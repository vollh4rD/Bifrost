# Bifrost

Bifrost is a bridge between engineers who want to stay focused on technical work and executives who need clean, executive-ready vulnerability reports.

It helps security teams turn brief notes and evidence into a structured Excel report without forcing engineers to draft polished prose or rebuild compliance documents manually.

## Why Bifrost

- Engineers add findings once with minimal detail.
- Claude AI drafts observation, risk impact, and recommendation text automatically.
- Executives receive a polished Excel report with severity, evidence, and business-friendly wording.

## Features

- AI-assisted finding text generation using Claude
- Save and load assessment projects as JSON
- Export to `.xlsx` using customizable report templates
- Annexures support for step-by-step evidence details
- Simple metadata fields for client, assessment type, and reporting period
- Autosave in browser local storage while you work

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
VITE_CLAUDE_API_KEY=your_api_key_here
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in your browser at the address shown by Vite.

## How to Use Bifrost

1. Open the app and enter report metadata:
   - Client Name
   - Assessment Type
   - Month / Year
   - Type of Assessment

2. Add a finding:
   - Click **Add Finding**
   - Enter a short issue name and severity
   - Add a brief note describing the finding
   - Click **Generate** to let Claude fill observation, risk impact, and recommendation
   - Add annexure steps for screenshots, proof, or evidence if needed
   - Save the finding

3. Manage findings:
   - Edit findings to refine wording
   - Delete findings you no longer need
   - Load a saved project to continue work later
   - Save your project as a `.json` file for reuse

4. Export the report:
   - Load a `.xlsx` template file with report placeholders
   - Toggle whether to include detailed descriptions in output
   - Click **Export Excel**
   - Download your generated report ready for executive review

## Template Requirements

Your Excel template should include text placeholders in the report sheet, such as:

- `{{findings_start}}`
- `{{issueName}}`
- `{{observation}}`
- `{{riskImpact}}`
- `{{affectedURL}}`
- `{{severity}}`
- `{{recommendation}}`
- `{{testEvidence}}`

The app will replace these placeholders with actual finding rows and metadata.

### Metadata placeholders

Any worksheet cell can contain:

- `{{clientName}}`
- `{{assessmentType}}`
- `{{monthYear}}`
- `{{typeOfAssessment}}`

These values are replaced from the report metadata form.

## Notes

- A valid `VITE_CLAUDE_API_KEY` is required for AI generation.
- Project data can be loaded from JSON to continue work later.
- Excel export uses the selected `.xlsx` template and preserves worksheet formatting where possible.

## Scripts

- `npm run dev` — start development server
- `npm run build` — build production bundle
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint
