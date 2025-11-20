from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.predict import router as predict_router
from app.routers.diagnostic import router as diagnostic_router
from app.routers.debug_prediction import router as debug_router
from app.routers.model_analysis import router as analysis_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(title="Hackathon ML API", version="1.0.0")

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-api"}

app.include_router(predict_router, prefix="/predict", tags=["predict"])
app.include_router(diagnostic_router, prefix="/diagnostic", tags=["diagnostic"])
app.include_router(debug_router, prefix="/debug", tags=["debug"])
app.include_router(analysis_router, prefix="/analysis", tags=["analysis"])
