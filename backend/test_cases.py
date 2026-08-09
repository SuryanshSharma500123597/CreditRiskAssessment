"""
test_cases.py — Realistic test profiles to validate credit risk assessment pipeline predictions.

Tests 5 distinct applicant profiles:
1. LOW RISK applicant (high income, low loan, stable long-term employment, mature age)
2. MEDIUM RISK applicant (average income, moderate credit ratio, standard employment)
3. HIGH RISK applicant (low income, high credit/annuity, young age, short employment)
4. VERY HIGH RISK applicant (very low income, excessive loan demand, unemployed/short employment, high annuity ratio)
5. DEMO APPLICANT profile
"""

import json
from pathlib import Path
import sys

BASE_DIR = Path(r"E:\Credit Risk Assessment System")
sys.path.insert(0, str(BASE_DIR / "backend"))

from services.pipeline import load_pipeline


def main():
    print("=" * 60)
    print("TESTING APPLICANT PROFILES")
    print("=" * 60)

    pipeline = load_pipeline()

    test_profiles = [
        {
            "name": "Profile 1 — Low Risk Applicant",
            "data": {
                "AMT_INCOME_TOTAL": 450000.0,
                "AMT_CREDIT": 300000.0,
                "AMT_ANNUITY": 15000.0,
                "AMT_GOODS_PRICE": 280000.0,
                "DAYS_BIRTH": -18250,  # ~50 years old
                "DAYS_EMPLOYED": -5475,  # ~15 years employed
                "CNT_CHILDREN": 0,
                "CNT_FAM_MEMBERS": 2.0,
                "CODE_GENDER": "F",
                "NAME_EDUCATION_TYPE": "Higher education",
                "NAME_INCOME_TYPE": "Commercial associate",
                "EXT_SOURCE_1": 0.85,
                "EXT_SOURCE_2": 0.78,
                "EXT_SOURCE_3": 0.82,
            },
        },
        {
            "name": "Profile 2 — Medium Risk Applicant",
            "data": {
                "AMT_INCOME_TOTAL": 180000.0,
                "AMT_CREDIT": 450000.0,
                "AMT_ANNUITY": 25000.0,
                "AMT_GOODS_PRICE": 400000.0,
                "DAYS_BIRTH": -12000,  # ~32 years old
                "DAYS_EMPLOYED": -1460,  # ~4 years employed
                "CNT_CHILDREN": 1,
                "CNT_FAM_MEMBERS": 3.0,
                "CODE_GENDER": "M",
                "NAME_EDUCATION_TYPE": "Secondary / secondary special",
                "NAME_INCOME_TYPE": "Working",
                "EXT_SOURCE_1": 0.50,
                "EXT_SOURCE_2": 0.48,
                "EXT_SOURCE_3": 0.52,
            },
        },
        {
            "name": "Profile 3 — High Risk Applicant",
            "data": {
                "AMT_INCOME_TOTAL": 90000.0,
                "AMT_CREDIT": 750000.0,
                "AMT_ANNUITY": 45000.0,
                "AMT_GOODS_PRICE": 700000.0,
                "DAYS_BIRTH": -7670,  # ~21 years old
                "DAYS_EMPLOYED": -180,  # ~0.5 years employed
                "CNT_CHILDREN": 2,
                "CNT_FAM_MEMBERS": 4.0,
                "CODE_GENDER": "M",
                "NAME_EDUCATION_TYPE": "Secondary / secondary special",
                "NAME_INCOME_TYPE": "Working",
                "EXT_SOURCE_1": 0.22,
                "EXT_SOURCE_2": 0.25,
                "EXT_SOURCE_3": 0.20,
            },
        },
        {
            "name": "Profile 4 — Very High Risk Applicant",
            "data": {
                "AMT_INCOME_TOTAL": 67500.0,
                "AMT_CREDIT": 900000.0,
                "AMT_ANNUITY": 52000.0,
                "AMT_GOODS_PRICE": 850000.0,
                "DAYS_BIRTH": -7300,  # ~20 years old
                "DAYS_EMPLOYED": 365243,  # Unemployed anomaly code
                "CNT_CHILDREN": 3,
                "CNT_FAM_MEMBERS": 5.0,
                "CODE_GENDER": "M",
                "NAME_EDUCATION_TYPE": "Lower secondary",
                "NAME_INCOME_TYPE": "Unemployed",
                "EXT_SOURCE_1": 0.10,
                "EXT_SOURCE_2": 0.12,
                "EXT_SOURCE_3": 0.08,
            },
        },
        {
            "name": "Profile 5 — Pre-filled Demo Applicant",
            "data": pipeline.get_demo_applicant(),
        },
    ]

    for profile in test_profiles:
        name = profile["name"]
        data = profile["data"]

        pred = pipeline.predict(data)
        exp = pipeline.explain(data, top_n=3)

        print(f"\n--- {name} ---")
        print(f"  Income:       ${data.get('AMT_INCOME_TOTAL', 0):,.2f}")
        print(f"  Credit Loan:  ${data.get('AMT_CREDIT', 0):,.2f}")
        print(f"  Annuity:      ${data.get('AMT_ANNUITY', 0):,.2f}")
        print(f"  Days Birth:   {data.get('DAYS_BIRTH')} (~{abs(data.get('DAYS_BIRTH', 0))/365.25:.1f} yrs old)")
        print(f"  Days Employed:{data.get('DAYS_EMPLOYED')}")
        print(f"  --> Probability:  {pred['probability']*100:.2f}%")
        print(f"  --> Predicted Class: {pred['predicted_class']}")
        print(f"  --> Risk Category:   {pred['risk_category']}")
        print(f"  --> Model:           {pred['model']}")

        if exp["positive"]:
            top_pos = ", ".join([f"{f['feature']} (+{f['value']:.4f})" for f in exp["positive"][:3]])
            print(f"  --> Top Risk Factors:       {top_pos}")
        if exp["negative"]:
            top_neg = ", ".join([f"{f['feature']} ({f['value']:.4f})" for f in exp["negative"][:3]])
            print(f"  --> Top Protective Factors: {top_neg}")

    print("\n" + "=" * 60)
    print("TEST SUITE COMPLETED SUCCESSFULLY")
    print("=" * 60)


if __name__ == "__main__":
    main()
