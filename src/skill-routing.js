const path = require('path');
const os = require('os');
const fs = require('fs/promises');

function normalizeSkillName(value) {
  return String(value || '').trim();
}

function slugifySkillName(value) {
  return normalizeSkillName(value).toLowerCase();
}

function parseExplicitSkillDirective(text) {
  const input = String(text || '');
  const hashMatch = input.match(/#skill:([A-Za-z0-9._-]+)/i);
  if (hashMatch) {
    return normalizeSkillName(hashMatch[1]);
  }
  const useMatch = input.match(/\buse\s+skill\s+([A-Za-z0-9._-]+)/i);
  if (useMatch) {
    return normalizeSkillName(useMatch[1]);
  }
  return null;
}

function buildRepoSkillPromptBlock(skill, body) {
  const trimmed = String(body || '').trim();
  if (!trimmed) return '';
  const compact = trimmed.length > 2500 ? `${trimmed.slice(0, 2500)}\n...(truncated)` : trimmed;
  return [
    `Active skill: ${skill.name}`,
    `Skill source: ${skill.source}`,
    'Follow this skill guidance if relevant to the user request.',
    '--- SKILL START ---',
    compact,
    '--- SKILL END ---',
  ].join('\n');
}

async function listRepoSkills(repoRoot) {
  const skillsDir = path.join(repoRoot, 'skills');
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const out = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
      try {
        await fs.access(skillFile);
        out.push({
          name: entry.name,
          slug: slugifySkillName(entry.name),
          source: 'repo',
          path: skillFile,
        });
      } catch {}
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    console.warn('Failed to list repo skills:', err);
    return [];
  }
}

