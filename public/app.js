// Saints patrons de test pour chaque jour du mois courant
function getSaintsForMonth(year, month) {
  const saints = [
    'St Marie', 'St Paul', 'St Pierre', 'St Barnabé', 'St Antoine', 'St Jean', 'St Luc', 'St Marc', 'St Denis', 'St Martin',
    'St André', 'St Nicolas', 'Ste Lucie', 'St Urbain', 'St Thomas', 'St Etienne', 'St Jean', 'St Innocents', 'St David', 'St Sylvestre',
    'St Joseph', 'St Patrick', 'St Georges', 'St Philippe', 'St Jacques', 'St Augustin', 'St Michel', 'St François', 'St Simon', 'St Jude', 'St Saturnin'
  ];
  // Retourne un tableau de 31 saints, cyclique si besoin
  return Array.from({length: 31}, (_, i) => saints[i % saints.length]);
}
// Mapping type d'événement -> icône
const EVENT_ICONS = {
  garde: '👶',
  cartons: '📦',
  poubelles: '🟫',
  pmc: '🟦',
  docteur: '🩺',
  ophtalmo: '👁️',
  dentiste: '🦷'
};

// Événements de test pour le mois courant
function getTestEvents(year, month) {
  return [
    { date: new Date(year, month, 3), type: 'garde' },
    { date: new Date(year, month, 7), type: 'cartons' },
    { date: new Date(year, month, 10), type: 'poubelles' },
    { date: new Date(year, month, 12), type: 'pmc' },
    { date: new Date(year, month, 15), type: 'docteur' },
    { date: new Date(year, month, 18), type: 'ophtalmo' },
    { date: new Date(year, month, 22), type: 'dentiste' },
    { date: new Date(year, month, 22), type: 'pmc' }, // test multi-événement
  ];
}
// public/app.js - Calendar Server
// Frontend minimal pour afficher les événements depuis l'API REST

const API_BASE = '/api/events';

// Notifications (similaire à music_server)
(() => {
  const ICONS = { info:'ℹ️', success:'✅', warning:'⚠️', error:'❌' };
  const ANIMATION_DURATION = 350;
  function getContainer() {
    let container = document.getElementById('notification-container');
    if(!container){
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.prepend(container);
    }
    return container;
  }
  function createNotification(msg, type) {
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.style.cssText = 'position: fixed !important; top: 20px !important; right: 20px !important; z-index: 99999 !important;';
    const icon = document.createElement('span'); 
    icon.className='notification-icon'; 
    icon.textContent=ICONS[type];
    const text = document.createElement('span'); 
    text.className='notification-message'; 
    text.textContent = msg;
    notif.append(icon, text);
    return notif;
  }
  window.showNotification = (msg, type='info', duration=4000) => {
    if(!ICONS[type]) type='info';
    const container = getContainer();
    const notif = createNotification(msg, type);
    container.appendChild(notif);
    requestAnimationFrame(() => notif.classList.add('show'));
    const timer = setTimeout(() => { 
      notif.classList.remove('show'); 
      setTimeout(() => notif.remove(), ANIMATION_DURATION); 
    }, duration);
    notif.addEventListener('click', () => { 
      clearTimeout(timer); 
      notif.classList.remove('show'); 
      setTimeout(() => notif.remove(), ANIMATION_DURATION); 
    });
  };
})();

// Navigation simple
const state = { currentView: 'events' };

document.addEventListener('DOMContentLoaded', () => {
  // Afficher le mois courant dans la sidebar
  updateSidebarMonth();

  // Navigation Année/Mois/Semaine
  document.querySelectorAll('.btn-calnav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-calnav').forEach(b => b.classList.remove('btn-calnav-active'));
      btn.classList.add('btn-calnav-active');
      setCalendarView(btn.dataset.calview);
    });
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      e.target.classList.add('active');
      loadView(e.target.dataset.view);
    });
  });
  loadView('events');
});

function updateSidebarMonth(date = new Date()) {
  const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const el = document.getElementById('sidebar-month');
  if (el) {
    el.textContent = `${mois[date.getMonth()]} ${date.getFullYear()}`;
  }
}


function setCalendarView(view) {
  state.currentView = view;
  if (view === 'year') {
    renderYearCalendar();
  } else if (view === 'month') {
    renderMonthCalendar();
  } else if (view === 'week') {
    renderWeekCalendar();
  }
}



