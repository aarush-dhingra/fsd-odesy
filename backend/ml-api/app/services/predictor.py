from typing import Dict, Any, List
import numpy as np
import logging
import traceback

from app.core.model_loader import get_model
from app.schemas.prediction import (
    SinglePredictionRequest,
    SinglePredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    BatchPredictionItem,
)

logger = logging.getLogger(__name__)

# Risk score thresholds
RISK_THRESHOLD_HIGH = 0.7
RISK_THRESHOLD_MEDIUM = 0.4


def _score_to_category(score: float) -> str:
    """
    Convert risk score to category.
    
    Args:
        score: Risk score (0-1, where 1 = highest risk)
    
    Returns:
        Risk category: "Critical", "At-Risk", or "Safe"
    """
    if score >= RISK_THRESHOLD_HIGH:
        return "Critical"
    if score >= RISK_THRESHOLD_MEDIUM:
        return "At-Risk"
    return "Safe"


def _get_feature_importance(model, features: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract feature importance from the model.
    
    Args:
        model: The trained model (XGBoost pipeline or DummyModel)
        features: Input features dictionary
    
    Returns:
        Dictionary mapping feature names to importance scores
    """
    try:
        # Check if model has feature_importances_ attribute (Random Forest)
        if hasattr(model, 'named_steps') and 'clf' in model.named_steps:
            classifier = model.named_steps['clf']
            if hasattr(classifier, 'feature_importances_'):
                # Get feature names after preprocessing
                preprocessor = model.named_steps['prep']
                
                # Get numeric feature names
                numeric_features = preprocessor.named_transformers_['num'].feature_names_in_
                
                # Get categorical feature names (after one-hot encoding)
                cat_encoder = preprocessor.named_transformers_['cat']
                if hasattr(cat_encoder, 'get_feature_names_out'):
                    cat_features = cat_encoder.get_feature_names_out(['activities'])
                else:
                    cat_features = []
                
                # Combine all feature names
                all_features = list(numeric_features) + list(cat_features)
                
                # Map importances to feature names
                importances = classifier.feature_importances_
                importance_dict = {}
                
                # Map back to original feature names where possible
                for i, feat_name in enumerate(all_features):
                    # For one-hot encoded features, map back to original
                    if feat_name.startswith('activities_'):
                        importance_dict['activities'] = importance_dict.get('activities', 0) + importances[i]
                    else:
                        importance_dict[feat_name] = importances[i]
                
                # Normalize to sum to 1
                total = sum(importance_dict.values())
                if total > 0:
                    importance_dict = {k: v / total for k, v in importance_dict.items()}
                
                return importance_dict
    except Exception as e:
        logger.warning(f"Could not extract feature importance: {e}")
    
    # Fallback: equal importance or dummy model method
    if hasattr(model, 'get_feature_importance'):
        return model.get_feature_importance()
    
    # Default: assign equal importance
    if not features:
        return {}
    n = len(features)
    if n == 0:
        return {}
    value = 1.0 / n
    return {k: value for k in features.keys()}


def _prepare_features_for_model(features: Dict[str, Any], model=None) -> Dict[str, Any]:
    """
    Prepare features for the model by mapping frontend names to dataset names.
    
    The frontend sends:
    - attendance
    - study_hours
    - assignments_completed
    - internal_marks (optional)
    - activities (optional)
    
    The model expects:
    - attendance
    - study_hours
    - internal_marks
    - assignments_submitted (not assignments_completed)
    - activities
    """
    # Map assignments_completed to assignments_submitted
    prepared = features.copy()
    if 'assignments_completed' in prepared and 'assignments_submitted' not in prepared:
        prepared['assignments_submitted'] = prepared.pop('assignments_completed')
    
    # Set default for activities if not provided
    if 'activities' not in prepared:
        prepared['activities'] = 'low'  # Default to 'low' to match dataset
    
    # Handle unknown categories for 'activities' if model is provided
    if model is not None and 'activities' in prepared:
        try:
            from app.core.model_loader import DummyModel
            if not isinstance(model, DummyModel) and hasattr(model, 'named_steps'):
                preprocessor = model.named_steps.get('prep')
                if preprocessor:
                    cat_transformer = preprocessor.named_transformers_.get('cat')
                    if cat_transformer and hasattr(cat_transformer, 'categories_'):
                        known_categories = cat_transformer.categories_[0] if len(cat_transformer.categories_) > 0 else []
                        if len(known_categories) > 0:
                            known_categories = list(known_categories)
                            if prepared['activities'] not in known_categories:
                                logger.warning(
                                    f"Unknown activity category '{prepared['activities']}'. "
                                    f"Known categories: {known_categories}. "
                                    f"Using default: '{known_categories[0] if known_categories else 'low'}'"
                                )
                                prepared['activities'] = known_categories[0] if known_categories else 'low'
        except Exception as e:
            logger.warning(f"Could not validate activity category: {e}. Using provided value: {prepared.get('activities', 'low')}")
    
    return prepared


def predict_single(req: SinglePredictionRequest) -> SinglePredictionResponse:
    """
    Make a single prediction.
    
    Args:
        req: SinglePredictionRequest with features dictionary
    
    Returns:
        SinglePredictionResponse with prediction results
    """
    model = get_model()
    
    # Prepare features for the model (pass model to validate categories)
    prepared_features = _prepare_features_for_model(req.features, model=model)
    
    try:
        import pandas as pd
        from app.core.model_loader import DummyModel
        
        logger.info(f"Prepared features: {prepared_features}")
        logger.info(f"Original input features: {req.features}")
        
        is_dummy = isinstance(model, DummyModel)
        
        if is_dummy:
            # Dummy model - already returns [normal_prob, risk_prob]
            logger.warning("Using dummy model for prediction")
            probs = model.predict_proba([prepared_features])[0]
            predicted_class = model.predict([prepared_features])[0]
            risk_score = float(probs[1])  # index 1 = risk
            logger.info(f"Dummy model probabilities: {probs}, risk_score: {risk_score}")
        else:
            logger.info("Using trained Random Forest model")
            risk_score = None
            predicted_class = None
            probs = None
            
            try:
                preprocessor = model.named_steps['prep']
                
                numeric_transformer = preprocessor.named_transformers_['num']
                numeric_features = list(numeric_transformer.feature_names_in_)
                
                cat_transformer = preprocessor.named_transformers_['cat']
                if hasattr(cat_transformer, 'feature_names_in_'):
                    cat_features = list(cat_transformer.feature_names_in_)
                else:
                    cat_features = ['activities']
                
                expected_features = numeric_features + cat_features
                logger.info(f"Expected features (in order): {expected_features}")
                
                ordered_features = {}
                for feat in expected_features:
                    if feat in prepared_features:
                        ordered_features[feat] = prepared_features[feat]
                    else:
                        if feat == 'activities':
                            ordered_features[feat] = 'low'
                        else:
                            ordered_features[feat] = 0
                        logger.warning(f"Feature {feat} not provided, using default: {ordered_features[feat]}")
                
                features_df = pd.DataFrame([ordered_features], columns=expected_features)
                logger.info(f"Features DataFrame shape: {features_df.shape}")
                logger.info(f"Features DataFrame columns: {list(features_df.columns)}")
                logger.info(f"Features DataFrame values: {features_df.values.tolist()}")
                logger.info(
                    f"Feature summary - Attendance: {ordered_features.get('attendance')}%, "
                    f"Study Hours: {ordered_features.get('study_hours')}, "
                    f"Assignments: {ordered_features.get('assignments_submitted')}, "
                    f"Internal Marks: {ordered_features.get('internal_marks')}, "
                    f"Activities: {ordered_features.get('activities')}"
                )
                
                # ----- FIXED PART: get correct index for 'Fail' -----
                clf = model.named_steps['clf']
                probs_all = model.predict_proba(features_df)
                logger.info(f"Raw prediction probabilities shape: {probs_all.shape}")
                logger.info(f"Raw prediction probabilities: {probs_all}")
                probs = probs_all[0]
                logger.info(f"Prediction probabilities (aligned with classes_ {clf.classes_}): {probs}")
                
                predicted_class = model.predict(features_df)[0]
                logger.info(f"Predicted class: {predicted_class}")
                
                classes = list(clf.classes_)
                logger.info(f"Model classes_: {classes}")
                
                # You trained with y: Fail -> 0, Pass -> 1
                # So risk = P(Fail) = P(class == 0)
                try:
                    fail_index = classes.index(0)
                except ValueError:
                    # In case in future you switch to string labels
                    fail_index = classes.index("Fail")
                
                risk_score = float(probs[fail_index])
                logger.info(f"Using fail_index={fail_index}, risk_score={risk_score}")
                # ----- END FIX -----
            
            except Exception as pipeline_error:
                logger.error(f"Error with pipeline prediction: {pipeline_error}")
                logger.error(f"Pipeline error traceback: {traceback.format_exc()}")
                try:
                    logger.info("Trying fallback: simple DataFrame creation")
                    features_df = pd.DataFrame([prepared_features])
                    logger.info(f"Fallback DataFrame columns: {list(features_df.columns)}")
                    
                    clf = model.named_steps['clf']
                    probs_all = model.predict_proba(features_df)
                    logger.info(f"Fallback probabilities shape: {probs_all.shape}")
                    probs = probs_all[0]
                    classes = list(clf.classes_)
                    logger.info(f"Fallback model classes_: {classes}")
                    
                    try:
                        fail_index = classes.index(0)
                    except ValueError:
                        fail_index = classes.index("Fail")
                    
                    risk_score = float(probs[fail_index])
                    predicted_class = model.predict(features_df)[0]
                    logger.info(f"Fallback successful - Risk score: {risk_score}")
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed: {fallback_error}")
                    logger.error(f"Fallback traceback: {traceback.format_exc()}")
                    raise fallback_error
            
            if risk_score is None or predicted_class is None or probs is None:
                raise ValueError("Failed to get prediction results from model")
        
        # Map predicted class to label (frontend expects "at_risk" or "normal")
        # 0 = Fail, 1 = Pass
        predicted_label = "normal" if predicted_class == 1 else "at_risk"
        
        # Map risk_score to "high"/"medium"/"low"
        category = _score_to_category(risk_score)
        if category == "Critical":
            risk_category = "high"
        elif category == "At-Risk":
            risk_category = "medium"
        else:
            risk_category = "low"
        
        feature_importance = _get_feature_importance(model, prepared_features)
        
        logger.info(
            f"Prediction: {predicted_label}, Risk: {risk_category} ({risk_score:.2f})"
        )
        
        return SinglePredictionResponse(
            predicted_label=predicted_label,
            risk_category=risk_category,
            risk_score=risk_score,
            feature_importance=feature_importance,
        )
    except Exception as e:
        logger.error(f"Error making prediction: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        risk_score = 0.5
        logger.warning(f"Falling back to default prediction with risk_score={risk_score}")
        return SinglePredictionResponse(
            predicted_label="Fail",
            risk_category="At-Risk",
            risk_score=risk_score,
            feature_importance=_get_feature_importance(model, prepared_features),
        )


def predict_batch(req: BatchPredictionRequest) -> BatchPredictionResponse:
    """
    Make batch predictions for multiple records.
    
    Args:
        req: BatchPredictionRequest with list of feature dictionaries
    
    Returns:
        BatchPredictionResponse with list of prediction results
    """
    model = get_model()
    features_list: List[Dict[str, Any]] = req.records
    
    prepared_features_list = [
        _prepare_features_for_model(features, model=model) for features in features_list
    ]
    
    try:
        import pandas as pd
        
        features_df = pd.DataFrame(prepared_features_list)
        
        clf = model.named_steps['clf']
        probs_list = model.predict_proba(features_df)
        predicted_classes = model.predict(features_df)
        
        classes = list(clf.classes_)
        logger.info(f"Batch prediction - model classes_: {classes}")
        try:
            fail_index = classes.index(0)
        except ValueError:
            fail_index = classes.index("Fail")
        
        items: List[BatchPredictionItem] = []
        for i, (features, probs, predicted_class) in enumerate(
            zip(prepared_features_list, probs_list, predicted_classes)
        ):
            # probs is 1D for this row; use correct index for Fail
            risk_score = float(probs[fail_index])
            
            predicted_label = "normal" if predicted_class == 1 else "at_risk"
            
            category = _score_to_category(risk_score)
            if category == "Critical":
                risk_category = "high"
            elif category == "At-Risk":
                risk_category = "medium"
            else:
                risk_category = "low"
            
            feature_importance = _get_feature_importance(model, features)
            
            items.append(
                BatchPredictionItem(
                    input_features=features,
                    predicted_label=predicted_label,
                    risk_category=risk_category,
                    risk_score=risk_score,
                    feature_importance=feature_importance,
                )
            )
        
        logger.info(f"Batch prediction completed: {len(items)} predictions")
        return BatchPredictionResponse(items=items)
        
    except Exception as e:
        logger.error(f"Error making batch prediction: {e}")
        raise Exception(f"Batch prediction failed: {str(e)}")