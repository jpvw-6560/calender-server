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

export async function deleteEvent(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error();
}
