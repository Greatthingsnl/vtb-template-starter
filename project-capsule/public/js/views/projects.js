// Projects list.
window.Views = window.Views || {};

Views.projects = async function (root) {
  const { h, fmtDate, statusPill } = UI;
  const projects = await API.projects();
  projects.sort((a, b) => String(b.lastActivity || '').localeCompare(String(a.lastActivity || '')));

  const filterInput = h('input', { type: 'search', class: 'wp-input', placeholder: 'Filter projecten…', style: 'max-width:260px' });
  const statusSel = h('select', { class: 'wp-input', style: 'max-width:160px' },
    h('option', { value: '' }, 'Alle statussen'),
    ...['idee','actief','wacht op klant','onderhoud','afgerond','archief','template','clonebaar'].map((s) => h('option', { value: s }, s)),
  );

  const tbody = h('tbody');

  function render() {
    const q = filterInput.value.trim().toLowerCase();
    const status = statusSel.value;
    tbody.replaceChildren();
    const matches = projects.filter((p) => {
      if (status && p.status !== status) return false;
      if (q && !(`${p.clientName} ${p.projectName} ${(p.labels||[]).join(' ')}`).toLowerCase().includes(q)) return false;
      return true;
    });
    if (!matches.length) {
      tbody.appendChild(h('tr', {}, h('td', { colspan: 5, class: 'muted' }, 'Geen projecten gevonden.')));
      return;
    }
    for (const p of matches) {
      tbody.appendChild(h('tr', {},
        h('td', {},
          h('a', { href: `#/project/${p.id}` }, p.projectName),
          h('div', { class: 'muted small' }, p.clientName),
        ),
        h('td', {}, statusPill(p.status)),
        h('td', {}, fmtDate(p.lastActivity)),
        h('td', { class: 'small muted' }, (p.labels || []).join(', ') || '—'),
        h('td', { style: 'text-align:right' },
          h('button', {
            class: 'button small', onclick: async () => {
              try { await API.openInVSCode(p.id); UI.showNotice('VS Code wordt geopend…'); }
              catch (e) { UI.error(e); }
            }
          }, 'VS Code'),
          ' ',
          h('a', { class: 'button small', href: `#/project/${p.id}` }, 'Open'),
        ),
      ));
    }
  }

  filterInput.addEventListener('input', render);
  statusSel.addEventListener('change', render);

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Projecten'));
  root.appendChild(h('div', { class: 'row', style: 'margin-bottom:12px' },
    filterInput, statusSel,
    h('a', { class: 'button button-primary', href: '#/new', style: 'margin-left:auto' }, '+ Nieuw project'),
  ));

  root.appendChild(h('div', { class: 'postbox' },
    h('div', { class: 'inside', style: 'padding:0' },
      h('table', { class: 'wp-list-table' },
        h('thead', {}, h('tr', {},
          h('th', {}, 'Project'), h('th', {}, 'Status'), h('th', {}, 'Laatste activiteit'),
          h('th', {}, 'Labels'), h('th', {}, ''),
        )),
        tbody,
      )
    )
  ));

  render();
};
