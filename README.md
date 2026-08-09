# Credit Risk Assessment System

> **2-Month Summer Internship Project — Machine Learning & Full-Stack Web Application**

An end-to-end explainable machine learning system and full-stack web application designed to evaluate loan applicant risk using historical data from the [Home Credit Default Risk](https://www.kaggle.com/c/home-credit-default-risk) dataset (**307,511 applicants × 122 columns**).

The system combines a GPU-accelerated **Tuned XGBoost** model with class imbalance weighting (`scale_pos_weight`), **validation-based decision threshold optimization**, **SHAP explainability**, a high-performance **FastAPI** backend, and a modern, responsive **React + Vite** frontend.

---

## 🌟 Key Features

* **Full-Stack Architecture**: Decoupled FastAPI backend and Vite + React frontend.
* **GPU-Accelerated XGBoost**: Trained with `tree_method="hist"` and `device="cuda"` on NVIDIA GPU.
* **Class Imbalance Resolution**: Solved majority-class bias using calculated `scale_pos_weight` (~11.39), boosting High-Risk Default Recall from **3.14% to 65.50%**.
* **Validation-Based Threshold Optimization**: Data-driven risk categories (`LOW < 35%`, `MEDIUM 35–64%`, `HIGH >= 64%`) based on validation set MCC and F1-score optimization.
* **SHAP Explainability**: Per-prediction breakdown of top positive (risk-increasing) and negative (risk-reducing) factors influencing the model's risk score.
* **Interactive Risk Meter**: Visual gauge displaying predicted default probability (0–100%) and risk categories.
* **Model Comparison & Analytics**: Interactive charts and comparison tables evaluating baseline vs. improved models on a **61,503-sample** held-out test set.
* **Auto-Fill Demo Applicant**: Pre-populated sample data for instant demonstration without manual form entry.

---

## 📁 Project Structure

```
Credit Risk Assessment System/
├── backend/
│   ├── main.py                  # FastAPI server & REST endpoints
│   ├── setup_pipeline.py        # Legacy pipeline builder
│   ├── train_improved_model.py  # Model trainer with scale_pos_weight & threshold tuning
│   ├── validate_model.py       # Standalone test set validation & report generator
│   ├── test_cases.py            # LOW, MEDIUM, HIGH, & VERY HIGH profile test runner
│   ├── services/
│   │   └── pipeline.py          # Prediction & SHAP explanation service
│   └── schemas/
│       └── predict.py           # Pydantic request/response schemas
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, HeroSection, RiskForm, RiskMeter, RiskResult, ShapExplanation
│   │   ├── pages/               # AssessmentPage, InsightsPage, AboutPage
│   │   ├── services/            # Centralized API fetch service (api.js)
│   │   ├── App.jsx              # Root router & page layout
│   │   └── index.css            # Dark theme CSS & design tokens
│   ├── package.json
│   └── vite.config.js
├── Notebook/
│   ├── 01_DataLoading.ipynb
│   ├── 02_EDA.ipynb
│   ├── 03_DataCleaning_FeatureEngineering.ipynb
│   ├── 04_FeatureSelection.ipynb
│   ├── 05_DataPreprocessing_Modeling.ipynb
│   ├── 06_LogisticRegression.ipynb
│   ├── 07_DecisionTree.ipynb
│   ├── 08_RandomForest.ipynb
│   ├── 09_XGBoost.ipynb
│   ├── 10-Hypertuning.ipynb
│   ├── 11_ModelComparision.ipynb
│   ├── 12_SHAP_Explainability.ipynb
│   └── 13_PredictionPipeline.ipynb
├── models/
│   └── pipeline/                # Saved model, preprocessor, feature schema, & thresholds
├── results/                     # Model comparison CSVs, threshold analysis, & SHAP importances
├── README.md
└── requirements.txt
```

---

## 📊 Model Performance & Class Imbalance Resolution

All models were evaluated on the exact same 20% stratified held-out test set (**61,503 applicants** containing 56,538 Class 0 non-defaults and 4,965 Class 1 defaults):

| Model | Accuracy | Precision | High-Risk Recall | High-Risk F1 | ROC-AUC | PR-AUC | MCC | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Improved Tuned XGBoost (GPU + ScalePosWeight)** | **73.17%** | **18.02%** | **65.50%** | **28.27%** | **0.7656** | **0.2558** | **0.2354** | **Final Selected Model** |
| **Original Baseline XGBoost** | 91.95% | 52.13% | 3.20% | 6.03% | 0.7631 | 0.2486 | 0.1142 | Legacy Baseline |
| **Logistic Regression** | 69.44% | 16.28% | 67.25% | 26.21% | 0.7465 | — | 0.2131 | Baseline |
| **Random Forest** | 91.93% | 46.15% | 0.12% | 0.24% | 0.7037 | — | 0.0203 | Baseline |
| **Decision Tree** | 84.47% | 13.68% | 17.40% | 15.32% | 0.5388 | — | 0.0697 | Baseline |

> **Key Finding**: The original unweighted XGBoost achieved high accuracy (91.95%) by predicting Class 0 for ~97% of applicants, but failed to detect high-risk default applicants (Recall: 3.20%). By incorporating class imbalance weighting (`scale_pos_weight = 11.39`), **High-Risk Default Recall improved by +62.3%** (from 3.20% to 65.50%), successfully identifying **3,252 out of 4,965 actual default cases**.

---

## 🔌 Backend API Endpoints

The FastAPI backend exposes REST endpoints under `http://localhost:8000`:

* **`GET /api/health`**: Returns system health status and model load state.
* **`GET /api/model-info`**: Returns active model metadata, feature count (149), GPU status, and active risk thresholds.
* **`GET /api/model-comparison`**: Returns performance metrics comparing baseline vs. improved models.
* **`GET /api/shap/features`**: Returns pre-computed global SHAP feature importances.
* **`GET /api/demo-applicant`**: Returns pre-filled applicant values for quick demo submission.
* **`POST /api/predict`**: Accepts applicant JSON, executes preprocessing pipeline, predicts default probability, assigns risk category (`LOW`, `MEDIUM`, `HIGH`), and returns top SHAP risk factors.

---

## ⚡ Quick Start Guide

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & **npm**
* NVIDIA GPU (Optional: XGBoost will automatically fall back to CPU if CUDA is unavailable)

### 1. Model Training & Pipeline Setup

```powershell
# Navigate to the project root
cd "E:\Credit Risk Assessment System"

# Train improved model with class imbalance weighting & threshold optimization
python backend/train_improved_model.py

# Run test set validation report
python backend/validate_model.py

# Run applicant profile test suite
python backend/test_cases.py
```

### 2. Backend Server

```powershell
# Navigate to the backend directory
cd "E:\Credit Risk Assessment System\backend"

# Start FastAPI backend server
python -m uvicorn main:app --reload --port 8000
```
API live at `http://localhost:8000` | Interactive docs at `http://localhost:8000/docs`.

### 3. Frontend Web App

```powershell
# In a new terminal, navigate to the frontend directory
cd "E:\Credit Risk Assessment System\frontend"

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
Web UI live at `http://localhost:5173`.

---

## 🛠️ Technology Stack

* **Machine Learning**: Python 3.10 · scikit-learn · XGBoost 3.2 (CUDA GPU) · SHAP · pandas · NumPy · joblib
* **Backend**: FastAPI 0.135 · Uvicorn · Pydantic
* **Frontend**: React 19 · Vite · Tailwind CSS · Framer Motion · Recharts · Lucide React

---

## ⚠️ Limitations & Academic Disclaimer

* **Demonstration Purpose Only**: This is an internship portfolio project. Risk probabilities and thresholds (`LOW < 35%`, `MEDIUM 35–64%`, `HIGH >= 64%`) are for demonstration purposes and are **not regulatory bank thresholds**.
* **Model Behavior vs. Causality**: SHAP values explain features the model used to arrive at a probability; they do **not** represent real-world cause-and-effect relationships.
* **Data Storage**: Predictions are processed in-memory and not stored in a permanent database.
