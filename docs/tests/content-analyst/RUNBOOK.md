<!-- Content Analyst Performance Runbook -->
# Content Analyst Performance Runbook

## 1. Prerequisites

- Windows PowerShell 7+ (matches project rules).
- Node.js workspace with repository cloned.
- `k6` CLI installed and on `PATH`.
- Valid bearer token with access to Content Analyst API (`CONTENT_ANALYST_TEST_TOKEN` env var).
- Dedicated AI API keys for staging/perf (OpenAI, Anthropic, Google).

## 2. Environment Setup

```powershell
cd C:\Users\rokas\OneDrive\Dokumentai\Analyst
$env:CONTENT_ANALYST_TEST_TOKEN = '...'
```

Optional overrides:
- `BASE_URL` (default `https://codeanalyst-staging.up.railway.app/api`)
- `TEST_PROFILE` (`smoke`, `sustained`, `spike`)

## 3. Test Execution

```powershell
cd docs\tests\content-analyst\scripts
.\run-content-perf.ps1 -Profile sustained -BaseUrl https://codeanalyst-staging.up.railway.app/api
```

The script:
1. Loads datasets from `../datasets/*.json`.
2. Sets env vars for k6.
3. Runs `k6-content-analyst.js` with selected profile (text + non-WordPress URL mix).

## 4. Data Collection

- k6 summary JSON: run `k6 run ... --summary-export ..\reports\data\run-{{timestamp}}.json`.
- Prometheus scrape for runtime metrics (`content_*` series).
- Logs/traces collected automatically via Loki/Tempo.

## 5. Report Generation

1. Copy `reports/report-template.html` → `reports/content-report-{{timestamp}}.html`.
2. Fill placeholders with metrics:
   - Use summary JSON for counts/latency.
   - Pull cost + provider share from Prometheus or worker logs.
3. Attach charts automatically populated via inline Chart.js arrays.
4. Zip HTML + summary JSON for archival.

## 6. KPI Acceptance

- Compare metrics with `KPI_PROFILES.md`.
- Flag breaches >5% for remediation.
- Record outcome in `reports/README.md` (create log entry if needed).

## 7. Remediation Checklist

- **Latency breach**: inspect queue depth, worker CPU, AI provider throttling.
- **Cost breach**: verify prompt sizes, provider mix, caching.
- **Crawl failures**: confirm URLs accessible, respect robots, review fetch timeouts.
- **Error spikes**: check API logs for validation errors vs. genuine failures.

## 8. Communication

- Post summary in Slack `#qa-perf` with:
  - Run ID, profile, overall status.
  - KPI pass/fail table.
  - Link to HTML report + raw metrics.
- Create GitHub issue if major KPI breach observed.

---

Follow this runbook sequentially whenever running performance suites for the Content Analyst module.

