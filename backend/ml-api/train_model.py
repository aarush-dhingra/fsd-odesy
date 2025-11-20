"""
Random Forest Model Training Script
==================================

Trains an ML model using MULTIPLE datasets merged together.

Usage:
    python train_model.py
"""

import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# -----------------------------------------------------------
# 1. LOAD & MERGE DATASETS
# -----------------------------------------------------------
print("Loading datasets...")

dataset_paths = [
    "student_performance_synthetic_1000.xlsx",
    "student_performance_balanced.xlsx",
    "student_performance_balanced_FIXED.csv"  # <── NEW DATASET
]

loaded_datasets = []
missing_files = []

for path in dataset_paths:
    if os.path.exists(path):
        print(f"  ✅ Found {path}, loading...")
        if path.lower().endswith(".csv"):
            df = pd.read_csv(path)
        else:
            df = pd.read_excel(path)
        print(f"     -> {df.shape[0]} rows")
        loaded_datasets.append(df)
    else:
        missing_files.append(path)

if missing_files:
    raise FileNotFoundError(
        "The following dataset file(s) were NOT found:\n"
        + "\n".join(f" - {p}" for p in missing_files)
        + "\nPlease ensure they exist in the ml-api directory."
    )

print("\nMerging datasets...")
df = pd.concat(loaded_datasets, ignore_index=True)
print(f"Final merged dataset -> {df.shape[0]} rows, {df.shape[1]} cols")

# -----------------------------------------------------------
# 2. BASIC VALIDATION
# -----------------------------------------------------------
if "performance" not in df.columns:
    raise ValueError("ERROR: Column 'performance' missing in merged dataset.")

X = df.drop("performance", axis=1)
y = df["performance"].map({"Fail": 0, "Pass": 1})

print(f"\nTarget distribution (0=Fail,1=Pass): {y.value_counts().to_dict()}")
print(f"Feature columns: {list(X.columns)}")

# -----------------------------------------------------------
# 3. DEFINE FEATURES
# -----------------------------------------------------------
numeric_features = [
    "attendance",
    "study_hours",
    "internal_marks",
    "assignments_submitted"
]

categorical_features = ["activities"]

missing_numeric = [c for c in numeric_features if c not in X.columns]
missing_categorical = [c for c in categorical_features if c not in X.columns]

if missing_numeric or missing_categorical:
    print("\n❌ ERROR: Missing required features in merged dataset!")
    print(f"Numeric missing: {missing_numeric}")
    print(f"Categorical missing: {missing_categorical}")
    print(f"Available columns: {list(X.columns)}")
    raise SystemExit

# -----------------------------------------------------------
# 4. PREPROCESSING PIPELINE
# -----------------------------------------------------------
print("\nSetting up preprocessing pipeline...")

preprocessor = ColumnTransformer([
    ("num", StandardScaler(), numeric_features),
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
])

# -----------------------------------------------------------
# 5. RANDOM FOREST MODEL
# -----------------------------------------------------------
print("Configuring RandomForest model...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features="sqrt",
    bootstrap=True,
    oob_score=True,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

pipeline = Pipeline([
    ("prep", preprocessor),
    ("clf", model)
])

print("Pipeline ready.")

# -----------------------------------------------------------
# 6. TRAIN-TEST SPLIT
# -----------------------------------------------------------
print("\nSplitting into train/test sets...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training size: {X_train.shape[0]}")
print(f"Testing size:  {X_test.shape[0]}")

# -----------------------------------------------------------
# 7. TRAIN MODEL
# -----------------------------------------------------------
print("\nTraining model...")
pipeline.fit(X_train, y_train)
print("Training complete!")

clf = pipeline.named_steps['clf']
if hasattr(clf, "oob_score_"):
    print(f"OOB Score: {clf.oob_score_:.4f} ({clf.oob_score_ * 100:.2f}%)")

# -----------------------------------------------------------
# 8. EVALUATION
# -----------------------------------------------------------
print("\nEvaluating model...")
y_pred = pipeline.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
print(f"\nAccuracy: {accuracy:.4f} ({accuracy * 100:.2f}%)")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["Fail", "Pass"]))

# Print importances
if hasattr(clf, "feature_importances_"):
    print("\nFeature Importances:")
    prep = pipeline.named_steps['prep']
    num_names = list(prep.named_transformers_['num'].feature_names_in_)
    cat_names = list(
        prep.named_transformers_['cat'].get_feature_names_out(['activities'])
    )

    feature_names = num_names + cat_names
    importance_dict = sorted(
        zip(feature_names, clf.feature_importances_), key=lambda x: x[1], reverse=True
    )

    for name, imp in importance_dict:
        print(f"  {name}: {imp:.4f}")

# -----------------------------------------------------------
# 9. SAVE MODEL
# -----------------------------------------------------------
print("\nSaving model to model.pkl...")
joblib.dump(pipeline, "model.pkl")
print("Saved model.pkl successfully!")

# Save metadata
model_info = {
    "model_type": "RandomForest",
    "features": {
        "numeric": numeric_features,
        "categorical": categorical_features
    },
    "accuracy": float(accuracy)
}

import json
with open("model_info.json", "w") as f:
    json.dump(model_info, f, indent=2)

print("Saved model_info.json")
print("\n🎉 Training complete!")
