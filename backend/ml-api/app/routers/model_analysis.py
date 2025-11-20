from fastapi import APIRouter
from app.core.model_loader import get_model, DummyModel
import pandas as pd
import numpy as np

router = APIRouter()


@router.get("/analyze-model")
async def analyze_model():
    """Analyze the trained model to understand its behavior."""
    try:
        model = get_model()
        is_dummy = isinstance(model, DummyModel)
        
        if is_dummy:
            return {
                "is_dummy": True,
                "message": "Model is dummy - please train the model first"
            }
        
        # Get model info
        preprocessor = model.named_steps['prep']
        classifier = model.named_steps['clf']
        
        # Get feature names
        numeric_features = list(preprocessor.named_transformers_['num'].feature_names_in_)
        cat_transformer = preprocessor.named_transformers_['cat']
        if hasattr(cat_transformer, 'categories_'):
            cat_categories = list(cat_transformer.categories_[0]) if len(cat_transformer.categories_) > 0 else []
        else:
            cat_categories = []
        
        # Get feature importance
        feature_importance = {}
        if hasattr(classifier, 'feature_importances_'):
            importances = classifier.feature_importances_
            # Get all feature names after preprocessing
            if hasattr(cat_transformer, 'get_feature_names_out'):
                cat_features_encoded = cat_transformer.get_feature_names_out(['activities'])
            else:
                cat_features_encoded = []
            all_features_encoded = list(numeric_features) + list(cat_features_encoded)
            
            for i, feat_name in enumerate(all_features_encoded):
                if feat_name.startswith('activities_'):
                    feature_importance['activities'] = feature_importance.get('activities', 0) + float(importances[i])
                else:
                    feature_importance[feat_name] = float(importances[i])
            
            # Normalize
            total = sum(feature_importance.values())
            if total > 0:
                feature_importance = {k: v / total for k, v in feature_importance.items()}
        
        # Test with extreme cases
        test_cases = [
            {
                "name": "Very Low Performance",
                "features": {
                    "attendance": 5,
                    "study_hours": 5,
                    "assignments_submitted": 2,
                    "internal_marks": 30,
                    "activities": "low"
                }
            },
            {
                "name": "Very High Performance",
                "features": {
                    "attendance": 95,
                    "study_hours": 35,
                    "assignments_submitted": 15,
                    "internal_marks": 90,
                    "activities": "high"
                }
            },
            {
                "name": "Medium Performance",
                "features": {
                    "attendance": 75,
                    "study_hours": 20,
                    "assignments_submitted": 8,
                    "internal_marks": 70,
                    "activities": "medium"
                }
            }
        ]
        
        # Get class order from model
        class_order = list(classifier.classes_) if hasattr(classifier, 'classes_') else [0, 1]
        
        results = []
        for test_case in test_cases:
            # Create DataFrame with correct column order
            features_df = pd.DataFrame([test_case["features"]], columns=numeric_features + ['activities'])
            probs = model.predict_proba(features_df)[0]
            predicted_class = model.predict(features_df)[0]
            
            # Verify class order
            # probs[0] should be class 0 (Fail), probs[1] should be class 1 (Pass)
            prob_fail = float(probs[0])  # Class 0
            prob_pass = float(probs[1])  # Class 1
            
            results.append({
                "name": test_case["name"],
                "features": test_case["features"],
                "class_order": class_order,
                "prob_fail": prob_fail,
                "prob_pass": prob_pass,
                "predicted_class": int(predicted_class),
                "predicted_label": "Pass" if predicted_class == 1 else "Fail",
                "risk_score_percent": round(prob_fail * 100, 2),
                "expected_behavior": "Should predict Fail with high risk" if test_case["name"] == "Very Low Performance" else ("Should predict Pass with low risk" if test_case["name"] == "Very High Performance" else "Should predict based on balanced features")
            })
        
        return {
            "is_dummy": False,
            "numeric_features": numeric_features,
            "categorical_categories": cat_categories,
            "feature_importance": feature_importance,
            "test_cases": results,
            "model_info": {
                "n_estimators": getattr(classifier, 'n_estimators', 'unknown'),
                "max_depth": getattr(classifier, 'max_depth', 'unknown'),
                "learning_rate": getattr(classifier, 'learning_rate', 'unknown'),
            }
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

