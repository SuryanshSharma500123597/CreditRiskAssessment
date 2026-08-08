# Credit Risk Assessment System

A complete, end-to-end machine learning project that predicts the probability
a loan applicant will experience payment difficulty, using the
[Home Credit Default Risk](https://www.kaggle.com/c/home-credit-default-risk)
dataset. Built as an internship / portfolio project covering the full
lifecycle: data understanding → cleaning → feature engineering → modeling →
explainability → a deployable prediction pipeline and demo app.

> **Demonstration project — not a real lending decision.** Risk thresholds
> and outputs are for educational purposes only and are not bank-approved
> regulatory thresholds.

## Project Structure

```
credit-risk-assessment-system/
├── notebooks/
│   ├── 01_Data_Loading.ipynb
│   ├── 02_EDA.ipynb
│   ├── 03_Data_Cleaning_and_Feature_Engineering.ipynb
│   ├── 04_Feature_Selection.ipynb
│   ├── 05_Data_Preprocessing_for_Modeling.ipynb
│   ├── 06_Logistic_Regression.ipynb
│   ├── 07_Decision_Tree.ipynb
│   ├── 08_Random_Forest.ipynb
│   ├── 09_XGBoost.ipynb
│   ├── 10_Hyperparameter_Tuning_GPU.ipynb
│   ├── 11_Model_Comparison_and_Final_Model_Selection.ipynb
│   ├── 12_SHAP_Explainability.ipynb
│   └── 13_Prediction_Pipeline.ipynb
├── app/
│   ├── app.py
│   └── pipeline.py
├── models/
│   └── pipeline/          # saved model + preprocessing artifacts (see .gitattributes for LFS)
├── results/                # saved metrics, comparison tables, SHAP outputs
├── requirements.txt
└── README.md
```

## Pipeline Overview

1. **Data Loading & EDA** (01–02) — load the raw `application_train.csv`
   (307,511 rows × 122 columns), inspect structure, missingness, and the
   target's class imbalance (~8% default rate).
2. **Cleaning & Feature Engineering** (03) — drop columns with >65% missing
   values, impute (median/mode), flag the `DAYS_EMPLOYED` anomaly, and
   engineer ratio features (`CREDIT_INCOME_RATIO`, `ANNUITY_INCOME_RATIO`,
   `AGE`, `YEARS_EMPLOYED`, etc.).
3. **Feature Selection** (04) — rank features via Mutual Information,
   SelectKBest, and Random Forest importance; produce Top 20/30/40/50 subsets.
4. **Preprocessing** (05) — train/test split (80/20, stratified), one-hot
   encoding (fit on train only), SMOTE (train only), and two output
   versions: scaled (for Logistic Regression) and unscaled (for tree models).
5. **Modeling** (06–09) — baseline Logistic Regression, Decision Tree,
   Random Forest, and XGBoost (GPU-enabled: `tree_method="hist"`,
   `device="cuda"`).
6. **Hyperparameter Tuning** (10) — GPU-accelerated `RandomizedSearchCV`
   on XGBoost only (`n_jobs=1` to respect limited VRAM).
7. **Model Comparison & Selection** (11) — evaluate all models on ROC-AUC,
   Recall, Precision, F1, MCC, and prediction time; select the final model.
8. **Explainability** (12) — SHAP global and local explanations for the
   selected model.
9. **Prediction Pipeline** (13) — a reusable `CreditRiskPipeline` that
   validates, engineers features, preprocesses, predicts, and explains a
   single new applicant without retraining anything.
10. **Streamlit App** (`app/`) — a simple demo UI around the saved pipeline.

## Key Design Decisions

- **No data leakage**: all encoders/scalers are fit only on training data;
  SMOTE is applied only to training data; the test set is never touched
  during feature selection or hyperparameter tuning.
- **ROC-AUC and Recall as primary metrics**, given the ~8% class imbalance
  — accuracy alone would be misleading.
- **SHAP over ad-hoc feature importance** for the final explainability
  layer, giving both global and per-applicant explanations without
  claiming causality.
- **GPU-accelerated XGBoost tuning** (RTX 3050 Ti, 4GB VRAM) using
  `tree_method="hist"` + `device="cuda"`, with `n_jobs=1` in the search to
  avoid concurrent CUDA jobs exhausting VRAM.

## Running the Notebooks

```bash
pip install -r requirements.txt
jupyter notebook notebooks/
```
Run notebooks 01 → 13 in order; each depends on artifacts saved by the
previous ones.

## Running the App

```bash
cd app
pip install -r ../requirements.txt
streamlit run app.py
```

## Tech Stack

Python · pandas · NumPy · scikit-learn · XGBoost (GPU) · SHAP · imbalanced-learn (SMOTE) · Streamlit · Matplotlib/Seaborn

## Disclaimer

This project is for educational/portfolio purposes. Model outputs, risk
categories, and thresholds are demonstrations only and must not be used
for actual lending decisions.
