---
name: credit-risk-ui-ux
description: Designs and improves the Credit Risk Assessment frontend with premium fintech UI/UX, responsive layouts, accessible components, clear credit-risk visualization, SHAP explanations, forms, dashboards, animations, and production-quality React interfaces. Use this skill whenever building, redesigning, reviewing, or improving the frontend UI/UX of the CreditRiskAssessment project.
---

# Credit Risk Assessment — UI/UX Skill

## Role

Act as a senior UI/UX designer, product designer, and frontend engineer.

Build interfaces that feel like a polished commercial fintech product, not a generic college-project dashboard.

Use the quality and design discipline of products such as:

- Stripe
- Vercel
- Linear
- Raycast
- modern fintech dashboards
- modern banking applications

The interface must prioritize:

1. Correctness
2. Usability
3. Clear risk communication
4. Accessibility
5. Visual hierarchy
6. Responsiveness
7. Visual polish
8. Animation

Never sacrifice functionality for visual appearance.

---

# PROJECT CONTEXT

This is a:

Credit Risk Assessment System

Technology:

- React
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- FastAPI backend
- XGBoost
- SHAP

The frontend communicates with a machine-learning backend that produces:

- prediction
- probability
- risk category
- SHAP explanations
- model information
- model comparison

The frontend must visualize the actual backend results.

---

# CORE DESIGN DIRECTION

Use a premium fintech aesthetic.

Design characteristics:

- modern
- minimal
- professional
- trustworthy
- clean
- spacious
- data-focused
- sophisticated
- responsive

The application should feel appropriate for:

- banks
- financial institutions
- credit analysts
- fintech companies
- enterprise users

Avoid making it look like a basic ML demo.

---

# VISUAL STYLE

Prefer:

- dark modern interface
- neutral backgrounds
- subtle gradients
- soft borders
- rounded cards
- restrained shadows
- clean typography
- subtle glass effects where appropriate
- strong spacing system
- clear hierarchy

Do NOT overuse:

- gradients
- glowing effects
- glassmorphism
- giant cards
- excessive shadows
- neon colors
- decorative animations
- emojis
- random colors
- excessive rounded elements

Every visual element must have a purpose.

---

# COLOR SYSTEM

Use a mostly neutral color palette.

Risk colors must have semantic meaning.

LOW RISK:

- green

MEDIUM RISK:

- amber/orange

HIGH RISK:

- red

Risk colors should primarily appear in:

- risk badge
- risk meter
- prediction status
- relevant charts

Do not use red/green randomly for decoration.

Never communicate risk using color alone.

Always include text such as:

LOW RISK
MEDIUM RISK
HIGH RISK

---

# TYPOGRAPHY

Use a modern sans-serif font.

Maintain a consistent hierarchy.

Example:

H1:
Large, bold, clear.

H2:
Strong section heading.

H3:
Card/subsection heading.

Body:
Comfortable readable text.

Labels:
Smaller and muted.

Numbers:
Large and highly readable.

Important financial numbers should have strong visual hierarchy.

---

# APPLICATION STRUCTURE

The application should have a clear information architecture.

Recommended structure:

Dashboard
    ↓
Risk Assessment
    ↓
Applicant Information
    ↓
Prediction
    ↓
Risk Explanation
    ↓
SHAP Analysis
    ↓
Model Performance

Avoid making every piece of information compete for attention.

---

# DASHBOARD

The dashboard should immediately communicate:

- what the application does
- current assessment
- risk score
- risk level
- important contributing factors
- model information

Use a strong hero/header section.

Example:

Credit Risk Assessment

Evaluate applicant credit risk using a machine-learning model.

Then provide the primary CTA:

Assess Credit Risk

---

# RISK RESULT

The prediction result is the most important UI element.

Display:

Risk Score
XX.XX%

Risk Level
LOW / MEDIUM / HIGH

Model
Tuned XGBoost

Probability
XX.XX%

Use a visually prominent result card.

The user should understand the result within approximately 2–3 seconds.

---

# RISK METER

Use either:

- circular gauge

OR

- horizontal risk meter

Do not use both unless there is a clear UX reason.

The meter should visually communicate:

LOW
MEDIUM
HIGH

The actual value must come from the backend.

Never invent or calculate a different probability in React.

---

# RISK COPY

Use professional language.

Prefer:

"Model-estimated default risk"

"Estimated probability"

"Risk assessment generated from applicant information"

Avoid:

"Guaranteed default"

"Guaranteed approval"

"100% safe"

"The applicant WILL default"

Machine-learning predictions are estimates.

---

# APPLICANT FORM

The form should feel like a professional financial application.

Do NOT present all fields as one giant unstructured form.

Group fields into sections:

## Personal Information

- Gender
- Age
- Education
- Family information

## Financial Information

- Annual income
- Credit amount
- Loan annuity
- Goods price

## Employment

- Income type
- Employment duration
- Occupation
- Organization type

## Housing

- Housing type
- Car ownership

## Additional Information

- Children
- Family members
- Other relevant fields

