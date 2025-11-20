<!-- Content Analyst Test Architecture -->
# Content Analyst Performance Test Reference

This document maps the Content Analyst module so we can design accurate performance scenarios before scripting load tests.

## Functional Scope

- **Text submissions**: user pastes raw text/HTML (any language) directly into the module; payload goes to `POST /content-analysis/analyze` with `type: "text"`.
- **Website URL analysis**: user provides a public URL (non-WordPress requirement for the perf suite); backend fetches and sanitizes HTML, then pushes the same endpoint with `type: "url"`.
- **Optional WordPress source**: available in-product but explicitly excluded from the upcoming test suite.

## Service Topology

```mermaid
flowchart LR
    U[Frontend: Content Analyst React page] -->|HTTPS JSON| API[(Express API /content-analysis)]
    API -->|Persist request| DB[(Supabase/PostgreSQL tables: analyses, analysis_jobs)]
    API -->|Enqueue| Q[(Redis/BullMQ queue content-analysis-jobs)]
    Q --> Workers
    Workers -->|LLM calls| OpenAI & Anthropic & Gemini
    Workers -->|Metrics| Supabase Logs / OpenTelemetry
    Workers -->|Save results| DB
    DB -->|Poll via /content-analysis/:id| U
```

### Core Dependencies

| Component | Purpose | Notes for testing |
| --- | --- | --- |
| `POST /content-analysis/analyze` | Intake for both text and URL requests | Accepts `content` or `url` (mutually exclusive), optional `language`. |
| Supabase/PostgreSQL (`analyses`, `content_metrics`) | Stores request metadata, metrics, recommendations | Include DB load when ramping concurrency. |
| Redis/BullMQ (`content-analysis-jobs`) | Decouples ingestion from heavy analysis work | Queue depth is key telemetry for saturation. |
| AI Providers (OpenAI GPT-4.1, Anthropic Claude 3, Google Gemini 1.5) | Generate improvements, SEO scores, summaries | Provider selection logged per request; each has its own rate limit. |
| Supabase Storage | Holds large HTML snapshots if `content` exceeds inline size | Ensure synthetic datasets exercise both inline + stored blobs. |

## Processing Stages

1. **Intake validation**  
   - Verifies JSON schema, trims text, normalizes URLs, rejects WordPress hostnames for perf tests.  
   - Adds headers `x-request-id`, `x-content-pipeline`.

2. **Content enrichment**  
   - Text flow: strips HTML, tokenizes paragraphs, detects language (LanguageTool).  
   - URL flow: fetches HTML via headless fetcher, removes scripts/styles, extracts `<main>` body, checks robots directives.

3. **Parallel analysis fan-out**  
   - Grammar: LanguageTool + Claude critique.  
   - Readability: `readability-service` micro util (Flesch, Fog, Dale-Chall).  
   - SEO: Yoast/Surfer-like heuristics + GPT metadata suggestions.  
   - Engagement/Summary: Gemini summarizer for bullet highlights.

4. **Aggregation & persistence**  
   - Combines scores into `analysis.result`, calculates `time_to_first_token_ms`, `total_processing_ms`.  
   - Persists JSON plus AI token spend to Supabase.

5. **Delivery**  
   - Frontend polls `/content-analysis/:id` or receives WebSocket push (beta).  
   - Includes improved content, keyword list, metrics histogram.

## Data Variants for Testing

| Variant | Description | Perf testing use |
| --- | --- | --- |
| `TEXT_SHORT_EN` | 400–600 words blog snippet | Smoke baseline (fast path). |
| `TEXT_LONG_LT` | 1,800 word Lithuanian article with HTML | Sustained read/write pressure + language detection. |
| `URL_NEWS_EN` | External news article (non-WordPress, static HTML) | Validates crawl + sanitization. |
| `URL_DOCS_MULTI` | Documentation site page with heavy tables | Exercises parsing and summarization cost. |

Datasets will live under `docs/tests/content-analyst/datasets/`.

## Observability Touchpoints

- `request_id`, `x-content-pipeline` headers propagate through API → queue → workers.
- Metrics to export:
  - API latency percentiles (ingress).
  - Queue depth + job wait time.
  - Worker CPU/RAM + AI token usage per provider.
  - Crawl success rate for URL flows.
- Logs captured via structured logger (pino) with `module: "content-analyst"`.

## Constraints & Assumptions

- Only **text** and **generic website URLs** are included in performance scenarios—WordPress shortcuts remain functional but excluded.  
- All tests run against staging backend with dedicated AI API keys to avoid rate-limit noise.  
- Payload size cap: 10k tokens per request; longer texts stored in Supabase storage before processing.  
- SSE/WebSocket streaming disabled during automated perf runs to simplify measurements (polling only).

---

Next steps: define KPIs & workload patterns (`content-kpis` todo) and implement the dedicated test harness.

