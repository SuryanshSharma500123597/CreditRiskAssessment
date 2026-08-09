"""
pipeline.py — Wraps the credit risk prediction pipeline for FastAPI and standalone scripts.
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
        self.demo_applicant = {}
        self._loaded = False

    def load(self):
        """Load all pipeline artifacts. Call once at FastAPI startup or script execution."""
        print("[Pipeline] Loading artifacts from", PIPELINE_DIR)

        self.model = joblib.load(PIPELINE_DIR / "final_model.pkl")

        preprocessor = joblib.load(PIPELINE_DIR / "preprocessor.pkl")
        self.encoder = preprocessor["encoder"]
        self.scaler = preprocessor["scaler"]
        self.data_type = preprocessor["data_type"]

        self.expected_features = joblib.load(PIPELINE_DIR / "feature_schema.pkl")
        self.thresholds = json.loads((PIPELINE_DIR / "risk_thresholds.json").read_text())
        self.raw_feature_metadata = joblib.load(PIPELINE_DIR / "raw_feature_metadata.pkl")

        demo_path = PIPELINE_DIR / "demo_applicant.json"
        if demo_path.exists():
            self.demo_applicant = json.loads(demo_path.read_text())

        self._init_shap_explainer()

        self._loaded = True
        model_name = self.raw_feature_metadata.get("final_model_name", "Tuned XGBoost (GPU + ScalePosWeight)")
        print(f"[Pipeline] Loaded model: {model_name}")

        return self

    def _init_shap_explainer(self):
        """Initialize SHAP TreeExplainer cleanly for XGBoost."""
        try:
            import shap
            shap_bg_path = PIPELINE_DIR / "shap_background.pkl"
            if shap_bg_path.exists():
                background = joblib.load(shap_bg_path)
                if background is not None:
                    background = background.reindex(columns=self.expected_features, fill_value=0)
                    self.shap_explainer = shap.TreeExplainer(self.model, data=background.head(50))
                    print(f"[Pipeline] SHAP TreeExplainer initialized with background samples.")
                    return

            self.shap_explainer = shap.TreeExplainer(self.model)
            print("[Pipeline] SHAP TreeExplainer initialized (no background).")
        except Exception as e:
            print(f"[Pipeline] SHAP explainer fallback enabled: {e}")
            self.shap_explainer = None

    def _engineer_features(self, applicant: dict) -> dict:
        """Apply derived feature calculations (age, employment, ratios, logs)."""
        result = dict(applicant)

        # Handle age_years if passed directly from frontend
        if "age_years" in result and "DAYS_BIRTH" not in result:
            result["DAYS_BIRTH"] = -float(result["age_years"]) * 365.25

        # Handle employment_years if passed directly from frontend
        if "employment_years" in result and "DAYS_EMPLOYED" not in result:
            emp_yrs = float(result["employment_years"])
            result["DAYS_EMPLOYED"] = -emp_yrs * 365.25 if emp_yrs > 0 else 365243

        income = float(result.get("AMT_INCOME_TOTAL", 1))
        credit = float(result.get("AMT_CREDIT", 1))
        annuity = float(result.get("AMT_ANNUITY", 1))
        goods = float(result.get("AMT_GOODS_PRICE", 1))
        days_birth = float(result.get("DAYS_BIRTH", -12000))
        days_employed = float(result.get("DAYS_EMPLOYED", -1800))
        cnt_children = float(result.get("CNT_CHILDREN", 0))
        cnt_fam = float(result.get("CNT_FAM_MEMBERS", 1))

        # Derived features
        result["AGE"] = abs(days_birth) / 365.25
        years_employed = abs(days_employed) / 365.25 if days_employed != 365243 else 0.0
        result["YEARS_EMPLOYED"] = years_employed

        result["CREDIT_INCOME_RATIO"] = credit / max(income, 1.0)
        result["ANNUITY_INCOME_RATIO"] = annuity / max(income, 1.0)
        result["GOODS_CREDIT_RATIO"] = goods / max(credit, 1.0)
        result["EMPLOYMENT_AGE_RATIO"] = years_employed / max(result["AGE"], 1.0)
        result["INCOME_PER_CHILD"] = income / max(cnt_children, 1.0)
        result["CREDIT_PER_CHILD"] = credit / max(cnt_children, 1.0)
        result["ANNUITY_CREDIT_RATIO"] = annuity / max(credit, 1.0)
        result["FAMILY_SIZE"] = cnt_fam

        result["LOG_AMT_CREDIT"] = np.log1p(credit)
        result["LOG_AMT_INCOME_TOTAL"] = np.log1p(income)

        return result

    def _fill_defaults(self, applicant: dict) -> dict:
        """Autofill missing raw feature template fields with demo defaults."""
        full_applicant = dict(self.demo_applicant)
        full_applicant.update(applicant)
        return full_applicant

    def _validate_input(self, applicant: dict) -> list:
        """Validate input payload."""
        errors = []
        meta = self.raw_feature_metadata
        raw_template = meta["raw_feature_template"]
        all_numeric = set(meta["numerical_fields"])
        all_categorical = set(meta["categorical_fields"])

        for col in raw_template:
            if col not in applicant:
                errors.append(f"Missing required field: '{col}'")
                continue
            val = applicant[col]
            if val is None or (isinstance(val, float) and np.isnan(val)):
                errors.append(f"Missing value for field: '{col}'")
                continue
            if col in all_numeric and not isinstance(val, (int, float, np.number)):
                try:
                    float(val)
                except Exception:
                    errors.append(f"'{col}' must be numeric, got {type(val).__name__}: {val!r}")
            if col in ("AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE", "CNT_CHILDREN", "CNT_FAM_MEMBERS"):
                if float(val) < 0:
                    errors.append(f"'{col}' cannot be negative, got {val}")

        return errors

    def _preprocess(self, applicant: dict) -> pd.DataFrame:
        """Full preprocessing flow: autofill defaults → engineer → encode → align."""
        filled_applicant = self._fill_defaults(applicant)
        errors = self._validate_input(filled_applicant)
        if errors:
            raise ValueError("Input validation failed:\n" + "\n".join(errors))

        engineered = self._engineer_features(filled_applicant)

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

        aligned = encoded.reindex(columns=self.expected_features, fill_value=0)
        return aligned

    def _get_risk_category(self, probability: float) -> str:
        low = self.thresholds["low_threshold"]
        high = self.thresholds["high_threshold"]
        if probability < low:
            return "LOW"
        if probability < high:
            return "MEDIUM"
        return "HIGH"

    def predict(self, applicant: dict) -> dict:
        """Predict credit risk probability and assign risk category."""
        X_row = self._preprocess(applicant)
        probability = float(self.model.predict_proba(X_row)[0, 1])

        # Predicted class based on high threshold
        high_thresh = self.thresholds["high_threshold"]
        predicted_class = 1 if probability >= high_thresh else 0
        risk_category = self._get_risk_category(probability)

        model_name = self.raw_feature_metadata.get("final_model_name", "Tuned XGBoost (GPU + ScalePosWeight)")

        # Safe internal logging
        print(f"[Prediction Log] Probability: {probability:.4f} | Class: {predicted_class} | Category: {risk_category} | Model: {model_name} | Thresholds: LOW<{self.thresholds['low_threshold']}, HIGH>={self.thresholds['high_threshold']}")

        return {
            "predicted_class": predicted_class,
            "probability": round(probability, 6),
            "risk_category": risk_category,
            "model": model_name,
        }

    def explain(self, applicant: dict, top_n: int = 7) -> dict:
        """Return top risk increasing and risk decreasing SHAP factors."""
        try:
            X_row = self._preprocess(applicant)

            if self.shap_explainer is not None:
                shap_values = self.shap_explainer.shap_values(X_row)
                if isinstance(shap_values, list):
                    values = shap_values[1][0]
                elif len(shap_values.shape) == 2:
                    values = shap_values[0]
                else:
                    values = shap_values
                contrib = pd.Series(values, index=self.expected_features)
            else:
                # Fallback to feature importance * row values
                fi = self.model.feature_importances_
                contrib = pd.Series(fi * (X_row.iloc[0].values != 0), index=self.expected_features)

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

    def get_model_info(self) -> dict:
        model_name = self.raw_feature_metadata.get("final_model_name", "Tuned XGBoost (GPU + ScalePosWeight)")
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
        return dict(self.demo_applicant)


_pipeline: Optional[CreditRiskPipelineService] = None


def get_pipeline() -> CreditRiskPipelineService:
    global _pipeline
    if _pipeline is None or not _pipeline._loaded:
        raise RuntimeError("Pipeline not initialized. Call load_pipeline() first.")
    return _pipeline


def load_pipeline() -> CreditRiskPipelineService:
    global _pipeline
    _pipeline = CreditRiskPipelineService().load()
    return _pipeline
