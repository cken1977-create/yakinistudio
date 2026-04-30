<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yakini — New Client Intake</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --black: #0A0A0A;
    --dark: #111111;
    --card: #161616;
    --border: #2A2A2A;
    --gold: #C8A84B;
    --gold-light: #E2C97A;
    --gold-dim: rgba(200,168,75,0.15);
    --white: #F8F5EF;
    --soft: #999;
    --mid: #666;
    --red: #E05555;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--black);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* BG texture */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(ellipse at 20% 10%, rgba(200,168,75,0.04) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 90%, rgba(200,168,75,0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .wrap {
    position: relative;
    z-index: 1;
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 24px 80px;
  }

  /* Header */
  .site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 56px;
  }

  .logo {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 18px;
    letter-spacing: 0.08em;
    color: var(--white);
    text-transform: uppercase;
  }

  .logo span {
    display: block;
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.2em;
    color: var(--gold);
    text-transform: uppercase;
    margin-top: 2px;
  }

  .header-badge {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mid);
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 2px;
  }

  /* Intro */
  .intro {
    margin-bottom: 52px;
  }

  .intro-label {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
  }

  .intro h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 6vw, 52px);
    font-weight: 600;
    line-height: 1.1;
    color: var(--white);
    margin-bottom: 20px;
  }

  .intro h1 em {
    font-style: italic;
    color: var(--gold);
  }

  .intro p {
    font-size: 15px;
    line-height: 1.7;
    color: var(--soft);
    max-width: 560px;
  }

  /* Progress */
  .progress-bar {
    display: flex;
    gap: 6px;
    margin-bottom: 40px;
  }

  .progress-seg {
    height: 2px;
    flex: 1;
    background: var(--border);
    border-radius: 2px;
    transition: background 0.4s ease;
  }

  .progress-seg.active { background: var(--gold); }
  .progress-seg.done { background: rgba(200,168,75,0.4); }

  .progress-label {
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--mid);
    margin-bottom: 32px;
  }

  .progress-label strong {
    color: var(--gold);
    font-weight: 500;
  }

  /* Steps */
  .step { display: none; animation: fadeUp 0.4s ease forwards; }
  .step.active { display: block; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .step-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--white);
    margin-bottom: 6px;
  }

  .step-desc {
    font-size: 14px;
    color: var(--mid);
    margin-bottom: 36px;
    line-height: 1.6;
  }

  /* Field groups */
  .field-group {
    margin-bottom: 28px;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }

  @media (max-width: 560px) {
    .field-row { grid-template-columns: 1fr; }
  }

  label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--soft);
    margin-bottom: 10px;
    font-weight: 500;
  }

  label .req { color: var(--gold); margin-left: 3px; }

  input[type="text"],
  input[type="email"],
  input[type="tel"],
  input[type="url"],
  select,
  textarea {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    padding: 14px 16px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none;
  }

  input:focus, select:focus, textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px var(--gold-dim);
  }

  input::placeholder, textarea::placeholder { color: var(--mid); }

  select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
    cursor: pointer;
  }

  select option { background: var(--dark); }

  textarea { resize: vertical; min-height: 110px; line-height: 1.6; }

  /* Checkbox group */
  .check-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  @media (max-width: 480px) { .check-grid { grid-template-columns: 1fr; } }

  .check-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--card);
    border: 1px solid var(--border);
    padding: 14px 16px;
    border-radius: 3px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    user-select: none;
  }

  .check-item:hover { border-color: var(--gold); }

  .check-item input[type="checkbox"] {
    width: 16px; height: 16px; flex-shrink: 0;
    accent-color: var(--gold);
    cursor: pointer;
  }

  .check-item.checked {
    border-color: var(--gold);
    background: var(--gold-dim);
  }

  .check-item span {
    font-size: 14px;
    color: var(--white);
    line-height: 1.4;
  }

  /* Radio group */
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .radio-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: var(--card);
    border: 1px solid var(--border);
    padding: 16px 18px;
    border-radius: 3px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    user-select: none;
  }

  .radio-item:hover { border-color: var(--gold); }

  .radio-item.selected {
    border-color: var(--gold);
    background: var(--gold-dim);
  }

  .radio-item input[type="radio"] {
    width: 16px; height: 16px; flex-shrink: 0;
    margin-top: 2px;
    accent-color: var(--gold);
    cursor: pointer;
  }

  .radio-item .r-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--white);
    margin-bottom: 2px;
  }

  .radio-item .r-desc {
    font-size: 12px;
    color: var(--soft);
    line-height: 1.5;
  }

  /* Scale */
  .scale-wrap {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .scale-btn {
    width: 44px; height: 44px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--soft);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center;
  }

  .scale-btn:hover { border-color: var(--gold); color: var(--white); }
  .scale-btn.active { background: var(--gold); border-color: var(--gold); color: var(--black); font-weight: 600; }

  .scale-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 11px;
    color: var(--mid);
    letter-spacing: 0.08em;
  }

  /* Divider */
  .divider {
    height: 1px;
    background: var(--border);
    margin: 36px 0;
  }

  /* Section label */
  .section-label {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 20px;
    font-weight: 500;
  }

  /* Nav */
  .step-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 48px;
    gap: 16px;
  }

  .btn-back {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--soft);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 14px 28px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-back:hover { border-color: var(--soft); color: var(--white); }

  .btn-next {
    background: var(--gold);
    border: none;
    color: var(--black);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 14px 36px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: auto;
  }

  .btn-next:hover { background: var(--gold-light); transform: translateY(-1px); }
  .btn-next:active { transform: translateY(0); }

  /* Summary */
  .summary-block {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 28px;
    margin-bottom: 20px;
  }

  .summary-block h3 {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
    font-weight: 500;
  }

  .summary-row {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .summary-row .s-label {
    color: var(--mid);
    min-width: 140px;
    flex-shrink: 0;
  }

  .summary-row .s-val { color: var(--white); }

  /* Thank you */
  .thank-you {
    text-align: center;
    padding: 60px 0;
  }

  .thank-you .check-circle {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: var(--gold-dim);
    border: 2px solid var(--gold);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 32px;
    font-size: 28px;
  }

  .thank-you h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .thank-you p {
    font-size: 15px;
    color: var(--soft);
    line-height: 1.7;
    max-width: 480px;
    margin: 0 auto 12px;
  }

  .thank-you .next-steps {
    margin-top: 40px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 28px;
    text-align: left;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  }

  .next-steps h4 {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
  }

  .next-steps li {
    font-size: 14px;
    color: var(--soft);
    margin-bottom: 10px;
    padding-left: 20px;
    position: relative;
    line-height: 1.6;
    list-style: none;
  }

  .next-steps li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--gold);
    font-size: 12px;
  }

  /* Error */
  .field-error {
    font-size: 12px;
    color: var(--red);
    margin-top: 6px;
    display: none;
  }

  .has-error input, .has-error textarea, .has-error select {
    border-color: var(--red);
  }
