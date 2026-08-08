/**
 * api.js — Centralized API service for the Credit Risk Assessment frontend.
 * All backend calls go through this file; never scatter fetch calls in components.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        'Cannot connect to the backend. Make sure the FastAPI server is running at ' + API_URL
      );
    }
    throw err;
  }
}

/** Check backend health */
export async function getHealth() {
  return request('/api/health');
}

/** Get model information */
export async function getModelInfo() {
  return request('/api/model-info');
}

/** Get model comparison results */
export async function getModelComparison() {
  return request('/api/model-comparison');
}

/** Get global SHAP feature importance (top N) */
export async function getShapFeatures(topN = 15) {
  return request(`/api/shap/features?top_n=${topN}`);
}

/** Get a demo applicant for the form */
export async function getDemoApplicant() {
  return request('/api/demo-applicant');
}

/**
 * Predict credit risk for an applicant.
 * @param {Object} applicantData - raw applicant fields
 * @returns {Promise<Object>} - { predicted_class, probability, risk_category, model, shap }
 */
export async function predictRisk(applicantData) {
  return request('/api/predict', {
    method: 'POST',
    body: JSON.stringify(applicantData),
  });
}
