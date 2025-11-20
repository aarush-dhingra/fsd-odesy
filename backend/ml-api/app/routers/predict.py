from fastapi import APIRouter

from app.schemas.prediction import (
    SinglePredictionRequest,
    SinglePredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
)
from app.services.predictor import predict_single, predict_batch

router = APIRouter()


@router.post("/single", response_model=SinglePredictionResponse)
async def single_predict(payload: SinglePredictionRequest):
    return predict_single(payload)


@router.post("/batch", response_model=BatchPredictionResponse)
async def batch_predict(payload: BatchPredictionRequest):
    return predict_batch(payload)
