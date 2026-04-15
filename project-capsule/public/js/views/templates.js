// Templates overview.
window.Views = window.Views || {};

Views.templates = async function (root) {
  const { h } = UI;
  const tpls = await API.templates();

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Templates'));
  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Beschikbaar')),
    h('div', { class: 'inside', style: 'padding:0' },
      h('table', { class: 'wp-list-table' },
        h('thead', {}, h('tr', {}, h('th', {}, 'ID'), h('th', {}, 'Naam'), h('th', {}, 'Beschrijving'), h('th', {}, 'Bestanden'))),
        h('tbody', {}, ...tpls.map((t) => h('tr', {},
          h('td', {}, h('span', { class: 'mono' }, t.id)),
          h('td', {}, t.name),
          h('td', { class: 'muted small' }, t.description),
          h('td', {}, t.hasFiles ? '✓ ja' : '—'),
        )))
      )
    )
  ));
  root.appendChild(h('p', { class: 'muted small' },
    'Templates worden gekopieerd vanuit de map ',
    h('span', { class: 'mono' }, 'project-capsule/templates/<id>/'),
    ' wanneer je een nieuw project aanmaakt. Voeg vrijelijk eigen bestanden toe.'));
};
