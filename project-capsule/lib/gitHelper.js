// Thin wrapper around the `git` CLI. Never throws; returns { ok, ... }.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cwd, args) {
  try {
    const out = execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: out.trim() };
  } catch (err) {
    return { ok: false, error: err.stderr ? String(err.stderr).trim() : String(err.message) };
  }
}

function init(cwd) {
  return run(cwd, ['init', '-b', 'main']);
}

function isRepo(cwd) {
  return fs.existsSync(path.join(cwd, '.git'));
}

function status(cwd) {
  if (!isRepo(cwd)) return { isRepo: false };
  const branch = run(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const short = run(cwd, ['status', '--short']);
  const lastCommit = run(cwd, ['log', '-1', '--pretty=%h %s (%cr)']);
  const changed = short.ok
    ? short.out.split('\n').map((l) => l.trim()).filter(Boolean)
    : [];
  return {
    isRepo: true,
    branch: branch.ok ? branch.out : null,
    clean: short.ok && short.out === '',
    changed,
    lastCommit: lastCommit.ok ? lastCommit.out : null,
  };
}

function addAllAndCommit(cwd, message) {
  const a = run(cwd, ['add', '-A']);
  if (!a.ok) return a;
  return run(cwd, ['commit', '-m', message]);
}

module.exports = { run, init, isRepo, status, addAllAndCommit };
