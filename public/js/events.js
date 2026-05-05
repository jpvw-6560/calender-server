// events.js
import { showNotification } from './ui.js';

const API_BASE = '/api/events';

export async function fetchEvents() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    showNotification('Erreur chargement événements', 'error');
    return [];
  }
}

export async function createEvent(payload) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur API');
}

export async function fetchEventById(id) {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Événement introuvable');
  return await res.json();
}

export async function updateEvent(id, payload) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur API mise à jour');
}

export async function deleteEvent(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error();
}

// ── API Alternance ────────────────────────────────────────────────────────

export async function fetchAlternance() {
  try {
    const res = await fetch('/api/alternance');
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
}

export async function createAlternance(payload) {
  const res = await fetch('/api/alternance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur API alternance');
}

export async function deleteAlternance(id) {
  const res = await fetch(`/api/alternance/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error();
}
