// Device management — register Mac minis / other machines accessed via Tailscale.
window.Views = window.Views || {};

Views.devices = async function (root) {
  const { h, fmtDate } = UI;
  const [devices, health] = await Promise.all([API.devices(), API.health()]);

  const fields = {
    name: h('input', { type: 'text', class: 'wp-input', placeholder: 'Bijv. Regie Mini' }),
    role: h('select', { class: 'wp-input' },
      ...['general','regie','ops','ai','klant'].map((r) => h('option', { value: r }, r)),
    ),
    host: h('input', { type: 'text', class: 'wp-input', placeholder: 'mac-mini.tail-xxxx.ts.net' }),
    port: h('input', { type: 'number', class: 'wp-input', value: 4321 }),
    notes: h('input', { type: 'text', class: 'wp-input', placeholder: 'Opmerkingen' }),
  };
  const addForm = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (!fields.name.value.trim()) return UI.showNotice('Naam is verplicht.', 'warn');
      try {
        await API.addDevice({
          name: fields.name.value.trim(),
          role: fields.role.value,
          host: fields.host.value.trim(),
          port: Number(fields.port.value) || 4321,
          notes: fields.notes.value.trim(),
        });
        Views.devices(root);
      } catch (err) { UI.error(err); }
    }
  },
    h('table', { class: 'form-table' }, h('tbody', {},
      h('tr', {}, h('th', {}, 'Naam'), h('td', {}, fields.name)),
      h('tr', {}, h('th', {}, 'Rol'),  h('td', {}, fields.role)),
      h('tr', {}, h('th', {}, 'Host'), h('td', {}, fields.host, h('div', { class: 'small muted' }, 'Tailscale MagicDNS naam of IP.'))),
      h('tr', {}, h('th', {}, 'Poort'),h('td', {}, fields.port)),
      h('tr', {}, h('th', {}, 'Notitie'), h('td', {}, fields.notes)),
    )),
    h('button', { class: 'button button-primary', type: 'submit' }, '+ Device toevoegen'),
  );

  const tbody = h('tbody');
  if (!devices.length) {
    tbody.appendChild(h('tr', {}, h('td', { colspan: 5, class: 'muted' }, 'Geen devices geregistreerd.')));
  } else {
    for (const d of devices) {
      const url = d.host ? `http://${d.host}:${d.port || 4321}` : '';
      tbody.appendChild(h('tr', {},
        h('td', {}, h('strong', {}, d.name), h('div', { class: 'muted small' }, d.role)),
        h('td', {}, url ? h('a', { href: url, target: '_blank' }, url) : h('span', { class: 'muted' }, '—')),
        h('td', { class: 'small muted' }, fmtDate(d.lastSeen) + (d.notes ? ' • ' + d.notes : '')),
        h('td', { style: 'text-align:right' },
          url ? h('button', {
            class: 'button small', onclick: async () => {
              try {
                const r = await fetch(`${url}/api/health`, { mode: 'no-cors' });
                await API.pingDevice(d.id); UI.showNotice('Ping verstuurd.'); Views.devices(root);
              } catch (e) {
                try { await API.pingDevice(d.id); } catch {}
                UI.showNotice('Ping kon host niet direct bereiken — markering bijgewerkt.', 'warn');
                Views.devices(root);
              }
            }
          }, 'Ping') : null,
          ' ',
          h('button', {
            class: 'button small button-danger', onclick: async () => {
              if (!confirm('Device verwijderen?')) return;
              await API.removeDevice(d.id); Views.devices(root);
            }
          }, 'Verwijder'),
        ),
      ));
    }
  }

  root.appendChild(h('h1', { class: 'wp-heading' }, 'Devices'));
  root.appendChild(h('div', { class: 'notice' },
    'Deze capsule draait op ', h('strong', {}, health.host || 'deze machine'),
    '. Voeg hier andere Mac mini\'s (of machines) toe om ze via je tailnet te bereiken.',
  ));
  root.appendChild(h('div', { class: 'col-2' },
    h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, 'Geregistreerde devices')),
      h('div', { class: 'inside', style: 'padding:0' },
        h('table', { class: 'wp-list-table' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Device'), h('th', {}, 'URL'), h('th', {}, 'Laatst gezien'), h('th', {}, ''))),
          tbody,
        ),
      ),
    ),
    h('div', { class: 'postbox' },
      h('header', {}, h('span', {}, 'Device toevoegen')),
      h('div', { class: 'inside' }, addForm),
    ),
  ));
};
