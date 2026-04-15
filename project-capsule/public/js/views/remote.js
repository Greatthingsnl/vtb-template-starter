// Remote access — Tailscale setup notes + local info.
window.Views = window.Views || {};

Views.remote = async function (root) {
  const { h } = UI;
  const [cfg, health] = await Promise.all([API.config(), API.health()]);

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Remote access'));

  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Deze machine')),
    h('div', { class: 'inside' },
      h('div', { class: 'kv' },
        h('dt', {}, 'Hostname'), h('dd', {}, h('span', { class: 'mono' }, health.host || '—')),
        h('dt', {}, 'Poort'),    h('dd', {}, h('span', { class: 'mono' }, String(cfg.port))),
        h('dt', {}, 'Projecten-root'), h('dd', {}, h('span', { class: 'mono' }, cfg.rootAbsolute)),
        h('dt', {}, 'VS Code commando'), h('dd', {}, h('span', { class: 'mono' }, cfg.vscode)),
      ),
    ),
  ));

  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Tailscale setup')),
    h('div', { class: 'inside' },
      h('p', {}, 'Project Capsule luistert op ', h('span', { class: 'mono' }, '0.0.0.0:' + cfg.port),
        '. Zodra je machine in een ', h('strong', {}, 'tailnet'), ' zit, is hij veilig bereikbaar op je MagicDNS naam.'),
      h('h2', {}, '1. Installeer Tailscale op de Mac mini'),
      h('pre', { class: 'code' }, 'brew install --cask tailscale\nopen -a Tailscale # of: sudo tailscale up'),
      h('h2', {}, '2. Vind de tailnet-naam'),
      h('pre', { class: 'code' }, 'tailscale status\ntailscale ip -4'),
      h('p', {}, 'Benader de tool in een browser op een ander apparaat via '),
      h('pre', { class: 'code' }, `http://<mac-mini>.tail-XXXX.ts.net:${cfg.port}`),
      h('h2', {}, '3. (Optioneel) Tailscale Serve — HTTPS op poort 443'),
      h('pre', { class: 'code' }, `tailscale serve --bg --https=443 http://127.0.0.1:${cfg.port}`),
      h('p', { class: 'muted small' }, 'Hierdoor is de tool bereikbaar op https://<mac-mini>.tail-XXXX.ts.net (zonder poort).'),
      h('h2', {}, '4. (Optioneel) Tailscale SSH voor beheer'),
      h('pre', { class: 'code' }, 'sudo tailscale up --ssh'),
      h('p', { class: 'muted small' }, 'Daarna kun je SSH\'en naar de Mac mini met ', h('span', { class: 'mono' }, 'ssh <user>@<mac-mini>.tail-XXXX.ts.net'), ' — zonder publieke poorten te openen.'),
      h('h2', {}, 'Veilig houden'),
      h('ul', {},
        h('li', {}, 'Deze tool heeft ', h('strong', {}, 'geen auth'), ' — vertrouw op je tailnet-ACL.'),
        h('li', {}, 'Beperk toegang tot jouw gebruikersaccount in de Tailscale admin.'),
        h('li', {}, 'Vermijd het openbaar blootstellen van poort ', h('span', { class: 'mono' }, String(cfg.port)), ' op internet.'),
      ),
    ),
  ));

  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'Mobiele toegang')),
    h('div', { class: 'inside' },
      h('p', {}, 'Voeg de pagina toe aan je beginscherm op iOS/Android voor een app-achtige ervaring:'),
      h('ul', {},
        h('li', {}, 'Safari → Deel → ', h('strong', {}, 'Zet op beginscherm'), '.'),
        h('li', {}, 'Chrome (Android) → menu → ', h('strong', {}, 'Toevoegen aan startscherm'), '.'),
      ),
      h('p', { class: 'muted small' }, 'De mobiele weergave is geoptimaliseerd voor snelle idee-invoer, status bekijken en “Verder waar ik was”.'),
    ),
  ));
};
