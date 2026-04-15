// App shell: hash-based router + global wiring.
(() => {
  const view = document.getElementById('view');
  const sidebar = document.getElementById('sidebar');

  const routes = {
    dashboard:      () => Views.dashboard(view),
    projects:       () => Views.projects(view),
    new:            () => Views.newProject(view),
    project:        (id) => Views.projectDetail(view, id),
    ideas:          () => Views.ideas(view),
    notes:          () => Views.notes(view),
    search:         (q) => Views.search(view, q),
    templates:      () => Views.templates(view),
    devices:        () => Views.devices(view),
    remote:         () => Views.remote(view),
    scan:           () => Views.scan(view),
    settings:       () => Views.settings(view),
  };

  function route() {
    const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [name, ...rest] = hash.split('/');
    const arg = rest.join('/');
    const handler = routes[name] || routes.dashboard;
    view.replaceChildren();
    try { handler(arg); } catch (err) { UI.error(err); }
    // highlight sidebar
    document.querySelectorAll('#sidebar a').forEach((a) => {
      a.classList.toggle('active', a.dataset.route === name);
    });
    // close mobile menu
    sidebar.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('load', route);

  // Header wiring
  document.getElementById('sidebar-toggle').addEventListener('click', () => sidebar.classList.toggle('open'));
  document.getElementById('new-project-btn').addEventListener('click', () => { location.hash = '#/new'; });
  document.getElementById('quick-idea-btn').addEventListener('click', () => Views.quickIdea());

  const searchInput = document.getElementById('global-search');
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) location.hash = '#/search/' + encodeURIComponent(q);
    }
  });

  // Expose navigation helper
  window.go = (hash) => { location.hash = hash; };
})();
