// Lightweight JSON-file-backed storage. No locking — v1 is single-user.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(name, fallback) {
  const file = path.join(DATA_DIR, name);
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function writeJSON(name, data) {
  const file = path.join(DATA_DIR, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function getConfig() {
  return readJSON('config.json', { port: 4321, root: './klanten', vscode: 'code' });
}

function getProjectsRoot() {
  const cfg = getConfig();
  const root = cfg.root || './klanten';
  return path.isAbsolute(root) ? root : path.resolve(__dirname, '..', root);
}

module.exports = {
  DATA_DIR,
  readJSON,
  writeJSON,
  getConfig,
  getProjectsRoot,
};
