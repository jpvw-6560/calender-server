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
    // Indexation rapide par date (format YYYY-MM-DD)
    const eventsByDate = {};
    for (const ev of events) {
      if (!ev.date) continue;
      const key = ev.date.slice(0,10); // YYYY-MM-DD
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(ev);
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

    // Saints patrons de test (31 noms cycliques)
    const saints = [
      'St Marie', 'St Paul', 'St Pierre', 'St Barnabé', 'St Antoine', 'St Jean', 'St Luc', 'St Marc', 'St Denis', 'St Martin',
      'St André', 'St Nicolas', 'Ste Lucie', 'St Urbain', 'St Thomas', 'St Etienne', 'St Jean', 'St Innocents', 'St David', 'St Sylvestre',
      'St Joseph', 'St Patrick', 'St Georges', 'St Philippe', 'St Jacques', 'St Augustin', 'St Michel', 'St François', 'St Simon', 'St Jude', 'St Saturnin'
    ];
    for (let day = 1; day <= last.getDate(); day++) {
      const date = new Date(year, month, day);
      const saint = saints[(day-1) % saints.length];
      const key = date.toISOString().slice(0,10);
      // TEST : injecter du contenu de test si aucun événement réel
      let testEvents = [];
      if (day === 7) testEvents.push({ title: 'Rdv Ophtalmo', icon: '👁️' });
      if (day === 10) testEvents.push({ icon: '📦' }); // poubelles cartons, pas de texte
      if (day === 15) testEvents.push({ title: 'Contrôle technique', icon: '🚗' });
      if (day === 20) testEvents.push({ title: "Anniversaire de Toto", icon: '🎂' });
      if (day === 25) testEvents.push({ title: 'Vacances', icon: '🏖️' });
      const dayEvents = (eventsByDate[key] || []).concat(testEvents);
      const isToday = (date.toDateString() === new Date().toDateString());
      html += `<td data-day="${day}">
        <div class="cell-rect">
          <div class="cell-zone-top">
            <span class="cell-day${isToday ? ' cell-day-today' : ''}">${day}</span>
            <span class="cell-saint">${saint}</span>
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
