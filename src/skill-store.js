const { randomUUID } = require('crypto');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const { buildTopicKey } = require('./thread-store');

const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
const CONFIG_DIR = path.join(XDG_CONFIG_HOME, 'aipal');
const SKILLS_CONFIG_PATH = path.join(CONFIG_DIR, 'skills.json');

function defaultSkillsState() {
  return {
    topicOverrides: {},
    topicAuto: {},
    aliases: {
      ios: 'swiftui-expert-skill',
      swift: 'swiftui-expert-skill',
      swiftui: 'swiftui-expert-skill',
      swiftdata: 'axiom-swiftdata',
      xcode: 'ios-build-review',
      pm2: 'reliability-ops',
      postiz: 'social-postiz-ops',
      tiktok: 'social-postiz-ops',
      telegram: 'reliability-ops',
      docker: 'reliability-ops',
    },
    catalog: {},
  };
}

function normalizeSkillsState(raw) {
  const base = defaultSkillsState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    topicOverrides:
      raw.topicOverrides && typeof raw.topicOverrides === 'object' ? { ...raw.topicOverrides } : {},
    topicAuto:
      raw.topicAuto && typeof raw.topicAuto === 'object' ? { ...raw.topicAuto } : {},
    aliases:
      raw.aliases && typeof raw.aliases === 'object' ? { ...base.aliases, ...raw.aliases } : base.aliases,
    catalog:
      raw.catalog && typeof raw.catalog === 'object' ? { ...raw.catalog } : {},
  };
}

async function loadSkillsConfig() {
  try {
    const raw = await fs.readFile(SKILLS_CONFIG_PATH, 'utf8');
    if (!raw.trim()) return defaultSkillsState();
    return normalizeSkillsState(JSON.parse(raw));
  } catch (err) {
    if (err && err.code === 'ENOENT') return defaultSkillsState();
    console.warn('Failed to load skills.json:', err);
    return defaultSkillsState();
  }
}

async function saveSkillsConfig(state) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const tmpPath = `${SKILLS_CONFIG_PATH}.${randomUUID()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(normalizeSkillsState(state), null, 2), 'utf8');
  await fs.rename(tmpPath, SKILLS_CONFIG_PATH);
}

function getSkillTopicKey(chatId, topicId) {
  return buildTopicKey(chatId, topicId);
}

function getTopicSkillOverride(state, chatId, topicId) {
  return String(state?.topicOverrides?.[getSkillTopicKey(chatId, topicId)] || '').trim() || null;
}

function setTopicSkillOverride(state, chatId, topicId, skillName) {
  const key = getSkillTopicKey(chatId, topicId);
  if (!state.topicOverrides || typeof state.topicOverrides !== 'object') state.topicOverrides = {};
  state.topicOverrides[key] = String(skillName || '').trim();
  return key;
}

function clearTopicSkillOverride(state, chatId, topicId) {
  const key = getSkillTopicKey(chatId, topicId);
  if (!state.topicOverrides || typeof state.topicOverrides !== 'object') return false;
  return delete state.topicOverrides[key];
}

function isTopicSkillAutoEnabled(state, chatId, topicId) {
  const key = getSkillTopicKey(chatId, topicId);
  if (!state.topicAuto || typeof state.topicAuto !== 'object') return true;
  const value = state.topicAuto[key];
  if (value === undefined) return true;
  return Boolean(value);
}

function setTopicSkillAuto(state, chatId, topicId, enabled) {
  const key = getSkillTopicKey(chatId, topicId);
  if (!state.topicAuto || typeof state.topicAuto !== 'object') state.topicAuto = {};
  state.topicAuto[key] = Boolean(enabled);
  return key;
}

function setSkillsCatalogEntry(state, skillName, entry) {
  if (!state.catalog || typeof state.catalog !== 'object') state.catalog = {};
  state.catalog[String(skillName)] = {
    ...(state.catalog[String(skillName)] || {}),
    ...(entry || {}),
  };
}

module.exports = {
  SKILLS_CONFIG_PATH,
  defaultSkillsState,
  normalizeSkillsState,
  loadSkillsConfig,
  saveSkillsConfig,
  getTopicSkillOverride,
  setTopicSkillOverride,
  clearTopicSkillOverride,
  isTopicSkillAutoEnabled,
  setTopicSkillAuto,
  setSkillsCatalogEntry,
};
