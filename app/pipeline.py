"""Reusable credit-risk prediction pipeline — loads artifacts saved by
13_Prediction_Pipeline.ipynb. No training, tuning, or fitting happens here."""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
import shap

PIPELINE_DIR = Path(r"E:\Credit Risk Assessment System\models\pipeline")


def safe_div(numerator, denominator):
    """Element-wise-safe division; returns NaN where denominator is 0."""
    return np.nan if denominator == 0 else numerator / denominator


def engineer_features(applicant: dict) -> dict:
    """Reproduces Notebook 3's feature engineering exactly."""
    data = dict(applicant)
    data["AGE"] = round(-data["DAYS_BIRTH"] / 365, 1)
    years_employed = 0 if data["DAYS_EMPLOYED"] == 365243 else round(-data["DAYS_EMPLOYED"] / 365, 1)
    data["YEARS_EMPLOYED"] = years_employed
    data["CREDIT_INCOME_RATIO"] = safe_div(data["AMT_CREDIT"], data["AMT_INCOME_TOTAL"])
    data["ANNUITY_INCOME_RATIO"] = safe_div(data["AMT_ANNUITY"], data["AMT_INCOME_TOTAL"])
    data["GOODS_CREDIT_RATIO"] = safe_div(data["AMT_GOODS_PRICE"], data["AMT_CREDIT"])
    data["EMPLOYMENT_AGE_RATIO"] = safe_div(data["YEARS_EMPLOYED"], data["AGE"])
    data["INCOME_PER_CHILD"] = safe_div(data["AMT_INCOME_TOTAL"], data["CNT_CHILDREN"] + 1)
    data["CREDIT_PER_CHILD"] = safe_div(data["AMT_CREDIT"], data["CNT_CHILDREN"] + 1)
    data["ANNUITY_CREDIT_RATIO"] = safe_div(data["AMT_ANNUITY"], data["AMT_CREDIT"])
    data["FAMILY_SIZE"] = data["CNT_FAM_MEMBERS"]
    return data


def get_risk_category(probability: float, low_threshold: float, high_threshold: float) -> str:
    if probability < low_threshold:
        return "LOW RISK"
    if probability < high_threshold:
        return "MEDIUM RISK"
    return "HIGH RISK"


class CreditRiskPipeline:
    """Loads saved artifacts only. Never trains, tunes, or fits anything."""

    def __init__(self, pipeline_dir: Path = PIPELINE_DIR):
        self.pipeline_dir = pipeline_dir
        self.model = None
        self.encoder = None
        self.scaler = None
        self.data_type = None
        self.expected_features = None
        self.thresholds = None
        self.meta = None
        self._shap_explainer = None

    def load_artifacts(self):
        self.model = joblib.load(self.pipeline_dir / "final_model.pkl")
        artifacts = joblib.load(self.pipeline_dir / "preprocessor.pkl")
        self.encoder, self.scaler, self.data_type = artifacts["encoder"], artifacts["scaler"], artifacts["data_type"]
        self.expected_features = joblib.load(self.pipeline_dir / "feature_schema.pkl")
        self.thresholds = json.loads((self.pipeline_dir / "risk_thresholds.json").read_text())
        self.meta = joblib.load(self.pipeline_dir / "raw_feature_metadata.pkl")
        return self

    def validate_input(self, applicant: dict) -> list:
        errors = []
        for col in self.meta["raw_feature_template"]:
            if col not in applicant or applicant[col] is None:
                errors.append(f"Missing required field: '{col}'")
                continue
            value = applicant[col]
            if col in self.meta["numerical_fields"] and not isinstance(value, (int, float)):
                errors.append(f"'{col}' must be numeric, got {type(value).__name__}: {value!r}")
                continue
            if col in self.meta["categorical_fields"]:
                choices = self.meta["categorical_choices"].get(col, [])
                if choices and value not in choices:
                    errors.append(f"'{col}' has unknown value '{value}' (expected one of {choices[:5]}...)")
            if col in ("AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE",
                       "CNT_CHILDREN", "CNT_FAM_MEMBERS") and isinstance(value, (int, float)) and value < 0:
                errors.append(f"'{col}' cannot be negative, got {value}")
            if col in ("DAYS_BIRTH", "DAYS_EMPLOYED") and isinstance(value, (int, float)) and value > 0 and value != 365243:
                errors.append(f"'{col}' should be negative, got {value}")
        return errors

    def preprocess(self, applicant: dict) -> pd.DataFrame:
        errors = self.validate_input(applicant)
        if errors:
            raise ValueError("Input validation failed:\n" + "\n".join(errors))
        engineered = engineer_features(applicant)
        row = pd.DataFrame([engineered])[[c for c in self.encoder.feature_names_in_]]
        encoded = pd.DataFrame(
            self.encoder.transform(row), columns=self.encoder.get_feature_names_out(), index=row.index
        )
        if self.data_type == "scaled":
            encoded = pd.DataFrame(self.scaler.transform(encoded), columns=encoded.columns, index=encoded.index)
        return encoded.reindex(columns=self.expected_features, fill_value=0)

    def predict(self, applicant: dict) -> dict:
        X_row = self.preprocess(applicant)
        predicted_class = int(self.model.predict(X_row)[0])
        probability_default = float(self.model.predict_proba(X_row)[0, 1])
        risk_category = get_risk_category(probability_default, self.thresholds["low_threshold"], self.thresholds["high_threshold"])
        return {"predicted_class": predicted_class, "probability_of_default": probability_default, "risk_category": risk_category}

    def explain(self, applicant: dict, top_n: int = 5) -> dict:
        if self._shap_explainer is None:
            background = pd.DataFrame(0, index=range(1), columns=self.expected_features)
            self._shap_explainer = shap.Explainer(self.model.predict_proba, background)
        X_row = self.preprocess(applicant)
        shap_out = self._shap_explainer(X_row)
        values = shap_out.values[0, :, 1]
        contrib = pd.Series(values, index=self.expected_features).sort_values()
        return {"top_increasing_risk": contrib.tail(top_n)[::-1], "top_decreasing_risk": contrib.head(top_n)}