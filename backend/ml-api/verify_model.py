"""
Model Verification Script
========================
This script verifies that the trained model is working correctly
and diagnoses any issues with predictions.
"""

import pandas as pd
import joblib
import os
from app.core.model_loader import get_model, DummyModel

print("=" * 60)
print("MODEL VERIFICATION SCRIPT")
print("=" * 60)

# 1. Check if model exists
print("\n1. Checking model file...")
model_path = "model.pkl"
if not os.path.exists(model_path):
    print(f"[ERROR] Model file not found at {model_path}")
    print("   Please run train_model.py first!")
    exit(1)
else:
    file_info = os.stat(model_path)
    print(f"[OK] Model file exists ({file_info.st_size} bytes)")

# 2. Load model
print("\n2. Loading model...")
try:
    model = get_model()
    is_dummy = isinstance(model, DummyModel)
    if is_dummy:
        print("[WARNING] Using dummy model!")
        print("   The trained model was not found. Please run train_model.py")
        exit(1)
    else:
        print("[OK] Trained model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit(1)

# 3. Check model structure
print("\n3. Checking model structure...")
try:
    preprocessor = model.named_steps['prep']
    classifier = model.named_steps['clf']
    
    # Get feature names
    numeric_features = list(preprocessor.named_transformers_['num'].feature_names_in_)
    cat_transformer = preprocessor.named_transformers_['cat']
    if hasattr(cat_transformer, 'categories_'):
        cat_categories = list(cat_transformer.categories_[0]) if len(cat_transformer.categories_) > 0 else []
    else:
        cat_categories = []
    
    print(f"[OK] Numeric features: {numeric_features}")
    print(f"[OK] Categorical categories: {cat_categories}")
    
    # Check class order
    if hasattr(classifier, 'classes_'):
        class_order = list(classifier.classes_)
        print(f"[OK] Class order: {class_order} (0=Fail, 1=Pass)")
    else:
        print("[WARNING] Could not determine class order")
        class_order = [0, 1]
    
except Exception as e:
    print(f"❌ Error checking model structure: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# 4. Check training data
print("\n4. Checking training data...")
dataset_path = "student_performance_balanced.xlsx"
if not os.path.exists(dataset_path):
    print(f"⚠️  Dataset not found at {dataset_path}")
    print("   Cannot verify training data distribution")
else:
    try:
        df = pd.read_excel(dataset_path)
        print(f"[OK] Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        
        # Check target distribution
        if 'performance' in df.columns:
            perf_dist = df['performance'].value_counts()
            print(f"[OK] Performance distribution:")
            for label, count in perf_dist.items():
                pct = (count / len(df)) * 100
                print(f"   {label}: {count} ({pct:.1f}%)")
            
            # Check for very low performance examples
            if 'attendance' in df.columns:
                low_attendance = df[df['attendance'] < 20]
                print(f"\n[OK] Students with <20% attendance: {len(low_attendance)}")
                if len(low_attendance) > 0:
                    low_attendance_perf = low_attendance['performance'].value_counts()
                    print(f"   Performance distribution for low attendance:")
                    for label, count in low_attendance_perf.items():
                        print(f"   {label}: {count}")
        else:
            print("[WARNING] 'performance' column not found in dataset")
    except Exception as e:
        print(f"⚠️  Error reading dataset: {e}")

# 5. Test predictions with extreme cases
print("\n5. Testing predictions with extreme cases...")
test_cases = [
    {
        "name": "Very Low Performance",
        "features": {
            "attendance": 5,
            "study_hours": 5,
            "assignments_submitted": 2,
            "internal_marks": 30,
            "activities": "low"
        },
        "expected": "Fail with high risk (>70%)"
    },
    {
        "name": "Very High Performance",
        "features": {
            "attendance": 95,
            "study_hours": 35,
            "assignments_submitted": 15,
            "internal_marks": 90,
            "activities": "high"
        },
        "expected": "Pass with low risk (<30%)"
    },
    {
        "name": "Medium Performance",
        "features": {
            "attendance": 75,
            "study_hours": 20,
            "assignments_submitted": 8,
            "internal_marks": 70,
            "activities": "medium"
        },
        "expected": "Pass with moderate risk (30-70%)"
    },
    {
        "name": "Your Problem Case",
        "features": {
            "attendance": 7,
            "study_hours": 9,
            "assignments_submitted": 4,
            "internal_marks": 67,
            "activities": "high"
        },
        "expected": "Should predict Fail with high risk (>70%)"
    }
]

print("\n" + "-" * 60)
for test_case in test_cases:
    try:
        # Create DataFrame with correct column order
        features_df = pd.DataFrame([test_case["features"]], columns=numeric_features + ['activities'])
        
        # Get predictions
        probs = model.predict_proba(features_df)[0]
        predicted_class = model.predict(features_df)[0]
        
        prob_fail = float(probs[0])  # Class 0 (Fail)
        prob_pass = float(probs[1])  # Class 1 (Pass)
        risk_percent = prob_fail * 100
        predicted_label = "Pass" if predicted_class == 1 else "Fail"
        
        # Determine if prediction is correct
        is_correct = True
        if test_case["name"] == "Very Low Performance":
            is_correct = predicted_class == 0 and risk_percent > 70
        elif test_case["name"] == "Very High Performance":
            is_correct = predicted_class == 1 and risk_percent < 30
        elif test_case["name"] == "Your Problem Case":
            is_correct = predicted_class == 0 and risk_percent > 70
        
        status = "[OK]" if is_correct else "[FAIL]"
        
        print(f"\n{status} {test_case['name']}:")
        print(f"   Features: Attendance={test_case['features']['attendance']}%, "
              f"Study Hours={test_case['features']['study_hours']}, "
              f"Assignments={test_case['features']['assignments_submitted']}, "
              f"Internal Marks={test_case['features']['internal_marks']}, "
              f"Activities={test_case['features']['activities']}")
        print(f"   Prediction: {predicted_label}")
        print(f"   Risk Score: {risk_percent:.2f}%")
        print(f"   Probabilities: Fail={prob_fail:.4f}, Pass={prob_pass:.4f}")
        print(f"   Expected: {test_case['expected']}")
        if not is_correct:
            print(f"   [WARNING] Prediction does not match expected behavior!")
        
    except Exception as e:
        print(f"\n[ERROR] Error testing {test_case['name']}: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)

print("\nRECOMMENDATIONS:")
print("1. If predictions are incorrect, the model may need retraining")
print("2. Check that the training data has enough examples of low-performance students")
print("3. Consider adjusting model hyperparameters in train_model.py")
print("4. Verify that student_performance_balanced.xlsx has the correct format")
print("\nTo retrain the model, run: python train_model.py")