function loadView(view) {
  state.currentView = view;
  if(view === 'events') {
    // Affiche la vue sélectionnée (défaut : mois)
    setCalendarView(document.querySelector('.btn-calnav-active')?.dataset.calview || 'month');
  }
  else if(view === 'stats') showNotification('Statistiques à venir', 'info');
}

// Vue Année : tableau des 12 mois
function renderYearCalendar(date = calendarDate) {
  const content = document.getElementById('content-view');
  const year = date.getFullYear();
  const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  let html = `<div class="calendar-title-bar">
    <span>${year}</span>
    <button id="btn-today" class="btn-today">Aujourd'hui</button>
  </div>`;
  html += '<div class="year-grid">';
  const jours = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const today = new Date();
  for(let m=0; m<12; m++) {
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m+1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = lastDay.getDate();
    const isCurrentMonth = (year === today.getFullYear() && m === today.getMonth());
    html += `<div class="year-month-mini${isCurrentMonth ? ' calendar-today' : ''}" data-month="${m}">`;
    html += `<div class="mini-month-title">${mois[m]}</div>`;
    html += '<table class="mini-calendar-table"><thead><tr>';
    for(const j of jours) html += `<th>${j[0]}</th>`;
    html += '</tr></thead><tbody><tr>';
    let day = 1;
    for(let i=0; i<startDay; i++) html += '<td></td>';
    for(let i=startDay; i<7; i++) {
      let cellClass = '';
      if (isCurrentMonth && day === today.getDate()) cellClass = 'mini-today';
      html += `<td${cellClass ? ` class=\"${cellClass}\"` : ''}>${day++}</td>`;
    }
    html += '</tr>';
    while(day <= daysInMonth) {
      html += '<tr>';
      for(let i=0; i<7; i++) {
        if(day > daysInMonth) html += '<td></td>';
        else {
          let cellClass = '';
          if (isCurrentMonth && day === today.getDate()) cellClass = 'mini-today';
          html += `<td${cellClass ? ` class=\"${cellClass}\"` : ''}>${day++}</td>`;
        }
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
  }
  html += '</div>';
  content.innerHTML = html;
  // Navigation : cliquer sur un mois
  document.querySelectorAll('.year-month-mini').forEach(el => {
    el.onclick = () => {
      calendarDate = new Date(year, parseInt(el.dataset.month), 1);
      document.querySelectorAll('.btn-calnav').forEach(b => b.classList.remove('btn-calnav-active'));
      document.querySelector('.btn-calnav[data-calview="month"]').classList.add('btn-calnav-active');
      setCalendarView('month');
    };
  });
  // Bouton Aujourd'hui
  document.getElementById('btn-today').onclick = () => {
    calendarDate = new Date();
    renderYearCalendar(calendarDate);
  };
}

// Vue Semaine : calendrier de la semaine courante
function renderWeekCalendar(date = calendarDate) {
  const content = document.getElementById('content-view');
  const today = new Date();
  // Trouver le lundi de la semaine
  const d = new Date(date);
  const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
  const monday = new Date(d.setDate(d.getDate() - dayOfWeek));
  let html = `<div class="calendar-title-bar">
    <button id="btn-prev-week">◀</button>
    <span>Semaine du ${monday.toLocaleDateString('fr-FR')}</span>
    <button id="btn-next-week">▶</button>
    <button id="btn-today" class="btn-today">Aujourd'hui</button>
  </div>`;
  html += '<table class="calendar-table"><thead><tr>';
  const jours = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  for(const j of jours) html += `<th>${j}</th>`;
  html += '</tr></thead><tbody><tr>';
  for(let i=0; i<7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const isToday = day.toDateString() === today.toDateString();
    html += `<td${isToday ? ' class="calendar-today"' : ''}>${day.getDate()}</td>`;
  }
  html += '</tr></tbody></table>';
  content.innerHTML = html;
  // Navigation semaine précédente/suivante
  document.getElementById('btn-prev-week').onclick = () => {
    calendarDate.setDate(calendarDate.getDate() - 7);
    renderWeekCalendar(calendarDate);
  };
  document.getElementById('btn-next-week').onclick = () => {
    calendarDate.setDate(calendarDate.getDate() + 7);
    renderWeekCalendar(calendarDate);
  };
  // Bouton Aujourd'hui
  document.getElementById('btn-today').onclick = () => {
    calendarDate = new Date();
    renderWeekCalendar(calendarDate);
  };
}


// Navigation calendrier (mois courant par défaut)
let calendarDate = new Date();

function renderMonthCalendar(date = calendarDate) {
  calendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const content = document.getElementById('content-view');
  const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi=0
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  let header = `${mois[month]} ${year}`;
  let html = `<div class="calendar-title-bar">
    <button id="btn-prev-month">◀</button>
    <span>${header}</span>
    <button id="btn-next-month">▶</button>
    <button id="btn-today" class="btn-today">Aujourd'hui</button>
  </div>`;
  html += '<table class="calendar-table"><thead><tr>';
  html += '<th class="weeknum-header"><div class="th-center">N°</div></th>';
  const jours = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  for(const j of jours) html += `<th class="calendar-th"><div class='th-center'>${j}</div></th>`;
  html += '</tr></thead><tbody>';
  let day = 1;
  const testEvents = getTestEvents(year, month);
  const saints = getSaintsForMonth(year, month);
  let weekRow = 0;
  let firstRow = true;
  while(day <= daysInMonth) {
    html += '<tr>';
    // Numéro de semaine
    let weekDate = new Date(year, month, day);
    let weekNum = getWeekNumber(weekDate);
    html += `<td class="weeknum"><div class='th-center'>${weekNum}</div></td>`;
    for(let i=0; i<7; i++) {
      if(firstRow && i < startDay) {
        html += '<td></td>';
      } else if(day > daysInMonth) {
        html += '<td></td>';
      } else {
        let cellClass = '';
        const dayEvents = testEvents.filter(ev => ev.date.getDate() === day);
        if (isCurrentMonth && day === today.getDate()) cellClass = 'calendar-today';
        if (dayEvents.some(ev => ev.type === 'garde')) cellClass += (cellClass ? ' ' : '') + 'garde-day';
        // Nouvelle structure : rectangle à 3 zones horizontales
        let saint = saints[day-1] || '';
        let zoneTop = `<div class='cell-zone-top'><span class='cell-day'>${day}</span><span class='cell-saint'>${saint}</span></div>`;
        // Ajout de texte aléatoire pour test visuel
        let randomText = '';
        if ([7, 13, 22, 28].includes(day)) {
          randomText = "<span class='test-texte-noir'>Texte de test aligné à gauche</span>";
        }
        let zoneMiddle = `<div class='cell-zone-middle'>${dayEvents.some(ev => ev.text) ? dayEvents.map(ev => ev.text).join('<br>') : ''}${randomText}</div>`;
        let icons = dayEvents.map(ev => EVENT_ICONS[ev.type] || '');
        let zoneBottom = `<div class='cell-zone-bottom'>${icons.join(' ')}</div>`;
        html += `<td${cellClass ? ` class=\"${cellClass}\"` : ''}><div class='cell-rect'>${zoneTop}${zoneMiddle}${zoneBottom}</div></td>`;
        day++;
      }
    }
    html += '</tr>';
    firstRow = false;
  }
  html += '</tbody></table>';

// Fonction pour calculer le numéro de semaine ISO
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  return weekNo;
}
  content.innerHTML = html;

  // Navigation mois précédent/suivant
  document.getElementById('btn-prev-month').onclick = () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    updateSidebarMonth(calendarDate);
    renderMonthCalendar(calendarDate);
  };
  document.getElementById('btn-next-month').onclick = () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    updateSidebarMonth(calendarDate);
    renderMonthCalendar(calendarDate);
  };

  // Bouton Aujourd'hui
  document.getElementById('btn-today').onclick = () => {
    calendarDate = new Date();
    updateSidebarMonth(calendarDate);
    renderMonthCalendar(calendarDate);
  };
}

// Affichage des événements
async function loadEvents() {
  const content = document.getElementById('content-view');
  content.innerHTML = '<p>Chargement des événements...</p>';
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();
    if(!data.events || data.events.length === 0) {
      content.innerHTML = '<p>Aucun événement à afficher.</p>';
      return;
    }
    content.innerHTML = `
      <h2>📅 Événements (${data.events.length})</h2>
      <ul style="margin-top:20px;">
        ${data.events.map(ev => `<li><b>${ev.title}</b> — ${ev.date} (${ev.type||'autre'})</li>`).join('')}
      </ul>
    `;
  } catch (e) {
    content.innerHTML = '<p style="color:#c41e3a;">Erreur lors du chargement des événements.</p>';
    showNotification('Erreur API', 'error');
  }
}
