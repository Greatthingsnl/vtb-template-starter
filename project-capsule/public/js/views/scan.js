// Scan view — discover unregistered project folders.
window.Views = window.Views || {};

Views.scan = async function (root) {
  const { h } = UI;
  root.appendChild(h('h1', { class: 'wp-heading' }, 'Map-scan'));
  const results = h('div');
  const refresh = h('button', { class: 'button', onclick: () => render() }, 'Opnieuw scannen');
  root.appendChild(h('div', { class: 'notice' },
    'Scant de projecten-root op mappen met pad ',
    h('span', { class: 'mono' }, '<klant>/<project>/'),
    ' die nog niet geregistreerd zijn.'));
  root.appendChild(h('div', { class: 'row', style: 'margin-bottom:12px' }, refresh));
  root.appendChild(results);

  async function render() {
    results.replaceChildren(h('p', { class: 'muted' }, 'Scannen…'));
    try {
      const found = await API.scan();
      if (!found.length) {
        results.replaceChildren(h('div', { class: 'postbox' }, h('div', { class: 'inside muted' }, 'Geen nieuwe projectmappen gevonden.')));
        return;
      }
      const tbody = h('tbody');
      for (const f of found) {
        tbody.appendChild(h('tr', {},
          h('td', {}, h('strong', {}, f.projectName), h('div', { class: 'muted small' }, f.clientName)),
          h('td', { class: 'mono small' }, f.dir),
          h('td', {}, f.hasMeta ? '✓ meta gevonden' : '—'),
          h('td', { style: 'text-align:right' },
            h('button', {
              class: 'button small button-primary', onclick: async () => {
                try { await API.adopt(f); UI.showNotice('Toegevoegd.'); render(); }
                catch (e) { UI.error(e); }
              }
            }, 'Toevoegen'),
          ),
        ));
      }
      results.replaceChildren(h('div', { class: 'postbox' },
        h('div', { class: 'inside', style: 'padding:0' },
          h('table', { class: 'wp-list-table' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Project'), h('th', {}, 'Map'), h('th', {}, 'Meta'), h('th', {}, ''))),
            tbody,
          ),
        ),
      ));
    } catch (e) { UI.error(e); }
  }
  render();
};
