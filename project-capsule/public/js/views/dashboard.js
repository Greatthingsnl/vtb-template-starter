// Dashboard view — project stats + recent projects + welcome cards.
window.Views = window.Views || {};

Views.dashboard = async function (root) {
  const { h, fmtDate, statusPill } = UI;

  const [projects, ideas, notes] = await Promise.all([API.projects(), API.ideas(), API.notes()]);

  const countByStatus = {};
  for (const p of projects) countByStatus[p.status] = (countByStatus[p.status] || 0) + 1;
  const recent = [...projects]
    .sort((a, b) => String(b.lastActivity || '').localeCompare(String(a.lastActivity || '')))
    .slice(0, 8);

  const stats = [
    ['Totaal projecten', projects.length],
    ['Actief',           countByStatus['actief'] || 0],
    ['Idee',             countByStatus['idee']   || 0],
    ['Templates',        countByStatus['template'] || 0],
    ['Open ideeën',      ideas.length],
    ['Notities',         notes.length],
  ];

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Dashboard'));

  // welcome panel (WordPress "At a Glance")
  root.appendChild(h('div', { class: 'postbox' },
    h('header', {}, h('span', {}, 'In één oogopslag')),
    h('div', { class: 'inside' },
      h('div', { class: 'grid' },
        ...stats.map(([label, n]) => h('div', { class: 'postbox', style: 'margin:0' },
          h('div', { class: 'inside', style: 'text-align:center' },
            h('div', { style: 'font-size:28px;font-weight:600;color:#2271b1' }, String(n)),
            h('div', { class: 'muted' }, label),
          )
        ))
      )
    )
  ));

  // recent projects
  const tbody = h('tbody');
  for (const p of recent) {
    tbody.appendChild(h('tr', {},
      h('td', {}, h('a', { href: `#/project/${p.id}` }, p.projectName), h('div', { class: 'muted small' }, p.clientName)),
      h('td', {}, statusPill(p.status)),
      h('td', {}, fmtDate(p.lastActivity)),
      h('td', { class: 'muted small' }, (p.labels || []).join(', ') || '—'),
    ));
  }
  if (!recent.length) {
    tbody.appendChild(h('tr', {}, h('td', { colspan: 4, class: 'muted' }, 'Nog geen projecten. Maak er een via “+ Nieuw”.')));
  }

  root.appendChild(h('div', { class: 'postbox' },
    h('header', {},
      h('span', {}, 'Recent'),
      h('a', { href: '#/projects', class: 'small' }, 'Bekijk alle projecten →'),
    ),
    h('div', { class: 'inside', style: 'padding:0' },
      h('table', { class: 'wp-list-table' },
        h('thead', {}, h('tr', {},
          h('th', {}, 'Project'), h('th', {}, 'Status'), h('th', {}, 'Laatste activiteit'), h('th', {}, 'Labels'),
        )),
        tbody,
      )
    )
  ));

  // welcome & remote cards
  const welcome = h('div', { class: 'col-2' },
    h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, 'Welkom')),
      h('div', { class: 'inside' },
        h('p', {}, 'Project Capsule is je lokale projectlauncher en AI-geheugen.'),
        h('div', { class: 'row' },
          h('a', { class: 'button button-primary', href: '#/new' }, '+ Nieuw project'),
          h('a', { class: 'button', href: '#/ideas' }, 'Ideeën'),
          h('a', { class: 'button', href: '#/scan' }, 'Scan mappen'),
          h('a', { class: 'button', href: '#/remote' }, 'Remote access'),
        ),
      )
    ),
    h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, 'Tip')),
      h('div', { class: 'inside muted' },
        h('p', {}, 'Gebruik de zoekbalk bovenin om door projecten, prompts, changelogs en notities te zoeken.'),
        h('p', {}, 'Via Tailscale kun je deze tool ook vanaf je iPhone of iPad openen.'),
      )
    ),
  );
  root.appendChild(welcome);
};
