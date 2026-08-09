"""
validate_model.py — Standalone validation script for the final deployed Credit Risk model.

Validates the saved pipeline artifacts against the 61,503 held-out test set:
- Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, MCC
- Confusion Matrix & Classification Report
- Risk Category Distribution (LOW, MEDIUM, HIGH)
- Probability Statistics (Min, Max, Mean, Median, 95th Percentile)
"""

import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    auc,
    classification_report,
    confusion_matrix,
    f1_score,
    matthews_corrcoef,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

BASE_DIR = Path(r"E:\Credit Risk Assessment System")
CLEANED_DATA_PATH = BASE_DIR / "dataset" / "processed" / "cleaned_credit_data.csv"
SELECTED_FEATURES_PATH = BASE_DIR / "dataset" / "processed" / "selected_top50.csv"
PIPELINE_DIR = BASE_DIR / "models" / "pipeline"


def main():
    # 1. Load artifacts
    model = joblib.load(PIPELINE_DIR / "final_model.pkl")
    preprocessor = joblib.load(PIPELINE_DIR / "preprocessor.pkl")
    feature_schema = joblib.load(PIPELINE_DIR / "feature_schema.pkl")
    thresholds = json.loads((PIPELINE_DIR / "risk_thresholds.json").read_text())

    encoder = preprocessor["encoder"]
    low_thresh = thresholds["low_threshold"]
    high_thresh = thresholds["high_threshold"]

    # 2. Load test dataset
    cleaned_df = pd.read_csv(CLEANED_DATA_PATH)
    selected_features = pd.read_csv(SELECTED_FEATURES_PATH)["feature"].tolist()

    X_full = cleaned_df[selected_features]
    y_full = cleaned_df["TARGET"]

    _, X_test_raw, _, y_test = train_test_split(
        X_full, y_full, test_size=0.2, random_state=42, stratify=y_full
    )

    # 3. Transform test data
    X_test_enc = pd.DataFrame(
        encoder.transform(X_test_raw),
        columns=encoder.get_feature_names_out(),
        index=X_test_raw.index,
    ).reindex(columns=feature_schema, fill_value=0)

    # 4. Generate predictions and probabilities
    y_prob = model.predict_proba(X_test_enc)[:, 1]
    y_pred = (y_prob >= high_thresh).astype(int)

    # 5. Compute metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)

    prec_arr, rec_arr, _ = precision_recall_curve(y_test, y_prob)
    pr_auc = auc(rec_arr, prec_arr)
    mcc = matthews_corrcoef(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    # Risk category distribution
    low_mask = y_prob < low_thresh
    med_mask = (y_prob >= low_thresh) & (y_prob < high_thresh)
    high_mask = y_prob >= high_thresh

    low_count = int(low_mask.sum())
    med_count = int(med_mask.sum())
    high_count = int(high_mask.sum())
    total_count = len(y_prob)

    # Output formatted report
    print("=" * 60)
    print("FINAL MODEL VALIDATION")
    print("=" * 60)

    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1:        {f1 * 100:.2f}%")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}")
    print(f"MCC:       {mcc:.4f}")
    print()
    print("Confusion Matrix:")
    print(cm)
    print()
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low Risk (0)", "High Risk (1)"]))
    print()
    print("Risk Distribution:")
    print(f"LOW (< {low_thresh:.2f}):      {low_count:,} ({low_count / total_count * 100:.2f}%)")
    print(f"MEDIUM ({low_thresh:.2f}-{high_thresh:.2f}): {med_count:,} ({med_count / total_count * 100:.2f}%)")
    print(f"HIGH (>= {high_thresh:.2f}):     {high_count:,} ({high_count / total_count * 100:.2f}%)")
    print()
    print("Probability:")
    print(f"Min:             {float(np.min(y_prob)):.4f}")
    print(f"Max:             {float(np.max(y_prob)):.4f}")
    print(f"Mean:            {float(np.mean(y_prob)):.4f}")
    print(f"Median:          {float(np.median(y_prob)):.4f}")
    print(f"95th percentile: {float(np.percentile(y_prob, 95)):.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
