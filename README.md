# Credit Risk Assessment System

> **2-Month Summer Internship Project — Machine Learning & Full-Stack Web Application**

An end-to-end explainable machine learning system and full-stack web application designed to evaluate loan applicant risk using historical data from the [Home Credit Default Risk](https://www.kaggle.com/c/home-credit-default-risk) dataset (307,511 applicants × 122 columns).

The system combines a GPU-accelerated **Tuned XGBoost** model, **SHAP explainability**, a high-performance **FastAPI** backend, and a modern, responsive **React + Vite** frontend.

---

## 🌟 Key Features

* **Full-Stack Architecture**: Decoupled FastAPI backend and Vite + React frontend.
* **GPU-Accelerated XGBoost**: Trained with `tree_method="hist"` and `device="cuda"` (NVIDIA RTX 3050 Ti GPU).
* **SHAP Explainability**: Per-prediction breakdown of top positive and negative factors influencing the model's risk score.
* **Interactive Risk Meter**: Visual gauge displaying predicted probability (0–100%) and risk categories (`LOW < 30%`, `MEDIUM 30–60%`, `HIGH >= 60%`).
* **Model Comparison & Analytics**: Interactive charts and comparison tables evaluating 5 ML algorithms on a 61,503-sample held-out test set.
* **Auto-Fill Demo Applicant**: Pre-populated sample data for instant demonstration without manual form entry.

---

## 📁 Project Structure

```
Credit Risk Assessment System/
├── backend/
│   ├── main.py                  # FastAPI server & endpoints
│   ├── setup_pipeline.py        # One-time pipeline builder & artifact saver
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
│   └── pipeline/                # Saved model, preprocessor, & schemas
├── results/                     # Saved metrics CSVs & SHAP importances
├── README.md
└── requirements.txt
```

---

## 📊 Model Comparison & Performance

All models were evaluated on the exact same 20% stratified held-out test set (**61,503 applicants**):

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC | MCC | Selected |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tuned XGBoost (GPU)** | **0.9196** | **0.5324** | **0.0314** | **0.0593** | **0.7635** | **0.1147** | **Final Model** |
| **Logistic Regression** | 0.6944 | 0.1628 | 0.6725 | 0.2621 | 0.7465 | 0.2131 | Baseline |
| **XGBoost (Default)** | 0.9195 | 0.5426 | 0.0141 | 0.0275 | 0.7462 | 0.0777 | Baseline |
| **Random Forest** | 0.9193 | 0.4615 | 0.0012 | 0.0024 | 0.7037 | 0.0203 | Baseline |
| **Decision Tree** | 0.8447 | 0.1368 | 0.1740 | 0.1532 | 0.5388 | 0.0697 | Baseline |

---

## 🔌 Backend API Endpoints

The FastAPI backend exposes the following REST endpoints under `http://localhost:8000`:

* **`GET /api/health`**: Returns system health status and model load state.
* **`GET /api/model-info`**: Returns specs for the active model (Tuned XGBoost GPU, 149 features, risk thresholds).
* **`GET /api/model-comparison`**: Returns performance metrics for all 5 trained models.
* **`GET /api/shap/features`**: Returns pre-computed global SHAP feature importances.
* **`GET /api/demo-applicant`**: Returns pre-filled applicant values for quick demo submission.
* **`POST /api/predict`**: Accepts raw applicant JSON, runs preprocessing, predicts default probability, assigns risk category, and computes top SHAP risk factors.

---

## ⚡ Quick Start Guide

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & **npm**
* NVIDIA GPU (Optional: XGBoost will fall back if CUDA is unavailable)

### 1. Backend Setup

```powershell
# Navigate to the backend directory
cd "E:\Credit Risk Assessment System\backend"

# Install Python dependencies
pip install -r ..\requirements.txt

# Run one-time pipeline builder (generates models/pipeline/ artifacts)
python setup_pipeline.py

# Start FastAPI backend server
python -m uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`. Interactive docs are available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```powershell
# In a new terminal, navigate to the frontend directory
cd "E:\Credit Risk Assessment System\frontend"

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

The Web UI will be live at `http://localhost:5173`.

---

## 🛠️ Technology Stack

* **Machine Learning**: Python 3.10 · scikit-learn · XGBoost 3.2 (CUDA GPU) · SHAP · pandas · NumPy · joblib
* **Backend**: FastAPI 0.135 · Uvicorn · Pydantic
* **Frontend**: React 19 · Vite · Tailwind CSS · Framer Motion · Recharts · Lucide React

---

## ⚠️ Limitations & Academic Disclaimer

* **Demonstration Purpose Only**: This is an internship portfolio project. Risk probabilities and thresholds (`LOW < 30%`, `MEDIUM 30–60%`, `HIGH >= 60%`) are for demonstration purposes and are **not regulatory bank thresholds**.
* **Model Behavior vs. Causality**: SHAP values explain features the model used to arrive at a probability; they do **not** represent real-world cause-and-effect relationships.
* **Data Storage**: Predictions are processed in-memory and not stored in a permanent database.
