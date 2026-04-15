// Idea inbox + quick-add modal.
window.Views = window.Views || {};

Views.ideas = async function (root) {
  const { h, fmtDate } = UI;
  const ideas = await API.ideas();

  const title = h('input', { type: 'text', class: 'wp-input', placeholder: 'Titel' });
  const body  = h('textarea', { class: 'wp-input', rows: 3, placeholder: 'Korte beschrijving' });
  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (!title.value.trim()) return;
      try {
        await API.addIdea({ title: title.value.trim(), body: body.value.trim() });
        UI.showNotice('Idee opgeslagen.');
        Views.ideas(root);
      } catch (err) { UI.error(err); }
    }
  },
    h('label', { class: 'stacked' }, 'Titel'), title,
    h('div', { class: 'spacer' }),
    h('label', { class: 'stacked' }, 'Beschrijving'), body,
    h('div', { class: 'spacer' }),
    h('button', { class: 'button button-primary', type: 'submit' }, '+ Idee toevoegen'),
  );

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Idee-inbox'));
  root.appendChild(h('div', { class: 'col-2' },
    h('div', {},
      h('div', { class: 'postbox' },
        h('header', {}, h('span', {}, 'Ideeën')),
        h('div', { class: 'inside', style: 'padding:0' },
          h('table', { class: 'wp-list-table' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Titel'), h('th', {}, 'Datum'), h('th', {}, ''))),
            h('tbody', {},
              ...(ideas.length ? ideas.map((i) => h('tr', {},
                h('td', {},
                  h('strong', {}, i.title),
                  i.body ? h('div', { class: 'muted small' }, i.body) : null,
                ),
                h('td', { class: 'small muted' }, fmtDate(i.createdAt)),
                h('td', { style: 'text-align:right' },
                  h('button', { class: 'button small', onclick: () => convert(i) }, '→ Project'),
                  ' ',
                  h('button', {
                    class: 'button small button-danger', onclick: async () => {
                      if (!confirm('Idee verwijderen?')) return;
                      await API.removeIdea(i.id); Views.ideas(root);
                    }
                  }, 'Verwijder'),
                ),
              )) : [h('tr', {}, h('td', { colspan: 3, class: 'muted' }, 'Nog geen ideeën.'))])
            )
          )
        )
      )
    ),
    h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, 'Snel idee')),
      h('div', { class: 'inside' }, form),
    ),
  ));

  async function convert(idea) {
    const templates = await API.templates();
    const client = UI.h('input', { type: 'text', class: 'wp-input', value: 'Intern' });
    const project = UI.h('input', { type: 'text', class: 'wp-input', value: idea.title });
    const tpl = UI.h('select', { class: 'wp-input' }, ...templates.map((t) => UI.h('option', { value: t.id }, t.name)));
    const gitInit = UI.h('input', { type: 'checkbox', checked: '' });
    const btn = UI.h('button', {
      class: 'button button-primary', onclick: async () => {
        try {
          const p = await API.convertIdea(idea.id, {
            clientName: client.value.trim(),
            projectName: project.value.trim(),
            templateId: tpl.value,
            gitInit: gitInit.checked,
          });
          UI.closeModal(); UI.showNotice('Idee omgezet naar project.');
          location.hash = `#/project/${p.id}`;
        } catch (e) { UI.error(e); }
      }
    }, 'Omzetten');
    UI.openModal('Idee → project', UI.h('div', {},
      UI.h('table', { class: 'form-table' }, UI.h('tbody', {},
        UI.h('tr', {}, UI.h('th', {}, 'Klant'), UI.h('td', {}, client)),
        UI.h('tr', {}, UI.h('th', {}, 'Project'), UI.h('td', {}, project)),
        UI.h('tr', {}, UI.h('th', {}, 'Template'), UI.h('td', {}, tpl)),
        UI.h('tr', {}, UI.h('th', {}, 'Git'), UI.h('td', {}, UI.h('label', {}, gitInit, ' Git init'))),
      )),
      btn,
    ));
  }
};

Views.quickIdea = function () {
  const title = UI.h('input', { type: 'text', class: 'wp-input', placeholder: 'Titel' });
  const body  = UI.h('textarea', { class: 'wp-input', rows: 3, placeholder: 'Korte tekst (optioneel)' });
  const save  = UI.h('button', {
    class: 'button button-primary', onclick: async () => {
      if (!title.value.trim()) return UI.showNotice('Titel is verplicht.', 'warn');
      try { await API.addIdea({ title: title.value.trim(), body: body.value.trim() }); UI.closeModal(); UI.showNotice('Idee opgeslagen.'); }
      catch (e) { UI.error(e); }
    }
  }, 'Opslaan');
  UI.openModal('Snel idee', UI.h('div', {}, title, UI.h('div', { class: 'spacer' }), body, UI.h('div', { class: 'spacer' }), save));
  setTimeout(() => title.focus(), 50);
};
