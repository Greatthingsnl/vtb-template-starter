// Attach an arbitrary existing folder as a project.
window.Views = window.Views || {};

Views.attach = async function (root) {
  const { h } = UI;

  const f = {
    path:    h('input', { type: 'text', class: 'wp-input', placeholder: 'Kies een map of typ een absoluut pad' }),
    client:  h('input', { type: 'text', class: 'wp-input', placeholder: 'Bijv. Intern of Klantnaam', value: 'Intern' }),
    project: h('input', { type: 'text', class: 'wp-input', placeholder: 'Projectnaam (auto)' }),
    status: h('select', { class: 'wp-input' },
      ...['idee','actief','wacht op klant','onderhoud','afgerond','archief','template','clonebaar']
        .map((s) => h('option', s === 'actief' ? { value: s, selected: '' } : { value: s }, s))
    ),
    labels: h('input', { type: 'text', class: 'wp-input', placeholder: 'comma, gescheiden' }),
    description: h('textarea', { class: 'wp-input', rows: 3, placeholder: 'Korte omschrijving (optioneel)' }),
  };

  const browseBtn = h('button', {
    class: 'button', type: 'button', onclick: () => {
      FolderPicker.open({
        title: 'Kies de projectmap',
        onSelect: (p) => {
          f.path.value = p;
          // Auto-fill project name from folder basename if empty.
          if (!f.project.value.trim()) {
            const base = p.split(/[\\/]+/).filter(Boolean).pop() || '';
            f.project.value = base;
          }
        },
      });
    }
  }, '📁 Bladeren…');

  const submit = h('button', { class: 'button button-primary', type: 'submit' }, 'Koppel als project');
  const openAfter = h('input', { type: 'checkbox', checked: '' });

  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (!f.path.value.trim()) return UI.showNotice('Kies eerst een map.', 'warn');
      submit.disabled = true;
      try {
        const p = await API.attach({
          path:        f.path.value.trim(),
          clientName:  f.client.value.trim() || 'Intern',
          projectName: f.project.value.trim(),
          status:      f.status.value,
          labels:      f.labels.value.split(',').map((x) => x.trim()).filter(Boolean),
          description: f.description.value.trim(),
        });
        if (openAfter.checked) { try { await API.openInVSCode(p.id); } catch {} }
        UI.showNotice(`Map gekoppeld als "${p.projectName}"`, 'success');
        location.hash = `#/project/${p.id}`;
      } catch (err) { UI.error(err); submit.disabled = false; }
    },
  },
    h('table', { class: 'form-table' }, h('tbody', {},
      h('tr', {}, h('th', {}, 'Map op je computer'), h('td', {},
        h('div', { class: 'row' }, f.path, browseBtn),
        h('div', { class: 'small muted', style: 'margin-top:4px' },
          'De map blijft staan waar hij is. We voegen alleen een ',
          h('span', { class: 'mono' }, '.capsule/'), ' subfolder toe voor prompts, context, changelog en taken.'),
      )),
      h('tr', {}, h('th', {}, 'Projectnaam'), h('td', {}, f.project)),
      h('tr', {}, h('th', {}, 'Klant'),       h('td', {}, f.client)),
      h('tr', {}, h('th', {}, 'Status'),      h('td', {}, f.status)),
      h('tr', {}, h('th', {}, 'Labels'),      h('td', {}, f.labels)),
      h('tr', {}, h('th', {}, 'Omschrijving'),h('td', {}, f.description)),
      h('tr', {}, h('th', {}, 'Opties'),      h('td', {},
        h('label', {}, openAfter, ' Open in VS Code na koppelen'),
      )),
    )),
    h('p', {}, submit, ' ', h('a', { class: 'button', href: '#/projects' }, 'Annuleren')),
  );

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Koppel bestaande map'));
  root.appendChild(h('div', { class: 'notice' },
    'Gebruik dit om elke map op je Mac als project te registreren — ook buiten de projecten-root. ',
    'Je kunt ook beginnen vanuit ', h('a', { href: '#/new' }, 'Nieuw project'), ' als je een verse map wilt laten genereren.',
  ));
  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Projectgegevens')),
    h('div', { class: 'inside' }, form),
  ));
};
