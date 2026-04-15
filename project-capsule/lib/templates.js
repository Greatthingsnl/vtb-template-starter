// Project templates. Each template describes the directory scaffold and seed files.
// Templates live in /templates/<name> as raw files; this file provides metadata + helpers.

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const TEMPLATES = [
  { id: 'empty',             name: 'Leeg project',      description: 'Kale basisstructuur zonder extra opinions.' },
  { id: 'wordpress-plugin',  name: 'WordPress plugin',  description: 'Basis voor een WordPress plugin.' },
  { id: 'woocommerce',       name: 'WooCommerce',       description: 'Basis voor een WooCommerce extensie / shop.' },
  { id: 'api-tool',          name: 'API tool',          description: 'Node.js basis voor een API / CLI tool.' },
  { id: 'ai-tool',           name: 'AI tool',           description: 'Opzet voor een AI-geoptimaliseerd project.' },
];

function listTemplates() {
  return TEMPLATES.map((t) => ({ ...t, hasFiles: fs.existsSync(path.join(TEMPLATES_DIR, t.id)) }));
}

function getTemplateDir(id) {
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return null;
  const dir = path.join(TEMPLATES_DIR, template.id);
  return fs.existsSync(dir) ? dir : null;
}

module.exports = { TEMPLATES, listTemplates, getTemplateDir, TEMPLATES_DIR };
