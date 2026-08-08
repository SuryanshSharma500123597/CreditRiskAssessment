import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Send, User, DollarSign, Briefcase, CreditCard } from 'lucide-react';
import { getDemoApplicant } from '../services/api';

// Categorical options matching the training data
const GENDER_OPTIONS = ['M', 'F'];
const EDUCATION_OPTIONS = [
  'Secondary / secondary special',
  'Higher education',
  'Incomplete higher',
  'Lower secondary',
  'Academic degree',
];
const INCOME_TYPE_OPTIONS = [
  'Working',
  'Commercial associate',
  'Pensioner',
  'State servant',
  'Self-employed',
  'Unemployed',
  'Student',
  'Businessman',
  'Maternity leave',
];
const HOUSING_OPTIONS = [
  'House / apartment',
  'With parents',
  'Municipal apartment',
  'Rented apartment',
  'Office apartment',
  'Co-op apartment',
];
const OCCUPATION_OPTIONS = [
  'Laborers',
  'Core staff',
  'Accountants',
  'Managers',
  'Drivers',
  'Sales staff',
  'Cleaning staff',
  'Cooking staff',
  'Private service staff',
  'Medicine staff',
  'Security staff',
  'High skill tech staff',
  'Waiters/barmen staff',
  'Low-skill Laborers',
  'Secretaries',
  'Realty agents',
  'HR staff',
  'IT staff',
];
const ORG_TYPE_OPTIONS = [
  'Business Entity Type 3',
  'Business Entity Type 2',
  'Business Entity Type 1',
  'Self-employed',
  'Other',
  'Medicine',
  'Government',
  'Construction',
  'Electricity',
  'Transport: type 4',
  'Trade: type 6',
  'Industry: type 3',
  'School',
  'Industry: type 9',
  'Security',
  'Hotel',
  'University',
  'XNA',
];
const SUITE_OPTIONS = [
  'Unaccompanied',
  'Family',
  'Spouse, partner',
  'Children',
  'Other_B',
  'Group of people',
  'Other_A',
];

