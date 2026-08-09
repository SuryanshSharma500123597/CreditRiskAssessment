"""Pydantic schemas for the predict API endpoint."""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, model_validator


class ApplicantInput(BaseModel):
    """
    Raw applicant fields accepted by the prediction endpoint.
    All fields map directly to the Home Credit Default Risk dataset columns.
    Days fields should be negative (days before application date).
    """
    # Financial
    AMT_INCOME_TOTAL: float = Field(..., gt=0, description="Annual income (positive)")
    AMT_CREDIT: float = Field(..., gt=0, description="Credit amount of the loan")
    AMT_ANNUITY: float = Field(..., gt=0, description="Loan annuity")
    AMT_GOODS_PRICE: float = Field(..., gt=0, description="Price of goods for which loan is given")

    # Days-based (negative = days before application)
    DAYS_BIRTH: int = Field(..., description="Days before application the client was born (negative)")
    DAYS_EMPLOYED: float = Field(..., description="Days before application client started current employment (negative)")

    # Family
    CNT_CHILDREN: int = Field(..., ge=0, description="Number of children")
    CNT_FAM_MEMBERS: float = Field(..., ge=1, description="Family members count")

    # External credit scores
    EXT_SOURCE_1: Optional[float] = Field(None, ge=0, le=1, description="External data source 1 normalized score")
    EXT_SOURCE_2: Optional[float] = Field(None, ge=0, le=1, description="External data source 2 normalized score")
    EXT_SOURCE_3: Optional[float] = Field(None, ge=0, le=1, description="External data source 3 normalized score")

    # Categorical
    CODE_GENDER: str = Field(default="F", description="Gender: M or F")
    NAME_EDUCATION_TYPE: str = Field(default="Secondary / secondary special", description="Education level")
    NAME_INCOME_TYPE: str = Field(default="Working", description="Income category")
    NAME_HOUSING_TYPE: Optional[str] = Field(default="House / apartment", description="Housing situation")
    OCCUPATION_TYPE: Optional[str] = Field(default="Laborers", description="Occupation")
    ORGANIZATION_TYPE: Optional[str] = Field(default="Business Entity Type 3", description="Organization type of employer")
    NAME_TYPE_SUITE: Optional[str] = Field(default="Unaccompanied", description="Who accompanied client")
    FLAG_OWN_CAR: Optional[str] = Field(default="N", description="Y or N — client owns car")

    # Flags
    FLAG_DOCUMENT_3: Optional[float] = Field(None, description="Document 3 provided (0 or 1)")
    FLAG_EMP_PHONE: Optional[float] = Field(None, description="Employment phone provided (0 or 1)")
    REG_CITY_NOT_WORK_CITY: Optional[float] = Field(None, description="Lives in different city from work")

    # Days
    DAYS_ID_PUBLISH: Optional[float] = Field(None, description="Days before application client changed ID (negative)")
    DAYS_REGISTRATION: Optional[float] = Field(None, description="Days before application client changed registration (negative)")
    DAYS_LAST_PHONE_CHANGE: Optional[float] = Field(None, description="Days before application client changed phone (negative)")
    HOUR_APPR_PROCESS_START: Optional[float] = Field(None, description="Hour of day application was made")

    # Ratings
    REGION_RATING_CLIENT: Optional[float] = Field(None, description="Rating of region where client lives (1-3)")
    REGION_RATING_CLIENT_W_CITY: Optional[float] = Field(None, description="Rating of region where client lives with city (1-3)")
    REGION_POPULATION_RELATIVE: Optional[float] = Field(None, description="Normalized population of region")

    # Log features (will be auto-computed but can be overridden)
    LOG_AMT_CREDIT: Optional[float] = Field(None, description="Log of credit amount (auto-computed if not provided)")
    LOG_AMT_INCOME_TOTAL: Optional[float] = Field(None, description="Log of income (auto-computed if not provided)")

    # Area metrics
    APARTMENTS_AVG: Optional[float] = Field(None, ge=0)
    APARTMENTS_MEDI: Optional[float] = Field(None, ge=0)
    APARTMENTS_MODE: Optional[float] = Field(None, ge=0)
    FLOORSMAX_AVG: Optional[float] = Field(None, ge=0)
    FLOORSMAX_MEDI: Optional[float] = Field(None, ge=0)
    FLOORSMAX_MODE: Optional[float] = Field(None, ge=0)
    LIVINGAREA_AVG: Optional[float] = Field(None, ge=0)
    LIVINGAREA_MEDI: Optional[float] = Field(None, ge=0)
    LIVINGAREA_MODE: Optional[float] = Field(None, ge=0)
    BASEMENTAREA_AVG: Optional[float] = Field(None, ge=0)
    BASEMENTAREA_MEDI: Optional[float] = Field(None, ge=0)
    BASEMENTAREA_MODE: Optional[float] = Field(None, ge=0)
    TOTALAREA_MODE: Optional[float] = Field(None, ge=0)

    # Other
    AMT_REQ_CREDIT_BUREAU_YEAR: Optional[float] = Field(None, ge=0)

    def to_pipeline_dict(self) -> dict:
        """Convert to dict for the prediction pipeline (exclude None values not needed)."""
        data = {}
        for k, v in self.model_dump().items():
            if v is not None:
                data[k] = v
        return data


class ShapFactor(BaseModel):
    feature: str
    raw_feature: str
    value: float
    direction: str


class ShapExplanation(BaseModel):
    positive: List[ShapFactor]
    negative: List[ShapFactor]


class PredictionResponse(BaseModel):
    predicted_class: int = Field(..., description="0=Low Risk, 1=High Risk prediction")
    probability: float = Field(..., description="Model-predicted probability of payment difficulty")
    risk_category: str = Field(..., description="LOW, MEDIUM, or HIGH")
    model: str = Field(..., description="Name of the model that made the prediction")
    shap: ShapExplanation
    disclaimer: str = Field(
        default=(
            "This is a model-predicted probability for demonstration purposes only. "
            "SHAP values describe model behavior, not causality. "
            "This is not a regulatory or bank-approved credit decision."
        )
    )


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class ModelInfoResponse(BaseModel):
    model: str
    gpu_enabled: bool
    explainability: str
    training_data: str
    dataset_rows: int
    dataset_columns: int
    feature_count: int
    risk_thresholds: Dict[str, Any]


class ModelMetrics(BaseModel):
    Model: str
    Accuracy: float
    Precision: float
    Recall: float
    F1: float
    ROC_AUC: float = Field(alias="ROC-AUC")
    MCC: float

    class Config:
        populate_by_name = True


class ModelComparisonResponse(BaseModel):
    models: List[Dict[str, Any]]
    final_model: str


class ShapFeature(BaseModel):
    feature: str
    importance: float
    clean_name: str


class ShapFeaturesResponse(BaseModel):
    features: List[ShapFeature]
    source: str