---

# HUMAN-FRIENDLY LABELS

Never expose raw ML feature names unnecessarily.

Instead of:

DAYS_BIRTH

display:

Age

Instead of:

DAYS_EMPLOYED

display:

Employment Duration

Instead of:

AMT_INCOME_TOTAL

display:

Annual Income

Instead of:

AMT_CREDIT

display:

Credit Amount

Instead of:

AMT_ANNUITY

display:

Loan Annuity

Instead of:

AMT_GOODS_PRICE

display:

Goods Price

Users should not need to understand machine-learning dataset terminology.

---

# AGE AND EMPLOYMENT

The Home Credit dataset stores some values as negative day counts.

The UI should NEVER ask users to enter:

- -12005
- -2000

Instead ask for:

Age:
33 years

Employment Duration:
5 years

The backend should handle conversion to the representation required by the model.

---

# FORM UX

Every input should have:

- clear label
- sensible placeholder
- appropriate input type
- validation
- helpful error message

Use dropdowns for categorical fields.

Use numeric inputs for financial values.

Use sliders only when they genuinely improve usability.

Avoid unnecessarily complicated controls.

---

# FORM VALIDATION

Validate inputs before sending them to the backend.

Examples:

Income must be positive.

Credit amount must be positive.

Age must be within a realistic range.

Family members cannot be negative.

Children cannot be negative.

Employment duration cannot exceed reasonable age.

Show errors close to the relevant field.

Do not show raw backend exceptions to users.

---

# LOADING STATE

When generating a prediction, show a polished loading state.

Example:

Analyzing applicant...

Possible animation:

- subtle pulse
- progress indicator
- animated risk-analysis icon

Do not freeze the entire page.

Keep the interface responsive.

---

# ERROR HANDLING

Never show technical errors like:

AxiosError 500

Instead show:

"Unable to generate the risk assessment. Please check the applicant information and try again."

For backend unavailable:

"Risk assessment service is temporarily unavailable."

Provide a retry action when appropriate.

---

# SHAP EXPLANATION

SHAP is an important part of this project.

The interface should explain WHY the model produced the risk result.

Display:

Top factors increasing risk

Top factors reducing risk

Show approximately:

5–10 important features

Do not overwhelm the user with all 149 features.

---

# SHAP VISUALIZATION

Prefer:

horizontal contribution bars

Each item should show:

Feature
Contribution
Direction

Example:

Annual Income
+0.31
Increases Risk

Credit Amount
+0.24
Increases Risk

Employment Duration
-0.17
Reduces Risk

Use clear visual direction.

Positive contribution:

increases high-risk probability

Negative contribution:

reduces high-risk probability

---

# MODEL INFORMATION

Provide a compact model information section.

Example:

Model

Tuned XGBoost

Task

Binary Credit Risk Classification

Features

149

Explainability

SHAP

Prediction

Probability-based

Do not overwhelm the main screen with technical details.

---

# MODEL COMPARISON

The model comparison section should show:

Original XGBoost

vs.

Improved XGBoost

Metrics:

- Accuracy
- Precision
- Recall
- F1
- ROC-AUC
- PR-AUC
- MCC

Important:

Do not visually prioritize accuracy if it hides poor high-risk detection.

For this project, high-risk recall and F1 are especially important.

---

# CHARTS

Use Recharts where useful.

Charts should answer a specific question.

Good examples:

Model comparison

Risk probability distribution

Confusion matrix visualization

SHAP contribution chart

Avoid adding charts merely to make the dashboard look complex.

---

# CARDS

Cards should have:

- consistent padding
- consistent border radius
- consistent border
- clear heading
- useful content

Avoid excessive nesting.

Do not create:

Card inside card inside card inside card.

Use whitespace instead.

---

# NAVIGATION

Navigation should be simple.

Possible sections:

Dashboard
Risk Assessment
Model Insights
SHAP Explainability
About

Highlight the active section.

Use smooth transitions.

Do not create unnecessary navigation items.

---

# RESPONSIVE DESIGN

The application must work on:

320px
375px
768px
1024px
1440px+

Desktop:

Use multi-column layouts.

Tablet:

Reduce columns.

Mobile:

Stack sections vertically.

Forms should become single-column on mobile.

Charts should remain readable.

Do not allow horizontal scrolling unless absolutely necessary.

---

# ANIMATIONS

Use Framer Motion where already installed.

Animations should be:

- subtle
- fast
- purposeful

Recommended duration:

150–300ms

Use animation for:

- page transitions
- cards entering
- risk meter
- SHAP bars
- modal appearance
- hover states

Do NOT animate every element.

Avoid excessive bouncing or dramatic effects.

---

# HOVER STATES

Interactive elements should clearly respond to hover.

Use:

- slight elevation
- subtle border change
- subtle background change
- small movement

Do not use huge scaling effects.

---

# BUTTONS

Primary CTA:

Clear and visually prominent.

Examples:

Assess Credit Risk

Analyze Applicant

Run Assessment

Secondary actions:

Reset
View Explanation
View Model Details

