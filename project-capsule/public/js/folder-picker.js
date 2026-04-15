// Folder picker modal — navigates the server's filesystem (which is the user's
// local machine for this single-user tool). Calls `onSelect(absolutePath)` when
// the user confirms a folder.
window.FolderPicker = (() => {
  const LAST_KEY = 'capsule-folder-picker-last';

  function open({ title = 'Kies een map', startPath = null, onSelect } = {}) {
    const { h } = UI;
    const remembered = startPath || localStorage.getItem(LAST_KEY) || '';

    let currentPath = remembered;
    let showHidden = false;
    const pathInput = h('input', { type: 'text', class: 'wp-input', value: '', placeholder: '/Users/jij/Projecten' });
    const breadcrumb = h('div', { class: 'small muted', style: 'padding:6px 0;word-break:break-all' });
    const placesList = h('ul', { style: 'list-style:none;padding:0;margin:0' });
    const folderList = h('div', { style: 'border:1px solid #dcdcde;border-radius:3px;max-height:360px;overflow:auto;background:#fff' });
    const upBtn = h('button', { class: 'button', type: 'button', title: 'Omhoog' }, '↑ Omhoog');
    const refreshBtn = h('button', { class: 'button', type: 'button' }, '↻');
    const hiddenToggle = h('label', { class: 'small' }, h('input', { type: 'checkbox' }), ' Verborgen mappen');
    hiddenToggle.querySelector('input').addEventListener('change', (e) => { showHidden = e.target.checked; load(currentPath); });
    refreshBtn.addEventListener('click', () => load(currentPath));
    upBtn.addEventListener('click', () => { if (upBtn._parent) load(upBtn._parent); });
    pathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); load(pathInput.value); } });

    const selectBtn = h('button', { class: 'button button-primary', type: 'button' }, 'Selecteer deze map');
    selectBtn.addEventListener('click', () => {
      localStorage.setItem(LAST_KEY, currentPath);
      UI.closeModal();
      if (typeof onSelect === 'function') onSelect(currentPath);
    });

    const dialog = h('div', {},
      h('div', { class: 'row', style: 'margin-bottom:8px' },
        upBtn, refreshBtn, pathInput, hiddenToggle,
      ),
      breadcrumb,
      h('div', { class: 'col-2', style: 'grid-template-columns: 160px 1fr' },
        h('div', { class: 'postbox', style: 'margin:0' },
          h('header', {}, h('span', {}, 'Snelkoppelingen')),
          h('div', { class: 'inside', style: 'padding:8px' }, placesList),
        ),
        folderList,
      ),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row-between' },
        h('div', { class: 'small muted' }, 'Dubbelklik om in te duiken. Selecteer onder in de lijst of op de huidige map.'),
        h('div', {}, h('button', { class: 'button', type: 'button', onclick: () => UI.closeModal() }, 'Annuleren'), ' ', selectBtn),
      ),
    );
    UI.openModal(title, dialog);

    // Load quick-places sidebar.
    API.fsPlaces().then((places) => {
      placesList.replaceChildren(...places.map((pl) => h('li', {},
        h('a', {
          href: '#', onclick: (e) => { e.preventDefault(); load(pl.path); },
          style: 'display:block;padding:4px 6px;border-radius:3px;color:#2271b1',
        }, pl.name, h('div', { class: 'small mono muted' }, pl.path)),
      )));
    }).catch(() => {});

    function setBreadcrumb(p) {
      breadcrumb.replaceChildren();
      const parts = p.split(/[\\/]+/).filter(Boolean);
      breadcrumb.appendChild(document.createTextNode(p.startsWith('/') ? '/' : ''));
      let acc = p.startsWith('/') ? '/' : '';
      parts.forEach((part, idx) => {
        acc = (acc && acc !== '/' ? acc + '/' : acc) + part;
        if (idx > 0) breadcrumb.appendChild(document.createTextNode(' / '));
        const link = h('a', { href: '#', onclick: (e) => { e.preventDefault(); load(acc); } }, part);
        breadcrumb.appendChild(link);
      });
    }

    async function load(p) {
      folderList.replaceChildren(h('div', { class: 'muted', style: 'padding:10px' }, 'Laden…'));
      try {
        const data = await API.fsList(p || '', showHidden);
        currentPath = data.path;
        pathInput.value = data.path;
        upBtn._parent = data.parent;
        upBtn.disabled = !data.parent;
        setBreadcrumb(data.path);
        folderList.replaceChildren();
        if (!data.entries.length) {
          folderList.appendChild(h('div', { class: 'muted', style: 'padding:10px' }, 'Geen submappen.'));
        } else {
          const ul = h('ul', { style: 'list-style:none;margin:0;padding:0' });
          data.entries.forEach((ent) => {
            const li = h('li', { style: 'border-bottom:1px solid #f0f0f1' },
              h('a', {
                href: '#', onclick: (e) => { e.preventDefault(); load(ent.path); },
                ondblclick: (e) => { e.preventDefault(); load(ent.path); },
                style: 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;color:#1d2327',
              },
                h('span', {},
                  h('span', { style: 'margin-right:6px' }, '📁'),
                  ent.name,
                  ent.hasCapsule ? h('span', { class: 'pill', style: 'margin-left:6px' }, 'capsule') : null,
                  ent.isGit ? h('span', { class: 'pill', style: 'margin-left:6px;background:#e5e7eb;color:#374151' }, 'git') : null,
                ),
                h('span', { class: 'small muted' }, '→'),
              )
            );
            ul.appendChild(li);
          });
          folderList.appendChild(ul);
        }
      } catch (err) {
        folderList.replaceChildren(h('div', { class: 'notice error', style: 'margin:10px' }, err.message));
      }
    }

    load(remembered || '');
  }
  return { open };
})();
