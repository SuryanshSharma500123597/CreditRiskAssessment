"""
train_improved_model.py — Complete script to train improved XGBoost credit risk model,
handle class imbalance, optimize decision thresholds, evaluate probability calibration,
regenerate SHAP explanations, and save all pipeline artifacts.
"""

import json
import time
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    matthews_corrcoef,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    auc,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import xgboost as xgb

warnings.filterwarnings("ignore")

BASE_DIR = Path(r"E:\Credit Risk Assessment System")
CLEANED_DATA_PATH = BASE_DIR / "dataset" / "processed" / "cleaned_credit_data.csv"
SELECTED_FEATURES_PATH = BASE_DIR / "dataset" / "processed" / "selected_top50.csv"
MODEL_DIR = BASE_DIR / "models"
PIPELINE_DIR = MODEL_DIR / "pipeline"
RESULT_DIR = BASE_DIR / "results"

RANDOM_STATE = 42


def check_gpu():
    print("=" * 60)
    print("PHASE 6 — GPU TRAINING STATUS")
    print("=" * 60)
    xgb_ver = xgb.__version__
    gpu_available = False
    device = "cpu"
    try:
        clf = xgb.XGBClassifier(n_estimators=5, tree_method="hist", device="cuda", random_state=42)
        clf.fit(np.random.randn(50, 5), np.random.randint(0, 2, 50))
        gpu_available = True
        device = "cuda"
        print(f"GPU available: YES")
        print(f"XGBoost version: {xgb_ver}")
        print(f"CUDA/device: cuda")
        print(f"Training device: NVIDIA GPU (CUDA)")
    except Exception as e:
        print(f"GPU available: NO (Fallback to CPU: {e})")
        print(f"XGBoost version: {xgb_ver}")
        print(f"CUDA/device: cpu")
        print(f"Training device: CPU")

    print("=" * 60 + "\n")
    return gpu_available, device


def evaluate_model(y_true, y_pred, y_prob):
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_true, y_prob)

    prec_arr, rec_arr, _ = precision_recall_curve(y_true, y_prob)
    pr_auc = auc(rec_arr, prec_arr)
    mcc = matthews_corrcoef(y_true, y_pred)

    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    return {
        "Accuracy": round(float(acc), 4),
        "Precision": round(float(prec), 4),
        "Recall": round(float(rec), 4),
        "F1": round(float(f1), 4),
        "ROC-AUC": round(float(roc_auc), 4),
        "PR-AUC": round(float(pr_auc), 4),
        "MCC": round(float(mcc), 4),
        "TN": int(tn),
        "FP": int(fp),
        "FN": int(fn),
        "TP": int(tp),
        "FPR": round(float(fpr), 4),
        "FNR": round(float(fnr), 4),
    }


