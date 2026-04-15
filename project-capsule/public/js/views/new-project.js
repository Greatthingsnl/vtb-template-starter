// New Project form.
window.Views = window.Views || {};

Views.newProject = async function (root) {
  const { h } = UI;
  const templates = await API.templates();

  const f = {
    client: h('input', { type: 'text', class: 'wp-input', placeholder: 'Bijv. Intern of Klantnaam' }),
    project: h('input', { type: 'text', class: 'wp-input', placeholder: 'Projectnaam' }),
    template: h('select', { class: 'wp-input' }, ...templates.map((t) => h('option', { value: t.id }, t.name))),
    status: h('select', { class: 'wp-input' },
      ...['idee','actief','wacht op klant','onderhoud','afgerond','archief','template','clonebaar']
        .map((s) => h('option', { value: s }, s))
    ),
    labels: h('input', { type: 'text', class: 'wp-input', placeholder: 'comma, gescheiden' }),
    description: h('textarea', { class: 'wp-input', rows: 4, placeholder: 'Korte omschrijving' }),
    gitInit: h('input', { type: 'checkbox', checked: '' }),
  };

  const submit = h('button', { class: 'button button-primary', type: 'submit' }, 'Project aanmaken');
  const openAfter = h('input', { type: 'checkbox', checked: '' });

  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (!f.client.value.trim() || !f.project.value.trim()) {
        UI.showNotice('Klant en projectnaam zijn verplicht.', 'warn'); return;
      }
      submit.disabled = true;
      try {
        const p = await API.create({
          clientName:  f.client.value.trim(),
          projectName: f.project.value.trim(),
          templateId:  f.template.value,
          status:      f.status.value,
          labels:      f.labels.value.split(',').map((x) => x.trim()).filter(Boolean),
          description: f.description.value.trim(),
          gitInit:     f.gitInit.checked,
        });
        if (openAfter.checked) { try { await API.openInVSCode(p.id); } catch {} }
        UI.showNotice(`Project "${p.projectName}" aangemaakt`, 'success');
        location.hash = `#/project/${p.id}`;
      } catch (err) { UI.error(err); submit.disabled = false; }
    },
  },
    h('table', { class: 'form-table' },
      h('tbody', {},
        h('tr', {}, h('th', {}, 'Klantnaam'),   h('td', {}, f.client)),
        h('tr', {}, h('th', {}, 'Projectnaam'), h('td', {}, f.project)),
        h('tr', {}, h('th', {}, 'Template'),    h('td', {}, f.template)),
        h('tr', {}, h('th', {}, 'Status'),      h('td', {}, f.status)),
        h('tr', {}, h('th', {}, 'Labels'),      h('td', {}, f.labels)),
        h('tr', {}, h('th', {}, 'Omschrijving'),h('td', {}, f.description)),
        h('tr', {}, h('th', {}, 'Opties'), h('td', {},
          h('label', {}, f.gitInit, ' Git init + eerste commit'),
          h('br'),
          h('label', {}, openAfter, ' Open in VS Code na aanmaken'),
        )),
      )
    ),
    h('p', {}, submit, ' ', h('a', { class: 'button', href: '#/projects' }, 'Annuleren')),
  );

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Nieuw project'));
  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Projectgegevens')),
    h('div', { class: 'inside' }, form),
  ));
};
