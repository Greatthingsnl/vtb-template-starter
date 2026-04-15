// Project Capsule — local Express server.
// Binds on 0.0.0.0 so the dashboard is reachable via Tailscale (tailnet-only),
// in addition to localhost on the host machine.

const express = require('express');
const fs = require('fs');
const path = require('path');

const { getConfig, getProjectsRoot, readJSON, writeJSON } = require('./lib/storage');
const pm = require('./lib/projectManager');
const git = require('./lib/gitHelper');
const { listTemplates } = require('./lib/templates');
const { search } = require('./lib/search');
const { buildContext } = require('./lib/contextBuilder');
const { exportProject } = require('./lib/backup');
const devices = require('./lib/devices');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Config ----------
app.get('/api/config', (req, res) => {
  const cfg = getConfig();
  res.json({ ...cfg, rootAbsolute: getProjectsRoot() });
});

// ---------- Templates ----------
app.get('/api/templates', (req, res) => res.json(listTemplates()));

// ---------- Projects ----------
app.get('/api/projects', (req, res) => res.json(pm.listProjects()));

app.post('/api/projects', (req, res) => {
  try {
    const p = pm.createProject(req.body || {});
    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  const p = pm.findProject(req.params.id);
  if (!p) return res.status(404).json({ error: 'Project niet gevonden' });
  res.json(p);
});

app.put('/api/projects/:id', (req, res) => {
  const p = pm.updateProject(req.params.id, req.body || {});
  if (!p) return res.status(404).json({ error: 'Project niet gevonden' });
  res.json(p);
});

app.delete('/api/projects/:id', (req, res) => {
  pm.deleteProjectRecord(req.params.id);
  res.json({ ok: true });
});

app.post('/api/projects/:id/open-vscode', (req, res) => {
  const result = pm.openInVSCode(req.params.id);
  if (!result.ok) return res.status(500).json(result);
  res.json(result);
});

app.post('/api/projects/:id/touch', (req, res) => {
  const p = pm.touchOpened(req.params.id, req.body || {});
  if (!p) return res.status(404).json({ error: 'Project niet gevonden' });
  res.json(p);
});

app.post('/api/projects/:id/clone', (req, res) => {
  try {
    const cloned = pm.cloneProject(req.params.id, req.body || {});
    res.status(201).json(cloned);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Project markdown file I/O (only for the known standard files, for safety).
const ALLOWED_FILES = new Set([
  'docs/project.md',
  'docs/readme.md',
  'ai/prompts.md',
  'ai/context.md',
  'tasks/todo.md',
  'changelog/changelog.md',
  'deploy/deploy.md',
]);

app.get('/api/projects/:id/file', (req, res) => {
  const rel = String(req.query.path || '');
  if (!ALLOWED_FILES.has(rel)) return res.status(400).json({ error: 'Bestand niet toegestaan' });
  const content = pm.readProjectFile(req.params.id, rel);
  if (content === null) return res.status(404).json({ error: 'Project niet gevonden' });
  res.type('text/markdown').send(content);
});

app.put('/api/projects/:id/file', (req, res) => {
  const rel = String(req.query.path || '');
  if (!ALLOWED_FILES.has(rel)) return res.status(400).json({ error: 'Bestand niet toegestaan' });
  const body = req.body || {};
  const ok = pm.writeProjectFile(req.params.id, rel, body.content || '');
  if (!ok) return res.status(404).json({ error: 'Project niet gevonden' });
  res.json({ ok: true });
});

app.get('/api/projects/:id/git', (req, res) => {
  const p = pm.findProject(req.params.id);
  if (!p) return res.status(404).json({ error: 'Project niet gevonden' });
  res.json(git.status(pm.projectDir(p)));
});

app.get('/api/projects/:id/context', (req, res) => {
  const ctx = buildContext(req.params.id, { extra: req.query.extra || '' });
  if (!ctx) return res.status(404).json({ error: 'Project niet gevonden' });
  res.type('text/markdown').send(ctx);
});

app.get('/api/projects/:id/export', (req, res) => exportProject(req.params.id, res));

// ---------- Scan / adopt ----------
app.get('/api/scan', (req, res) => res.json(pm.scanForProjects()));
app.post('/api/scan/adopt', (req, res) => {
  try {
    res.status(201).json(pm.adoptProject(req.body || {}));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Ideas ----------
app.get('/api/ideas', (req, res) => res.json(readJSON('ideas.json', [])));
app.post('/api/ideas', (req, res) => {
  const ideas = readJSON('ideas.json', []);
  const idea = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: (req.body && req.body.title) || 'Naamloos idee',
    body:  (req.body && req.body.body)  || '',
    createdAt: new Date().toISOString(),
  };
  ideas.unshift(idea);
  writeJSON('ideas.json', ideas);
  res.status(201).json(idea);
});
app.delete('/api/ideas/:id', (req, res) => {
  writeJSON('ideas.json', readJSON('ideas.json', []).filter((i) => i.id !== req.params.id));
  res.json({ ok: true });
});
app.post('/api/ideas/:id/convert', (req, res) => {
  const ideas = readJSON('ideas.json', []);
  const idea = ideas.find((i) => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idee niet gevonden' });
  try {
    const project = pm.createProject({
      clientName: (req.body && req.body.clientName) || 'Intern',
      projectName: (req.body && req.body.projectName) || idea.title,
      description: idea.body,
      templateId: (req.body && req.body.templateId) || 'empty',
      status: 'idee',
      gitInit: !!(req.body && req.body.gitInit),
    });
    writeJSON('ideas.json', ideas.filter((i) => i.id !== idea.id));
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Notes ----------
app.get('/api/notes', (req, res) => res.json(readJSON('notes.json', [])));
app.post('/api/notes', (req, res) => {
  const notes = readJSON('notes.json', []);
  const note = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: (req.body && req.body.title) || '',
    body:  (req.body && req.body.body)  || '',
    createdAt: new Date().toISOString(),
  };
  notes.unshift(note);
  writeJSON('notes.json', notes);
  res.status(201).json(note);
});
app.put('/api/notes/:id', (req, res) => {
  const notes = readJSON('notes.json', []);
  const i = notes.findIndex((n) => n.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Notitie niet gevonden' });
  notes[i] = { ...notes[i], ...req.body, id: notes[i].id };
  writeJSON('notes.json', notes);
  res.json(notes[i]);
});
app.delete('/api/notes/:id', (req, res) => {
  writeJSON('notes.json', readJSON('notes.json', []).filter((n) => n.id !== req.params.id));
  res.json({ ok: true });
});

// ---------- Search ----------
app.get('/api/search', (req, res) => res.json(search(req.query.q || '')));

// ---------- Devices (multi-machine / Tailscale) ----------
app.get('/api/devices',         (req, res) => res.json(devices.listDevices()));
app.post('/api/devices',        (req, res) => res.status(201).json(devices.addDevice(req.body || {})));
app.put('/api/devices/:id',     (req, res) => {
  const d = devices.updateDevice(req.params.id, req.body || {});
  if (!d) return res.status(404).json({ error: 'Device niet gevonden' });
  res.json(d);
});
app.delete('/api/devices/:id',  (req, res) => { devices.removeDevice(req.params.id); res.json({ ok: true }); });
app.post('/api/devices/:id/ping', (req, res) => {
  const d = devices.markSeen(req.params.id);
  if (!d) return res.status(404).json({ error: 'Device niet gevonden' });
  res.json(d);
});

// Health / ping for Tailscale / remote checks.
app.get('/api/health', (req, res) => res.json({
  ok: true,
  service: 'project-capsule',
  time: new Date().toISOString(),
  host: require('os').hostname(),
}));

// ---------- Static frontend ----------
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ---------- Start ----------
const { port } = getConfig();
const HOST = '0.0.0.0'; // bind all interfaces so Tailscale / LAN can reach it
app.listen(port, HOST, () => {
  console.log(`🪶  Project Capsule draait op http://localhost:${port}`);
  console.log(`    Projecten-root: ${getProjectsRoot()}`);
  console.log(`    Extern bereikbaar via je tailnet (bijv. http://<mac-mini>.tail-XXXX.ts.net:${port}).`);
});
