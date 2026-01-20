// ui.js
import { state } from './state.js';

const ICONS = { info:'ℹ️', success:'✅', warning:'⚠️', error:'❌' };
const ANIMATION_DURATION = 300;

/* ---------- Notifications ---------- */

function getContainer() {
  let el = document.getElementById('notification-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'notification-container';
    document.body.prepend(el);
  }
  return el;
}

export function showNotification(msg, type = 'info', duration = 4000) {
  const container = getContainer();
  const div = document.createElement('div');
  div.className = `notification notification-${type}`;
  div.innerHTML = `
    <span class="notification-icon">${ICONS[type] || ICONS.info}</span>
    <span class="notification-message">${msg}</span>
  `;
  container.appendChild(div);
  requestAnimationFrame(() => div.classList.add('show'));
  const t = setTimeout(() => close(), duration);

  function close() {
    div.classList.remove('show');
    setTimeout(() => div.remove(), ANIMATION_DURATION);
  }
  div.onclick = () => { clearTimeout(t); close(); };
}

/* ---------- Mode édition ---------- */

export function initEditModeToggle() {
  const toggle = document.getElementById('editmode-toggle');
  if (!toggle) return;
  state.editMode = toggle.checked;
  toggle.onchange = () => state.editMode = toggle.checked;
}

export function requireEditMode(action) {
  if (!state.editMode) {
    showNotification(`Activez le mode édition pour ${action}`, 'warning');
    return false;
  }
  return true;
}
