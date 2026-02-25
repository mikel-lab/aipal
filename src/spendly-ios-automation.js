const path = require('path');
const os = require('os');
const fs = require('fs');

const DEFAULT_TIMEZONE = 'Europe/Madrid';
const DEFAULT_REPO = 'mikel-lab/spendly';
const DEFAULT_WORKSPACE = '/Users/mikelcobian/Repositorios Trabajo/Spendly-iOS';

const PROMPTS_DIR = path.join(__dirname, '..', 'prompts', 'spendly-ios');

const CRON_JOB_SPECS = [
  {
    key: 'auditCode',
    id: 'spendly-audit-code',
    cron: '0 6 * * *',
    promptFile: 'audit-code.md',
  },
  {
    key: 'auditUi',
    id: 'spendly-audit-ui',
    cron: '0 7 * * *',
    promptFile: 'audit-ui.md',
  },
  {
    key: 'auditSecurity',
    id: 'spendly-audit-security',
    cron: '0 8 * * *',
    promptFile: 'audit-security.md',
  },
  {
    key: 'issueWorker',
    id: 'spendly-issue-worker',
    cron: '0 9-23/2 * * *',
    promptFile: 'issue-worker.md',
  },
];

const LABEL_SPECS = [
  { name: 'audit:code', color: '1D76DB', description: 'Created or updated by code audit cron' },
  { name: 'audit:ui', color: '5319E7', description: 'Created or updated by UI quality audit cron' },
  { name: 'audit:security', color: 'B60205', description: 'Created or updated by security audit cron' },
  { name: 'agent:ready', color: '0E8A16', description: 'Approved for autonomous agent execution' },
  { name: 'agent:in-progress', color: 'FBCA04', description: 'Currently being worked by the autonomous agent' },
  { name: 'agent:managed', color: 'C2E0C6', description: 'PR or issue managed by the autonomous agent' },
  { name: 'agent:ci-failed', color: 'D93F0B', description: 'Managed PR failed CI and needs retry/fix' },
  { name: 'agent:blocked', color: 'E99695', description: 'Blocked by ambiguity, conflict, or external dependency' },
  { name: 'agent:needs-human', color: '7057FF', description: 'Needs human decision or unsafe for autonomous changes' },
  { name: 'priority:high', color: 'B60205', description: 'High priority issue' },
  { name: 'priority:medium', color: 'FBCA04', description: 'Medium priority issue' },
  { name: 'priority:low', color: '0E8A16', description: 'Low priority issue' },
  { name: 'type:bug', color: 'D73A4A', description: 'Behavioral bug or regression' },
  { name: 'type:refactor', color: 'A2EEEF', description: 'Refactor or cleanup task' },
  { name: 'type:ui', color: 'C5DEF5', description: 'UI/UX quality issue' },
  { name: 'type:security', color: 'B60205', description: 'Security hardening or exposure issue' },
];

function getAipalConfigDir() {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(xdg, 'aipal');
}

function getDefaultCronConfigPath() {
  return path.join(getAipalConfigDir(), 'cron.json');
}

function readPrompt(promptFile, options = {}) {
  const promptPath = path.join(options.promptsDir || PROMPTS_DIR, promptFile);
  const raw = fs.readFileSync(promptPath, 'utf8');
  return raw.trim();
}

function buildSpendlyCronJobs(options = {}) {
  const timezone = options.timezone || DEFAULT_TIMEZONE;
  const defaultChatId = options.chatId == null ? undefined : Number(options.chatId);
  const assignments = options.assignments || {};

  return CRON_JOB_SPECS.map((spec) => {
    const assignment = assignments[spec.key] || assignments[spec.id] || {};
    const job = {
      id: spec.id,
      enabled: true,
      cron: spec.cron,
      timezone,
      prompt: readPrompt(spec.promptFile, options),
      agent: assignment.agent || 'codex',
    };

    const chatId = assignment.chatId != null ? Number(assignment.chatId) : defaultChatId;
    if (Number.isFinite(chatId)) job.chatId = chatId;
    const topicId = assignment.topicId != null ? Number(assignment.topicId) : undefined;
    if (Number.isFinite(topicId)) {
      job.topicId = topicId;
    }
    return job;
  });
}

function upsertCronJobs(existingJobs, newJobs) {
  const safeExisting = Array.isArray(existingJobs) ? existingJobs : [];
  const byId = new Map(newJobs.map((job) => [job.id, job]));
  const merged = [];

  for (const job of safeExisting) {
    if (!job || typeof job !== 'object' || !job.id) {
      merged.push(job);
      continue;
    }
    if (!byId.has(job.id)) {
      merged.push(job);
      continue;
    }
    const next = byId.get(job.id);
    merged.push({
      ...job,
      ...next,
      // Preserve topic/chat assignment if caller didn't provide it this time.
      ...(next.topicId == null && job.topicId != null ? { topicId: job.topicId } : {}),
      ...(next.chatId == null && job.chatId != null ? { chatId: job.chatId } : {}),
    });
    byId.delete(job.id);
  }

  for (const job of newJobs) {
    if (byId.has(job.id)) merged.push(job);
  }

  return merged;
}

function loadCronConfig(cronPath = getDefaultCronConfigPath()) {
  try {
    const raw = fs.readFileSync(cronPath, 'utf8');
    if (!raw.trim()) return { jobs: [] };
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  } catch (err) {
    if (err && err.code === 'ENOENT') return { jobs: [] };
    throw err;
  }
}

function saveCronConfig(config, cronPath = getDefaultCronConfigPath()) {
  fs.mkdirSync(path.dirname(cronPath), { recursive: true });
  fs.writeFileSync(cronPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

module.exports = {
  CRON_JOB_SPECS,
  DEFAULT_REPO,
  DEFAULT_TIMEZONE,
  DEFAULT_WORKSPACE,
  LABEL_SPECS,
  PROMPTS_DIR,
  buildSpendlyCronJobs,
  getAipalConfigDir,
  getDefaultCronConfigPath,
  loadCronConfig,
  saveCronConfig,
  upsertCronJobs,
};
