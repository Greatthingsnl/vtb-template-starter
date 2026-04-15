// Global notes (not project-bound).
window.Views = window.Views || {};

Views.notes = async function (root) {
  const { h, fmtDate } = UI;
  const notes = await API.notes();

  const title = h('input', { type: 'text', class: 'wp-input', placeholder: 'Titel (optioneel)' });
  const body  = h('textarea', { class: 'wp-input', rows: 4, placeholder: 'Notitie…' });
  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (!title.value.trim() && !body.value.trim()) return;
      try { await API.addNote({ title: title.value.trim(), body: body.value.trim() }); Views.notes(root); }
      catch (err) { UI.error(err); }
    }
  },
    title, h('div', { class: 'spacer' }), body, h('div', { class: 'spacer' }),
    h('button', { class: 'button button-primary', type: 'submit' }, '+ Notitie toevoegen'),
  );

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Notities'));
  root.appendChild(h('div', { class: 'col-2' },
    h('div', {},
      ...(notes.length ? notes.map((n) => h('div', { class: 'postbox' },
        h('header', {},
          h('span', {}, n.title || '(zonder titel)'),
          h('span', { class: 'small muted' }, fmtDate(n.createdAt),
            ' • ',
            h('a', { href: '#', onclick: async (e) => {
              e.preventDefault();
              if (!confirm('Notitie verwijderen?')) return;
              await API.removeNote(n.id); Views.notes(root);
            } }, 'verwijder'),
          ),
        ),
        h('div', { class: 'inside' }, h('pre', { class: 'code', style: 'background:#fff;border:0;padding:0' }, n.body || '')),
      )) : [h('div', { class: 'postbox' }, h('div', { class: 'inside muted' }, 'Geen notities.'))])
    ),
    h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, 'Nieuwe notitie')),
      h('div', { class: 'inside' }, form),
    ),
  ));
};
