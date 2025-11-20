from fastapi import APIRouter
from app.core.model_loader import get_model, DummyModel
from app.services.predictor import _prepare_features_for_model
import pandas as pd
import numpy as np

router = APIRouter()


@router.post("/debug-prediction")
async def debug_prediction(features: dict):
    """Debug endpoint to see exactly what the model receives and predicts."""
    try:
        model = get_model()
        is_dummy = isinstance(model, DummyModel)
        
        # Prepare features
        prepared_features = _prepare_features_for_model(features, model=model)
        
        result = {
            "is_dummy_model": is_dummy,
            "input_features": features,
            "prepared_features": prepared_features,
        }
        
        if not is_dummy:
            # Get feature order
            # Updated to use 'prep' instead of 'preprocessor'
            preprocessor = model.named_steps['prep']
            numeric_transformer = preprocessor.named_transformers_['num']
            numeric_features = list(numeric_transformer.feature_names_in_)
            
            cat_transformer = preprocessor.named_transformers_['cat']
            if hasattr(cat_transformer, 'feature_names_in_'):
                cat_features = list(cat_transformer.feature_names_in_)
            else:
                cat_features = ['activities']
            
            expected_features = numeric_features + cat_features
            
            # Create ordered features
            ordered_features = {}
            for feat in expected_features:
                if feat in prepared_features:
                    ordered_features[feat] = prepared_features[feat]
                else:
                    # Only activities has a default now
                    if feat == 'activities':
                        ordered_features[feat] = 'low'
                    else:
                        ordered_features[feat] = 0
            
            features_df = pd.DataFrame([ordered_features], columns=expected_features)
            
            # Get predictions
            probs = model.predict_proba(features_df)[0]
            predicted_class = model.predict(features_df)[0]
            risk_score = float(probs[0])
            
            # Get feature importance if available
            feature_importance = {}
            try:
                # Updated to use 'clf' instead of 'classifier'
                classifier = model.named_steps['clf']
                if hasattr(classifier, 'feature_importances_'):
                    importances = classifier.feature_importances_
                    # Get all features after preprocessing (including one-hot encoded)
                    numeric_features = list(numeric_transformer.feature_names_in_)
                    cat_encoder = cat_transformer
                    if hasattr(cat_encoder, 'get_feature_names_out'):
                        cat_features_encoded = cat_encoder.get_feature_names_out(['activities'])
                    else:
                        cat_features_encoded = []
                    all_features_encoded = list(numeric_features) + list(cat_features_encoded)
                    
                    # Map importances back to original feature names
                    for i, feat_name in enumerate(all_features_encoded):
                        if feat_name.startswith('activities_'):
                            # Sum up all one-hot encoded activity features
                            feature_importance['activities'] = feature_importance.get('activities', 0) + float(importances[i])
                        else:
                            feature_importance[feat_name] = float(importances[i])
                    
                    # Normalize
                    total = sum(feature_importance.values())
                    if total > 0:
                        feature_importance = {k: v / total for k, v in feature_importance.items()}
            except Exception as e:
                feature_importance["error"] = str(e)
                import traceback
                feature_importance["traceback"] = traceback.format_exc()
            
            result.update({
                "expected_features": expected_features,
                "ordered_features": ordered_features,
                "dataframe_values": features_df.values[0].tolist(),
                "probabilities": {
                    "prob_fail": float(probs[0]),
                    "prob_pass": float(probs[1])
                },
                "predicted_class": int(predicted_class),
                "predicted_label": "Pass" if predicted_class == 1 else "Fail",
                "risk_score": risk_score,
                "risk_score_percent": round(risk_score * 100, 2),
                "feature_importance": feature_importance,
            })
        else:
            # Dummy model
            probs = model.predict_proba([prepared_features])[0]
            predicted_class = model.predict([prepared_features])[0]
            risk_score = float(probs[1])
            
            result.update({
                "probabilities": {
                    "normal_prob": float(probs[0]),
                    "risk_prob": float(probs[1])
                },
                "predicted_class": int(predicted_class),
                "predicted_label": "Pass" if predicted_class == 1 else "Fail",
                "risk_score": risk_score,
                "risk_score_percent": round(risk_score * 100, 2),
            })
        
        return result
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

