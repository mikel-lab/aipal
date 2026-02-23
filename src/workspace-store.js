const { randomUUID } = require('crypto');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const { buildTopicKey } = require('./thread-store');

const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
const CONFIG_DIR = path.join(XDG_CONFIG_HOME, 'aipal');
const WORKSPACES_CONFIG_PATH = path.join(CONFIG_DIR, 'workspaces.json');

function defaultWorkspacesState() {
  return {
    topicWorkspace: {},
  };
}

function normalizeWorkspacesState(raw) {
  if (!raw || typeof raw !== 'object') return defaultWorkspacesState();
  return {
    topicWorkspace:
      raw.topicWorkspace && typeof raw.topicWorkspace === 'object'
        ? { ...raw.topicWorkspace }
        : {},
  };
}

async function loadWorkspacesConfig() {
  try {
    const raw = await fs.readFile(WORKSPACES_CONFIG_PATH, 'utf8');
    if (!raw.trim()) return defaultWorkspacesState();
    return normalizeWorkspacesState(JSON.parse(raw));
  } catch (err) {
    if (err && err.code === 'ENOENT') return defaultWorkspacesState();
    console.warn('Failed to load workspaces.json:', err);
    return defaultWorkspacesState();
  }
}

async function saveWorkspacesConfig(state) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const tmpPath = `${WORKSPACES_CONFIG_PATH}.${randomUUID()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(normalizeWorkspacesState(state), null, 2), 'utf8');
  await fs.rename(tmpPath, WORKSPACES_CONFIG_PATH);
}

function getTopicWorkspace(state, chatId, topicId) {
  const key = buildTopicKey(chatId, topicId);
  return String(state?.topicWorkspace?.[key] || '').trim() || null;
}

function setTopicWorkspace(state, chatId, topicId, workspacePath) {
  const key = buildTopicKey(chatId, topicId);
  if (!state.topicWorkspace || typeof state.topicWorkspace !== 'object') state.topicWorkspace = {};
  state.topicWorkspace[key] = String(workspacePath || '').trim();
  return key;
}

function clearTopicWorkspace(state, chatId, topicId) {
  const key = buildTopicKey(chatId, topicId);
  if (!state.topicWorkspace || typeof state.topicWorkspace !== 'object') return false;
  return delete state.topicWorkspace[key];
}

module.exports = {
  WORKSPACES_CONFIG_PATH,
  defaultWorkspacesState,
  normalizeWorkspacesState,
  loadWorkspacesConfig,
  saveWorkspacesConfig,
  getTopicWorkspace,
  setTopicWorkspace,
  clearTopicWorkspace,
};
