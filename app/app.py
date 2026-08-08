"""Credit Risk Assessment System — Streamlit demonstration app.
Loads the pipeline from Notebook 13's saved artifacts. Trains nothing."""
from pathlib import Path

import streamlit as st

from pipeline import CreditRiskPipeline

st.set_page_config(page_title="Credit Risk Assessment System", page_icon="💳", layout="centered")


@st.cache_resource
def load_pipeline():
    return CreditRiskPipeline().load_artifacts()


st.title("Credit Risk Assessment System")
st.caption("Machine Learning Based Loan Default Risk Prediction")
st.write("This application estimates the model-predicted probability of payment difficulty for a loan applicant.")
st.info("Demonstration project — not a real lending decision.")

try:
    pipeline = load_pipeline()
except Exception:
    st.error("The prediction pipeline could not be loaded. Please run Notebook 13 first.")
    st.stop()

st.subheader("Applicant Information")
with st.form("applicant_form"):
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**Financial Information**")
        income = st.number_input("Annual Income", min_value=0.0, value=202500.0, step=1000.0)
        credit = st.number_input("Credit Amount", min_value=0.0, value=406597.5, step=1000.0)
        annuity = st.number_input("Loan Annuity", min_value=0.0, value=24700.5, step=100.0)
        goods_price = st.number_input("Goods Price", min_value=0.0, value=351000.0, step=1000.0)
    with col2:
        st.markdown("**Applicant & Employment**")
        age = st.slider("Age (years)", 18, 75, 33)
        years_employed = st.slider("Years Employed", 0, 45, 5)
        children = st.number_input("Number of Children", min_value=0, max_value=10, value=0, step=1)
        family_size = st.number_input("Family Size", min_value=1, max_value=15, value=2, step=1)
        gender = st.selectbox("Gender", options=pipeline.meta["categorical_choices"].get("CODE_GENDER", ["F", "M"]))

    submitted = st.form_submit_button("Assess Credit Risk")

if submitted:
    applicant = dict(pipeline.meta["defaults"])  # start from training-data medians/modes for every field
    applicant.update({
        "AMT_INCOME_TOTAL": income, "AMT_CREDIT": credit, "AMT_ANNUITY": annuity,
        "AMT_GOODS_PRICE": goods_price, "DAYS_BIRTH": -age * 365, "DAYS_EMPLOYED": -years_employed * 365,
        "CNT_CHILDREN": children, "CNT_FAM_MEMBERS": float(family_size), "CODE_GENDER": gender,
    })
    applicant = {k: v for k, v in applicant.items() if k in pipeline.meta["raw_feature_template"]}
    try:
        result = pipeline.predict(applicant)
    except ValueError as exc:
        st.error(f"Invalid input: {exc}")
        st.stop()
    except Exception:
        st.error("Prediction failed. Please check your inputs and try again.")
        st.stop()

    st.subheader("Credit Risk Assessment")
    m1, m2, m3 = st.columns(3)
    m1.metric("Probability of Default", f"{result['probability_of_default']*100:.1f}%")
    m2.metric("Risk Category", result["risk_category"])
    m3.metric("Predicted Class", "1 (Default)" if result["predicted_class"] == 1 else "0 (No Default)")
    st.caption("TARGET = 0: model predicts no payment difficulty. TARGET = 1: model predicts payment difficulty.")

    interpretation = {
        "LOW RISK": "The model predicts a relatively lower probability of payment difficulty.",
        "MEDIUM RISK": "The model predicts a moderate probability of payment difficulty.",
        "HIGH RISK": "The model predicts a relatively higher probability of payment difficulty.",
    }
    st.write(interpretation[result["risk_category"]])
    st.caption("These categories are demonstration thresholds, not official banking thresholds.")

    st.subheader("Why did the model make this prediction?")
    try:
        explanation = pipeline.explain(applicant, top_n=5)
        c1, c2 = st.columns(2)
        with c1:
            st.markdown("**Factors increasing predicted risk**")
            for feat in explanation["top_increasing_risk"].index:
                st.write(f"• {feat}")
        with c2:
            st.markdown("**Factors reducing predicted risk**")
            for feat in explanation["top_decreasing_risk"].index:
                st.write(f"• {feat}")
        st.caption("The model associated these features with higher/lower predicted risk — this does not mean a feature caused default.")
    except Exception:
        st.warning("Explanation could not be generated for this prediction.")

    with st.expander("Model Information"):
        st.write("Final Model:", pipeline.meta["final_model_name"])
        st.write("Model Type:", type(pipeline.model).__name__)
        if type(pipeline.model).__name__ == "XGBClassifier":
            device = pipeline.model.get_xgb_params().get("device")
            if device == "cuda":
                st.write("GPU Acceleration: CUDA")

if st.button("Reset"):
    st.rerun()