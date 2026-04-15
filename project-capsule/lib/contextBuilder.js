// Builds a single ready-to-paste AI prompt from project data.
const fs = require('fs');
const path = require('path');
const { findProject, projectDir, physicalFile } = require('./projectManager');
const git = require('./gitHelper');

function readOr(p, fallback = '') {
  try { return fs.readFileSync(p, 'utf8'); } catch { return fallback; }
}
function readLogical(project, logical) {
  return readOr(path.join(projectDir(project), physicalFile(project, logical)));
}
function tail(s, lines) {
  return s.split('\n').slice(-lines).join('\n');
}

function buildContext(id, opts = {}) {
  const p = findProject(id);
  if (!p) return null;
  const dir = projectDir(p);
  const promptsMd   = readLogical(p, 'ai/prompts.md');
  const contextMd   = readLogical(p, 'ai/context.md');
  const projectMd   = readLogical(p, 'docs/project.md');
  const todoMd      = readLogical(p, 'tasks/todo.md');
  const changelogMd = readLogical(p, 'changelog/changelog.md');
  const gitInfo = git.status(dir);

  const parts = [];
  parts.push(`# AI Context: ${p.clientName} / ${p.projectName}`);
  parts.push('');
  parts.push(`**Status:** ${p.status}  |  **Type:** ${p.templateId}  |  **Laatst geopend:** ${p.lastOpenedAt || '—'}`);
  if (p.attached) parts.push(`**Locatie:** \`${dir}\` (gekoppelde map)`);
  if (p.description) parts.push(`\n${p.description}\n`);

  parts.push('\n## Projectinformatie\n');
  parts.push(projectMd.trim() || '_geen project.md gevonden_');

  parts.push('\n## Leidende context\n');
  parts.push(contextMd.trim() || '_geen context gevonden_');

  parts.push('\n## Open taken\n');
  const open = todoMd.split('\n').filter((l) => /\[ \]/.test(l));
  parts.push(open.length ? open.join('\n') : '_geen open taken_');

  parts.push('\n## Recente changelog (laatste 30 regels)\n');
  parts.push('```\n' + tail(changelogMd, 30).trim() + '\n```');

  parts.push('\n## Relevante prompts\n');
  parts.push(promptsMd.trim() || '_geen prompts_');

  if (gitInfo.isRepo) {
    parts.push('\n## Git status\n');
    parts.push(`- Branch: \`${gitInfo.branch || '?'}\``);
    parts.push(`- Laatste commit: ${gitInfo.lastCommit || '—'}`);
    parts.push(`- Clean: ${gitInfo.clean ? 'ja' : 'nee'}`);
    if (!gitInfo.clean && gitInfo.changed.length) {
      parts.push('- Gewijzigde bestanden:');
      for (const line of gitInfo.changed.slice(0, 20)) parts.push(`  - ${line}`);
    }
  }

  if (opts.extra) {
    parts.push('\n## Extra aanvullingen\n');
    parts.push(opts.extra);
  }

  return parts.join('\n');
}

module.exports = { buildContext };
