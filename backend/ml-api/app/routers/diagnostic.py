from fastapi import APIRouter
from app.core.model_loader import get_model, DummyModel, _load_model_uncached
import os
from app.core.config import MODEL_PATH
import pandas as pd

router = APIRouter()


@router.get("/model-status")
async def model_status():
    """Check if the trained model is loaded or if dummy model is being used."""
    model = get_model()
    is_dummy = isinstance(model, DummyModel)
    
    model_path_exists = os.path.exists(MODEL_PATH)
    abs_path = os.path.abspath(MODEL_PATH)
    
    model_info = {
        "model_loaded": not is_dummy,
        "is_dummy_model": is_dummy,
        "model_path": MODEL_PATH,
        "model_path_absolute": abs_path,
        "model_file_exists": model_path_exists,
        "model_type": str(type(model)),
        "message": "Dummy model is being used. Train the model first!" if is_dummy else "Trained model is loaded successfully!"
    }
    
    # If it's a pipeline, get more info
    if not is_dummy and hasattr(model, 'named_steps'):
        try:
            # Updated to use 'prep' instead of 'preprocessor' to match new pipeline
            preprocessor = model.named_steps.get('prep')
            if preprocessor:
                numeric_transformer = preprocessor.named_transformers_.get('num')
                if numeric_transformer and hasattr(numeric_transformer, 'feature_names_in_'):
                    model_info["expected_numeric_features"] = list(numeric_transformer.feature_names_in_)
                cat_transformer = preprocessor.named_transformers_.get('cat')
                if cat_transformer and hasattr(cat_transformer, 'feature_names_in_'):
                    model_info["expected_categorical_features"] = list(cat_transformer.feature_names_in_)
        except Exception as e:
            model_info["feature_extraction_error"] = str(e)
    
    return model_info


@router.get("/test-prediction")
@router.post("/test-prediction")
async def test_prediction():
    """Test prediction with sample data to verify model is working."""
    try:
        model = get_model()
        is_dummy = isinstance(model, DummyModel)
        
        # Get valid activity categories from the model if available
        valid_activity = "None"  # Default
        if not is_dummy and hasattr(model, 'named_steps'):
            try:
                # Updated to use 'prep' instead of 'preprocessor'
                preprocessor = model.named_steps.get('prep')
                if preprocessor:
                    cat_transformer = preprocessor.named_transformers_.get('cat')
                    if cat_transformer and hasattr(cat_transformer, 'categories_'):
                        known_categories = cat_transformer.categories_[0] if len(cat_transformer.categories_) > 0 else []
                        if len(known_categories) > 0:
                            valid_activity = list(known_categories)[0]  # Use first known category
            except Exception:
                pass  # Use default if we can't get categories
        
        # Test with sample features (only the 5 required features)
        test_features = {
            "attendance": 85,
            "study_hours": 25,
            "assignments_submitted": 10,
            "internal_marks": 75,
            "activities": valid_activity
        }
        
        if is_dummy:
            probs = model.predict_proba([test_features])[0]
            predicted_class = model.predict([test_features])[0]
            risk_score = float(probs[1])
        else:
            # Use pipeline
            features_df = pd.DataFrame([test_features])
            probs = model.predict_proba(features_df)[0]
            predicted_class = model.predict(features_df)[0]
            risk_score = float(probs[0])
        
        return {
            "success": True,
            "is_dummy_model": is_dummy,
            "test_features": test_features,
            "probabilities": probs.tolist() if hasattr(probs, 'tolist') else list(probs),
            "predicted_class": int(predicted_class),
            "risk_score": risk_score,
            "message": "Prediction successful!"
        }
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "message": "Prediction failed - check error details"
        }

