"""
setup_pipeline.py — One-time pipeline setup script.

Run this once before starting the FastAPI backend:
    python backend/setup_pipeline.py

This script will:
1. Load the cleaned dataset and reconstruct the encoder/scaler
2. Load (or retrain) the Tuned XGBoost (GPU) model
3. Save all pipeline artifacts to models/pipeline/
4. Generate results/final_model_summary.csv (if missing)
5. Pre-compute and save global SHAP feature importance

Expected runtime: ~2-5 minutes (mostly CSV loading)
"""

import json
import time
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(r"E:\Credit Risk Assessment System")
DATA_DIR = BASE_DIR / "dataset" / "processed_models"
CLEANED_DATA_PATH = BASE_DIR / "dataset" / "processed" / "cleaned_credit_data.csv"
MODEL_DIR = BASE_DIR / "models"
RESULT_DIR = BASE_DIR / "results"
PIPELINE_DIR = MODEL_DIR / "pipeline"

RANDOM_STATE = 42


def main():
    print("=" * 60)
    print("Credit Risk Assessment — Pipeline Setup")
    print("=" * 60)

    PIPELINE_DIR.mkdir(parents=True, exist_ok=True)
    RESULT_DIR.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------------
    # Step 1: Load cleaned data
    # -------------------------------------------------------------------
    print("\n[1/6] Loading cleaned dataset (this may take 1-2 minutes)...")
    t0 = time.time()
    cleaned_df = pd.read_csv(CLEANED_DATA_PATH)
    print(f"      Loaded {len(cleaned_df):,} rows in {time.time()-t0:.1f}s")

    # -------------------------------------------------------------------
    # Step 2: Feature selection (top-50 list)
    # -------------------------------------------------------------------
    print("\n[2/6] Loading feature selection list...")
    selected_features_path = BASE_DIR / "dataset" / "processed" / "selected_top50.csv"
    if selected_features_path.exists():
        selected_features = pd.read_csv(selected_features_path)["feature"].tolist()
        print(f"      Using top-50 selected features ({len(selected_features)} features)")
    else:
        selected_features = [c for c in cleaned_df.columns if c != "TARGET"]
        print(f"      selected_top50.csv not found; using all {len(selected_features)} features")

    X_full = cleaned_df[selected_features]
    y_full = cleaned_df["TARGET"]

    X_train_raw, _, y_train_raw, _ = train_test_split(
        X_full, y_full, test_size=0.2, random_state=RANDOM_STATE, stratify=y_full
    )

    categorical_features = X_train_raw.select_dtypes(include="object").columns.tolist()
    numerical_features = X_train_raw.select_dtypes(include=np.number).columns.tolist()
    print(f"      Categorical: {len(categorical_features)} | Numerical: {len(numerical_features)}")

    # -------------------------------------------------------------------
    # Step 3: Build encoder and scaler (same as Notebook 5 / Notebook 13)
    # -------------------------------------------------------------------
    print("\n[3/6] Building encoder and scaler...")
    encoder = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", "passthrough", numerical_features),
        ]
    )
    encoder.fit(X_train_raw)
    X_train_encoded = pd.DataFrame(
        encoder.transform(X_train_raw),
        columns=encoder.get_feature_names_out(),
        index=X_train_raw.index,
    )

    scaler = StandardScaler()
    scaler.fit(X_train_encoded)

    # Expected feature columns (from training data)
    EXPECTED_FEATURES = X_train_encoded.columns.tolist()
    print(f"      Encoder output: {len(EXPECTED_FEATURES)} features")

    # -------------------------------------------------------------------
    # Step 4: Load or retrain the Tuned XGBoost (GPU) model
    # -------------------------------------------------------------------
    print("\n[4/6] Loading / training the Tuned XGBoost (GPU) model...")

    # Try to load from either path (the notebook may have saved to a path
    # with correct spelling while the folder has a typo)
    tuned_model_path = MODEL_DIR / "best_xgboost_model.pkl"
    candidate_paths = [
        tuned_model_path,
        Path(r"E:\Credit Risk Assessment System\models\best_xgboost_model.pkl"),
    ]

    model = None
    for candidate in candidate_paths:
        if candidate.exists():
            model = joblib.load(candidate)
            print(f"      Loaded existing tuned model from: {candidate}")
            break

    if model is None:
        print("      Tuned model not found. Retraining with best hyperparameters from Notebook 10...")
        print("      (subsample=0.9, reg_lambda=2, reg_alpha=0.1, n_estimators=300,")
        print("       min_child_weight=3, max_depth=7, learning_rate=0.08, gamma=0.1,")
        print("       colsample_bytree=0.8, device=cuda)")

        from xgboost import XGBClassifier

        # Load training data (already processed) for fast retraining
        train_data_path = DATA_DIR / "X_train_unscaled.csv"
        y_train_path = DATA_DIR / "y_train.csv"

        if train_data_path.exists() and y_train_path.exists():
            print("      Loading preprocessed training data...")
            X_train_processed = pd.read_csv(train_data_path)
            y_train_processed = pd.read_csv(y_train_path).squeeze()
            print(f"      Training shape: {X_train_processed.shape}")

            model = XGBClassifier(
                objective="binary:logistic",
                eval_metric="auc",
                tree_method="hist",
                device="cuda",
                random_state=RANDOM_STATE,
                subsample=0.9,
                reg_lambda=2,
                reg_alpha=0.1,
                n_estimators=300,
                min_child_weight=3,
                max_depth=7,
                learning_rate=0.08,
                gamma=0.1,
                colsample_bytree=0.8,
            )

            t_train = time.time()
            model.fit(X_train_processed, y_train_processed)
            print(f"      Training completed in {time.time()-t_train:.1f}s")

            # Save to models dir
            joblib.dump(model, tuned_model_path)
            print(f"      Saved tuned model to: {tuned_model_path}")
        else:
            print("      WARNING: Processed training data not found. Falling back to baseline XGBoost.")
            fallback_path = MODEL_DIR / "xgboost_model.pkl"
            if fallback_path.exists():
                model = joblib.load(fallback_path)
                print(f"      Loaded fallback baseline XGBoost from: {fallback_path}")
            else:
                raise FileNotFoundError(
                    "Neither tuned model nor baseline XGBoost found. "
                    "Please run the notebooks first."
                )

    # Verify GPU
    if hasattr(model, "get_xgb_params"):
        device = model.get_xgb_params().get("device")
        print(f"      Model device: {device}")

    # -------------------------------------------------------------------
    # Step 5: Save pipeline artifacts
    # -------------------------------------------------------------------
    print("\n[5/6] Saving pipeline artifacts...")

    # Determine data_type (tuned XGBoost uses unscaled)
    data_type = "unscaled"
    final_model_name = "Tuned XGBoost (GPU)"

    # Save final model
    joblib.dump(model, PIPELINE_DIR / "final_model.pkl")

    # Save preprocessor bundle
    joblib.dump(
        {"encoder": encoder, "scaler": scaler, "data_type": data_type},
        PIPELINE_DIR / "preprocessor.pkl",
    )

    # Save feature schema
    joblib.dump(EXPECTED_FEATURES, PIPELINE_DIR / "feature_schema.pkl")

    # Save risk thresholds
    risk_thresholds = {
        "low_threshold": 0.30,
        "high_threshold": 0.60,
        "note": "Demonstration thresholds only — not bank-approved regulatory thresholds.",
    }
    (PIPELINE_DIR / "risk_thresholds.json").write_text(json.dumps(risk_thresholds, indent=2))

    # Compute RAW_FEATURE_TEMPLATE (same logic as Notebook 13)
    ENGINEERED_FEATURES = {
        "AGE", "YEARS_EMPLOYED", "CREDIT_INCOME_RATIO", "ANNUITY_INCOME_RATIO",
        "GOODS_CREDIT_RATIO", "EMPLOYMENT_AGE_RATIO", "INCOME_PER_CHILD",
        "CREDIT_PER_CHILD", "ANNUITY_CREDIT_RATIO", "FAMILY_SIZE",
    }
    REQUIRED_RAW_FIELDS = [
        "AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE",
        "DAYS_BIRTH", "DAYS_EMPLOYED", "CNT_CHILDREN", "CNT_FAM_MEMBERS",
    ]
    OTHER_RAW_FIELDS = [
        c for c in selected_features
        if c not in ENGINEERED_FEATURES and c not in REQUIRED_RAW_FIELDS
    ]
    RAW_FEATURE_TEMPLATE = REQUIRED_RAW_FIELDS + OTHER_RAW_FIELDS

    RAW_NUMERIC_FIELDS = {
        "AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE",
        "DAYS_BIRTH", "DAYS_EMPLOYED", "CNT_CHILDREN", "CNT_FAM_MEMBERS",
    }
    ALL_NUMERIC_FIELDS = set(numerical_features) | RAW_NUMERIC_FIELDS
    ALL_CATEGORICAL_FIELDS = set(categorical_features) - RAW_NUMERIC_FIELDS

    raw_feature_metadata = {
        "raw_feature_template": RAW_FEATURE_TEMPLATE,
        "numerical_fields": sorted(ALL_NUMERIC_FIELDS),
        "categorical_fields": sorted(ALL_CATEGORICAL_FIELDS),
        "categorical_choices": {
            col: sorted(X_train_raw[col].dropna().unique().tolist())
            for col in ALL_CATEGORICAL_FIELDS
            if col in X_train_raw.columns
        },
        "final_model_name": final_model_name,
        "selected_features": selected_features,
    }
    joblib.dump(raw_feature_metadata, PIPELINE_DIR / "raw_feature_metadata.pkl")

    # Save demo applicant defaults (medians / modes)
    demo_template = {}
    for col in RAW_FEATURE_TEMPLATE:
        if col in X_train_raw.columns:
            demo_template[col] = (
                float(X_train_raw[col].median())
                if col in ALL_NUMERIC_FIELDS
                else str(X_train_raw[col].mode().iloc[0])
            )
        else:
            demo_template[col] = (
                float(cleaned_df[col].median())
                if pd.api.types.is_numeric_dtype(cleaned_df[col])
                else str(cleaned_df[col].mode().iloc[0])
            )
    # Override with realistic demo values
    demo_template.update({
        "AMT_INCOME_TOTAL": 202500.0,
        "AMT_CREDIT": 406597.5,
        "AMT_ANNUITY": 24700.5,
        "AMT_GOODS_PRICE": 351000.0,
        "DAYS_BIRTH": -12005,
        "DAYS_EMPLOYED": -2000,
        "CNT_CHILDREN": 0,
        "CNT_FAM_MEMBERS": 2.0,
        "CODE_GENDER": "F",
    })
    (PIPELINE_DIR / "demo_applicant.json").write_text(
        json.dumps(demo_template, indent=2)
    )

    # Save final model summary CSV
    final_model_summary = pd.DataFrame([{"recommended_model": final_model_name}])
    final_model_summary.to_csv(RESULT_DIR / "final_model_summary.csv", index=False)

    # Save full model comparison CSV (from notebook 11 results)
    model_comparison = [
        {"Model": "Tuned XGBoost (GPU)", "Accuracy": 0.9196, "Precision": 0.5324,
         "Recall": 0.0314, "F1": 0.0593, "ROC-AUC": 0.7635, "MCC": 0.1147},
        {"Model": "Logistic Regression", "Accuracy": 0.6944, "Precision": 0.1628,
         "Recall": 0.6725, "F1": 0.2621, "ROC-AUC": 0.7465, "MCC": 0.2131},
        {"Model": "XGBoost", "Accuracy": 0.9195, "Precision": 0.5426,
         "Recall": 0.0141, "F1": 0.0275, "ROC-AUC": 0.7462, "MCC": 0.0777},
        {"Model": "Random Forest", "Accuracy": 0.9193, "Precision": 0.4615,
         "Recall": 0.0012, "F1": 0.0024, "ROC-AUC": 0.7037, "MCC": 0.0203},
        {"Model": "Decision Tree", "Accuracy": 0.8447, "Precision": 0.1368,
         "Recall": 0.1740, "F1": 0.1532, "ROC-AUC": 0.5388, "MCC": 0.0697},
    ]
    pd.DataFrame(model_comparison).to_csv(RESULT_DIR / "model_comparison.csv", index=False)
    print(f"      Saved pipeline artifacts to: {PIPELINE_DIR}")

    # -------------------------------------------------------------------
    # Step 6: Pre-compute global SHAP feature importance
    # -------------------------------------------------------------------
    print("\n[6/6] Computing global SHAP feature importance (using training data sample)...")
    import shap

    # Load 200 training samples for SHAP background
    train_data_path = DATA_DIR / "X_train_unscaled.csv"
    if train_data_path.exists():
        X_background = pd.read_csv(train_data_path, nrows=200)
    else:
        X_background = X_train_encoded.sample(min(200, len(X_train_encoded)), random_state=RANDOM_STATE)
        X_background = X_background.reindex(columns=EXPECTED_FEATURES, fill_value=0)

    print("      Computing SHAP values on background sample...")
    t_shap = time.time()
    try:
        # Use TreeExplainer for XGBoost (much faster than Explainer)
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_background)
        
        # For binary classification TreeExplainer returns array of shape (n, features)
        if isinstance(shap_values, list):
            shap_arr = shap_values[1]  # class 1
        else:
            shap_arr = shap_values
        
        mean_abs_shap = np.abs(shap_arr).mean(axis=0)
        feature_names = X_background.columns.tolist()
        
        shap_importance_df = pd.DataFrame({
            "feature": feature_names,
            "mean_abs_shap": mean_abs_shap,
        }).sort_values("mean_abs_shap", ascending=False)
        
        shap_importance_df.to_csv(RESULT_DIR / "global_shap_importance.csv", index=False)
        print(f"      Global SHAP computed in {time.time()-t_shap:.1f}s")
        print(f"      Top 5 features: {shap_importance_df['feature'].head(5).tolist()}")
        
        # Save explainer background for per-prediction SHAP
        joblib.dump(X_background, PIPELINE_DIR / "shap_background.pkl")
        print("      Saved SHAP background data")
        
    except Exception as e:
        print(f"      WARNING: SHAP computation failed: {e}")
        print("      Will fall back to XGBoost feature_importances_ for global SHAP")
        # Use XGBoost native feature importance as fallback
        if hasattr(model, "feature_importances_"):
            fi = model.feature_importances_
            feature_names = EXPECTED_FEATURES
            shap_importance_df = pd.DataFrame({
                "feature": feature_names,
                "mean_abs_shap": fi,
            }).sort_values("mean_abs_shap", ascending=False)
            shap_importance_df.to_csv(RESULT_DIR / "global_shap_importance.csv", index=False)
            # Save a dummy background
            joblib.dump(X_background if 'X_background' in dir() else None, PIPELINE_DIR / "shap_background.pkl")

    print("\n" + "=" * 60)
    print("Pipeline setup complete!")
    print(f"Artifacts saved to: {PIPELINE_DIR}")
    print("You can now start the backend:")
    print("  cd backend")
    print("  python -m uvicorn main:app --reload --port 8000")
    print("=" * 60)


if __name__ == "__main__":
    main()
