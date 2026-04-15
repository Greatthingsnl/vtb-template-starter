// Settings — choose projects-root folder, VS Code command, port.
window.Views = window.Views || {};

Views.settings = async function (root) {
  const { h } = UI;
  const cfg = await API.config();

  const rootInput = h('input', { type: 'text', class: 'wp-input', value: cfg.root, placeholder: '~/projecten of /Users/jij/Projecten' });
  const codeInput = h('input', { type: 'text', class: 'wp-input', value: cfg.vscode, placeholder: 'code' });
  const portInput = h('input', { type: 'number', class: 'wp-input', value: cfg.port, min: 1, max: 65535 });

  const absLine = h('div', { class: 'small muted' }, 'Absoluut pad: ', h('span', { class: 'mono' }, cfg.rootAbsolute));
  const statusLine = h('div', { class: 'small' });

  async function refreshStatus() {
    try {
      const s = await API.ensureRoot(false);
      if (s.exists && s.isDir) {
        statusLine.className = 'small'; statusLine.style.color = '#00a32a';
        statusLine.textContent = '✓ Map bestaat en is bruikbaar (' + s.root + ').';
      } else {
        statusLine.className = 'small'; statusLine.style.color = '#d63638';
        statusLine.textContent = '⚠ Map bestaat nog niet (' + s.root + ').';
      }
    } catch (e) { statusLine.textContent = e.message; }
  }

  const checkBtn = h('button', { class: 'button', type: 'button', onclick: refreshStatus }, 'Pad controleren');
  const createBtn = h('button', {
    class: 'button', type: 'button', onclick: async () => {
      try {
        const s = await API.ensureRoot(true);
        if (s.created) UI.showNotice('Map aangemaakt: ' + s.root, 'success');
        else if (s.exists) UI.showNotice('Map bestond al.', 'success');
        refreshStatus();
      } catch (e) { UI.error(e); }
    }
  }, 'Map aanmaken');

  const saveBtn = h('button', {
    class: 'button button-primary', type: 'submit',
  }, 'Instellingen opslaan');

  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        const next = await API.updateConfig({
          root:   rootInput.value,
          vscode: codeInput.value,
          port:   Number(portInput.value),
        });
        UI.showNotice(
          'Opgeslagen.' + (next.restartNeeded ? ' ⚠ Herstart de server om de nieuwe poort actief te maken.' : ''),
          next.restartNeeded ? 'warn' : 'success',
          next.restartNeeded ? 8000 : 3000,
        );
        // refresh absolute path display
        absLine.replaceChildren(document.createTextNode('Absoluut pad: '), h('span', { class: 'mono' }, next.rootAbsolute));
        refreshStatus();
      } catch (err) { UI.error(err); }
    }
  },
    h('table', { class: 'form-table' }, h('tbody', {},
      h('tr', {}, h('th', {}, 'Projecten-root'), h('td', {},
        rootInput, absLine, h('div', { class: 'spacer' }),
        h('div', { class: 'row' }, checkBtn, createBtn, statusLine),
        h('div', { class: 'small muted', style: 'margin-top:6px' },
          'Wijs hier naar de map waarin je klanten-submappen leven, bijv. ',
          h('span', { class: 'mono' }, '~/Projecten'), ' of ',
          h('span', { class: 'mono' }, '/Users/jij/Sites'),
          '. Structuur: ', h('span', { class: 'mono' }, '<root>/<klant>/<project>/'), '.',
        ),
      )),
      h('tr', {}, h('th', {}, 'VS Code commando'), h('td', {},
        codeInput,
        h('div', { class: 'small muted' },
          'Standaard ', h('span', { class: 'mono' }, 'code'), ' (installeer via VS Code → ',
          h('em', {}, 'Shell Command: Install \'code\' command in PATH'), ').',
        ),
      )),
      h('tr', {}, h('th', {}, 'Poort'), h('td', {},
        portInput,
        h('div', { class: 'small muted' }, 'Wijziging vereist herstart van de server (',
          h('span', { class: 'mono' }, 'npm start'), ').'),
      )),
    )),
    h('p', {}, saveBtn,
      ' ', h('a', { class: 'button', href: '#/scan' }, 'Scan map na opslaan →'),
    ),
  );

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Instellingen'));
  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Lokale configuratie')),
    h('div', { class: 'inside' }, form),
  ));

  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Hoe werkt dit')),
    h('div', { class: 'inside' },
      h('ol', {},
        h('li', {}, 'Kies hierboven je ', h('strong', {}, 'projecten-root'), ' en druk op ', h('em', {}, 'Pad controleren'), '.'),
        h('li', {}, 'Bestaat de map nog niet? Klik ', h('em', {}, 'Map aanmaken'), '.'),
        h('li', {}, 'Klik ', h('em', {}, 'Instellingen opslaan'), '.'),
        h('li', {}, 'Ga naar ', h('a', { href: '#/scan' }, 'Map-scan'), ' om bestaande mappen te importeren, of ',
          h('a', { href: '#/new' }, 'Nieuw project'), ' om een vers project aan te maken.'),
      ),
    ),
  ));

  refreshStatus();
};
