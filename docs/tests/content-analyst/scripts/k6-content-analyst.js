import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

const textSamples = JSON.parse(open('../datasets/text_samples.json'));
const urlSamples = JSON.parse(open('../datasets/url_samples.json'));

const BASE_URL = __ENV.BASE_URL || 'https://codeanalyst-staging.up.railway.app/api';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'dev-token-content-analyst';
const PROFILE = (__ENV.TEST_PROFILE || 'smoke').toLowerCase();

const latencyTrend = new Trend('content_latency');
const queueTrend = new Trend('content_queue_wait');
const successRate = new Rate('content_success');
const failureCounter = new Counter('content_failures');

const profiles = {
  smoke: {
    vus: 1,
    duration: '5m',
    mix: { text: 0.7, url: 0.3 },
    sleep: 2
  },
  sustained: {
    stages: [
      { duration: '10m', target: 20 },
      { duration: '35m', target: 20 }
    ],
    mix: { text: 0.8, url: 0.2 },
    sleep: 0.5
  },
  spike: {
    stages: [
      { duration: '5m', target: 20 },
      { duration: '5m', target: 40 },
      { duration: '5m', target: 80 },
      { duration: '5m', target: 0 }
    ],
    mix: { text: 0.6, url: 0.4 },
    sleep: 0.25
  }
};

export const options = (() => {
  const profile = profiles[PROFILE];
  if (!profile) {
    throw new Error(`Unknown TEST_PROFILE "${PROFILE}". Supported: ${Object.keys(profiles).join(', ')}`);
  }

  return PROFILE === 'smoke'
    ? { vus: profile.vus, duration: profile.duration }
    : { stages: profile.stages };
})();

function pickSample(list) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function buildPayload(profile) {
  const useText = Math.random() <= profile.mix.text;
  if (useText) {
    const sample = pickSample(textSamples);
    return {
      body: JSON.stringify({
        type: 'text',
        content: sample.content,
        metadata: { sampleId: sample.id, language: sample.language }
      }),
      label: sample.id
    };
  }

  const sample = pickSample(urlSamples);
  return {
    body: JSON.stringify({
      type: 'url',
      url: sample.url,
      metadata: { sampleId: sample.id }
    }),
    label: sample.id
  };
}

export default function () {
  const profile = profiles[PROFILE];
  group(`profile_${PROFILE}`, () => {
    const payload = buildPayload(profile);
    const res = http.post(
      `${BASE_URL}/content-analysis/analyze`,
      payload.body,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'x-test-suite': 'content-analyst-perf',
          'x-request-source': PROFILE
        },
        tags: { inputType: JSON.parse(payload.body).type, sample: payload.label }
      }
    );

    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'payload success flag': (r) => {
        try {
          const json = r.json();
          return json?.success === true;
        } catch (err) {
          return false;
        }
      }
    });

    if (ok) {
      const body = res.json();
      const metrics = body?.metrics || {};
      latencyTrend.add(metrics.total_processing_ms || res.timings.duration);
      queueTrend.add(metrics.queue_wait_ms || 0);
      successRate.add(1);
    } else {
      failureCounter.add(1);
      successRate.add(0);
    }
  });

  sleep(profile.sleep || 0.5);
}

