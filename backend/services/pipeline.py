"""
pipeline.py — Wraps the credit risk prediction pipeline for FastAPI.

This module mirrors the logic from Notebook 13 (CreditRiskPipeline class)
using the pre-saved artifacts from setup_pipeline.py.
"""

import json
import warnings
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


BASE_DIR = Path(r"E:\Credit Risk Assessment System")
PIPELINE_DIR = BASE_DIR / "models" / "pipeline"
RESULT_DIR = BASE_DIR / "results"


class CreditRiskPipelineService:
    """
    Loads pre-built pipeline artifacts once and provides predict/explain methods.
    Mirrors the CreditRiskPipeline class from Notebook 13.
    """

    def __init__(self):
        self.model = None
        self.encoder = None
        self.scaler = None
        self.data_type = None
        self.expected_features = None
        self.thresholds = None
        self.raw_feature_metadata = None
        self.shap_explainer = None
        self._loaded = False

    def load(self):
        """Load all pipeline artifacts. Call once at FastAPI startup."""
        print("[Pipeline] Loading artifacts from", PIPELINE_DIR)

        self.model = joblib.load(PIPELINE_DIR / "final_model.pkl")

        preprocessor = joblib.load(PIPELINE_DIR / "preprocessor.pkl")
        self.encoder = preprocessor["encoder"]
        self.scaler = preprocessor["scaler"]
        self.data_type = preprocessor["data_type"]

        self.expected_features = joblib.load(PIPELINE_DIR / "feature_schema.pkl")
        self.thresholds = json.loads((PIPELINE_DIR / "risk_thresholds.json").read_text())
        self.raw_feature_metadata = joblib.load(PIPELINE_DIR / "raw_feature_metadata.pkl")

        # Load demo applicant
        demo_path = PIPELINE_DIR / "demo_applicant.json"
        if demo_path.exists():
            self.demo_applicant = json.loads(demo_path.read_text())
        else:
            self.demo_applicant = {}

        # Initialize SHAP explainer (using TreeExplainer — fast for XGBoost)
        self._init_shap_explainer()

        self._loaded = True
        model_name = self.raw_feature_metadata.get("final_model_name", "XGBoost")
        print(f"[Pipeline] Loaded: {model_name}")

        return self

    def _init_shap_explainer(self):
        """Initialize SHAP TreeExplainer for fast per-prediction explanations."""
        try:
            import shap
            shap_bg_path = PIPELINE_DIR / "shap_background.pkl"
            if shap_bg_path.exists():
                background = joblib.load(shap_bg_path)
                if background is not None:
                    # Reindex background to match expected features
                    background = background.reindex(columns=self.expected_features, fill_value=0)
                    self.shap_explainer = shap.TreeExplainer(self.model)
                    print(f"[Pipeline] SHAP TreeExplainer initialized with {len(background)} background samples")
                    return
            # Fallback: create explainer without background data
            self.shap_explainer = shap.TreeExplainer(self.model)
            print("[Pipeline] SHAP TreeExplainer initialized (no background)")
        except Exception as e:
            print(f"[Pipeline] WARNING: SHAP explainer init failed: {e}")
            self.shap_explainer = None

    # -----------------------------------------------------------------------
    # Feature Engineering (mirrors Notebook 3 logic exactly)
    # -----------------------------------------------------------------------
    def _engineer_features(self, applicant: dict) -> dict:
        """Apply the same feature engineering as Notebook 3."""
        result = dict(applicant)

        income = applicant.get("AMT_INCOME_TOTAL", 1)
        credit = applicant.get("AMT_CREDIT", 1)
        annuity = applicant.get("AMT_ANNUITY", 1)
        goods = applicant.get("AMT_GOODS_PRICE", 1)
        days_birth = applicant.get("DAYS_BIRTH", -1)
        days_employed = applicant.get("DAYS_EMPLOYED", -1)
        cnt_children = applicant.get("CNT_CHILDREN", 0)
        cnt_fam = applicant.get("CNT_FAM_MEMBERS", 1)

        # Derived features (same as Notebook 3)
        result["AGE"] = abs(days_birth) / 365.25
        # DAYS_EMPLOYED = 365243 means unemployed in this dataset
        years_employed = abs(days_employed) / 365.25 if days_employed != 365243 else 0
        result["YEARS_EMPLOYED"] = years_employed

        result["CREDIT_INCOME_RATIO"] = credit / max(income, 1)
        result["ANNUITY_INCOME_RATIO"] = annuity / max(income, 1)
        result["GOODS_CREDIT_RATIO"] = goods / max(credit, 1)
        result["EMPLOYMENT_AGE_RATIO"] = years_employed / max(result["AGE"], 1)
        result["INCOME_PER_CHILD"] = income / max(cnt_children, 1)
        result["CREDIT_PER_CHILD"] = credit / max(cnt_children, 1)
        result["ANNUITY_CREDIT_RATIO"] = annuity / max(credit, 1)
        result["FAMILY_SIZE"] = cnt_fam

        # Log transforms
        result["LOG_AMT_CREDIT"] = np.log1p(credit)
        result["LOG_AMT_INCOME_TOTAL"] = np.log1p(income)

        return result

    # -----------------------------------------------------------------------
    # Input validation
    # -----------------------------------------------------------------------
    def _validate_input(self, applicant: dict) -> list:
        """Return list of validation errors; empty list = valid."""
        errors = []
        meta = self.raw_feature_metadata
        raw_template = meta["raw_feature_template"]
        all_numeric = set(meta["numerical_fields"])
        all_categorical = set(meta["categorical_fields"])

        for col in raw_template:
            if col not in applicant:
                errors.append(f"Missing required field: '{col}'")
                continue
            value = applicant[col]
            if value is None or (isinstance(value, float) and np.isnan(value)):
                errors.append(f"Missing value for field: '{col}'")
                continue
            if col in all_numeric and not isinstance(value, (int, float)):
                errors.append(f"'{col}' must be numeric, got {type(value).__name__}: {value!r}")
                continue
            if col in all_categorical:
                valid_cats = set(meta["categorical_choices"].get(col, []))
                if valid_cats and value not in valid_cats:
                    errors.append(f"'{col}' has unknown category '{value}'")
            if col in ("AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE", "CNT_CHILDREN", "CNT_FAM_MEMBERS"):
                if isinstance(value, (int, float)) and value < 0:
                    errors.append(f"'{col}' cannot be negative, got {value}")
            if col in ("DAYS_BIRTH", "DAYS_EMPLOYED"):
                if isinstance(value, (int, float)) and value > 0 and value != 365243:
                    errors.append(f"'{col}' should be negative (days before application), got {value}")

        return errors

    # -----------------------------------------------------------------------
    # Preprocessing
    # -----------------------------------------------------------------------
    def _preprocess(self, applicant: dict) -> pd.DataFrame:
        """Validate → engineer → encode → align columns."""
        errors = self._validate_input(applicant)
        if errors:
            raise ValueError("Input validation failed:\n" + "\n".join(errors))

        engineered = self._engineer_features(applicant)

        selected_features = self.raw_feature_metadata["selected_features"]
        row = pd.DataFrame([engineered])[selected_features]

        encoded = pd.DataFrame(
            self.encoder.transform(row),
            columns=self.encoder.get_feature_names_out(),
            index=row.index,
        )

        if self.data_type == "scaled":
            encoded = pd.DataFrame(
                self.scaler.transform(encoded),
                columns=encoded.columns,
                index=encoded.index,
            )

        # Align to expected feature order; fill unseen dummies with 0
        aligned = encoded.reindex(columns=self.expected_features, fill_value=0)
        return aligned

    # -----------------------------------------------------------------------
    # Risk category
    # -----------------------------------------------------------------------
    def _get_risk_category(self, probability: float) -> str:
        low = self.thresholds["low_threshold"]
        high = self.thresholds["high_threshold"]
        if probability < low:
            return "LOW"
        if probability < high:
            return "MEDIUM"
        return "HIGH"

    # -----------------------------------------------------------------------
    # Predict
    # -----------------------------------------------------------------------
    def predict(self, applicant: dict) -> dict:
        """Run full pipeline: validate → engineer → preprocess → predict."""
        X_row = self._preprocess(applicant)
        predicted_class = int(self.model.predict(X_row)[0])
        probability = float(self.model.predict_proba(X_row)[0, 1])
        risk_category = self._get_risk_category(probability)
        return {
            "predicted_class": predicted_class,
            "probability": round(probability, 6),
            "risk_category": risk_category,
            "model": self.raw_feature_metadata.get("final_model_name", "XGBoost"),
        }

    # -----------------------------------------------------------------------
    # Explain (SHAP)
    # -----------------------------------------------------------------------
    def explain(self, applicant: dict, top_n: int = 7) -> dict:
        """
        Return top positive and negative SHAP contributors for one applicant.
        Returns empty lists if SHAP is unavailable.
        """
        if self.shap_explainer is None:
            return {"positive": [], "negative": []}

        try:
            X_row = self._preprocess(applicant)
            shap_values = self.shap_explainer.shap_values(X_row)

            # TreeExplainer for binary classification returns array or list of 2 arrays
            if isinstance(shap_values, list):
                values = shap_values[1][0]  # class 1
            else:
                values = shap_values[0]  # single array, class 1

            contrib = pd.Series(values, index=self.expected_features)

            # Readable feature names (strip "cat__" / "num__" prefix)
            def clean_name(name: str) -> str:
                parts = name.split("__", 1)
                return parts[1] if len(parts) > 1 else name

            positive_raw = contrib[contrib > 0].sort_values(ascending=False).head(top_n)
            negative_raw = contrib[contrib < 0].sort_values().head(top_n)

            positive = [
                {
                    "feature": clean_name(k),
                    "raw_feature": k,
                    "value": round(float(v), 6),
                    "direction": "increases_risk",
                }
                for k, v in positive_raw.items()
            ]
            negative = [
                {
                    "feature": clean_name(k),
                    "raw_feature": k,
                    "value": round(float(v), 6),
                    "direction": "decreases_risk",
                }
                for k, v in negative_raw.items()
            ]

            return {"positive": positive, "negative": negative}

        except Exception as e:
            print(f"[Pipeline] SHAP explain error: {e}")
            return {"positive": [], "negative": []}

    # -----------------------------------------------------------------------
    # Model info helpers
    # -----------------------------------------------------------------------
    def get_model_info(self) -> dict:
        model_name = self.raw_feature_metadata.get("final_model_name", "Unknown")
        is_xgb = "xgboost" in model_name.lower() or "xgb" in model_name.lower()
        gpu_enabled = False
        if is_xgb and hasattr(self.model, "get_xgb_params"):
            gpu_enabled = self.model.get_xgb_params().get("device") == "cuda"

        return {
            "model": model_name,
            "gpu_enabled": gpu_enabled,
            "explainability": "SHAP",
            "training_data": "Home Credit Default Risk",
            "dataset_rows": 307511,
            "dataset_columns": 122,
            "feature_count": len(self.expected_features),
            "risk_thresholds": self.thresholds,
        }

    def get_demo_applicant(self) -> dict:
        """Return the pre-built demo applicant dict."""
        return dict(self.demo_applicant)


# Singleton instance — loaded once at FastAPI startup
_pipeline: Optional[CreditRiskPipelineService] = None


def get_pipeline() -> CreditRiskPipelineService:
    """Return the loaded pipeline singleton."""
    global _pipeline
    if _pipeline is None or not _pipeline._loaded:
        raise RuntimeError("Pipeline not initialized. Call load_pipeline() first.")
    return _pipeline


def load_pipeline() -> CreditRiskPipelineService:
    """Load the pipeline (call at FastAPI lifespan startup)."""
    global _pipeline
    _pipeline = CreditRiskPipelineService().load()
    return _pipeline
