<!-- KPI & Load Profiles for Content Analyst -->
# Content Analyst Performance KPIs & Load Profiles

## Key Metrics

| Metric | Target | Notes |
| --- | --- | --- |
| **Time to First Token (TTFT)** | ≤ 2.5 s (P95) | From request submit → first partial analysis payload ready. |
| **Full Analysis Latency** | ≤ 8 s (P95), ≤ 12 s (P99) | Includes AI calls, aggregation, persistence. |
| **Throughput** | ≥ 12 req/min sustained | Mixed text/URL flow with autoscaling workers (x3). |
| **Success Rate** | ≥ 99% (HTTP 2xx + valid analysis) | Excludes user validation errors. |
| **Queue Wait Time** | ≤ 500 ms (P95) | Time between enqueue and worker start. |
| **AI Cost per Article** | ≤ $0.045 USD | Sum of OpenAI + Anthropic + Gemini tokens. |
| **Crawl Completion Rate (URL)** | ≥ 97% | Failed fetches (4xx, robots) counted separately. |
| **Language Detection Accuracy** | ≥ 98% for supported locales | Compare against known dataset label. |

## Load Profiles

### 1. Smoke (Baseline Health)

- **Duration**: 5 minutes  
- **RPS**: 0.5 req/s (30 req total)  
- **Mix**: 70% text, 30% URL  
- **Purpose**: Validate deployment after release, ensure TTFT + queue wait within bounds.  
- **Dataset**: `TEXT_SHORT_EN`, `URL_NEWS_EN`.

### 2. Sustained (Realistic Peak)

- **Duration**: 45 minutes  
- **RPS**: ramp 1 → 4 req/s over 10 min, hold 4 req/s thereafter (≈10.8k req)  
- **Mix**: 50% `TEXT_LONG_LT`, 30% `TEXT_SHORT_EN`, 20% `URL_DOCS_MULTI`  
- **Assertions**:  
  - P95 latency ≤ 8 s.  
  - Queue depth < 50 jobs.  
  - AI cost per minute ≤ $8.  
- **Notes**: SSE disabled; use polling to avoid websocket noise.

### 3. Spike/Stress (Failure Envelope)

- **Duration**: 20 minutes  
- **Pattern**: Step from 2 req/s to 8 req/s every 5 minutes, final burst 12 req/s for 2 minutes.  
- **Mix**: 60% random text payloads (1k–3k words), 40% curated URLs (non-WordPress).  
- **Goals**:  
  - Identify saturation point (queue wait > 2 s).  
  - Observe AI provider throttling behavior.  
  - Capture auto-scaling trigger timings.

### 4. Resiliency / Negative

- **Duration**: 10 minutes intermittent  
- **Payloads**:  
  - 5% oversize text ( >10k tokens ) expect HTTP 413.  
  - 5% blocked URLs (robots/noindex) expect 4xx with fast fail.  
- **Purpose**: Ensure validation path remains cheap (<300 ms) and errors do not clog queues.

## Test Schedule & Environments

- **Staging**: run Smoke daily, Sustained weekly, Spike monthly or before major launch.  
- **Production shadow**: 5% mirrored traffic for TTFT telemetry (read-only).  
- **Environment variables**: use dedicated AI API keys (`OPENAI_API_KEY_PERF`, etc.) to isolate billing.

## Reporting Expectations

- Every run stores raw metrics JSON under `docs/tests/content-analyst/reports/data/`.  
- HTML report surfaces:
  - Latency percentiles (per flow type).  
  - Queue wait histogram.  
  - AI provider usage share.  
  - KPI compliance table (pass/fail).  
- Include remediation recommendations if any KPI breaches >5%.

---

Next task: implement the load-test harness following these KPI targets.

