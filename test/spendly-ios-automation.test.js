const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  buildSpendlyCronJobs,
  upsertCronJobs,
  LABEL_SPECS,
} = require('../src/spendly-ios-automation');

test('buildSpendlyCronJobs returns four configured jobs', () => {
  const jobs = buildSpendlyCronJobs({
    chatId: -100123,
    assignments: {
      auditCode: { topicId: 11 },
      auditUi: { topicId: 22 },
      auditSecurity: { topicId: 33 },
      issueWorker: { topicId: 44 },
    },
  });

  assert.equal(jobs.length, 4);
  assert.equal(jobs[0].id, 'spendly-audit-code');
  assert.equal(jobs[0].chatId, -100123);
  assert.equal(jobs[0].topicId, 11);
  assert.equal(jobs[3].id, 'spendly-issue-worker');
  assert.equal(jobs[3].cron, '0 9-23/2 * * *');
  for (const job of jobs) {
    assert.equal(job.enabled, true);
    assert.equal(job.timezone, 'Europe/Madrid');
    assert.equal(job.agent, 'codex');
    assert.match(job.prompt, /Spendly-iOS/);
  }
});

test('upsertCronJobs preserves unrelated jobs and existing assignments when omitted', () => {
  const existing = [
    { id: 'keep-me', enabled: true, cron: '* * * * *', prompt: 'hello' },
    { id: 'spendly-audit-code', enabled: false, cron: '1 1 * * *', prompt: 'old', topicId: 999, chatId: 123 },
  ];
  const incoming = [
    { id: 'spendly-audit-code', enabled: true, cron: '0 6 * * *', prompt: 'new' },
    { id: 'spendly-audit-ui', enabled: true, cron: '0 7 * * *', prompt: 'ui' },
  ];

  const merged = upsertCronJobs(existing, incoming);

  assert.equal(merged.length, 3);
  const kept = merged.find((j) => j.id === 'keep-me');
  const code = merged.find((j) => j.id === 'spendly-audit-code');
  const ui = merged.find((j) => j.id === 'spendly-audit-ui');
  assert.ok(kept);
  assert.equal(code.enabled, true);
  assert.equal(code.prompt, 'new');
  assert.equal(code.topicId, 999);
  assert.equal(code.chatId, 123);
  assert.ok(ui);
});

test('label catalog includes required automation labels', () => {
  const names = new Set(LABEL_SPECS.map((l) => l.name));
  for (const name of [
    'agent:ready',
    'agent:in-progress',
    'agent:managed',
    'agent:ci-failed',
    'agent:blocked',
    'agent:needs-human',
    'audit:code',
    'audit:ui',
    'audit:security',
  ]) {
    assert.equal(names.has(name), true, `missing label ${name}`);
  }
});
