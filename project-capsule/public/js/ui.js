// Shared UI helpers (DOM, notice, modal, formatting).
window.UI = (() => {
  const notice = document.getElementById('notice');
  let noticeTimer = null;

  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'checked' || k === 'disabled' || k === 'readonly') { if (v) el.setAttribute(k, ''); }
      else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showNotice(msg, kind = 'success', timeout = 4000) {
    notice.className = 'notice ' + kind;
    notice.textContent = msg;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    if (timeout) noticeTimer = setTimeout(() => (notice.hidden = true), timeout);
  }

  function error(err) {
    showNotice(err && err.message ? err.message : String(err), 'error', 6000);
  }

  // Simple modal.
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody  = document.getElementById('modal-body');
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  function openModal(title, contentEl) {
    modalTitle.textContent = title;
    modalBody.replaceChildren(contentEl);
    modal.hidden = false;
  }
  function closeModal() {
    modal.hidden = true; modalBody.replaceChildren();
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return iso; }
  }

  function statusPill(status) {
    const s = (status || '').toLowerCase().replace(/\s+/g, '');
    const map = { 'idee':'idee', 'actief':'actief', 'wachtopklant':'wacht', 'onderhoud':'onderhoud', 'afgerond':'afgerond', 'archief':'archief', 'template':'template', 'clonebaar':'clonebaar' };
    return h('span', { class: 'pill ' + (map[s] || '') }, status || '—');
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for Safari over HTTP on Tailscale tailnets that block clipboard API.
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    return Promise.resolve();
  }

  return { h, esc, showNotice, error, openModal, closeModal, fmtDate, statusPill, copyToClipboard };
})();
