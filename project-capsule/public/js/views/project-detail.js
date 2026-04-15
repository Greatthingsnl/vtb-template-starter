// Project detail — tabs: overview, AI, changelog, tasks, links, git.
window.Views = window.Views || {};

Views.projectDetail = async function (root, id) {
  const { h, fmtDate, statusPill } = UI;
  if (!id) { location.hash = '#/projects'; return; }

  let project;
  try { project = await API.project(id); }
  catch (err) { root.appendChild(h('div', { class: 'notice error' }, 'Project niet gevonden.')); return; }

  // header
  const header = h('div', { class: 'row-between', style: 'margin-bottom:12px' },
    h('div', {},
      h('h1', { class: 'wp-heading', style: 'margin:0' }, project.projectName),
      h('div', { class: 'muted' }, project.clientName, ' • ', statusPill(project.status)),
    ),
    h('div', { class: 'row' },
      h('button', {
        class: 'button button-primary', onclick: async () => {
          try { await API.openInVSCode(project.id); UI.showNotice('VS Code wordt geopend…'); }
          catch (e) { UI.error(e); }
        }
      }, 'Open in VS Code'),
      h('button', { class: 'button', onclick: () => openCloneDialog(project) }, 'Clone project'),
      h('a', { class: 'button', href: `/api/projects/${project.id}/export`, target: '_blank' }, 'Export (zip)'),
      h('button', { class: 'button', onclick: () => openContextDialog(project) }, 'AI Context'),
    )
  );
  root.appendChild(header);

  // "verder waar ik was"
  const continueBox = h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Verder waar ik was')),
    h('div', { class: 'inside' },
      h('div', { class: 'kv' },
        h('dt', {}, 'Laatst geopend'),   h('dd', {}, fmtDate(project.lastOpenedAt)),
        h('dt', {}, 'Laatste activiteit'), h('dd', {}, fmtDate(project.lastActivity || project.updatedAt)),
        h('dt', {}, 'Laatste notitie'),  h('dd', {}, project.lastNote || '—'),
        h('dt', {}, 'Laatste prompt'),   h('dd', {}, h('span', { class: 'mono' }, project.lastPrompt || '—')),
      ),
    ),
  );
  root.appendChild(continueBox);

  // Tabs
  const tabs = ['Overzicht', 'AI geheugen', 'Changelog', 'Taken', 'Koppelingen', 'Git info'];
  const tabBar = h('nav', { class: 'nav-tab-wrapper' });
  const tabContent = h('div');
  let active = 0;

  function setTab(i) {
    active = i;
    tabBar.querySelectorAll('a').forEach((a, idx) => a.classList.toggle('nav-tab-active', idx === i));
    tabContent.replaceChildren();
    const r = [
      () => renderOverview(),
      () => renderEditor('ai/prompts.md', 'AI prompts', 'AI context (ai/context.md)', 'ai/context.md'),
      () => renderEditor('changelog/changelog.md', 'Changelog'),
      () => renderEditor('tasks/todo.md', 'Taken'),
      () => renderLinks(),
      () => renderGit(),
    ];
    r[i]();
  }

  tabs.forEach((t, i) => {
    tabBar.appendChild(h('a', { class: 'nav-tab', onclick: (e) => { e.preventDefault(); setTab(i); } }, t));
  });
  root.appendChild(tabBar);
  root.appendChild(tabContent);
  setTab(0);

  // ---------- Tab renderers ----------

  async function renderOverview() {
    const md = await API.readFile(project.id, 'docs/project.md').catch(() => '');
    const readmeMd = await API.readFile(project.id, 'docs/readme.md').catch(() => '');
    tabContent.appendChild(h('div', { class: 'col-2' },
      h('div', { class: 'postbox' },
        h('header', {}, h('span', {}, 'docs/project.md'),
          saveButton('docs/project.md', () => editorProject.value)),
        h('div', { class: 'inside' }, editorProject = h('textarea', { class: 'wp-input', rows: 16 }, md)),
      ),
      h('div', {},
        h('div', { class: 'postbox' },
          h('header', {}, h('span', {}, 'Metadata')),
          h('div', { class: 'inside' }, renderMeta()),
        ),
        h('div', { class: 'postbox' },
          h('header', {}, h('span', {}, 'docs/readme.md'),
            saveButton('docs/readme.md', () => editorReadme.value)),
          h('div', { class: 'inside' }, editorReadme = h('textarea', { class: 'wp-input', rows: 8 }, readmeMd)),
        ),
      ),
    ));
  }
  let editorProject, editorReadme;

  async function renderEditor(file, heading, secondHeading, secondFile) {
    const content = await API.readFile(project.id, file).catch(() => '');
    const ta = h('textarea', { class: 'wp-input', rows: 20 }, content);
    tabContent.appendChild(h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, heading + ' — ' + file), saveButton(file, () => ta.value)),
      h('div', { class: 'inside' }, ta),
    ));
    if (secondFile) {
      const c2 = await API.readFile(project.id, secondFile).catch(() => '');
      const ta2 = h('textarea', { class: 'wp-input', rows: 14 }, c2);
      tabContent.appendChild(h('div', { class: 'postbox' },
        h('header', {}, h('span', {}, secondHeading + ' — ' + secondFile), saveButton(secondFile, () => ta2.value)),
        h('div', { class: 'inside' }, ta2),
      ));
    }
  }

  function saveButton(path, getter) {
    return h('button', {
      class: 'button small', onclick: async () => {
        try { await API.writeFile(project.id, path, getter()); UI.showNotice('Opgeslagen.'); }
        catch (e) { UI.error(e); }
      }
    }, 'Opslaan');
  }

  function renderMeta() {
    const statusSel = h('select', { class: 'wp-input' },
      ...['idee','actief','wacht op klant','onderhoud','afgerond','archief','template','clonebaar']
        .map((s) => h('option', s === project.status ? { value: s, selected: '' } : { value: s }, s))
    );
    const labels = h('input', { type: 'text', class: 'wp-input', value: (project.labels || []).join(', ') });
    const desc = h('textarea', { class: 'wp-input', rows: 4 }, project.description || '');
    const saveBtn = h('button', {
      class: 'button button-primary', onclick: async () => {
        try {
          const upd = await API.update(project.id, {
            status: statusSel.value,
            labels: labels.value.split(',').map((x) => x.trim()).filter(Boolean),
            description: desc.value,
          });
          project = upd; UI.showNotice('Metadata bijgewerkt.');
        } catch (e) { UI.error(e); }
      }
    }, 'Bijwerken');
    return h('div', {},
      h('label', { class: 'stacked' }, 'Status'), statusSel,
      h('div', { class: 'spacer' }),
      h('label', { class: 'stacked' }, 'Labels'), labels,
      h('div', { class: 'spacer' }),
      h('label', { class: 'stacked' }, 'Omschrijving'), desc,
      h('div', { class: 'spacer' }),
      saveBtn,
    );
  }

  async function renderLinks() {
    const L = project.links || {};
    const keys = ['live', 'staging', 'plesk', 'git', 'docs', 'klantinfo'];
    const inputs = {};
    keys.forEach((k) => { inputs[k] = h('input', { type: 'url', class: 'wp-input', placeholder: 'https://…', value: L[k] || '' }); });
    const extras = h('textarea', { class: 'wp-input', rows: 4, placeholder: 'Extra informatie / klantinfo' }, L.notes || '');
    const saveBtn = h('button', {
      class: 'button button-primary', onclick: async () => {
        const links = { ...L, notes: extras.value };
        for (const k of keys) links[k] = inputs[k].value.trim();
        try { project = await API.update(project.id, { links }); UI.showNotice('Koppelingen opgeslagen.'); }
        catch (e) { UI.error(e); }
      }
    }, 'Opslaan');
    const table = h('table', { class: 'form-table' }, h('tbody', {},
      ...keys.map((k) => h('tr', {},
        h('th', {}, k.charAt(0).toUpperCase() + k.slice(1) + ' URL'),
        h('td', {}, inputs[k], L[k] ? h('div', { class: 'small' }, h('a', { href: L[k], target: '_blank' }, 'Openen')) : null),
      )),
      h('tr', {}, h('th', {}, 'Notities'), h('td', {}, extras)),
    ));
    tabContent.appendChild(h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, 'Koppelingen')),
      h('div', { class: 'inside' }, table, h('p', {}, saveBtn)),
    ));
  }

  async function renderGit() {
    const container = h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, 'Git status')),
      h('div', { class: 'inside' }, h('p', { class: 'muted' }, 'Bezig met laden…')),
    );
    tabContent.appendChild(container);
    try {
      const g = await API.gitStatus(project.id);
      const inside = container.querySelector('.inside');
      inside.replaceChildren();
      if (!g.isRepo) {
        inside.appendChild(h('p', {}, 'Dit project is geen Git repository.'));
        return;
      }
      inside.appendChild(h('div', { class: 'kv' },
        h('dt', {}, 'Branch'), h('dd', {}, h('span', { class: 'mono' }, g.branch || '?')),
        h('dt', {}, 'Clean'),  h('dd', {}, g.clean ? 'ja' : 'nee (wijzigingen aanwezig)'),
        h('dt', {}, 'Laatste commit'), h('dd', {}, h('span', { class: 'mono' }, g.lastCommit || '—')),
      ));
      if (g.changed && g.changed.length) {
        inside.appendChild(h('h2', {}, 'Gewijzigde bestanden'));
        inside.appendChild(h('pre', { class: 'code' }, g.changed.join('\n')));
      }
    } catch (e) { UI.error(e); }
  }

  // ---------- Dialogs ----------

  async function openContextDialog(p) {
    const ctx = await API.context(p.id);
    const ta = h('textarea', { class: 'wp-input', rows: 20, readonly: '' }, ctx);
    const copyBtn = h('button', {
      class: 'button button-primary', onclick: async () => {
        await UI.copyToClipboard(ta.value); UI.showNotice('Gekopieerd naar klembord.');
      }
    }, 'Kopieer naar klembord');
    UI.openModal('AI context voor ' + p.projectName, h('div', {},
      h('p', { class: 'muted small' }, 'Plak dit als eerste bericht in je AI chat.'),
      ta, h('div', { class: 'spacer' }), copyBtn,
    ));
  }

  async function openCloneDialog(p) {
    const f = {
      client:  h('input', { type: 'text', class: 'wp-input', value: p.clientName }),
      project: h('input', { type: 'text', class: 'wp-input', value: p.projectName + '-copy' }),
      code:      h('input', { type: 'checkbox', checked: '' }),
      docs:      h('input', { type: 'checkbox', checked: '' }),
      prompts:   h('input', { type: 'checkbox', checked: '' }),
      changelog: h('input', { type: 'checkbox' }),
      tasks:     h('input', { type: 'checkbox' }),
      deploy:    h('input', { type: 'checkbox', checked: '' }),
      gitInit:   h('input', { type: 'checkbox', checked: '' }),
    };
    const submit = h('button', {
      class: 'button button-primary', onclick: async () => {
        try {
          const cl = await API.clone(p.id, {
            clientName:     f.client.value.trim(),
            projectName:    f.project.value.trim(),
            cloneCode:      f.code.checked,
            cloneDocs:      f.docs.checked,
            clonePrompts:   f.prompts.checked,
            cloneChangelog: f.changelog.checked,
            cloneTasks:     f.tasks.checked,
            cloneDeploy:    f.deploy.checked,
            gitInit:        f.gitInit.checked,
          });
          UI.closeModal();
          UI.showNotice('Gekloond.');
          location.hash = `#/project/${cl.id}`;
        } catch (e) { UI.error(e); }
      }
    }, 'Clonen');

    UI.openModal('Clone project', h('div', {},
      h('table', { class: 'form-table' }, h('tbody', {},
        h('tr', {}, h('th', {}, 'Nieuwe klant'),   h('td', {}, f.client)),
        h('tr', {}, h('th', {}, 'Nieuwe project'), h('td', {}, f.project)),
        h('tr', {}, h('th', {}, 'Meenemen'), h('td', {},
          h('label', {}, f.code,      ' code/'),      h('br'),
          h('label', {}, f.docs,      ' docs/'),      h('br'),
          h('label', {}, f.prompts,   ' ai/ (prompts + context)'), h('br'),
          h('label', {}, f.deploy,    ' deploy/'),    h('br'),
          h('label', {}, f.tasks,     ' tasks/'),     h('br'),
          h('label', {}, f.changelog, ' changelog/ (standaard uit)'),
        )),
        h('tr', {}, h('th', {}, 'Git'), h('td', {}, h('label', {}, f.gitInit, ' Nieuwe Git repo aanmaken'))),
      )),
      submit,
    ));
  }
};
