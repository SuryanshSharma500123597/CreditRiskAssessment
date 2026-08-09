import { useState } from 'react';
import { RefreshCw, Send, User, DollarSign, Briefcase, Home, ShieldCheck } from 'lucide-react';
import { getDemoApplicant } from '../services/api';

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

function FormSection({ title, subtitle, icon: Icon, children }) {
  return (
    <div style={{
      marginBottom: 32,
      background: '#111827',
      border: '1px solid #1e293b',
      borderRadius: 16,
      padding: '24px 28px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color="#818cf8" />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, id, type = 'number', value, onChange, error, options, min, max, step, placeholder, required = false, hint }) {
  const isSelect = type === 'select';
  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    background: '#1a2332',
    border: `1px solid ${error ? '#ef4444' : '#1e293b'}`,
    color: '#f1f5f9',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s',
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
          fontWeight: 600,
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
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        >
          <option value="">Select option...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)}
          style={inputStyle}
          min={min}
          max={max}
          step={step || 'any'}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#1e293b'}
        />
      )}
      {hint && !error && (
        <p id={`${id}-hint`} style={{ fontSize: 11, color: '#64748b', marginTop: 4, margin: '4px 0 0' }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 500 }}>
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
  age_years: 33,
  employment_years: 5,
  CNT_CHILDREN: 0,
  CNT_FAM_MEMBERS: 2,
  EXT_SOURCE_1: '',
  EXT_SOURCE_2: '',
  EXT_SOURCE_3: '',
  CODE_GENDER: 'F',
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
    if (!form.AMT_INCOME_TOTAL || form.AMT_INCOME_TOTAL <= 0) errs.AMT_INCOME_TOTAL = 'Annual income must be a positive number';
    if (!form.AMT_CREDIT || form.AMT_CREDIT <= 0) errs.AMT_CREDIT = 'Credit amount must be a positive number';
    if (!form.AMT_ANNUITY || form.AMT_ANNUITY <= 0) errs.AMT_ANNUITY = 'Loan annuity must be a positive number';
    if (!form.AMT_GOODS_PRICE || form.AMT_GOODS_PRICE <= 0) errs.AMT_GOODS_PRICE = 'Goods price must be a positive number';
    if (!form.age_years || form.age_years < 18 || form.age_years > 100) errs.age_years = 'Age must be between 18 and 100 years';
    if (form.employment_years === '' || form.employment_years < 0 || form.employment_years > 70) errs.employment_years = 'Enter valid employment duration (0 for unemployed)';
    if (form.CNT_CHILDREN < 0) errs.CNT_CHILDREN = 'Children cannot be negative';
    if (!form.CNT_FAM_MEMBERS || form.CNT_FAM_MEMBERS < 1) errs.CNT_FAM_MEMBERS = 'Family members must be at least 1';
    if (!form.CODE_GENDER) errs.CODE_GENDER = 'Gender is required';
    if (!form.NAME_EDUCATION_TYPE) errs.NAME_EDUCATION_TYPE = 'Education level is required';
    if (!form.NAME_INCOME_TYPE) errs.NAME_INCOME_TYPE = 'Income type is required';
    if (!form.NAME_HOUSING_TYPE) errs.NAME_HOUSING_TYPE = 'Housing type is required';
    if (!form.OCCUPATION_TYPE) errs.OCCUPATION_TYPE = 'Occupation is required';
    if (!form.ORGANIZATION_TYPE) errs.ORGANIZATION_TYPE = 'Organization type is required';
    if (form.EXT_SOURCE_1 !== '' && (form.EXT_SOURCE_1 < 0 || form.EXT_SOURCE_1 > 1)) errs.EXT_SOURCE_1 = 'Must be between 0.00 and 1.00';
    if (form.EXT_SOURCE_2 !== '' && (form.EXT_SOURCE_2 < 0 || form.EXT_SOURCE_2 > 1)) errs.EXT_SOURCE_2 = 'Must be between 0.00 and 1.00';
    if (form.EXT_SOURCE_3 !== '' && (form.EXT_SOURCE_3 < 0 || form.EXT_SOURCE_3 > 1)) errs.EXT_SOURCE_3 = 'Must be between 0.00 and 1.00';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    // Build payload with converted days fields
    const payload = { ...form };
    const ageYrs = parseFloat(form.age_years) || 33;
    const empYrs = parseFloat(form.employment_years) || 5;

    payload.DAYS_BIRTH = -Math.round(ageYrs * 365.25);
    payload.DAYS_EMPLOYED = empYrs > 0 ? -Math.round(empYrs * 365.25) : 365243;

    delete payload.age_years;
    delete payload.employment_years;

    onSubmit(payload);
  };

  const loadDemo = async () => {
    setDemoLoading(true);
    try {
      const demo = await getDemoApplicant();
      const rawBirth = demo.DAYS_BIRTH || -12005;
      const rawEmp = demo.DAYS_EMPLOYED || -2000;

      const calcAge = Math.round(Math.abs(rawBirth) / 365.25);
      const calcEmp = rawEmp === 365243 ? 0 : Math.round(Math.abs(rawEmp) / 365.25);

      setForm({
        AMT_INCOME_TOTAL: demo.AMT_INCOME_TOTAL || 202500,
        AMT_CREDIT: demo.AMT_CREDIT || 406597.5,
        AMT_ANNUITY: demo.AMT_ANNUITY || 24700.5,
        AMT_GOODS_PRICE: demo.AMT_GOODS_PRICE || 351000,
        age_years: calcAge,
        employment_years: calcEmp,
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
      });
      setErrors({});
    } catch {
      setForm({
        AMT_INCOME_TOTAL: 202500, AMT_CREDIT: 406597.5, AMT_ANNUITY: 24700.5,
        AMT_GOODS_PRICE: 351000, age_years: 33, employment_years: 5,
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
    <form onSubmit={handleSubmit} noValidate aria-label="Credit risk assessment application form">
      {/* Form header & Demo loader */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
            Applicant Information Form
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Enter financial details to generate a model-estimated credit risk assessment.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            id="btn-load-demo"
            onClick={loadDemo}
            disabled={demoLoading || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              opacity: demoLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} className={demoLoading ? 'spin' : ''} />
            {demoLoading ? 'Loading Demo...' : 'Pre-fill Demo Applicant'}
          </button>
          <button
            type="button"
            id="btn-reset-form"
            onClick={() => { setForm(initialForm); setErrors({}); }}
            disabled={loading}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'transparent', border: '1px solid #1e293b',
              color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* 1. Personal Information */}
      <FormSection title="Personal Information" subtitle="Demographics and family background" icon={User}>
        <FormField id="code-gender" label="Gender" type="select" value={form.CODE_GENDER}
          onChange={setField('CODE_GENDER')} options={GENDER_OPTIONS} required error={errors.CODE_GENDER} />
        <FormField id="age-years" label="Age (Years)" value={form.age_years}
          onChange={setField('age_years')} min={18} max={100} step={1} placeholder="33" required error={errors.age_years}
          hint="Applicant age in years" />
        <FormField id="education-type" label="Education Level" type="select" value={form.NAME_EDUCATION_TYPE}
          onChange={setField('NAME_EDUCATION_TYPE')} options={EDUCATION_OPTIONS} required error={errors.NAME_EDUCATION_TYPE} />
        <FormField id="cnt-children" label="Number of Children" value={form.CNT_CHILDREN}
          onChange={setField('CNT_CHILDREN')} min={0} max={20} step={1} error={errors.CNT_CHILDREN} />
        <FormField id="cnt-fam-members" label="Family Members" value={form.CNT_FAM_MEMBERS}
          onChange={setField('CNT_FAM_MEMBERS')} min={1} max={20} step={1} required error={errors.CNT_FAM_MEMBERS} />
      </FormSection>

      {/* 2. Financial Information */}
      <FormSection title="Financial Information" subtitle="Income, loan request, and annuity" icon={DollarSign}>
        <FormField id="amt-income" label="Annual Income (₹)" value={form.AMT_INCOME_TOTAL}
          onChange={setField('AMT_INCOME_TOTAL')} min={1} placeholder="e.g. 202,500" required error={errors.AMT_INCOME_TOTAL}
          hint="Total annual income in INR" />
        <FormField id="amt-credit" label="Credit Amount (₹)" value={form.AMT_CREDIT}
          onChange={setField('AMT_CREDIT')} min={1} placeholder="e.g. 406,597" required error={errors.AMT_CREDIT}
          hint="Total loan credit requested" />
        <FormField id="amt-annuity" label="Loan Annuity (₹)" value={form.AMT_ANNUITY}
          onChange={setField('AMT_ANNUITY')} min={1} placeholder="e.g. 24,700" required error={errors.AMT_ANNUITY}
          hint="Annual payment annuity" />
        <FormField id="amt-goods" label="Goods Price (₹)" value={form.AMT_GOODS_PRICE}
          onChange={setField('AMT_GOODS_PRICE')} min={1} placeholder="e.g. 351,000" required error={errors.AMT_GOODS_PRICE}
          hint="Price of goods financed" />
      </FormSection>

      {/* 3. Employment Information */}
      <FormSection title="Employment Information" subtitle="Work history and employer details" icon={Briefcase}>
        <FormField id="income-type" label="Income Category" type="select" value={form.NAME_INCOME_TYPE}
          onChange={setField('NAME_INCOME_TYPE')} options={INCOME_TYPE_OPTIONS} required error={errors.NAME_INCOME_TYPE} />
        <FormField id="employment-years" label="Employment Duration (Years)" value={form.employment_years}
          onChange={setField('employment_years')} min={0} max={70} step={0.5} placeholder="5" required error={errors.employment_years}
          hint="Years at current job (0 if unemployed)" />
        <FormField id="occupation-type" label="Occupation" type="select" value={form.OCCUPATION_TYPE}
          onChange={setField('OCCUPATION_TYPE')} options={OCCUPATION_OPTIONS} required error={errors.OCCUPATION_TYPE} />
        <FormField id="organization-type" label="Organization Type" type="select" value={form.ORGANIZATION_TYPE}
          onChange={setField('ORGANIZATION_TYPE')} options={ORG_TYPE_OPTIONS} required error={errors.ORGANIZATION_TYPE} />
      </FormSection>

      {/* 4. Housing & Assets */}
      <FormSection title="Housing & Assets" subtitle="Living arrangement and vehicle ownership" icon={Home}>
        <FormField id="housing-type" label="Housing Type" type="select" value={form.NAME_HOUSING_TYPE}
          onChange={setField('NAME_HOUSING_TYPE')} options={HOUSING_OPTIONS} required error={errors.NAME_HOUSING_TYPE} />
        <FormField id="own-car" label="Owns a Car" type="select" value={form.FLAG_OWN_CAR}
          onChange={setField('FLAG_OWN_CAR')} options={['N', 'Y']} required error={errors.FLAG_OWN_CAR} />
        <FormField id="suite-type" label="Accompanied By" type="select" value={form.NAME_TYPE_SUITE}
          onChange={setField('NAME_TYPE_SUITE')} options={SUITE_OPTIONS} required error={errors.NAME_TYPE_SUITE} />
      </FormSection>

      {/* 5. External Credit Ratings */}
      <FormSection title="External Credit Ratings (Optional)" subtitle="Standardized credit bureau ratings (0.00 to 1.00)" icon={ShieldCheck}>
        <FormField id="ext-source-1" label="External Rating 1" value={form.EXT_SOURCE_1}
          onChange={setField('EXT_SOURCE_1')} min={0} max={1} step={0.01} placeholder="e.g. 0.50" error={errors.EXT_SOURCE_1} />
        <FormField id="ext-source-2" label="External Rating 2" value={form.EXT_SOURCE_2}
          onChange={setField('EXT_SOURCE_2')} min={0} max={1} step={0.01} placeholder="e.g. 0.56" error={errors.EXT_SOURCE_2} />
        <FormField id="ext-source-3" label="External Rating 3" value={form.EXT_SOURCE_3}
          onChange={setField('EXT_SOURCE_3')} min={0} max={1} step={0.01} placeholder="e.g. 0.54" error={errors.EXT_SOURCE_3} />
      </FormSection>

      {/* Primary Submit Button */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          id="btn-assess-risk-submit"
          type="submit"
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 44px',
            borderRadius: 12,
            background: loading ? '#1e293b' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: loading ? '1px solid #334155' : 'none',
            color: loading ? '#94a3b8' : 'white',
            fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
            minWidth: 220,
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
              Analyzing Applicant...
            </>
          ) : (
            <>
              <Send size={18} />
              Assess Credit Risk
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
