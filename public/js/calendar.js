// calendar.js
import { state } from './state.js';
import { fetchEvents } from './events.js';

/* ---------- Utilitaires ---------- */

export function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/* ---------- Router calendrier ---------- */

export function setCalendarView(view) {
  state.currentView = view;
  if (view === 'year') renderYear();
  if (view === 'month') renderMonth();
  if (view === 'week') renderWeek();
}

/* ---------- Vue Année ---------- */

export function renderYear() {
  const content = document.getElementById('content-view');
  const year = state.calendarDate.getFullYear();
  const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

  let html = `<h2>${year}</h2><div class="year-grid">`;
  for (let m = 0; m < 12; m++) {
    html += `<div class="year-month" data-month="${m}">${months[m]}</div>`;
  }
  html += '</div>';
  content.innerHTML = html;

  document.querySelectorAll('.year-month').forEach(div => {
    div.onclick = () => {
      state.calendarDate = new Date(year, div.dataset.month, 1);
      setCalendarView('month');
    };
  });
}

/* ---------- Vue Mois ---------- */

export function renderMonth() {
  const content = document.getElementById('content-view');
  const d = state.calendarDate;
  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = (first.getDay() + 6) % 7;

  // Rendu asynchrone pour charger les événements
  (async () => {
    const eventsData = await fetchEvents();
    // eventsData peut être { events: [...] } ou juste un tableau
    const events = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);
    // Indexation par date réelle + gestion des récurrences
    const eventsByDate = {};
    for (const ev of events) {
      if (!ev.date) continue;
      const baseDate = new Date(ev.date);
      const y = baseDate.getFullYear();
      const m = baseDate.getMonth();
      const d = baseDate.getDate();
      // Générer toutes les occurrences du mois courant selon la récurrence
      let occs = [];
      if (!ev.recurrence || ev.recurrence === 'none') {
        // Non récurrent
        if (y === year && m === month) occs = [d];
      } else if (ev.recurrence === 'daily') {
        for (let day = 1; day <= last.getDate(); day++) occs.push(day);
      } else if (ev.recurrence === 'biweekly') {
        // Afficher toutes les occurrences tous les 15 jours à partir de la date de départ
        let occurrence = new Date(baseDate);
        // Avancer jusqu'à la première occurrence dans le mois affiché
        while (occurrence < new Date(year, month, 1)) {
          occurrence.setDate(occurrence.getDate() + 14);
        }
        // Ajouter toutes les occurrences du mois affiché
        while (occurrence.getFullYear() === year && occurrence.getMonth() === month && occurrence <= last) {
          occs.push(occurrence.getDate());
          occurrence.setDate(occurrence.getDate() + 14);
        }
      } else if (ev.recurrence === 'biweekly') {
        // Trouver le premier jour >= baseDate dans le mois
        let first = new Date(year, month, d);
        if (first.getMonth() !== month) first = new Date(year, month, 1 + ((d-1)%14));
        for (let day = first.getDate(); day <= last.getDate(); day += 14) occs.push(day);
      } else if (ev.recurrence === 'monthly') {
        if (d <= last.getDate()) occs = [d];
      } else if (ev.recurrence === 'yearly') {
        if (m === month && d <= last.getDate()) occs = [d];
      }
      for (const day of occs) {
        const key = new Date(year, month, day).toISOString().slice(0,10);
        if (!eventsByDate[key]) eventsByDate[key] = [];
        eventsByDate[key].push(ev);
      }
    }

    let html = `
      <div class="calendar-title-bar">
        <button id="btn-prev-month">◀</button>
        <span>${first.toLocaleDateString('fr-FR', { month:'long', year:'numeric' })}</span>
        <button id="btn-next-month">▶</button>
        <button id="btn-today" class="btn-today">Aujourd'hui</button>
      </div>
    `;
    html += `<table class="calendar-table"><tr>`;
    ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].forEach(j => html += `<th>${j}</th>`);
    html += '</tr><tr>';

    for (let i = 0; i < start; i++) html += '<td></td>';

    for (let day = 1; day <= last.getDate(); day++) {
      const date = new Date(year, month, day);
      const key = date.toISOString().slice(0,10);
      const dayEvents = eventsByDate[key] || [];
      const isToday = (date.toDateString() === new Date().toDateString());
      html += `<td data-day="${day}">
        <div class="cell-rect">
          <div class="cell-zone-top">
            <span class="cell-day${isToday ? ' cell-day-today' : ''}">${day}</span>
          </div>
          <div class="cell-zone-middle">${dayEvents.map(ev => ev.title ? `<div class='event-title'>${ev.title}</div>` : '').join('') || '&nbsp;'}</div>
          <div class="cell-zone-bottom">${dayEvents.map(ev => ev.icon ? ev.icon : '').join(' ')}</div>
        </div>
      </td>`;
      if ((start + day) % 7 === 0) html += '</tr><tr>';
    }
    html += '</tr></table>';
    content.innerHTML = html;

  // Navigation mois
    document.getElementById('btn-prev-month').onclick = () => {
      state.calendarDate = new Date(year, month - 1, 1);
      renderMonth();
    };
    document.getElementById('btn-next-month').onclick = () => {
      state.calendarDate = new Date(year, month + 1, 1);
      renderMonth();
    };
    document.getElementById('btn-today').onclick = () => {
      state.calendarDate = new Date();
      renderMonth();
    };

    document.querySelectorAll('td[data-day]').forEach(td => {
      td.onclick = () => {
        state.calendarDate = new Date(year, month, td.dataset.day);
        setCalendarView('week');
      };
    });
  })();
}

/* ---------- Vue Semaine ---------- */

export function renderWeek() {
  const content = document.getElementById('content-view');
  const d = new Date(state.calendarDate);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);

  let html = `<h2>Semaine ${getWeekNumber(d)}</h2><table class="week-table">`;
  html += '<tr><th></th>';
  ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].forEach((j,i)=>{
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    html += `<th>${j}<br>${dd.getDate()}</th>`;
  });
  html += '</tr>';

  for (let h = 0; h < 24; h++) {
    html += `<tr><td>${h}:00</td>`;
    for (let i = 0; i < 7; i++) html += '<td></td>';
    html += '</tr>';
  }
  html += '</table>';
  content.innerHTML = html;
}
