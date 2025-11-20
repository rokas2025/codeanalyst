<!-- Observability Plan for Content Analyst Perf Tests -->
# Content Analyst Observability Plan

## Metrics

| Metric | Source | Notes |
| --- | --- | --- |
| `content_api_latency_ms` | Express middleware (Prometheus) | Histogram with `type=text/url`, `status`. |
| `content_queue_depth` | BullMQ metrics endpoint | Sampled every 15s, exported as gauge. |
| `content_queue_wait_ms` | Worker instrumentation | Recorded per job and pushed via StatsD. |
| `content_worker_duration_ms` | Worker instrumentation | Labels: `phase=enrich,grammar,seo,summary`. |
| `content_ai_tokens_total` | LLM wrapper | Labels: `provider`, `model`, `input_type`. |
| `content_crawl_success_total` | URL fetcher | Distinguish `success`, `robots_blocked`, `timeout`. |
| `content_tfft_ms` | Worker → API streaming hook | Captured when first partial response ready. |

## Logs

- Structured logger (`logger.info`) includes:
  - `module: "content-analyst"`
  - `request_id`, `content_source`, `language`
  - `tfft_ms`, `total_ms`, `retry_count`
- Ship to Loki (staging) + Supabase log explorer.

## Tracing

- Propagate headers:
  - `x-request-id` (UUID per request)
  - `x-content-pipeline` (text/url)
  - `x-ai-provider` (set by worker before LLM call)
- OpenTelemetry spans:
  - `content.intake`
  - `content.enrich`
  - `content.llm.gpt4`, `content.llm.claude`, `content.llm.gemini`
  - `content.persist`
- Export to Jaeger/Tempo; sampling 50% for smoke, 15% for sustained/spike runs.

## Dashboards

1. **Intake Health**
   - API latency (P50/P95)
   - Request volume split by type
   - Error rate (4xx vs 5xx)

2. **Queue & Workers**
   - Queue depth vs active workers
   - Wait time heatmap
   - Worker CPU/RAM (Railway/VM metrics)

3. **AI Provider Usage**
   - Token spend per provider/model
   - Throttling events (rate-limit responses)
   - Cost/minute overlay vs KPI budget

4. **Crawl Diagnostics**
   - Success vs blocked vs timeout counts
   - Average fetch duration
   - Top failing domains (should exclude WordPress)

## Alerting

- PagerDuty warnings:
  - `content_queue_wait_ms_p95 > 2000` for 5 min.
  - `content_api_latency_ms_p95 > 10000` for 5 min.
  - `content_crawl_success_rate < 95%` for 10 min.
- Slack notifications for AI cost spikes (>150% baseline).

## Data Retention

- Metrics: 30 days (Prometheus)
- Logs: 14 days (Loki)
- Traces: 7 days (Tempo)
- KPI rollups exported to `docs/tests/content-analyst/reports/data/` per run.

---

Next task: produce the HTML report template + written runbook.

