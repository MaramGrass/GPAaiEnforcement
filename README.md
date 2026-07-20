# GPA DPA Enforcement Tracker

A React web application for tracking Data Protection Authority enforcement actions, maintained by the AI Working Group of the Global Privacy Assembly.

---

## Project Structure

```
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   ├── index.css
│   ├── App.js
│   └── DPATracker.jsx        ← Main app component
├── .github/
│   └── workflows/
│       └── deploy.yml        ← Auto-deploy on Excel update
├── dpa_tracker_template.xlsx ← Data source (edit this to update cases)
├── convert.py                ← Converts Excel → dpa-data.json
├── package.json
└── .gitignore
```

---

## Setup Instructions for IT

### Step 1 — Create a GitLab repository

1. Log in to [gitlab.com](https://gitlab.com)
2. Click **New project** → **Create blank project**
3. Name it `dpa-enforcement-tracker`
4. Set visibility to **Private** (or Public if the site should be publicly accessible)
5. Click **Create project**

### Step 2 — Upload the project files

On your local machine, open a terminal and run:

```bash
git clone https://gitlab.com/YOUR_USERNAME/dpa-enforcement-tracker.git
cd dpa-enforcement-tracker
```

Copy all the project files into this folder, then:

```bash
git add .
git commit -m "Initial project setup"
git push origin main
```

### Step 3 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in
2. Click **Add New Project**
3. Select **Import Git Repository**
4. Choose **GitLab** and authorise Vercel to access your account
5. Select the `dpa-enforcement-tracker` repository
6. Under **Framework Preset**, select **Create React App**
7. Click **Deploy**

Vercel will build and deploy the site automatically. You'll get a URL like `dpa-tracker.vercel.app`.

### Step 4 — Set up auto-deploy when Excel is updated (optional but recommended)

This step makes it so that when someone uploads a new version of `dpa_tracker_template.xlsx` to GitLab, the site rebuilds automatically.

In Vercel:
1. Go to your project → **Settings** → **Git**
2. Note your **Project ID** and **Org ID**
3. Go to **Settings** → **Tokens** → create a new token

In GitLab:
1. Go to your repo → **Settings** → **CI/CD** → **Variables**
2. Add three variables:
   - `VERCEL_TOKEN` — your Vercel token
   - `VERCEL_ORG_ID` — your Vercel Org ID  
   - `VERCEL_PROJECT_ID` — your Vercel Project ID

From this point, whenever the Excel file is updated in GitLab, the pipeline will run `convert.py`, rebuild the app, and redeploy to Vercel automatically.

### Step 5 — Custom domain (optional)

1. In Vercel → **Settings** → **Domains**
2. Add your domain, e.g. `enforcement.globalprivacyassembly.org`
3. Follow the DNS instructions Vercel provides (your IT team will need to add a CNAME record)

---

## Updating the data

1. Open `dpa_tracker_template.xlsx`
2. Add or edit rows (one row per enforcement case)
3. Save the file
4. Upload it to GitLab (replace the existing file)
5. The site will update automatically within ~2 minutes

If auto-deploy is not set up, run `python convert.py` locally to regenerate `dpa-data.json`, then redeploy manually.

---

## Local development

```bash
npm install
npm start
```

The app will open at `http://localhost:3000`.

---


