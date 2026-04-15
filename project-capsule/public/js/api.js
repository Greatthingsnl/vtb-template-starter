// Thin client wrapper around the REST API.
window.API = (() => {
  async function req(method, url, body) {
    const opts = { method, headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    if (!res.ok) {
      let msg = res.statusText;
      try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
      throw new Error(msg);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }
  return {
    config:      ()         => req('GET',    '/api/config'),
    templates:   ()         => req('GET',    '/api/templates'),

    projects:    ()         => req('GET',    '/api/projects'),
    project:     (id)       => req('GET',    `/api/projects/${id}`),
    create:      (p)        => req('POST',   '/api/projects', p),
    update:      (id, p)    => req('PUT',    `/api/projects/${id}`, p),
    remove:      (id)       => req('DELETE', `/api/projects/${id}`),
    clone:       (id, p)    => req('POST',   `/api/projects/${id}/clone`, p),
    openInVSCode:(id)       => req('POST',   `/api/projects/${id}/open-vscode`, {}),
    touch:       (id, p)    => req('POST',   `/api/projects/${id}/touch`, p || {}),

    readFile:    (id, path)          => req('GET', `/api/projects/${id}/file?path=${encodeURIComponent(path)}`),
    writeFile:   (id, path, content) => req('PUT', `/api/projects/${id}/file?path=${encodeURIComponent(path)}`, { content }),

    gitStatus:   (id)       => req('GET', `/api/projects/${id}/git`),
    context:     (id, extra)=> req('GET', `/api/projects/${id}/context${extra ? `?extra=${encodeURIComponent(extra)}` : ''}`),

    scan:        ()         => req('GET',  '/api/scan'),
    adopt:       (p)        => req('POST', '/api/scan/adopt', p),

    ideas:       ()         => req('GET',    '/api/ideas'),
    addIdea:     (p)        => req('POST',   '/api/ideas', p),
    removeIdea:  (id)       => req('DELETE', `/api/ideas/${id}`),
    convertIdea: (id, p)    => req('POST',   `/api/ideas/${id}/convert`, p),

    notes:       ()         => req('GET',    '/api/notes'),
    addNote:     (p)        => req('POST',   '/api/notes', p),
    updateNote:  (id, p)    => req('PUT',    `/api/notes/${id}`, p),
    removeNote:  (id)       => req('DELETE', `/api/notes/${id}`),

    search:      (q)        => req('GET', `/api/search?q=${encodeURIComponent(q || '')}`),

    devices:     ()         => req('GET',    '/api/devices'),
    addDevice:   (p)        => req('POST',   '/api/devices', p),
    updateDevice:(id, p)    => req('PUT',    `/api/devices/${id}`, p),
    removeDevice:(id)       => req('DELETE', `/api/devices/${id}`),
    pingDevice:  (id)       => req('POST',   `/api/devices/${id}/ping`, {}),

    health:      ()         => req('GET', '/api/health'),
  };
})();
