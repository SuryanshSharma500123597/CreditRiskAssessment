"""
main.py — FastAPI backend for the Credit Risk Assessment System.

Start the server:
    cd "E:\Credit Risk Assessment System\backend"
    python -m uvicorn main:app --reload --port 8000

Endpoints:
    GET  /api/health
    GET  /api/model-info
    GET  /api/model-comparison
    GET  /api/shap/features
    POST /api/predict
    GET  /api/demo-applicant
"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Project root (always use correct spelling)
PROJECT_ROOT = Path(r"E:\Credit Risk Assessment System")
RESULT_DIR = PROJECT_ROOT / "results"

# Ensure backend dir is on path for imports
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from schemas.predict import (
    ApplicantInput,
    HealthResponse,
    ModelComparisonResponse,
    ModelInfoResponse,
    PredictionResponse,
    ShapExplanation,
    ShapFactor,
    ShapFeaturesResponse,
)
from services.pipeline import get_pipeline, load_pipeline


# ---------------------------------------------------------------------------
# Lifespan: load model once at startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML pipeline artifacts at startup, release at shutdown."""
    print("[Startup] Loading Credit Risk Assessment ML pipeline...")
    try:
        pipeline = load_pipeline()
        print(f"[Startup] Pipeline loaded successfully: {pipeline.get_model_info()['model']}")
    except Exception as e:
        print(f"[Startup] ERROR: Could not load pipeline: {e}")
        print("[Startup] Run backend/setup_pipeline.py first, then restart the server.")
    yield
    print("[Shutdown] Server shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Credit Risk Assessment API",
    description=(
        "Machine learning-based credit risk prediction API. "
        "Uses Tuned XGBoost (GPU) trained on the Home Credit Default Risk dataset."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_feature_name(name: str) -> str:
    """Strip 'cat__' / 'num__' prefixes and return a readable name."""
    parts = name.split("__", 1)
    return parts[1] if len(parts) > 1 else name


def _pipeline_or_503():
    """Return pipeline or raise 503 if not loaded."""
    try:
        return get_pipeline()
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail=(
                "ML pipeline is not loaded. "
                "Run backend/setup_pipeline.py first and restart the server."
            ),
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health():
    """System health check."""
    try:
        pipeline = get_pipeline()
        loaded = pipeline._loaded
    except RuntimeError:
        loaded = False
    return HealthResponse(status="healthy", model_loaded=loaded)


@app.get("/api/model-info", response_model=ModelInfoResponse, tags=["Model"])
async def model_info():
    """Return information about the final deployed model."""
    pipeline = _pipeline_or_503()
    return ModelInfoResponse(**pipeline.get_model_info())


@app.get("/api/model-comparison", response_model=ModelComparisonResponse, tags=["Model"])
async def model_comparison():
    """Return model comparison results from training."""
    comparison_path = RESULT_DIR / "model_comparison.csv"
    if not comparison_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Model comparison results not found. Run setup_pipeline.py first.",
        )

    df = pd.read_csv(comparison_path)
    models_list = df.to_dict(orient="records")

    # Determine final model
    final_summary_path = RESULT_DIR / "final_model_summary.csv"
    final_model = "Tuned XGBoost (GPU)"
    if final_summary_path.exists():
        summary = pd.read_csv(final_summary_path)
        if "recommended_model" in summary.columns:
            final_model = summary["recommended_model"].iloc[0]

    return ModelComparisonResponse(models=models_list, final_model=final_model)


@app.get("/api/shap/features", response_model=ShapFeaturesResponse, tags=["Model"])
async def shap_features(top_n: int = 15):
    """Return global SHAP/feature importance (pre-computed)."""
    shap_path = RESULT_DIR / "global_shap_importance.csv"
    source = "Global SHAP (TreeExplainer, 200-sample background)"

    if not shap_path.exists():
        # Fall back to XGBoost feature importance from results/
        xgb_fi_path = RESULT_DIR / "xgboost_feature_importance.csv"
        if not xgb_fi_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Feature importance results not found. Run setup_pipeline.py first.",
            )
        df = pd.read_csv(xgb_fi_path)
        df.columns = ["feature", "mean_abs_shap"]
        source = "XGBoost Feature Importance (gain)"
    else:
        df = pd.read_csv(shap_path)

    df = df.sort_values("mean_abs_shap", ascending=False).head(top_n)

    features = [
        {
            "feature": row["feature"],
            "importance": round(float(row["mean_abs_shap"]), 6),
            "clean_name": _clean_feature_name(row["feature"]),
        }
        for _, row in df.iterrows()
    ]

    return ShapFeaturesResponse(features=features, source=source)


@app.get("/api/demo-applicant", tags=["Predict"])
async def demo_applicant():
    """Return a pre-built demonstration applicant for the risk assessment form."""
    pipeline = _pipeline_or_503()
    demo = pipeline.get_demo_applicant()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo applicant not available.")
    return demo


@app.post("/api/predict", response_model=PredictionResponse, tags=["Predict"])
async def predict(applicant: ApplicantInput):
    """
    Assess credit risk for an applicant.

    Returns:
    - predicted_class: 0 = Low Risk, 1 = High Risk
    - probability: model-predicted probability of payment difficulty (0-1)
    - risk_category: LOW / MEDIUM / HIGH
    - shap: top factors increasing and decreasing predicted risk
    """
    pipeline = _pipeline_or_503()

    # Convert Pydantic model to dict
    applicant_dict = applicant.to_pipeline_dict()

    # Fill missing optional fields with pipeline defaults (from demo applicant)
    demo = pipeline.get_demo_applicant()
    meta = pipeline.raw_feature_metadata
    for field in meta["raw_feature_template"]:
        if field not in applicant_dict and field in demo:
            applicant_dict[field] = demo[field]

    # Run prediction
    try:
        result = pipeline.predict(applicant_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {type(e).__name__}. Check server logs.",
        )

    # Run SHAP explanation
    try:
        explanation = pipeline.explain(applicant_dict, top_n=7)
    except Exception as e:
        print(f"[Predict] SHAP explain error: {e}")
        explanation = {"positive": [], "negative": []}

    shap_response = ShapExplanation(
        positive=[ShapFactor(**f) for f in explanation["positive"]],
        negative=[ShapFactor(**f) for f in explanation["negative"]],
    )

    return PredictionResponse(
        predicted_class=result["predicted_class"],
        probability=result["probability"],
        risk_category=result["risk_category"],
        model=result["model"],
        shap=shap_response,
    )