</style>
</head>
<body>
<div class="wrap">

  <header class="site-header">
    <div class="logo">
      Yakini
      <span>Digital Infrastructure</span>
    </div>
    <div class="header-badge">New Client Intake</div>
  </header>

  <!-- Intro -->
  <div class="intro" id="intro-block">
    <div class="intro-label">Yakini — Client Onboarding</div>
    <h1>Let's build something<br><em>that works.</em></h1>
    <p>Before we scope your project, we need to understand your business, your goals, and what success looks like for you. This takes about 5–8 minutes.</p>
  </div>

  <!-- Progress -->
  <div class="progress-bar" id="progress-bar">
    <div class="progress-seg active" data-seg="0"></div>
    <div class="progress-seg" data-seg="1"></div>
    <div class="progress-seg" data-seg="2"></div>
    <div class="progress-seg" data-seg="3"></div>
    <div class="progress-seg" data-seg="4"></div>
  </div>
  <div class="progress-label" id="progress-label">Step <strong>1</strong> of 5</div>

  <form id="intake-form" novalidate>

    <!-- ── STEP 1: About You ── -->
    <div class="step active" data-step="0">
      <div class="step-title">About You</div>
      <div class="step-desc">Tell us who you are and how to reach you.</div>

      <div class="field-row">
        <div class="field-group" id="fg-first">
          <label>First Name <span class="req">*</span></label>
          <input type="text" id="first_name" placeholder="First name" />
          <div class="field-error" id="err-first">Required</div>
        </div>
        <div class="field-group" id="fg-last">
          <label>Last Name <span class="req">*</span></label>
          <input type="text" id="last_name" placeholder="Last name" />
          <div class="field-error" id="err-last">Required</div>
        </div>
      </div>

      <div class="field-group" id="fg-biz">
        <label>Business Name <span class="req">*</span></label>
        <input type="text" id="biz_name" placeholder="Your business or brand name" />
        <div class="field-error" id="err-biz">Required</div>
      </div>

      <div class="field-row">
        <div class="field-group" id="fg-phone">
          <label>Phone Number <span class="req">*</span></label>
          <input type="tel" id="phone" placeholder="(713) 000-0000" />
          <div class="field-error" id="err-phone">Required</div>
        </div>
        <div class="field-group" id="fg-email">
          <label>Email Address <span class="req">*</span></label>
          <input type="email" id="email" placeholder="you@yourbusiness.com" />
          <div class="field-error" id="err-email">Valid email required</div>
        </div>
      </div>

      <div class="field-group">
        <label>City & State</label>
        <input type="text" id="location" placeholder="Houston, TX" />
      </div>

      <div class="field-group">
        <label>How did you hear about Yakini?</label>
        <select id="referral">
          <option value="">Select one</option>
          <option>Referred by someone I know</option>
          <option>Social media</option>
          <option>Google search</option>
          <option>Word of mouth</option>
          <option>Other</option>
        </select>
      </div>

      <div class="step-nav">
        <button type="button" class="btn-next" onclick="nextStep(0)">Continue →</button>
      </div>
    </div>

    <!-- ── STEP 2: Your Business ── -->
    <div class="step" data-step="1">
      <div class="step-title">Your Business</div>
      <div class="step-desc">Help us understand what you do and who you serve.</div>

      <div class="field-group" id="fg-industry">
        <label>What industry or sector are you in? <span class="req">*</span></label>
        <select id="industry">
          <option value="">Select one</option>
          <option>Legal Services / Advocacy</option>
          <option>Towing / Roadside Services</option>
          <option>Real Estate</option>
          <option>Food & Beverage</option>
          <option>Energy / Oilfield Services</option>
          <option>Health & Wellness</option>
          <option>Nonprofit / Community Organization</option>
          <option>Retail / E-Commerce</option>
          <option>Construction / Trades</option>
          <option>Professional Services</option>
          <option>Other</option>
        </select>
        <div class="field-error" id="err-industry">Required</div>
      </div>

      <div class="field-group" id="fg-desc">
        <label>Describe your business in your own words <span class="req">*</span></label>
        <textarea id="biz_desc" placeholder="What do you do? Who do you help? What problem do you solve?"></textarea>
        <div class="field-error" id="err-desc">Required</div>
      </div>

      <div class="field-group">
        <label>Who is your ideal customer?</label>
        <textarea id="ideal_customer" placeholder="Age, location, situation, income level — any details help." style="min-height:90px;"></textarea>
      </div>

      <div class="field-group">
        <label>How long have you been in business?</label>
        <select id="years_in_biz">
          <option value="">Select one</option>
          <option>Just starting out (less than 6 months)</option>
          <option>6 months – 1 year</option>
          <option>1–3 years</option>
          <option>3–5 years</option>
          <option>5+ years</option>
        </select>
      </div>

      <div class="field-group">
        <label>Do you currently have a website?</label>
        <div class="radio-group" id="has-website-group">
          <label class="radio-item" onclick="selectRadio(this, 'has_website', 'yes')">
            <input type="radio" name="has_website" value="yes" /> 
            <div><div class="r-title">Yes</div><div class="r-desc">I have an existing website I want to replace or improve</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'has_website', 'no')">
            <input type="radio" name="has_website" value="no" />
            <div><div class="r-title">No</div><div class="r-desc">Starting fresh — I need a brand new site</div></div>
          </label>
        </div>
      </div>

      <div class="field-group" id="existing-url-group" style="display:none;">
        <label>Current Website URL</label>
        <input type="url" id="existing_url" placeholder="https://yourbusiness.com" />
      </div>

      <div class="step-nav">
        <button type="button" class="btn-back" onclick="prevStep(1)">← Back</button>
        <button type="button" class="btn-next" onclick="nextStep(1)">Continue →</button>
      </div>
    </div>

    <!-- ── STEP 3: Services Needed ── -->
    <div class="step" data-step="2">
      <div class="step-title">What Do You Need?</div>
      <div class="step-desc">Select everything that applies. We'll scope accordingly.</div>

      <div class="section-label">Digital Services</div>
      <div class="check-grid" style="margin-bottom:28px;">
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="New Website" /> <span>New Website</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Website Redesign" /> <span>Website Redesign</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Client Portal / Dashboard" /> <span>Client Portal / Dashboard</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Online Booking / Scheduling" /> <span>Online Booking / Scheduling</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Contact Forms / Lead Capture" /> <span>Contact Forms / Lead Capture</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="E-Commerce / Online Payments" /> <span>E-Commerce / Online Payments</span></label>
      </div>

      <div class="section-label">Marketing</div>
      <div class="check-grid" style="margin-bottom:28px;">
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Social Media Content" /> <span>Social Media Content</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Google Business Profile Setup" /> <span>Google Business Profile</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Email Marketing" /> <span>Email Marketing</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Paid Ads (Google / Meta)" /> <span>Paid Ads (Google / Meta)</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="SEO / Local Search" /> <span>SEO / Local Search</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Brand Identity / Logo" /> <span>Brand Identity / Logo</span></label>
      </div>

      <div class="section-label">AI & Automation</div>
      <div class="check-grid" style="margin-bottom:28px;">
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="AI Chat / Lead Qualification" /> <span>AI Chat / Lead Qualification</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Automated Follow-Up / CRM" /> <span>Automated Follow-Up / CRM</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Document Automation" /> <span>Document Automation</span></label>
        <label class="check-item" onclick="toggleCheck(this)"><input type="checkbox" name="services" value="Reporting / Analytics Dashboard" /> <span>Reporting / Analytics</span></label>
      </div>

      <div class="field-group">
        <label>Anything else you need that's not listed?</label>
        <textarea id="other_services" placeholder="Describe any other needs..." style="min-height:80px;"></textarea>
      </div>

      <div class="step-nav">
        <button type="button" class="btn-back" onclick="prevStep(2)">← Back</button>
        <button type="button" class="btn-next" onclick="nextStep(2)">Continue →</button>
      </div>
    </div>

    <!-- ── STEP 4: Goals & Budget ── -->
    <div class="step" data-step="3">
      <div class="step-title">Goals & Investment</div>
      <div class="step-desc">Help us understand what success looks like and what you're working with.</div>

      <div class="field-group" id="fg-goal">
        <label>What is your #1 goal for this project? <span class="req">*</span></label>
        <div class="radio-group">
          <label class="radio-item" onclick="selectRadio(this, 'primary_goal', 'leads')">
            <input type="radio" name="primary_goal" value="leads" />
            <div><div class="r-title">Generate more leads & clients</div><div class="r-desc">I need people to find me and contact me</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'primary_goal', 'credibility')">
            <input type="radio" name="primary_goal" value="credibility" />
            <div><div class="r-title">Build credibility & look professional</div><div class="r-desc">I need a presence that earns trust instantly</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'primary_goal', 'automate')">
            <input type="radio" name="primary_goal" value="automate" />
            <div><div class="r-title">Automate my operations</div><div class="r-desc">I need systems that save me time and reduce manual work</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'primary_goal', 'launch')">
            <input type="radio" name="primary_goal" value="launch" />
            <div><div class="r-title">Launch something new</div><div class="r-desc">I'm starting from zero and need everything built</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'primary_goal', 'all')">
            <input type="radio" name="primary_goal" value="all" />
            <div><div class="r-title">All of the above</div><div class="r-desc">I need the full picture — let's build it right</div></div>
          </label>
        </div>
        <div class="field-error" id="err-goal">Please select a goal</div>
      </div>

      <div class="divider"></div>

      <div class="field-group">
        <label>What does success look like 90 days after launch?</label>
        <textarea id="success_vision" placeholder="More calls? Specific number of clients? Revenue target? Rankings on Google? Be specific."></textarea>
      </div>

      <div class="field-group" id="fg-budget">
        <label>What is your monthly budget for digital services? <span class="req">*</span></label>
        <div class="radio-group">
          <label class="radio-item" onclick="selectRadio(this, 'budget', 'under500')">
            <input type="radio" name="budget" value="under500" />
            <div><div class="r-title">Under $500/month</div><div class="r-desc">Getting started, testing the waters</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'budget', '500-1000')">
            <input type="radio" name="budget" value="500-1000" />
            <div><div class="r-title">$500 – $1,000/month</div><div class="r-desc">Serious about growth, investing in the foundation</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'budget', '1000-2500')">
            <input type="radio" name="budget" value="1000-2500" />
            <div><div class="r-title">$1,000 – $2,500/month</div><div class="r-desc">Full-service digital presence and marketing</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'budget', '2500plus')">
            <input type="radio" name="budget" value="2500plus" />
            <div><div class="r-title">$2,500+/month</div><div class="r-desc">Enterprise-level build with ongoing management</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'budget', 'discuss')">
            <input type="radio" name="budget" value="discuss" />
            <div><div class="r-title">Let's discuss</div><div class="r-desc">I want to understand options before committing</div></div>
          </label>
        </div>
        <div class="field-error" id="err-budget">Please select a budget range</div>
      </div>

      <div class="field-group">
        <label>How soon do you need to launch?</label>
        <select id="timeline">
          <option value="">Select one</option>
          <option>ASAP — I needed this yesterday</option>
          <option>Within 2 weeks</option>
          <option>Within 30 days</option>
          <option>1–2 months</option>
          <option>No hard deadline — I want it done right</option>
        </select>
      </div>

      <div class="step-nav">
        <button type="button" class="btn-back" onclick="prevStep(3)">← Back</button>
        <button type="button" class="btn-next" onclick="nextStep(3)">Continue →</button>
      </div>
    </div>

    <!-- ── STEP 5: Final Notes ── -->
    <div class="step" data-step="4">
      <div class="step-title">Final Details</div>
      <div class="step-desc">Last section. Anything that helps us hit the ground running.</div>

      <div class="field-group">
        <label>Do you have existing branding? (Logo, colors, fonts)</label>
        <div class="radio-group" id="branding-group">
          <label class="radio-item" onclick="selectRadio(this, 'has_branding', 'yes_full')">
            <input type="radio" name="has_branding" value="yes_full" />
            <div><div class="r-title">Yes — full brand kit</div><div class="r-desc">I have a logo, colors, and fonts ready to go</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'has_branding', 'yes_partial')">
            <input type="radio" name="has_branding" value="yes_partial" />
            <div><div class="r-title">Partial — I have some pieces</div><div class="r-desc">Logo maybe, but colors/fonts need work</div></div>
          </label>
          <label class="radio-item" onclick="selectRadio(this, 'has_branding', 'no')">
            <input type="radio" name="has_branding" value="no" />
            <div><div class="r-title">No — starting from scratch</div><div class="r-desc">I need branding built as part of this project</div></div>
          </label>
        </div>
      </div>

      <div class="field-group">
        <label>Who are your main competitors or who do you admire in your space?</label>
        <textarea id="competitors" placeholder="Names, websites, or just describe what they do well." style="min-height:80px;"></textarea>
      </div>

      <div class="field-group">
        <label>What's the one thing you want people to feel when they land on your site?</label>
        <input type="text" id="brand_feeling" placeholder="Trust, power, urgency, warmth, expertise..." />
      </div>

      <div class="field-group">
        <label>How would you rate your current digital presence?</label>
        <div class="scale-wrap">
          <button type="button" class="scale-btn" onclick="setScale(this, 1)">1</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 2)">2</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 3)">3</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 4)">4</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 5)">5</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 6)">6</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 7)">7</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 8)">8</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 9)">9</button>
          <button type="button" class="scale-btn" onclick="setScale(this, 10)">10</button>
        </div>
        <div class="scale-labels"><span>1 — Nonexistent</span><span>10 — Fully dialed in</span></div>
        <input type="hidden" id="digital_score" value="" />
      </div>

      <div class="field-group">
        <label>Anything else we should know?</label>
        <textarea id="anything_else" placeholder="Past bad experiences with agencies, specific concerns, big opportunities we should know about — anything goes." style="min-height:100px;"></textarea>
      </div>

      <div class="field-group">
        <label>Best way to reach you for our first call?</label>
        <select id="contact_pref">
          <option value="">Select one</option>
          <option>Phone call</option>
          <option>Text message</option>
          <option>Email</option>
          <option>Video call (Zoom / Google Meet)</option>
          <option>Any — I'm flexible</option>
        </select>
      </div>

      <div class="step-nav">
        <button type="button" class="btn-back" onclick="prevStep(4)">← Back</button>
        <button type="button" class="btn-next" onclick="submitForm()">Submit Intake →</button>
      </div>
    </div>

    <!-- ── THANK YOU ── -->
    <div class="step" data-step="5" id="thank-you-step">
      <div class="thank-you">
        <div class="check-circle">✓</div>
        <h2>You're in the system.</h2>
        <p>We've received your intake and we're reviewing it now. Expect a call or message from Yakini within <strong style="color:var(--gold)">24–48 hours</strong> to set up your first working session.</p>
        <p style="margin-top:8px;">In the meantime — don't change a thing. We'll take it from here.</p>

        <div class="next-steps">
          <h4>What Happens Next</h4>
          <ul>
            <li>Yakini reviews your intake in full</li>
            <li>We prepare a project scope and recommendation</li>
            <li>First call — we walk you through the plan and answer every question</li>
            <li>You approve. We build. You grow.</li>
          </ul>
        </div>
      </div>
    </div>

  </form>
