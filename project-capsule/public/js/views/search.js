// Global search view.
window.Views = window.Views || {};

Views.search = async function (root, q) {
  const { h } = UI;
  const query = decodeURIComponent(q || '');
  const input = h('input', { type: 'search', class: 'wp-input', value: query, placeholder: 'Zoek in projecten, prompts, notities…', style: 'max-width:420px' });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') location.hash = '#/search/' + encodeURIComponent(input.value.trim());
  });

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Zoeken'));
  root.appendChild(h('div', { class: 'row', style: 'margin-bottom:12px' }, input));

  if (!query) {
    root.appendChild(h('div', { class: 'notice' }, 'Typ een zoekterm en druk op Enter.'));
    return;
  }

  const { results } = await API.search(query);
  const list = h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, `Resultaten (${results.length})`)),
    h('div', { class: 'inside' },
      results.length === 0
        ? h('div', { class: 'muted' }, `Niets gevonden voor "${query}".`)
        : h('div', {}, ...results.map(renderResult))
    )
  );
  root.appendChild(list);

  function renderResult(r) {
    const badge = h('span', { class: 'pill' }, r.kind);
    let link;
    if (r.kind === 'project' || r.kind === 'file') link = h('a', { href: `#/project/${r.projectId}` }, r.title);
    else if (r.kind === 'idea') link = h('a', { href: '#/ideas' }, r.title);
    else if (r.kind === 'note') link = h('a', { href: '#/notes' }, r.title);
    else link = h('span', {}, r.title);
    return h('div', { style: 'padding:8px 0;border-bottom:1px solid #f0f0f1' },
      h('div', {}, badge, ' ', link),
      h('div', { class: 'small muted' }, r.snippet),
    );
  }
};
