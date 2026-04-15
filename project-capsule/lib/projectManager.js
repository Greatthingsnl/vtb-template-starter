// Project lifecycle: create, list, read, update, clone, open in VS Code, scan.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { readJSON, writeJSON, getProjectsRoot, getConfig } = require('./storage');
const { slugify, copyDir, ensureDir, writeIfMissing, readTextSafe } = require('./fsutil');
const { getTemplateDir } = require('./templates');
const git = require('./gitHelper');

const STANDARD_FILES = {
  'docs/project.md':        (p) => `# ${p.projectName}\n\n**Klant:** ${p.clientName}\n**Status:** ${p.status}\n**Aangemaakt:** ${p.createdAt}\n\n## Omschrijving\n\n${p.description || ''}\n`,
  'docs/readme.md':         (p) => `# ${p.projectName} — README\n\nLokaal projectdossier, beheerd via Project Capsule.\n`,
  'ai/prompts.md':          () => `# AI Prompts\n\nVerzamel hier alle prompts die je gebruikt of hebt gebruikt.\n\n## Systeemprompt\n\n_leeg_\n\n## Prompts\n\n- \n`,
  'ai/context.md':          (p) => `# AI Context\n\nLeidende context voor AI assistenten die met dit project werken.\n\n- Klant: ${p.clientName}\n- Project: ${p.projectName}\n- Type: ${p.templateId}\n- Status: ${p.status}\n`,
  'tasks/todo.md':          () => `# Taken\n\n## Open\n\n- [ ] \n\n## Done\n\n`,
  'changelog/changelog.md': (p) => `# Changelog\n\n## ${p.createdAt.slice(0, 10)} — Project aangemaakt\n\n- Initiële structuur via Project Capsule.\n`,
  'deploy/deploy.md':       () => `# Deploy notes\n\nStappen voor deploy / release.\n`,
};

const STANDARD_DIRS = ['code', 'docs', 'ai', 'changelog', 'tasks', 'assets', 'deploy', 'archive'];

const GITIGNORE = `node_modules/\n.DS_Store\n*.log\n.env\ndist/\nbuild/\n.cache/\n`;

function loadProjects() {
  return readJSON('projects.json', []);
}
function saveProjects(projects) {
  writeJSON('projects.json', projects);
}

function projectDir(project) {
  const root = getProjectsRoot();
  return path.join(root, project.clientSlug, project.projectSlug);
}