</div>

<script>
  let currentStep = 0;
  let scaleValue = null;

  function updateProgress(step) {
    const segs = document.querySelectorAll('.progress-seg');
    const label = document.getElementById('progress-label');
    segs.forEach((s, i) => {
      s.classList.remove('active', 'done');
      if (i === step) s.classList.add('active');
      else if (i < step) s.classList.add('done');
    });
    if (step < 5) {
      label.innerHTML = `Step <strong>${step + 1}</strong> of 5`;
    }
  }

  function showStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelector(`.step[data-step="${n}"]`).classList.add('active');
    updateProgress(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (n === 5) {
      document.getElementById('progress-bar').style.display = 'none';
      document.getElementById('progress-label').style.display = 'none';
      document.getElementById('intro-block').style.display = 'none';
    }
  }

  function validateStep(step) {
    let valid = true;
    if (step === 0) {
      if (!v('first_name')) { err('fg-first', 'err-first', true); valid = false; } else err('fg-first', 'err-first', false);
      if (!v('last_name')) { err('fg-last', 'err-last', true); valid = false; } else err('fg-last', 'err-last', false);
      if (!v('biz_name')) { err('fg-biz', 'err-biz', true); valid = false; } else err('fg-biz', 'err-biz', false);
      if (!v('phone')) { err('fg-phone', 'err-phone', true); valid = false; } else err('fg-phone', 'err-phone', false);
      const em = document.getElementById('email').value;
      if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err('fg-email', 'err-email', true); valid = false; } else err('fg-email', 'err-email', false);
    }
    if (step === 1) {
      if (!document.getElementById('industry').value) { err('fg-industry', 'err-industry', true); valid = false; } else err('fg-industry', 'err-industry', false);
      if (!v('biz_desc')) { err('fg-desc', 'err-desc', true); valid = false; } else err('fg-desc', 'err-desc', false);
    }
    if (step === 3) {
      const goal = document.querySelector('input[name="primary_goal"]:checked');
      if (!goal) { document.getElementById('err-goal').style.display = 'block'; valid = false; } else document.getElementById('err-goal').style.display = 'none';
      const budget = document.querySelector('input[name="budget"]:checked');
      if (!budget) { document.getElementById('err-budget').style.display = 'block'; valid = false; } else document.getElementById('err-budget').style.display = 'none';
    }
    return valid;
  }

  function v(id) { return document.getElementById(id).value.trim(); }

  function err(groupId, errId, show) {
    const fg = document.getElementById(groupId);
    const er = document.getElementById(errId);
    if (show) { fg.classList.add('has-error'); er.style.display = 'block'; }
    else { fg.classList.remove('has-error'); er.style.display = 'none'; }
  }

  function nextStep(from) {
    if (!validateStep(from)) return;
    currentStep = from + 1;
    showStep(currentStep);
  }

  function prevStep(from) {
    currentStep = from - 1;
    showStep(currentStep);
  }

  function selectRadio(el, name, val) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
      r.closest('.radio-item').classList.remove('selected');
    });
    el.classList.add('selected');
    el.querySelector('input[type="radio"]').checked = true;

    // Show/hide existing URL field
    if (name === 'has_website') {
      document.getElementById('existing-url-group').style.display = val === 'yes' ? 'block' : 'none';
    }
  }

  function toggleCheck(el) {
    el.classList.toggle('checked');
    const cb = el.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
  }

  function setScale(btn, val) {
    scaleValue = val;
    document.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('digital_score').value = val;
  }

  async function submitForm() {
    const SUPABASE_URL = 'https://mxshsmknfqxwltucgezl.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c2hzbWtuZnF4d2x0dWNnZXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDM1NjIsImV4cCI6MjA5MzA3OTU2Mn0.cdx3T5CVFKq2sis-FOHau2V0Lx3CrsyoZmaAfM689v0';
    const RESEND_API_KEY = 're_DdtMrt3n_F6B4vJQiepzrYpHwK6gkB93N';
    const NOTIFY_EMAIL = 'hello@yakini.digital';

    const btn = document.querySelector('.step[data-step="4"] .btn-next');
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    const data = {
      first_name: v('first_name'),
      last_name: v('last_name'),
      biz_name: v('biz_name'),
      phone: v('phone'),
      email: document.getElementById('email').value.trim(),
      location: v('location'),
      referral: document.getElementById('referral').value,
      industry: document.getElementById('industry').value,
      biz_desc: v('biz_desc'),
      ideal_customer: v('ideal_customer'),
      years_in_biz: document.getElementById('years_in_biz').value,
      has_website: document.querySelector('input[name="has_website"]:checked')?.value || '',
      existing_url: v('existing_url'),
      services: [...document.querySelectorAll('input[name="services"]:checked')].map(c => c.value),
      other_services: v('other_services'),
      primary_goal: document.querySelector('input[name="primary_goal"]:checked')?.value || '',
      success_vision: v('success_vision'),
      budget: document.querySelector('input[name="budget"]:checked')?.value || '',
      timeline: document.getElementById('timeline').value,
      has_branding: document.querySelector('input[name="has_branding"]:checked')?.value || '',
      competitors: v('competitors'),
      brand_feeling: v('brand_feeling'),
      digital_score: document.getElementById('digital_score').value ? parseInt(document.getElementById('digital_score').value) : null,
      anything_else: v('anything_else'),
      contact_pref: document.getElementById('contact_pref').value,
      status: 'new'
    };

    // 1 — Save to Supabase
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/client_intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('Supabase error:', err);
      }
    } catch (e) {
      console.error('Supabase insert failed:', e);
    }

    // 2 — Send notification email via Resend
    try {
      const services = data.services.length ? data.services.join(', ') : 'None selected';
      const emailBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#F8F5EF;padding:32px;border-radius:8px;">
          <div style="border-bottom:2px solid #C8A84B;padding-bottom:16px;margin-bottom:24px;">
            <h1 style="color:#C8A84B;font-size:22px;margin:0;">New Client Intake</h1>
            <p style="color:#666;font-size:13px;margin:4px 0 0;">Yakini Digital Infrastructure</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#999;font-size:13px;width:140px;">Name</td><td style="padding:8px 0;font-size:14px;">${data.first_name} ${data.last_name}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Business</td><td style="padding:8px 0;font-size:14px;color:#C8A84B;font-weight:bold;">${data.biz_name}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Phone</td><td style="padding:8px 0;font-size:14px;">${data.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Email</td><td style="padding:8px 0;font-size:14px;">${data.email}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Location</td><td style="padding:8px 0;font-size:14px;">${data.location || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Industry</td><td style="padding:8px 0;font-size:14px;">${data.industry}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Budget</td><td style="padding:8px 0;font-size:14px;">${data.budget}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Timeline</td><td style="padding:8px 0;font-size:14px;">${data.timeline || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Goal</td><td style="padding:8px 0;font-size:14px;">${data.primary_goal}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px;">Contact Pref</td><td style="padding:8px 0;font-size:14px;">${data.contact_pref || '—'}</td></tr>
          </table>
          <div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:16px;margin:20px 0;">
            <p style="color:#C8A84B;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">Services Requested</p>
            <p style="font-size:14px;margin:0;">${services}</p>
          </div>
          <div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:16px;margin:20px 0;">
            <p style="color:#C8A84B;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">Business Description</p>
            <p style="font-size:14px;color:#999;margin:0;">${data.biz_desc}</p>
          </div>
          ${data.anything_else ? `
          <div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:16px;margin:20px 0;">
            <p style="color:#C8A84B;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">Additional Notes</p>
            <p style="font-size:14px;color:#999;margin:0;">${data.anything_else}</p>
          </div>` : ''}
          <div style="border-top:1px solid #2A2A2A;margin-top:24px;padding-top:16px;text-align:center;">
            <p style="color:#444;font-size:12px;margin:0;">Yakini Digital Infrastructure · yakini.digital</p>
          </div>
        </div>
      `;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Yakini Intake <hello@yakini.digital>',
          to: [NOTIFY_EMAIL],
          subject: `New Intake: ${data.biz_name} — ${data.first_name} ${data.last_name}`,
          html: emailBody
        })
      });
    } catch (e) {
      console.error('Resend notification failed:', e);
    }

    // 3 — Show thank you
    showStep(5);
  }
</script>
</body>
</html>
