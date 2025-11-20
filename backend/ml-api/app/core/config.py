from pydantic import BaseModel
import os


class Settings(BaseModel):
    model_path: str = "./model.pkl"  # Random Forest model path


settings = Settings()

# Get model path from environment variable or use default
MODEL_PATH = os.getenv("MODEL_PATH", settings.model_path)
