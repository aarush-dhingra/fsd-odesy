from functools import lru_cache
from typing import Any
import os
import joblib
import logging
import traceback

from app.core.config import MODEL_PATH

logger = logging.getLogger(__name__)


class DummyModel:
    """Simple dummy model used as a fallback when real model is not available.

    This dummy model calculates risk based on:
    - Low attendance (< 70%) = higher risk
    - Low study hours (< 15) = higher risk
    - Low assignments (< 5) = higher risk
    """

    def predict_proba(self, X):
        # X is expected to be a list of dicts
        results = []
        for features in X:
            if isinstance(features, dict):
                # Calculate risk based on input features
                attendance = features.get('attendance', 75)
                study_hours = features.get('study_hours', 20)
                assignments_completed = features.get('assignments_completed', 8)
                
                # Normalize values
                attendance_norm = max(0, min(100, attendance)) / 100
                study_hours_norm = max(0, min(40, study_hours)) / 40
                assignments_norm = max(0, min(15, assignments_completed)) / 15
                
                # Calculate risk score (0 = safe, 1 = critical)
                # Lower values = higher risk
                risk_score = 1 - ((attendance_norm * 0.4 + study_hours_norm * 0.35 + assignments_norm * 0.25))
                
                # Ensure risk score is between 0 and 1
                risk_score = max(0.0, min(1.0, risk_score))
                
                # Return probabilities: [normal_prob, risk_prob]
                # For Random Forest: [Fail_prob, Pass_prob]
                normal_prob = 1 - risk_score
                risk_prob = risk_score
                results.append([normal_prob, risk_prob])
            else:
                # Fallback for unexpected format
                results.append([0.2, 0.8])
        return results

    def predict(self, X):
        """Predict class labels (0 = Fail, 1 = Pass)"""
        probs = self.predict_proba(X)
        return [1 if prob[1] > 0.5 else 0 for prob in probs]

    def get_feature_importance(self):
        """Return dummy feature importance"""
        return {
            'attendance': 0.4,
            'study_hours': 0.35,
            'assignments_completed': 0.25
        }


def _load_model_uncached() -> Any:
    """Internal function to load model without caching."""
    try:
        abs_path = os.path.abspath(MODEL_PATH)
        logger.info(f"Looking for model at: {abs_path}")
        
        if os.path.exists(MODEL_PATH):
            logger.info(f"Loading Random Forest model from {MODEL_PATH}")
            model = joblib.load(MODEL_PATH)
            logger.info("✅ Random Forest model loaded successfully")
            logger.info(f"Model type: {type(model)}")
            
            # Check if it's a pipeline
            if hasattr(model, 'named_steps'):
                logger.info(f"Pipeline steps: {list(model.named_steps.keys())}")
                # Check classifier type
                if 'clf' in model.named_steps:
                    clf_type = type(model.named_steps['clf']).__name__
                    logger.info(f"Classifier type: {clf_type}")
            
            return model
        else:
            logger.warning(
                f"⚠️  Model file not found at {MODEL_PATH} (absolute: {abs_path}). "
                "Using dummy model. Please train the model first by running: python train_model.py"
            )
            return DummyModel()
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        logger.warning("Falling back to dummy model")
        return DummyModel()

@lru_cache(maxsize=1)
def get_model() -> Any:
    """
    Load the trained model from disk (cached).
    Loads the trained Random Forest model.
    
    Returns:
        The loaded model pipeline (preprocessor + classifier)
        Falls back to DummyModel if model file is not found.
    """
    return _load_model_uncached()