async function listCodexSkills() {
  const baseDir = path.join(os.homedir(), '.codex', 'skills');
  try {
    const top = await fs.readdir(baseDir, { withFileTypes: true });
    const out = [];
    for (const dir of top) {
      if (!dir.isDirectory()) continue;
      const dirPath = path.join(baseDir, dir.name);
      if (dir.name === '.system') {
        const nested = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
        for (const nd of nested) {
          if (!nd.isDirectory()) continue;
          const skillFile = path.join(dirPath, nd.name, 'SKILL.md');
          try {
            await fs.access(skillFile);
            out.push({
              name: nd.name,
              slug: slugifySkillName(nd.name),
              source: 'codex',
              mode: 'global',
              path: skillFile,
            });
          } catch {}
        }
        continue;
      }
      const skillFile = path.join(dirPath, 'SKILL.md');
      try {
        await fs.access(skillFile);
        out.push({
          name: dir.name,
          slug: slugifySkillName(dir.name),
          source: 'codex',
          mode: 'global',
          path: skillFile,
        });
      } catch {}
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    console.warn('Failed to list Codex skills:', err);
    return [];
  }
}

function mergeCatalog(repoSkills, codexSkills, stateCatalog = {}) {
  const merged = new Map();
  for (const skill of [...repoSkills, ...codexSkills]) {
    merged.set(skill.slug, { ...skill });
  }
  for (const [name, meta] of Object.entries(stateCatalog || {})) {
    const slug = slugifySkillName(name);
    const existing = merged.get(slug);
    merged.set(slug, {
      name,
      slug,
      source: meta?.source || existing?.source || 'config',
      mode: meta?.mode || existing?.mode,
      path: meta?.path || existing?.path,
      ...existing,
      ...meta,
      name: existing?.name || name,
      slug,
    });
  }
  return merged;
}

function detectDomainSignals(text) {
  const s = String(text || '').toLowerCase();
  return {
    ios: /\b(swift|swiftui|swiftdata|xcode|ios|uikit|@mainactor|sendable)\b/.test(s),
    social: /\b(postiz|tiktok|twitter|x|linkedin|schedule|scheduled post)\b/.test(s),
    ops: /\b(pm2|cron|docker|cloudflared|healthcheck|watchdog|runbook)\b/.test(s),
  };
}

function resolveAutoSkill(text, aliases, catalog) {
  const normalized = String(text || '').toLowerCase();
  for (const [alias, target] of Object.entries(aliases || {})) {
    const safeAlias = String(alias || '').trim().toLowerCase();
    if (!safeAlias) continue;
    const aliasRegex = new RegExp(`(^|[^a-z0-9])${safeAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^a-z0-9])`, 'i');
    if (aliasRegex.test(normalized)) {
      const match = catalog.get(slugifySkillName(target));
      if (match) {
        return { skill: match, confidence: 'high', matchedAlias: alias };
      }
      return {
        skill: null,
        confidence: 'high',
        matchedAlias: alias,
        missingRequestedSkill: String(target),
      };
    }
  }
  return null;
}

function buildMissingSkillSuggestions(signals) {
  const suggestions = [];
  if (signals.ios) suggestions.push('swiftui-expert-skill', 'axiom-swiftdata', 'ios-build-review');
  if (signals.social) suggestions.push('social-postiz-ops');
  if (signals.ops) suggestions.push('reliability-ops');
  return Array.from(new Set(suggestions)).slice(0, 3);
}

function buildMissingSkillNotice(suggestions) {
  if (!suggestions || suggestions.length === 0) return '';
  return [
    'Nota: este prompt parece requerir una skill especializada que no tengo registrada.',
    `Sugerencias: ${suggestions.join(', ')}`,
    'Si quieres, instálala tú manualmente y luego usa /skill use <nombre>.',
    'No he instalado nada automáticamente.',
    '',
  ].join('\n');
}

async function readSkillPromptBlock(skill) {
  if (!skill?.path) return '';
  try {
    const raw = await fs.readFile(skill.path, 'utf8');
    return buildRepoSkillPromptBlock(skill, raw);
  } catch (err) {
    console.warn('Failed to read repo skill file:', skill.path, err?.message || err);
    return '';
  }
}

async function resolveSkillRouting({
  prompt,
  chatId,
  topicId,
  skillsState,
  repoRoot,
  manualOverrideSkill,
}) {
  const repoSkills = await listRepoSkills(repoRoot);
  const codexSkills = await listCodexSkills();
  const catalog = mergeCatalog(repoSkills, codexSkills, skillsState?.catalog);
  const aliases = skillsState?.aliases || {};
  const explicitInPrompt = parseExplicitSkillDirective(prompt);

  let selected = null;
  let source = 'none';
  let confidence = 'low';

  const topicKey = `${String(chatId)}:${topicId === undefined || topicId === null ? 'root' : String(topicId)}`;
  const topicSkill = String(skillsState?.topicOverrides?.[topicKey] || '').trim();
  const topicAuto = (() => {
    const value = skillsState?.topicAuto?.[topicKey];
    return value === undefined ? true : Boolean(value);
  })();

  const explicitSkillName = manualOverrideSkill || explicitInPrompt;
  if (explicitSkillName) {
    selected = catalog.get(slugifySkillName(explicitSkillName)) || null;
    source = 'manual';
    confidence = selected ? 'high' : 'low';
  } else if (topicSkill) {
    selected = catalog.get(slugifySkillName(topicSkill)) || null;
    source = 'topic';
    confidence = selected ? 'high' : 'low';
  } else if (topicAuto) {
    const auto = resolveAutoSkill(prompt, aliases, catalog);
    if (auto) {
      selected = auto.skill;
      source = 'auto';
      confidence = auto.confidence || 'medium';
      if (!selected && auto.missingRequestedSkill) {
        const suggestions = buildMissingSkillSuggestions(detectDomainSignals(prompt));
        return {
          selectedSkill: null,
          source,
          confidence,
          catalog,
          repoSkills,
          codexSkills,
          skillPromptBlock: '',
          missingSkill: auto.missingRequestedSkill,
          missingSkillPrompted: true,
          missingSkillNotice: buildMissingSkillNotice(suggestions),
          suggestions,
        };
      }
    }
  }

  let missingSkillPrompted = false;
  let missingSkillNotice = '';
  let suggestions = [];
  if (!selected && source !== 'manual' && source !== 'topic') {
    const signals = detectDomainSignals(prompt);
    suggestions = buildMissingSkillSuggestions(signals).filter((name) => !catalog.has(slugifySkillName(name)));
    if (suggestions.length > 0) {
      missingSkillPrompted = true;
      missingSkillNotice = buildMissingSkillNotice(suggestions);
    }
  }

  const skillPromptBlock = selected ? await readSkillPromptBlock(selected) : '';

  return {
    selectedSkill: selected,
    source,
    confidence,
    catalog,
    repoSkills,
    codexSkills,
    skillPromptBlock,
    missingSkill: null,
    missingSkillPrompted,
    missingSkillNotice,
    suggestions,
  };
}

module.exports = {
  normalizeSkillName,
  slugifySkillName,
  parseExplicitSkillDirective,
  listRepoSkills,
  listCodexSkills,
  resolveSkillRouting,
};