function FormSection({ title, icon: Icon, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 8,
          background: 'rgba(99,102,241,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} color="#818cf8" />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, id, type = 'number', value, onChange, error, options, min, max, step, placeholder, required = false }) {
  const isSelect = type === 'select';
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    background: '#1a2332',
    border: `1px solid ${error ? '#ef444480' : '#1e293b'}`,
    color: '#f1f5f9',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    appearance: isSelect ? 'auto' : undefined,
  };

  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: '#94a3b8',
          marginBottom: 6,
          letterSpacing: '0.01em',
        }}
      >
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {isSelect ? (
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
          required={required}
          aria-required={required}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
          style={inputStyle}
          min={min}
          max={max}
          step={step || 'any'}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = error ? '#ef444480' : '#1e293b'}
        />
      )}
      {error && (
        <p id={`${id}-error`} role="alert" style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}

const initialForm = {
  AMT_INCOME_TOTAL: '',
  AMT_CREDIT: '',
  AMT_ANNUITY: '',
  AMT_GOODS_PRICE: '',
  DAYS_BIRTH: '',
  DAYS_EMPLOYED: '',
  CNT_CHILDREN: 0,
  CNT_FAM_MEMBERS: 2,
  EXT_SOURCE_1: '',
  EXT_SOURCE_2: '',
  EXT_SOURCE_3: '',
  CODE_GENDER: 'M',
  NAME_EDUCATION_TYPE: 'Secondary / secondary special',
  NAME_INCOME_TYPE: 'Working',
  NAME_HOUSING_TYPE: 'House / apartment',
  OCCUPATION_TYPE: 'Laborers',
  ORGANIZATION_TYPE: 'Business Entity Type 3',
  NAME_TYPE_SUITE: 'Unaccompanied',
  FLAG_OWN_CAR: 'N',
};

export default function RiskForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [demoLoading, setDemoLoading] = useState(false);

  const setField = (field) => (value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.AMT_INCOME_TOTAL || form.AMT_INCOME_TOTAL <= 0) errs.AMT_INCOME_TOTAL = 'Must be a positive number';
    if (!form.AMT_CREDIT || form.AMT_CREDIT <= 0) errs.AMT_CREDIT = 'Must be a positive number';
    if (!form.AMT_ANNUITY || form.AMT_ANNUITY <= 0) errs.AMT_ANNUITY = 'Must be a positive number';
    if (!form.AMT_GOODS_PRICE || form.AMT_GOODS_PRICE <= 0) errs.AMT_GOODS_PRICE = 'Must be a positive number';
    if (!form.DAYS_BIRTH || form.DAYS_BIRTH >= 0) errs.DAYS_BIRTH = 'Must be negative (days before application)';
    if (form.DAYS_EMPLOYED === '' || form.DAYS_EMPLOYED === undefined) errs.DAYS_EMPLOYED = 'Required';
    if (form.CNT_CHILDREN < 0) errs.CNT_CHILDREN = 'Cannot be negative';
    if (!form.CNT_FAM_MEMBERS || form.CNT_FAM_MEMBERS < 1) errs.CNT_FAM_MEMBERS = 'Must be at least 1';
    if (!form.CODE_GENDER) errs.CODE_GENDER = 'Required';
    if (!form.NAME_EDUCATION_TYPE) errs.NAME_EDUCATION_TYPE = 'Required';
    if (!form.NAME_INCOME_TYPE) errs.NAME_INCOME_TYPE = 'Required';
    if (!form.NAME_HOUSING_TYPE) errs.NAME_HOUSING_TYPE = 'Required';
    if (!form.OCCUPATION_TYPE) errs.OCCUPATION_TYPE = 'Required';
    if (!form.ORGANIZATION_TYPE) errs.ORGANIZATION_TYPE = 'Required';
    if (!form.NAME_TYPE_SUITE) errs.NAME_TYPE_SUITE = 'Required';
    if (!form.FLAG_OWN_CAR) errs.FLAG_OWN_CAR = 'Required';
    if (form.EXT_SOURCE_1 !== '' && (form.EXT_SOURCE_1 < 0 || form.EXT_SOURCE_1 > 1)) errs.EXT_SOURCE_1 = 'Must be between 0 and 1';
    if (form.EXT_SOURCE_2 !== '' && (form.EXT_SOURCE_2 < 0 || form.EXT_SOURCE_2 > 1)) errs.EXT_SOURCE_2 = 'Must be between 0 and 1';
    if (form.EXT_SOURCE_3 !== '' && (form.EXT_SOURCE_3 < 0 || form.EXT_SOURCE_3 > 1)) errs.EXT_SOURCE_3 = 'Must be between 0 and 1';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    // Build submission payload (omit empty optional fields)
    const payload = {};
    for (const [k, v] of Object.entries(form)) {
      if (v !== '' && v !== null && v !== undefined) {
        payload[k] = v;
      }
    }
    onSubmit(payload);
  };

  const loadDemo = async () => {
    setDemoLoading(true);
    try {
      const demo = await getDemoApplicant();
      setForm(prev => ({
        ...prev,
        AMT_INCOME_TOTAL: demo.AMT_INCOME_TOTAL || 202500,
        AMT_CREDIT: demo.AMT_CREDIT || 406597.5,
        AMT_ANNUITY: demo.AMT_ANNUITY || 24700.5,
        AMT_GOODS_PRICE: demo.AMT_GOODS_PRICE || 351000,
        DAYS_BIRTH: demo.DAYS_BIRTH || -12005,
        DAYS_EMPLOYED: demo.DAYS_EMPLOYED || -2000,
        CNT_CHILDREN: demo.CNT_CHILDREN ?? 0,
        CNT_FAM_MEMBERS: demo.CNT_FAM_MEMBERS || 2,
        EXT_SOURCE_1: demo.EXT_SOURCE_1 || 0.506,
        EXT_SOURCE_2: demo.EXT_SOURCE_2 || 0.566,
        EXT_SOURCE_3: demo.EXT_SOURCE_3 || 0.535,
        CODE_GENDER: demo.CODE_GENDER || 'F',
        NAME_EDUCATION_TYPE: demo.NAME_EDUCATION_TYPE || 'Secondary / secondary special',
        NAME_INCOME_TYPE: demo.NAME_INCOME_TYPE || 'Working',
        NAME_HOUSING_TYPE: demo.NAME_HOUSING_TYPE || 'House / apartment',
        OCCUPATION_TYPE: demo.OCCUPATION_TYPE || 'Laborers',
        ORGANIZATION_TYPE: demo.ORGANIZATION_TYPE || 'Business Entity Type 3',
        NAME_TYPE_SUITE: demo.NAME_TYPE_SUITE || 'Unaccompanied',
        FLAG_OWN_CAR: demo.FLAG_OWN_CAR || 'N',
      }));
      setErrors({});
    } catch {
      // Use fallback demo values if API call fails
      setForm({
        AMT_INCOME_TOTAL: 202500, AMT_CREDIT: 406597.5, AMT_ANNUITY: 24700.5,
        AMT_GOODS_PRICE: 351000, DAYS_BIRTH: -12005, DAYS_EMPLOYED: -2000,
        CNT_CHILDREN: 0, CNT_FAM_MEMBERS: 2,
        EXT_SOURCE_1: 0.506, EXT_SOURCE_2: 0.566, EXT_SOURCE_3: 0.535,
        CODE_GENDER: 'F', NAME_EDUCATION_TYPE: 'Secondary / secondary special',
        NAME_INCOME_TYPE: 'Working', NAME_HOUSING_TYPE: 'House / apartment',
        OCCUPATION_TYPE: 'Laborers', ORGANIZATION_TYPE: 'Business Entity Type 3',
        NAME_TYPE_SUITE: 'Unaccompanied', FLAG_OWN_CAR: 'N',
      });
      setErrors({});
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Credit risk assessment form">
      {/* Demo & Reset actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <button
          type="button"
          id="btn-load-demo"
          onClick={loadDemo}
          disabled={demoLoading || loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 8,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s',
            opacity: demoLoading ? 0.6 : 1,
          }}
          aria-label="Load a demonstration applicant"
        >
          <RefreshCw size={14} className={demoLoading ? 'spin' : ''} />
          {demoLoading ? 'Loading...' : 'Load Demo Applicant'}
        </button>
        <button
          type="button"
          id="btn-reset-form"
          onClick={() => { setForm(initialForm); setErrors({}); }}
          disabled={loading}
          style={{
            padding: '10px 18px', borderRadius: 8,
            background: 'transparent', border: '1px solid #1e293b',
            color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          aria-label="Reset form to defaults"
        >
          Reset
        </button>
      </div>

      {/* Applicant Information */}
      <FormSection title="Applicant Information" icon={User}>
        <FormField id="code-gender" label="Gender" type="select" value={form.CODE_GENDER}
          onChange={setField('CODE_GENDER')} options={GENDER_OPTIONS} required error={errors.CODE_GENDER} />
        <FormField id="education-type" label="Education Level" type="select" value={form.NAME_EDUCATION_TYPE}
          onChange={setField('NAME_EDUCATION_TYPE')} options={EDUCATION_OPTIONS} required error={errors.NAME_EDUCATION_TYPE} />
        <FormField id="income-type" label="Income Type" type="select" value={form.NAME_INCOME_TYPE}
          onChange={setField('NAME_INCOME_TYPE')} options={INCOME_TYPE_OPTIONS} required error={errors.NAME_INCOME_TYPE} />
        <FormField id="housing-type" label="Housing Type" type="select" value={form.NAME_HOUSING_TYPE}
          onChange={setField('NAME_HOUSING_TYPE')} options={HOUSING_OPTIONS} required error={errors.NAME_HOUSING_TYPE} />
        <FormField id="suite-type" label="Accompanied By" type="select" value={form.NAME_TYPE_SUITE}
          onChange={setField('NAME_TYPE_SUITE')} options={SUITE_OPTIONS} required error={errors.NAME_TYPE_SUITE} />
        <FormField id="own-car" label="Owns a Car" type="select" value={form.FLAG_OWN_CAR}
          onChange={setField('FLAG_OWN_CAR')} options={['N', 'Y']} required error={errors.FLAG_OWN_CAR} />
        <FormField id="cnt-children" label="Number of Children" value={form.CNT_CHILDREN}
          onChange={setField('CNT_CHILDREN')} min={0} max={20} step={1} error={errors.CNT_CHILDREN} />
        <FormField id="cnt-fam-members" label="Family Members" value={form.CNT_FAM_MEMBERS}
          onChange={setField('CNT_FAM_MEMBERS')} min={1} max={20} step={1} required error={errors.CNT_FAM_MEMBERS} />
        <FormField id="days-birth" label="Age in Days (negative)" value={form.DAYS_BIRTH}
          onChange={setField('DAYS_BIRTH')} placeholder="-12005" required error={errors.DAYS_BIRTH}
          step={1} />
      </FormSection>

      {/* Financial Information */}
      <FormSection title="Financial Information" icon={DollarSign}>
        <FormField id="amt-income" label="Annual Income (₹)" value={form.AMT_INCOME_TOTAL}
          onChange={setField('AMT_INCOME_TOTAL')} min={1} placeholder="202500" required error={errors.AMT_INCOME_TOTAL} />
        <FormField id="amt-credit" label="Credit Amount (₹)" value={form.AMT_CREDIT}
          onChange={setField('AMT_CREDIT')} min={1} placeholder="406597.5" required error={errors.AMT_CREDIT} />
        <FormField id="amt-annuity" label="Loan Annuity (₹)" value={form.AMT_ANNUITY}
          onChange={setField('AMT_ANNUITY')} min={1} placeholder="24700.5" required error={errors.AMT_ANNUITY} />
        <FormField id="amt-goods" label="Goods Price (₹)" value={form.AMT_GOODS_PRICE}
          onChange={setField('AMT_GOODS_PRICE')} min={1} placeholder="351000" required error={errors.AMT_GOODS_PRICE} />
      </FormSection>

      {/* Employment Information */}
      <FormSection title="Employment Information" icon={Briefcase}>
        <FormField id="occupation-type" label="Occupation" type="select" value={form.OCCUPATION_TYPE}
          onChange={setField('OCCUPATION_TYPE')} options={OCCUPATION_OPTIONS} required error={errors.OCCUPATION_TYPE} />
        <FormField id="organization-type" label="Organization Type" type="select" value={form.ORGANIZATION_TYPE}
          onChange={setField('ORGANIZATION_TYPE')} options={ORG_TYPE_OPTIONS} required error={errors.ORGANIZATION_TYPE} />
        <FormField id="days-employed" label="Days Employed (negative)" value={form.DAYS_EMPLOYED}
          onChange={setField('DAYS_EMPLOYED')} placeholder="-2000" required error={errors.DAYS_EMPLOYED}
          step={1} />
      </FormSection>

      {/* External Credit Scores */}
      <FormSection title="External Credit Scores (0–1)" icon={CreditCard}>
        <FormField id="ext-source-1" label="External Score 1" value={form.EXT_SOURCE_1}
          onChange={setField('EXT_SOURCE_1')} min={0} max={1} step={0.001} placeholder="0.50"
          error={errors.EXT_SOURCE_1} />
        <FormField id="ext-source-2" label="External Score 2" value={form.EXT_SOURCE_2}
          onChange={setField('EXT_SOURCE_2')} min={0} max={1} step={0.001} placeholder="0.56"
          error={errors.EXT_SOURCE_2} />
        <FormField id="ext-source-3" label="External Score 3" value={form.EXT_SOURCE_3}
          onChange={setField('EXT_SOURCE_3')} min={0} max={1} step={0.001} placeholder="0.54"
          error={errors.EXT_SOURCE_3} />
      </FormSection>

      {/* Submit button */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button
          id="btn-assess-risk-submit"
          type="submit"
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 40px',
            borderRadius: 12,
            background: loading ? '#1a2332' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: loading ? '1px solid #1e293b' : 'none',
            color: loading ? '#64748b' : 'white',
            fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.3s',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
            minWidth: 200,
          }}
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid #64748b', borderTopColor: '#818cf8',
                animation: 'spin 0.8s linear infinite',
              }} />
              Analyzing applicant...
            </>
          ) : (
            <>
              <Send size={16} />
              Assess Risk
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </form>
  );
}
