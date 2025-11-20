# ML API - Student Performance Prediction

This ML API service provides machine learning predictions for student performance using a Random Forest classifier. The API can predict whether a student will pass or fail based on various academic and behavioral features.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Training the Model](#training-the-model)
- [Running the API](#running-the-api)
- [API Endpoints](#api-endpoints)
- [Model Details](#model-details)
- [Custom Training](#custom-training)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Random Forest Classifier**: Ensemble learning algorithm with excellent performance on edge cases
- **Single Predictions**: Predict individual student performance
- **Batch Predictions**: Process multiple students at once
- **Feature Importance**: Get insights into which features matter most
- **Risk Assessment**: Categorize students as Safe, At-Risk, or Critical

## 📦 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## 🚀 Installation

### 1. Navigate to the ML API directory

```bash
cd backend/ml-api
```

### 2. Create and activate a virtual environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `fastapi` - Web framework for the API
- `uvicorn` - ASGI server
- `pandas` - Data manipulation
- `scikit-learn` - Machine learning utilities (includes Random Forest)
- `joblib` - Model serialization
- `numpy` - Numerical computing
- `pydantic` - Data validation

## 🎓 Training the Model

**⚠️ Important**: You must train the model before starting the API server. The API will use a dummy model if `model.pkl` is not found.

### Step 1: Prepare Your Dataset

Ensure your dataset file (e.g., `student_performance_synthetic_1000.xlsx`) is in the `backend/ml-api` directory.

**Required columns:**
- `attendance` - Student attendance percentage (0-100)
- `study_hours` - Hours studied per week
- `internal_marks` - Internal test marks (optional, can be null)
- `assignments_submitted` - Number of assignments submitted
- `activities` - Extracurricular activities level: "low", "medium", or "high"
- `performance` - Target variable: "Pass" or "Fail"

### Step 2: Train the Model

Run the training script:

```bash
python train_model.py
```

This will:
1. Load the dataset from your Excel file
2. Preprocess the data (standardize numeric features, one-hot encode categorical)
3. Split data into training (80%) and testing (20%) sets
4. Train a Random Forest classifier with optimized hyperparameters
5. Evaluate the model and print accuracy metrics, feature importances, and out-of-bag score
6. Save the trained model as `model.pkl`
7. Save model metadata as `model_info.json`

### Step 3: Verify Training

After training, you should see:
- Model accuracy (typically 85-95%+)
- Classification report with precision, recall, and F1-scores
- `model.pkl` file created in the directory
- `model_info.json` with model details

**Example output:**
```
✅ Accuracy: 0.9250 (92.50%)

📊 Classification Report:
              precision    recall  f1-score   support

        Fail       0.92      0.88      0.90       150
        Pass       0.93      0.95      0.94       250

    accuracy                           0.93       400
```

## 🏃 Running the API

### Start the Server

```bash
uvicorn main:app --reload --port 8000
```

Or use the provided script:

**Windows:**
```bash
python -m uvicorn main:app --reload --port 8000
```

**Linux/Mac:**
```bash
python3 -m uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

### Verify the API is Running

Visit: `http://localhost:8000/health`

You should see:
```json
{
  "status": "ok",
  "service": "ml-api"
}
```

### API Documentation

FastAPI automatically generates interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 📡 API Endpoints

### 1. Health Check

```
GET /health
```

Returns API status.

### 2. Single Prediction

```
POST /predict/single
```

**Request Body:**
```json
{
  "features": {
    "attendance": 85,
    "study_hours": 25,
    "assignments_completed": 10,
    "internal_marks": 75
  }
}
```

**Response:**
```json
{
  "predicted_label": "Pass",
  "risk_category": "Safe",
  "risk_score": 0.15,
  "feature_importance": {
    "attendance": 0.35,
    "study_hours": 0.28,
    "assignments_submitted": 0.22,
    "internal_marks": 0.15
  }
}
```

**Note**: The API automatically maps `assignments_completed` to `assignments_submitted` and adds default values for optional features if not provided.

### 3. Batch Prediction

```
POST /predict/batch
```

**Request Body:**
```json
{
  "records": [
    {
      "attendance": 85,
      "study_hours": 25,
      "assignments_completed": 10,
      "internal_marks": 75
    },
    {
      "attendance": 60,
      "study_hours": 10,
      "assignments_completed": 3,
      "internal_marks": 45
    }
  ]
}
```

**Response:**
```json
{
  "items": [
    {
      "input_features": {...},
      "predicted_label": "Pass",
      "risk_category": "Safe",
      "risk_score": 0.15,
      "feature_importance": {...}
    },
    {
      "input_features": {...},
      "predicted_label": "Fail",
      "risk_category": "Critical",
      "risk_score": 0.85,
      "feature_importance": {...}
    }
  ]
}
```

## 🔧 Model Details

### Model Architecture

- **Algorithm**: Random Forest (Ensemble of Decision Trees)
- **Type**: Binary Classification (Pass/Fail)
- **Preprocessing**:
  - Numeric features: StandardScaler (mean=0, std=1)
  - Categorical features: OneHotEncoder

### Hyperparameters

- `n_estimators`: 200 (number of trees)
- `max_depth`: 15 (maximum tree depth)
- `min_samples_split`: 5 (minimum samples to split a node)
- `min_samples_leaf`: 2 (minimum samples in a leaf)
- `max_features`: "sqrt" (features to consider for best split)
- `class_weight`: "balanced" (handle class imbalance)
- `bootstrap`: True (use bootstrap sampling)
- `oob_score`: True (calculate out-of-bag score)
- `random_state`: 42 (for reproducibility)

### Feature Mapping

The API accepts features from the frontend and maps them to the model's expected format:

| Frontend Input | Model Feature | Default (if missing) |
|---------------|---------------|----------------------|
| `attendance` | `attendance` | - |
| `study_hours` | `study_hours` | - |
| `assignments_completed` | `assignments_submitted` | - |
| `internal_marks` | `internal_marks` | null (optional) |
| `activities` | `activities` | "low" |

### Risk Categories

- **Safe**: Risk score < 0.4 (Low probability of failing)
- **At-Risk**: Risk score 0.4 - 0.7 (Moderate risk)
- **Critical**: Risk score ≥ 0.7 (High probability of failing)

## 🎯 Custom Training

### Modifying Hyperparameters

Edit `train_model.py` to adjust Random Forest parameters:

```python
model = RandomForestClassifier(
    n_estimators=300,        # Increase for better accuracy (slower)
    max_depth=20,            # Deeper trees (may overfit)
    min_samples_split=3,     # Lower = more splits (may overfit)
    min_samples_leaf=1,     # Lower = more granular splits
    max_features="log2",     # Fewer features = more randomness
    class_weight="balanced", # Handle class imbalance
    random_state=42,
    n_jobs=-1
)
```

### Adding Features

1. Update `numeric_features` or `categorical_features` in `train_model.py`
2. Ensure the feature exists in your CSV
3. Retrain the model
4. Update `_prepare_features_for_model()` in `predictor.py` if needed

### Changing Model Type

To use a different algorithm (e.g., XGBoost, Logistic Regression):

1. Replace `RandomForestClassifier` in `train_model.py`
2. Update imports
3. Adjust hyperparameters accordingly
4. Retrain the model

### Training with Different Data

1. Replace `student_performance_dataset.csv` with your dataset
2. Ensure column names match (or update the code)
3. Update feature lists in `train_model.py`
4. Run training script

## 🐛 Troubleshooting

### Model Not Found Error

**Problem**: API uses dummy model instead of trained model

**Solution**:
1. Ensure `model.pkl` exists in `backend/ml-api/` directory
2. Train the model: `python train_model.py`
3. Check file permissions

### Import Errors

**Problem**: `ModuleNotFoundError` for pandas, xgboost, etc.

**Solution**:
```bash
pip install -r requirements.txt
```

### Dataset Not Found

**Problem**: `FileNotFoundError: student_performance_dataset.csv`

**Solution**:
1. Ensure CSV file is in `backend/ml-api/` directory
2. Check file name matches exactly
3. Verify file path in `train_model.py`

### Prediction Errors

**Problem**: API returns errors when making predictions

**Solution**:
1. Check that all required features are provided
2. Verify feature names match expected format
3. Check model was trained with same feature set
4. Review API logs for detailed error messages

### Low Accuracy

**Problem**: Model accuracy is below 80%

**Solutions**:
1. Check data quality (missing values, outliers)
2. Increase training data size
3. Tune hyperparameters (see Custom Training section)
4. Try feature engineering
5. Check for data leakage

### Memory Issues

**Problem**: Out of memory during training

**Solution**:
1. Reduce `n_estimators`
2. Use smaller `max_depth`
3. Process data in chunks
4. Increase system RAM

## 📝 Notes

- The model is saved as `model.pkl` using joblib
- Model info is saved as `model_info.json` for reference
- The API automatically falls back to a dummy model if `model.pkl` is not found
- Default values are used for optional features if not provided
- Risk scores are calculated as probability of failure (0 = safe, 1 = critical)

## 🔄 Updating the Model

To retrain with new data:

1. Update `student_performance_dataset.csv`
2. Run `python train_model.py`
3. Restart the API server (or it will auto-reload if using `--reload`)

The new model will be automatically loaded on the next prediction request.

## 📚 Additional Resources

- [Scikit-learn Random Forest Documentation](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)
- [Scikit-learn Documentation](https://scikit-learn.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review API logs for error messages
3. Verify all prerequisites are installed
4. Ensure the dataset format matches requirements

---

**Happy Training! 🚀**