Buttons must have clear text.

Avoid:

Click Here

Submit

Go

when a more descriptive label is possible.

---

# ACCESSIBILITY

Follow accessibility best practices.

Ensure:

- keyboard navigation
- visible focus states
- sufficient contrast
- semantic HTML
- accessible labels
- readable text
- appropriate button states
- appropriate ARIA attributes

Never communicate risk using color alone.

Example:

HIGH RISK

not just:

🔴

---

# MOBILE UX

On mobile:

- keep risk score near the top
- keep prediction visible
- stack cards
- simplify navigation
- keep buttons large enough to tap
- prevent tiny text
- keep forms easy to complete

The mobile experience should feel intentionally designed, not simply squeezed from desktop.

---

# COMPONENT ARCHITECTURE

Prefer reusable components.

Examples:

RiskCard
RiskGauge
PredictionCard
ApplicantForm
FormSection
ShapExplanation
MetricCard
ModelComparison
Navbar
Sidebar
LoadingState
ErrorState
EmptyState

Avoid duplicated UI logic.

Keep components focused.

---

# FRONTEND ARCHITECTURE

Maintain separation between:

UI components
API services
state management
data formatting
visualization

Do not put large API calls directly inside presentational components if the existing architecture supports service modules.

---

# API RULE

The backend is the source of truth.

The frontend must consume:

prediction
probability
risk_category
SHAP data
model information

Do NOT duplicate machine-learning logic in React.

Do NOT create a second risk calculation.

Do NOT hard-code:

if probability > 0.6:
    HIGH

unless that threshold is actually provided by the backend configuration.

---

# DATA DISPLAY

Always format financial numbers professionally.

Example:

₹1,20,000

instead of:

120000

Use:

- percentage formatting
- currency formatting
- readable decimals
- consistent units

Avoid excessive decimal places.

Example:

73.42%

is better than:

0.7342381927

---

# EMPTY STATES

Every major section should have a meaningful empty state.

Example:

No assessment yet.

Enter applicant information to generate a credit-risk assessment.

Do not leave blank cards.

---

# SUCCESS STATES

After prediction:

Show:

Assessment Complete

Then display:

Risk Score
Risk Level
Important Factors
Model

Make the result feel complete and trustworthy.

---

# SECURITY AND PRIVACY UX

Do not unnecessarily display personal applicant information.

Avoid storing sensitive information in localStorage unless required.

Do not expose backend errors.

Do not expose model internals unnecessarily.

---

# DESIGN CONSISTENCY

Maintain consistent:

- spacing
- typography
- colors
- borders
- shadows
- radii
- button styles
- input styles
- chart styles

Create reusable design tokens where practical.

Do not invent a different visual style for every page.

---

# EXISTING PROJECT RULE

Before changing the frontend:

1. Inspect the current frontend.
2. Understand the existing components.
3. Understand the API contract.
4. Reuse working components.
5. Preserve existing functionality.
6. Improve rather than unnecessarily rewrite.

Do not rebuild the entire frontend unless the existing architecture is fundamentally broken.

---

# CODE QUALITY

Use clean React code.

Prefer:

- reusable components
- clear props
- sensible state management
- semantic HTML
- Tailwind utility classes
- existing project conventions

Avoid:

- giant components
- duplicated code
- inline magic values everywhere
- unnecessary dependencies
- unnecessary rewrites

---

# VISUAL QA

Before declaring the UI finished, inspect it visually.

Check:

Desktop
Tablet
Mobile

Check:

- spacing
- alignment
- typography
- contrast
- buttons
- form controls
- risk meter
- charts
- SHAP
- loading state
- error state
- empty state

Fix visual inconsistencies.

---

# BROWSER TESTING

After implementing UI changes:

1. Start the frontend.
2. Start the backend if required.
3. Open the application in the browser.
4. Test the main user flow.

Main flow:

Open application
↓
Enter applicant information
↓
Submit assessment
↓
Loading state
↓
Risk result
↓
Risk score
↓
Risk level
↓
SHAP explanation
↓
Model information

Verify that there are no:

- console errors
- broken API calls
- layout issues
- overflow problems
- missing components

---

# DO NOT BREAK ML FUNCTIONALITY

UI improvements must NOT modify:

- model behavior
- model probabilities
- model thresholds
- SHAP calculations
- preprocessing
- backend prediction logic

unless explicitly requested.

The UI should visualize the ML system, not change it.

---

# QUALITY BAR

Before finishing, ask:

Does this look like a real fintech product?

Is the prediction understandable immediately?

Can a non-technical user complete the form?

Can a credit analyst understand why the model produced the result?

Does the interface work on mobile?

Are risk levels visually clear?

Are animations subtle?

Is the UI accessible?

Is the design consistent?

If the answer is no, improve it before finishing.

---

# FINAL PRINCIPLE

Build a UI that feels:

Professional
Trustworthy
Modern
Clear
Fast
Accessible
Data-driven

The final result should look like a production-quality fintech application rather than a generic AI dashboard.