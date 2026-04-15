// Global search across projects (metadata + markdown files), ideas, notes.
const fs = require('fs');
const path = require('path');
const { listProjects, projectDir } = require('./projectManager');
const { readJSON } = require('./storage');

const SEARCHABLE_FILES = [
  'docs/project.md',
  'docs/readme.md',
  'ai/prompts.md',
  'ai/context.md',
  'tasks/todo.md',
  'changelog/changelog.md',
  'deploy/deploy.md',
];

function makeSnippet(text, q, pad = 60) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text.slice(0, pad * 2);
  const start = Math.max(0, idx - pad);
  const end = Math.min(text.length, idx + q.length + pad);
  return (start > 0 ? '…' : '') + text.slice(start, end).replace(/\s+/g, ' ') + (end < text.length ? '…' : '');
}

function search(q) {
  const query = String(q || '').trim();
  if (!query) return { query: '', results: [] };
  const needle = query.toLowerCase();
  const results = [];

  for (const p of listProjects()) {
    const haystack = [p.projectName, p.clientName, p.description, p.status, (p.labels || []).join(' ')]
      .filter(Boolean).join(' ');
    if (haystack.toLowerCase().includes(needle)) {
      results.push({
        kind: 'project',
        projectId: p.id,
        title: `${p.clientName} / ${p.projectName}`,
        snippet: makeSnippet(haystack, query),
      });
    }
    const dir = projectDir(p);
    for (const rel of SEARCHABLE_FILES) {
      try {
        const content = fs.readFileSync(path.join(dir, rel), 'utf8');
        if (content.toLowerCase().includes(needle)) {
          results.push({
            kind: 'file',
            projectId: p.id,
            title: `${p.clientName} / ${p.projectName} — ${rel}`,
            file: rel,
            snippet: makeSnippet(content, query),
          });
        }
      } catch {}
    }
  }

  for (const idea of readJSON('ideas.json', [])) {
    const hay = `${idea.title} ${idea.body || ''}`;
    if (hay.toLowerCase().includes(needle)) {
      results.push({
        kind: 'idea',
        ideaId: idea.id,
        title: idea.title,
        snippet: makeSnippet(hay, query),
      });
    }
  }

  for (const note of readJSON('notes.json', [])) {
    const hay = `${note.title} ${note.body || ''}`;
    if (hay.toLowerCase().includes(needle)) {
      results.push({
        kind: 'note',
        noteId: note.id,
        title: note.title || '(zonder titel)',
        snippet: makeSnippet(hay, query),
      });
    }
  }

  return { query, results };
}

module.exports = { search };