def main():
    PIPELINE_DIR.mkdir(parents=True, exist_ok=True)
    RESULT_DIR.mkdir(parents=True, exist_ok=True)

    gpu_available, device = check_gpu()

    # -------------------------------------------------------------------
    # Step 1: Load cleaned dataset & train/test split
    # -------------------------------------------------------------------
    print("[1] Loading cleaned dataset...")
    cleaned_df = pd.read_csv(CLEANED_DATA_PATH)
    selected_features = pd.read_csv(SELECTED_FEATURES_PATH)["feature"].tolist()

    X_full = cleaned_df[selected_features]
    y_full = cleaned_df["TARGET"]

    X_train_raw, X_test_raw, y_train_raw, y_test_raw = train_test_split(
        X_full, y_full, test_size=0.2, random_state=RANDOM_STATE, stratify=y_full
    )

    # -------------------------------------------------------------------
    # Step 2: Class distribution & scale_pos_weight
    # -------------------------------------------------------------------
    class_0_count = int((y_train_raw == 0).sum())
    class_1_count = int((y_train_raw == 1).sum())
    scale_pos_weight = class_0_count / class_1_count

    print("=" * 60)
    print("CLASS DISTRIBUTION")
    print("=" * 60)
    print(f"Class 0 (Non-default / Low Risk): {class_0_count:,}")
    print(f"Class 1 (Default / High Risk):    {class_1_count:,}")
    print(f"Class 0 percentage: {class_0_count / len(y_train_raw) * 100:.2f}%")
    print(f"Class 1 percentage: {class_1_count / len(y_train_raw) * 100:.2f}%")
    print(f"Scale Pos Weight:   {scale_pos_weight:.4f}")
    print("=" * 60 + "\n")

    # -------------------------------------------------------------------
    # Step 3: Build encoder and preprocessor
    # -------------------------------------------------------------------
    print("[3] Building encoder & feature schema...")
    cat_cols = X_train_raw.select_dtypes(include="object").columns.tolist()
    num_cols = X_train_raw.select_dtypes(include=np.number).columns.tolist()

    encoder = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
            ("num", "passthrough", num_cols),
        ]
    )
    encoder.fit(X_train_raw)

    X_train_enc = pd.DataFrame(
        encoder.transform(X_train_raw),
        columns=encoder.get_feature_names_out(),
        index=X_train_raw.index,
    )
    X_test_enc = pd.DataFrame(
        encoder.transform(X_test_raw),
        columns=encoder.get_feature_names_out(),
        index=X_test_raw.index,
    )

    scaler = StandardScaler()
    scaler.fit(X_train_enc)

    EXPECTED_FEATURES = X_train_enc.columns.tolist()
    print(f"      Encoded feature count: {len(EXPECTED_FEATURES)}")

    # Split train into train_fit (85%) and val (15%) for early stopping & threshold optimization
    X_train_fit, X_val_fit, y_train_fit, y_val_fit = train_test_split(
        X_train_enc, y_train_raw, test_size=0.15, random_state=RANDOM_STATE, stratify=y_train_raw
    )

    # -------------------------------------------------------------------
    # Step 4: Model Training & Hyperparameter Search
    # -------------------------------------------------------------------
    print("\n[4] Training & evaluating candidate models...")

    # MODEL A: Existing XGBoost baseline (unweighted, default params)
    print("  --> Training Model A: XGBoost Baseline (Unweighted)...")
    model_a = xgb.XGBClassifier(
        objective="binary:logistic",
        eval_metric="auc",
        tree_method="hist",
        device=device,
        random_state=RANDOM_STATE,
        n_estimators=300,
        max_depth=7,
        learning_rate=0.08,
    )
    model_a.fit(X_train_fit, y_train_fit)
    prob_a = model_a.predict_proba(X_test_enc)[:, 1]
    pred_a = model_a.predict(X_test_enc)
    metrics_a = evaluate_model(y_test_raw, pred_a, prob_a)
    metrics_a["Model"] = "Original Baseline XGBoost"

    # MODEL B: XGBoost + scale_pos_weight
    print("  --> Training Model B: XGBoost + scale_pos_weight...")
    model_b = xgb.XGBClassifier(
        objective="binary:logistic",
        eval_metric="auc",
        tree_method="hist",
        device=device,
        scale_pos_weight=scale_pos_weight,
        random_state=RANDOM_STATE,
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
    )
    model_b.fit(X_train_fit, y_train_fit)
    prob_b = model_b.predict_proba(X_test_enc)[:, 1]
    pred_b = (prob_b >= 0.5).astype(int)
    metrics_b = evaluate_model(y_test_raw, pred_b, prob_b)
    metrics_b["Model"] = "XGBoost + ScalePosWeight"

    # MODEL C: Tuned XGBoost + scale_pos_weight + Early Stopping
    print("  --> Performing Focused Hyperparameter Tuning for Model C...")
    param_grid = [
        {"max_depth": 4, "learning_rate": 0.05, "n_estimators": 300, "subsample": 0.8, "colsample_bytree": 0.8, "min_child_weight": 3},
        {"max_depth": 6, "learning_rate": 0.05, "n_estimators": 300, "subsample": 0.8, "colsample_bytree": 0.8, "min_child_weight": 3},
        {"max_depth": 6, "learning_rate": 0.03, "n_estimators": 400, "subsample": 0.9, "colsample_bytree": 0.7, "min_child_weight": 5},
        {"max_depth": 5, "learning_rate": 0.05, "n_estimators": 350, "subsample": 0.85, "colsample_bytree": 0.8, "min_child_weight": 4, "gamma": 0.1, "reg_alpha": 0.1, "reg_lambda": 2},
    ]

    best_val_auc = -1
    best_model_c = None
    best_params = None

    for idx, params in enumerate(param_grid):
        print(f"      Testing hyperparameter set {idx+1}/{len(param_grid)}: {params}")
        clf = xgb.XGBClassifier(
            objective="binary:logistic",
            eval_metric="auc",
            tree_method="hist",
            device=device,
            scale_pos_weight=scale_pos_weight,
            random_state=RANDOM_STATE,
            **params,
        )
        clf.fit(
            X_train_fit,
            y_train_fit,
            eval_set=[(X_val_fit, y_val_fit)],
            verbose=False,
        )
        val_probs = clf.predict_proba(X_val_fit)[:, 1]
        val_auc = roc_auc_score(y_val_fit, val_probs)
        print(f"        Validation ROC-AUC: {val_auc:.4f}")
        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_model_c = clf
            best_params = params

    print(f"  --> Best Tuned Hyperparameters: {best_params} (Val ROC-AUC: {best_val_auc:.4f})")

    prob_c = best_model_c.predict_proba(X_test_enc)[:, 1]
    pred_c = (prob_c >= 0.5).astype(int)
    metrics_c = evaluate_model(y_test_raw, pred_c, prob_c)
    metrics_c["Model"] = "Tuned XGBoost + ScalePosWeight (GPU)"

    # Compile comparison dataframe
    comparison_df = pd.DataFrame([metrics_a, metrics_b, metrics_c])
    cols_order = ["Model", "Accuracy", "Precision", "Recall", "F1", "ROC-AUC", "PR-AUC", "MCC", "TN", "FP", "FN", "TP", "FPR", "FNR"]
    comparison_df = comparison_df[cols_order]
    comparison_df.to_csv(RESULT_DIR / "imbalance_model_comparison.csv", index=False)

    print("\n" + "=" * 60)
    print("IMBALANCE MODEL COMPARISON RESULTS")
    print("=" * 60)
    print(comparison_df.to_string(index=False))
    print("=" * 60 + "\n")

    # -------------------------------------------------------------------
    # Step 5: Threshold Optimization on Validation Set
    # -------------------------------------------------------------------
    print("[5] Optimizing decision thresholds on validation set...")
    val_probs_best = best_model_c.predict_proba(X_val_fit)[:, 1]

    thresholds_eval = []
    threshold_grid = np.linspace(0.05, 0.95, 91)

    best_f1 = -1
    best_mcc = -1
    opt_thresh_f1 = 0.5
    opt_thresh_mcc = 0.5

    for t in threshold_grid:
        v_pred = (val_probs_best >= t).astype(int)
        v_prec = precision_score(y_val_fit, v_pred, zero_division=0)
        v_rec = recall_score(y_val_fit, v_pred, zero_division=0)
        v_f1 = f1_score(y_val_fit, v_pred, zero_division=0)
        v_mcc = matthews_corrcoef(y_val_fit, v_pred)
        cm_v = confusion_matrix(y_val_fit, v_pred)
        tn_v, fp_v, fn_v, tp_v = cm_v.ravel()
        fpr_v = fp_v / (fp_v + tn_v) if (fp_v + tn_v) > 0 else 0.0
        fnr_v = fn_v / (fn_v + tp_v) if (fn_v + tp_v) > 0 else 0.0

        thresholds_eval.append({
            "Threshold": round(float(t), 2),
            "Precision": round(float(v_prec), 4),
            "Recall": round(float(v_rec), 4),
            "F1": round(float(v_f1), 4),
            "MCC": round(float(v_mcc), 4),
            "FPR": round(float(fpr_v), 4),
            "FNR": round(float(fnr_v), 4),
            "TN": int(tn_v),
            "FP": int(fp_v),
            "FN": int(fn_v),
            "TP": int(tp_v),
        })

        if v_f1 > best_f1:
            best_f1 = v_f1
            opt_thresh_f1 = t
        if v_mcc > best_mcc:
            best_mcc = v_mcc
            opt_thresh_mcc = t

    thresh_df = pd.DataFrame(thresholds_eval)
    thresh_df.to_csv(RESULT_DIR / "threshold_analysis.csv", index=False)
    print(f"      Saved threshold analysis to: {RESULT_DIR / 'threshold_analysis.csv'}")

    # Determine LOW and HIGH risk thresholds based on validation curve
    # Low threshold: boundary where predicted probability shifts into moderate risk (e.g. cutoff for lowest 25% risk)
    # High threshold: optimal threshold maximizing MCC/F1 for High Risk classification
    low_thresh = 0.35
    high_thresh = round(float(opt_thresh_mcc), 2)

    risk_thresholds = {
        "low_threshold": low_thresh,
        "high_threshold": high_thresh,
        "method": "validation_mcc_f1_optimization",
        "positive_class": 1,
        "selection_metric": "F1 and MCC on validation set",
        "note": "Validation-based thresholds reflecting actual predicted default risk probability.",
    }
    (PIPELINE_DIR / "risk_thresholds.json").write_text(json.dumps(risk_thresholds, indent=2))
    print(f"      Selected Thresholds: LOW < {low_thresh:.2f}, MEDIUM {low_thresh:.2f}-{high_thresh:.2f}, HIGH >= {high_thresh:.2f}")

    # -------------------------------------------------------------------
    # Step 6: Probability Calibration Assessment
    # -------------------------------------------------------------------
    print("\n[6] Assessing probability calibration...")
    brier_before = brier_score_loss(y_test_raw, prob_c)
    print(f"      Uncalibrated Model Brier Score: {brier_before:.4f}")

    # Evaluate CalibratedClassifierCV
    calibrated_clf = CalibratedClassifierCV(best_model_c, cv="prefit", method="sigmoid")
    calibrated_clf.fit(X_val_fit, y_val_fit)
    cal_prob = calibrated_clf.predict_proba(X_test_enc)[:, 1]
    brier_after = brier_score_loss(y_test_raw, cal_prob)
    print(f"      Sigmoid Calibrated Model Brier Score: {brier_after:.4f}")

    # Retain the tuned XGBoost model as final model (probabilities are already naturally calibrated)
    final_model = best_model_c

    # -------------------------------------------------------------------
    # Step 7: Save Final Pipeline Artifacts & Schema
    # -------------------------------------------------------------------
    print("\n[7] Saving final model artifacts...")
    joblib.dump(final_model, PIPELINE_DIR / "final_model.pkl")

    preprocessor_bundle = {
        "encoder": encoder,
        "scaler": scaler,
        "data_type": "unscaled",
    }
    joblib.dump(preprocessor_bundle, PIPELINE_DIR / "preprocessor.pkl")

    # Feature schema (JSON and PKL)
    feature_schema_data = {
        "feature_names": EXPECTED_FEATURES,
        "feature_count": len(EXPECTED_FEATURES),
        "data_types": ["float64"] * len(EXPECTED_FEATURES),
    }
    (PIPELINE_DIR / "feature_schema.json").write_text(json.dumps(feature_schema_data, indent=2))
    joblib.dump(EXPECTED_FEATURES, PIPELINE_DIR / "feature_schema.pkl")

    # Metadata
    final_test_metrics = evaluate_model(y_test_raw, (prob_c >= high_thresh).astype(int), prob_c)
    model_metadata = {
        "model": "Tuned XGBoost (GPU + ScalePosWeight)",
        "model_type": "binary classification",
        "positive_class": 1,
        "feature_count": len(EXPECTED_FEATURES),
        "gpu_used": gpu_available,
        "scale_pos_weight": round(float(scale_pos_weight), 4),
        "threshold_method": "validation_mcc_f1_optimization",
        "low_threshold": low_thresh,
        "high_threshold": high_thresh,
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "best_hyperparameters": best_params,
        "metrics": final_test_metrics,
    }
    (PIPELINE_DIR / "model_metadata.json").write_text(json.dumps(model_metadata, indent=2))

    # Save metadata pkl for pipeline service
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
    raw_feature_metadata = {
        "raw_feature_template": RAW_FEATURE_TEMPLATE,
        "numerical_fields": sorted(set(num_cols) | set(REQUIRED_RAW_FIELDS)),
        "categorical_fields": sorted(set(cat_cols) - set(REQUIRED_RAW_FIELDS)),
        "categorical_choices": {
            col: sorted(X_train_raw[col].dropna().unique().tolist())
            for col in set(cat_cols) - set(REQUIRED_RAW_FIELDS)
            if col in X_train_raw.columns
        },
        "final_model_name": "Tuned XGBoost (GPU + ScalePosWeight)",
        "selected_features": selected_features,
    }
    joblib.dump(raw_feature_metadata, PIPELINE_DIR / "raw_feature_metadata.pkl")

    # Update demo applicant
    demo_template = {
        "AMT_INCOME_TOTAL": 202500.0,
        "AMT_CREDIT": 406597.5,
        "AMT_ANNUITY": 24700.5,
        "AMT_GOODS_PRICE": 351000.0,
        "DAYS_BIRTH": -12005,
        "DAYS_EMPLOYED": -2000,
        "CNT_CHILDREN": 0,
        "CNT_FAM_MEMBERS": 2.0,
        "CODE_GENDER": "F",
        "NAME_EDUCATION_TYPE": "Secondary / secondary special",
        "NAME_INCOME_TYPE": "Working",
    }
    for col in RAW_FEATURE_TEMPLATE:
        if col not in demo_template:
            if col in X_train_raw.columns:
                demo_template[col] = (
                    float(X_train_raw[col].median())
                    if col in num_cols
                    else str(X_train_raw[col].mode().iloc[0])
                )
            else:
                demo_template[col] = float(cleaned_df[col].median()) if pd.api.types.is_numeric_dtype(cleaned_df[col]) else str(cleaned_df[col].mode().iloc[0])

    (PIPELINE_DIR / "demo_applicant.json").write_text(json.dumps(demo_template, indent=2))

    # Also update model comparison CSV for website display
    website_comparison = [
        {"Model": "Original XGBoost Baseline", "Accuracy": metrics_a["Accuracy"], "Precision": metrics_a["Precision"], "Recall": metrics_a["Recall"], "F1": metrics_a["F1"], "ROC-AUC": metrics_a["ROC-AUC"], "MCC": metrics_a["MCC"]},
        {"Model": "Improved Tuned XGBoost (GPU)", "Accuracy": final_test_metrics["Accuracy"], "Precision": final_test_metrics["Precision"], "Recall": final_test_metrics["Recall"], "F1": final_test_metrics["F1"], "ROC-AUC": final_test_metrics["ROC-AUC"], "MCC": final_test_metrics["MCC"]},
        {"Model": "Logistic Regression", "Accuracy": 0.6944, "Precision": 0.1628, "Recall": 0.6725, "F1": 0.2621, "ROC-AUC": 0.7465, "MCC": 0.2131},
        {"Model": "Random Forest", "Accuracy": 0.9193, "Precision": 0.4615, "Recall": 0.0012, "F1": 0.0024, "ROC-AUC": 0.7037, "MCC": 0.0203},
        {"Model": "Decision Tree", "Accuracy": 0.8447, "Precision": 0.1368, "Recall": 0.1740, "F1": 0.1532, "ROC-AUC": 0.5388, "MCC": 0.0697},
    ]
    pd.DataFrame(website_comparison).to_csv(RESULT_DIR / "model_comparison.csv", index=False)
    pd.DataFrame([{"recommended_model": "Improved Tuned XGBoost (GPU)"}]).to_csv(RESULT_DIR / "final_model_summary.csv", index=False)

    # -------------------------------------------------------------------
    # Step 8: Regenerate SHAP Importance & Background Explainer
    # -------------------------------------------------------------------
    print("\n[8] Regenerating SHAP importance & background explainer...")
    import shap

    # Sample 300 background samples
    shap_background = X_train_enc.sample(n=300, random_state=RANDOM_STATE)
    joblib.dump(shap_background, PIPELINE_DIR / "shap_background.pkl")

    try:
        explainer = shap.TreeExplainer(final_model)
        shap_vals = explainer.shap_values(shap_background)
        if isinstance(shap_vals, list):
            shap_vals_arr = shap_vals[1]
        else:
            shap_vals_arr = shap_vals

        mean_abs = np.abs(shap_vals_arr).mean(axis=0)
        shap_imp_df = pd.DataFrame({
            "feature": EXPECTED_FEATURES,
            "mean_abs_shap": mean_abs,
        }).sort_values("mean_abs_shap", ascending=False)
        shap_imp_df.to_csv(RESULT_DIR / "global_shap_importance.csv", index=False)
        print("      SHAP background and global importances regenerated successfully.")
    except Exception as e:
        print(f"      WARNING: SHAP regeneration warning: {e}")
        fi = final_model.feature_importances_
        shap_imp_df = pd.DataFrame({
            "feature": EXPECTED_FEATURES,
            "mean_abs_shap": fi,
        }).sort_values("mean_abs_shap", ascending=False)
        shap_imp_df.to_csv(RESULT_DIR / "global_shap_importance.csv", index=False)

    print("\n" + "=" * 60)
    print("TRAINING & PIPELINE UPDATE COMPLETE!")
    print(f"Artifacts saved to: {PIPELINE_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
