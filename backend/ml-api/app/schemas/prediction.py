from typing import Any, Dict, List
from pydantic import BaseModel, RootModel


class SinglePredictionRequest(BaseModel):
    features: Dict[str, Any]


class SinglePredictionResponse(BaseModel):
    predicted_label: str
    risk_category: str
    risk_score: float
    feature_importance: Dict[str, float]


class BatchRecord(RootModel[Dict[str, Any]]):
    # flexible: each record can have arbitrary feature keys
    root: Dict[str, Any]


class BatchPredictionRequest(BaseModel):
    records: List[Dict[str, Any]]


class BatchPredictionItem(BaseModel):
    input_features: Dict[str, Any]
    predicted_label: str
    risk_category: str
    risk_score: float
    feature_importance: Dict[str, float]


class BatchPredictionResponse(BaseModel):
    items: List[BatchPredictionItem]
