// Project export — streams a zip of the project directory to the response.
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { findProject, projectDir } = require('./projectManager');

function exportProject(id, res) {
  const p = findProject(id);
  if (!p) return res.status(404).json({ error: 'Project niet gevonden' });
  const dir = projectDir(p);
  if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Projectmap niet gevonden' });

  const filename = `${p.clientSlug}__${p.projectSlug}__${new Date().toISOString().slice(0,10)}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => res.status(500).end(String(err.message)));
  archive.pipe(res);
  archive.directory(dir, `${p.clientSlug}/${p.projectSlug}`);
  archive.finalize();
}

module.exports = { exportProject };