function readCapsuleMeta(dir) {
  const p = path.join(dir, '.capsule.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function writeCapsuleMeta(dir, meta) {
  fs.writeFileSync(path.join(dir, '.capsule.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createProject(input) {
  const createdAt = new Date().toISOString();
  const clientSlug  = slugify(input.clientName);
  const projectSlug = slugify(input.projectName);
  const id = newId();

  const project = {
    id,
    clientName:  input.clientName,
    projectName: input.projectName,
    clientSlug,
    projectSlug,
    description: input.description || '',
    templateId:  input.templateId || 'empty',
    status:      input.status || 'idee',
    labels:      input.labels || [],
    links:       input.links || {},
    createdAt,
    updatedAt:   createdAt,
    lastOpenedAt: null,
    lastPrompt:   '',
    lastNote:     '',
  };

  const dir = projectDir(project);
  if (fs.existsSync(dir)) {
    throw new Error(`Projectmap bestaat al: ${dir}`);
  }

  // Make base structure.
  ensureDir(dir);
  for (const d of STANDARD_DIRS) ensureDir(path.join(dir, d));

  // Copy template files (non-destructive).
  const tplDir = getTemplateDir(project.templateId);
  if (tplDir) {
    copyDir(tplDir, dir);
  }

  // Seed standard files if still missing.
  for (const [rel, make] of Object.entries(STANDARD_FILES)) {
    writeIfMissing(path.join(dir, rel), make(project));
  }
  writeIfMissing(path.join(dir, '.gitignore'), GITIGNORE);

  writeCapsuleMeta(dir, project);

  if (input.gitInit) {
    git.init(dir);
    git.addAllAndCommit(dir, 'Initial commit (Project Capsule)');
  }

  const projects = loadProjects();
  projects.push(project);
  saveProjects(projects);

  return project;
}

function findProject(id) {
  return loadProjects().find((p) => p.id === id) || null;
}

function listProjects() {
  // Enrich with a cheap "last activity" timestamp.
  return loadProjects().map((p) => {
    const dir = projectDir(p);
    let lastActivity = p.updatedAt || p.createdAt;
    try {
      const st = fs.statSync(dir);
      const mtime = st.mtime.toISOString();
      if (mtime > lastActivity) lastActivity = mtime;
    } catch {}
    return { ...p, lastActivity };
  });
}

function updateProject(id, patch) {
  const projects = loadProjects();
  const i = projects.findIndex((p) => p.id === id);
  if (i < 0) return null;
  const merged = { ...projects[i], ...patch, id, updatedAt: new Date().toISOString() };
  // Re-slug only if explicitly renamed (unusual; keep simple).
  projects[i] = merged;
  saveProjects(projects);
  try { writeCapsuleMeta(projectDir(merged), merged); } catch {}
  return merged;
}

function touchOpened(id, patch = {}) {
  return updateProject(id, { lastOpenedAt: new Date().toISOString(), ...patch });
}

function openInVSCode(id) {
  const project = findProject(id);
  if (!project) return { ok: false, error: 'Project niet gevonden' };
  const { vscode } = getConfig();
  const dir = projectDir(project);
  try {
    const child = spawn(vscode || 'code', [dir], { detached: true, stdio: 'ignore' });
    child.unref();
    touchOpened(id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function cloneProject(sourceId, input) {
  const src = findProject(sourceId);
  if (!src) throw new Error('Bronproject niet gevonden');

  const createdAt = new Date().toISOString();
  const clientSlug  = slugify(input.clientName || src.clientName);
  const projectSlug = slugify(input.projectName);
  const id = newId();

  const cloned = {
    ...src,
    id,
    clientName:  input.clientName || src.clientName,
    projectName: input.projectName,
    clientSlug,
    projectSlug,
    status:      input.status || 'idee',
    labels:      input.labels || src.labels || [],
    createdAt,
    updatedAt:   createdAt,
    lastOpenedAt: null,
    clonedFrom:  src.id,
  };

  const srcDir = projectDir(src);
  const dstDir = projectDir(cloned);
  if (fs.existsSync(dstDir)) throw new Error(`Doelmap bestaat al: ${dstDir}`);

  ensureDir(dstDir);
  for (const d of STANDARD_DIRS) ensureDir(path.join(dstDir, d));

  const include = {
    code:      input.cloneCode !== false,
    docs:      input.cloneDocs !== false,
    ai:        input.clonePrompts !== false,
    changelog: input.cloneChangelog === true, // default off
    tasks:     input.cloneTasks === true,
    assets:    input.cloneAssets === true,
    deploy:    input.cloneDeploy !== false,
  };

  for (const d of STANDARD_DIRS) {
    if (!include[d]) continue;
    const s = path.join(srcDir, d);
    const t = path.join(dstDir, d);
    if (fs.existsSync(s)) copyDir(s, t);
  }

  // Always re-seed project.md with new metadata.
  fs.writeFileSync(path.join(dstDir, 'docs/project.md'), STANDARD_FILES['docs/project.md'](cloned), 'utf8');
  if (!include.changelog) {
    fs.writeFileSync(path.join(dstDir, 'changelog/changelog.md'), STANDARD_FILES['changelog/changelog.md'](cloned), 'utf8');
  } else {
    fs.appendFileSync(
      path.join(dstDir, 'changelog/changelog.md'),
      `\n## ${createdAt.slice(0, 10)} — Gekloond van ${src.clientName}/${src.projectName}\n`,
      'utf8'
    );
  }

  writeIfMissing(path.join(dstDir, '.gitignore'), GITIGNORE);
  writeCapsuleMeta(dstDir, cloned);

  if (input.gitInit) {
    git.init(dstDir);
    git.addAllAndCommit(dstDir, `Cloned from ${src.clientName}/${src.projectName}`);
  }

  const projects = loadProjects();
  projects.push(cloned);
  saveProjects(projects);
  return cloned;
}

function scanForProjects() {
  const root = getProjectsRoot();
  const known = new Set(loadProjects().map((p) => `${p.clientSlug}/${p.projectSlug}`));
  const found = [];
  if (!fs.existsSync(root)) return found;
  for (const client of fs.readdirSync(root, { withFileTypes: true })) {
    if (!client.isDirectory()) continue;
    const clientDir = path.join(root, client.name);
    for (const proj of fs.readdirSync(clientDir, { withFileTypes: true })) {
      if (!proj.isDirectory()) continue;
      const key = `${client.name}/${proj.name}`;
      if (known.has(key)) continue;
      const projDir = path.join(clientDir, proj.name);
      const meta = readCapsuleMeta(projDir);
      found.push({
        clientSlug:  client.name,
        projectSlug: proj.name,
        clientName:  meta?.clientName || client.name,
        projectName: meta?.projectName || proj.name,
        hasMeta:     !!meta,
        dir:         projDir,
      });
    }
  }
  return found;
}

function adoptProject(info) {
  const project = {
    id: newId(),
    clientName:  info.clientName,
    projectName: info.projectName,
    clientSlug:  info.clientSlug,
    projectSlug: info.projectSlug,
    description: info.description || '',
    templateId:  'empty',
    status:      info.status || 'actief',
    labels:      [],
    links:       {},
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    lastOpenedAt: null,
    lastPrompt:  '',
    lastNote:    '',
    adopted:     true,
  };
  const dir = projectDir(project);
  if (!fs.existsSync(dir)) throw new Error(`Map niet gevonden: ${dir}`);
  // Seed missing std files but don't overwrite.
  for (const d of STANDARD_DIRS) ensureDir(path.join(dir, d));
  for (const [rel, make] of Object.entries(STANDARD_FILES)) {
    writeIfMissing(path.join(dir, rel), make(project));
  }
  writeIfMissing(path.join(dir, '.gitignore'), GITIGNORE);
  writeCapsuleMeta(dir, project);
  const projects = loadProjects();
  projects.push(project);
  saveProjects(projects);
  return project;
}

function deleteProjectRecord(id) {
  // Removes only the registry entry. Files on disk are left alone (safety).
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

function readProjectFile(id, rel) {
  const p = findProject(id);
  if (!p) return null;
  const full = path.join(projectDir(p), rel);
  if (!full.startsWith(projectDir(p))) return null; // traversal guard
  return readTextSafe(full, '');
}

function writeProjectFile(id, rel, content) {
  const p = findProject(id);
  if (!p) return false;
  const full = path.join(projectDir(p), rel);
  if (!full.startsWith(projectDir(p))) return false;
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, 'utf8');
  updateProject(id, {});
  return true;
}

module.exports = {
  STANDARD_DIRS,
  STANDARD_FILES,
  projectDir,
  createProject,
  listProjects,
  findProject,
  updateProject,
  touchOpened,
  openInVSCode,
  cloneProject,
  scanForProjects,
  adoptProject,
  deleteProjectRecord,
  readProjectFile,
  writeProjectFile,
};
