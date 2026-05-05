// calendar.js
import { state } from './state.js';
import { fetchEvents, fetchAlternance } from './events.js';

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
  if (view === 'year') {
    // Centrer la vue sur aujourd'hui (mois actuel ≈ 4ème colonne)
    const t = new Date();
    state.calendarDate = new Date(t.getFullYear(), t.getMonth() - 3, 1);
    renderYear();
  }
  if (view === 'month') renderMonth();
  if (view === 'week') renderWeek();
}

/* ---------- Jours fériés français ---------- */

function getFrenchHolidays(year) {
  const h = new Map();
  // Algorithme de Meeus/Jones/Butcher pour la date de Pâques
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), hh = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - hh - k) % 7;
    const mm = Math.floor((a + 11 * hh + 22 * l) / 451);
    const mo = Math.floor((hh + l - 7 * mm + 114) / 31) - 1;
    const dy = ((hh + l - 7 * mm + 114) % 31) + 1;
    return new Date(y, mo, dy);
  }
  function add(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function key(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  const e = easter(year);
  h.set(key(new Date(year, 0, 1)),   "Jour de l'An");
  h.set(key(add(e, 1)),              'Lundi de Pâques');
  h.set(key(new Date(year, 4, 1)),   'Fête du Travail');
  h.set(key(new Date(year, 4, 8)),   'Victoire 1945');
  h.set(key(add(e, 39)),             'Ascension');
  h.set(key(add(e, 50)),             'Lundi de Pentecôte');
  h.set(key(new Date(year, 6, 14)),  'Fête Nationale');
  h.set(key(new Date(year, 7, 15)),  'Assomption');
  h.set(key(new Date(year, 10, 1)),  'Toussaint');
  h.set(key(new Date(year, 10, 11)), 'Armistice');
  h.set(key(new Date(year, 11, 25)), 'Noël');
  return h;
}

/* ---------- Vue Année (style calendrier des postes) ---------- */

export function renderYear() {
  document.body.dataset.calview = 'year';
  const content = document.getElementById('content-view');

  // 12 mois à afficher à partir de state.calendarDate
  const startYear  = state.calendarDate.getFullYear();
  const startMonth = state.calendarDate.getMonth();
  const months12 = [];
  for (let i = 0; i < 12; i++) {
    const totalM = startMonth + i;
    months12.push({ y: startYear + Math.floor(totalM / 12), m: totalM % 12 });
  }

  content.innerHTML = '<div class="event-list-loading">Chargement…</div>';

  (async () => {
    const [eventsData, alternanceEntries] = await Promise.all([fetchEvents(), fetchAlternance()]);
    const events = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);

    /* ── Utilitaires ─────────────────────────────────────────────────── */
    function parseLocalDate(str) {
      if (!str) return null;
      const s = typeof str === 'string' ? str : String(str);
      const p = s.substring(0, 10).split('-');
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }
    function localKey(y, m, day) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    function isMySaturday(satDate) {
      if (!alternanceEntries || !alternanceEntries.length) return false;
      const ref = alternanceEntries.find(e => {
        const rd = parseLocalDate(e.startDate);
        return rd && rd <= satDate;
      });
      if (!ref) return false;
      const refDate = parseLocalDate(ref.startDate);
      const daysDiff = Math.round((satDate - refDate) / (24 * 60 * 60 * 1000));
      const weeksDiff = Math.round(daysDiff / 7);
      return weeksDiff % 2 === 0 ? ref.alternanceType === 'mine' : ref.alternanceType !== 'mine';
    }
    function computeHolidayMyDays(evStart, evEnd, myWeek) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const durationDays = Math.round((evEnd - evStart) / msPerDay) + 1;
      const myWeekdays = new Set();
      if (durationDays < 2) return myWeekdays;
      function findChristmas() {
        for (let y = evStart.getFullYear(); y <= evEnd.getFullYear(); y++) {
          const dec24 = new Date(y, 11, 24);
          if (dec24 >= evStart && dec24 <= evEnd) return dec24;
        }
        return null;
      }
      let isMineFirstHalf;
      if (myWeek === 1) {
        isMineFirstHalf = true;
      } else if (myWeek === 2) {
        isMineFirstHalf = false;
      } else {
        const christmas = findChristmas();
        if (christmas) {
          const isEvenYear = christmas.getFullYear() % 2 === 0;
          const halfDay = Math.floor(durationDays / 2);
          const dec24Idx = Math.round((christmas - evStart) / msPerDay);
          const christmasInFirstHalf = dec24Idx < halfDay;
          isMineFirstHalf = isEvenYear ? christmasInFirstHalf : !christmasInFirstHalf;
        } else {
          let precedingSat = new Date(evStart);
          while (precedingSat.getDay() !== 6) precedingSat.setDate(precedingSat.getDate() - 1);
          isMineFirstHalf = isMySaturday(precedingSat);
        }
      }
      const halfDay = Math.floor(durationDays / 2);
      for (let i = 0; i < durationDays; i++) {
        const cur = new Date(evStart); cur.setDate(cur.getDate() + i);
        const dow = cur.getDay();
        if (dow === 0 || dow === 6) continue;
        const inFirstHalf = i < halfDay;
        if ((inFirstHalf && isMineFirstHalf) || (!inFirstHalf && !isMineFirstHalf))
          myWeekdays.add(localKey(cur.getFullYear(), cur.getMonth(), cur.getDate()));
      }
      return myWeekdays;
    }

    /* ── Jours fériés pour les années affichées ──────────────────────── */
    const yearsInRange = [...new Set(months12.map(({ y }) => y))];
    const frenchHolidays = new Map();
    yearsInRange.forEach(y => getFrenchHolidays(y).forEach((name, k) => frenchHolidays.set(k, name)));

    /* ── Indexation événements ───────────────────────────────────────── */
    const monthSet = new Set(months12.map(({ y, m }) => `${y}-${m}`));
    const eventsByDate = {};

    for (const ev of events) {
      if (!ev.date) continue;
      const baseDate = parseLocalDate(ev.date);

      if ((ev.type === 'holiday' || ev.type === 'mykids') && ev.dateEnd) {
        const endDate = parseLocalDate(ev.dateEnd);
        let cur = new Date(baseDate);
        while (cur <= endDate) {
          const mk = `${cur.getFullYear()}-${cur.getMonth()}`;
          if (monthSet.has(mk)) {
            const k = localKey(cur.getFullYear(), cur.getMonth(), cur.getDate());
            if (!eventsByDate[k]) eventsByDate[k] = [];
            if (!eventsByDate[k].find(e => e.id === ev.id)) eventsByDate[k].push(ev);
          }
          cur.setDate(cur.getDate() + 1);
        }
        continue;
      }

      for (const { y, m } of months12) {
        const last = new Date(y, m + 1, 0);
        const ey = baseDate.getFullYear(), em = baseDate.getMonth(), ed = baseDate.getDate();
        let occs = [];
        if (!ev.recurrence || ev.recurrence === 'none') {
          if (ey === y && em === m) occs = [ed];
        } else if (ev.recurrence === 'daily') {
          for (let day = 1; day <= last.getDate(); day++) occs.push(day);
        } else if (ev.recurrence === 'biweekly' || ev.recurrence === 'biweekly-2days') {
          let occ = new Date(baseDate);
          while (occ < new Date(y, m, 1)) occ.setDate(occ.getDate() + 14);
          while (occ.getFullYear() === y && occ.getMonth() === m && occ <= last) {
            occs.push(occ.getDate());
            if (ev.recurrence === 'biweekly-2days' && occ.getDate() + 1 <= last.getDate())
              occs.push(occ.getDate() + 1);
            occ.setDate(occ.getDate() + 14);
          }
        } else if (ev.recurrence === 'weekly') {
          let occ = new Date(baseDate);
          while (occ < new Date(y, m, 1)) occ.setDate(occ.getDate() + 7);
          while (occ.getFullYear() === y && occ.getMonth() === m && occ <= last) {
            occs.push(occ.getDate());
            occ.setDate(occ.getDate() + 7);
          }
        } else if (ev.recurrence === 'monthly') {
          if (ed <= last.getDate()) occs = [ed];
        } else if (ev.recurrence === 'yearly') {
          if (em === m && ed <= last.getDate()) occs = [ed];
        }
        for (const day of occs) {
          const k = localKey(y, m, day);
          if (!eventsByDate[k]) eventsByDate[k] = [];
          eventsByDate[k].push(ev);
        }
      }
    }

    /* ── Calcul jours "chez moi" ─────────────────────────────────────── */
    const myWeekendDays     = new Set();
    const myHolidayWeekdays = new Set();
    for (const { y, m } of months12) {
      const last = new Date(y, m + 1, 0);
      for (let day = 1; day <= last.getDate(); day++) {
        const date = new Date(y, m, day);
        if (date.getDay() === 6 && isMySaturday(date)) {
          myWeekendDays.add(localKey(y, m, day));
          if (day + 1 <= last.getDate()) myWeekendDays.add(localKey(y, m, day + 1));
        }
      }
    }
    const rangeStart = new Date(months12[0].y, months12[0].m, 1);
    const rangeEnd   = new Date(months12[11].y, months12[11].m + 1, 0);
    for (const ev of events) {
      if (ev.type !== 'holiday' || !ev.dateEnd) continue;
      const evStart = parseLocalDate(ev.date);
      const evEnd   = parseLocalDate(ev.dateEnd);
      if (evEnd < rangeStart || evStart > rangeEnd) continue;
      const myWeek = ev.myHolidayWeek ? Number(ev.myHolidayWeek) : null;
      computeHolidayMyDays(evStart, evEnd, myWeek).forEach(k => myHolidayWeekdays.add(k));
    }

    /* ── Rendu HTML ──────────────────────────────────────────────────── */
    const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin',
                        'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const today = new Date();
    const firstM = months12[0], lastM = months12[11];
    const titleStr = `${monthNames[firstM.m]} ${firstM.y} – ${monthNames[lastM.m]} ${lastM.y}`;

    let html = `
      <div class="year-title-bar">
        <button id="btn-prev-year">◀</button>
        <span>📅 ${titleStr}</span>
        <button id="btn-next-year">▶</button>
        <button id="btn-today-year" class="btn-today">Aujourd'hui</button>
      </div>
      <div class="year-postal-grid">`;

    for (const { y, m } of months12) {
      const first = new Date(y, m, 1);
      const last  = new Date(y, m + 1, 0);
      const startDay = (first.getDay() + 6) % 7;

      html += `<div class="year-mini-month">
        <div class="year-mini-title">${monthNames[m].toUpperCase()} ${y}</div>
        <table class="year-mini-table"><tr class="year-mini-header-row">`;
      ['L','M','M','J','V','S','D'].forEach((l, i) => {
        html += `<th${i >= 5 ? ' class="weekend-col"' : ''}>${l}</th>`;
      });
      html += '</tr><tr>';
      for (let i = 0; i < startDay; i++) html += '<td></td>';

      for (let day = 1; day <= last.getDate(); day++) {
        const colIndex   = (startDay + day - 1) % 7;
        const isWeekend  = colIndex >= 5;
        const key  = localKey(y, m, day);
        const evs  = eventsByDate[key] || [];
        const isToday = (today.getFullYear() === y && today.getMonth() === m && today.getDate() === day);
        const hasMykids      = evs.some(ev => ev.type === 'mykids');
        const hasHoliday     = evs.some(ev => ev.type === 'holiday');
        const isMyWeekend    = myWeekendDays.has(key);
        const isMyHolidayDay = myHolidayWeekdays.has(key);
        const holidayName    = frenchHolidays.get(key);
        // Icônes : pas d'icône de congés le week-end
        const icons = evs.filter(ev => ev.icon && ev.type !== 'mykids' && !(isWeekend && ev.type === 'holiday')).map(ev => ev.icon).join('');
        const cls = [];
        if (hasMykids || isMyWeekend) cls.push('cell-mykids');
        else if (isMyHolidayDay)       cls.push('cell-holiday-mine');
        else if (hasHoliday)           cls.push('cell-holiday');
        if (isToday)   cls.push('cell-today-mini');
        if (isWeekend) cls.push('weekend-col');
        const title = new Date(y, m, day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + (holidayName ? ` — ${holidayName}` : '');
        html += `<td${cls.length ? ` class="${cls.join(' ')}"` : ''} data-month="${m}" data-day="${day}" data-year="${y}" title="${title}">${day}${holidayName ? `<span class='mini-holiday' title='${holidayName}'>★</span>` : ''}${icons ? `<span class='mini-icons'>${icons}</span>` : ''}</td>`;
        if ((startDay + day) % 7 === 0) html += '</tr><tr>';
      }
      html += '</tr></table></div>';
    }

    // Pied de page : liste des congés scolaires dans la plage
    const fmtDate = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const holidayPeriods = events
      .filter(ev => ev.type === 'holiday' && ev.dateEnd)
      .map(ev => ({ title: ev.title || 'Congés scolaires', start: parseLocalDate(ev.date), end: parseLocalDate(ev.dateEnd) }))
      .filter(ev => ev.start <= rangeEnd && ev.end >= rangeStart)
      .sort((a, b) => a.start - b.start);
    const footerHtml = holidayPeriods.length > 0
      ? `<div class="print-footer-periods"><strong>Congés scolaires :</strong> ${holidayPeriods.map(p => `<span class="print-footer-item">${p.title} : ${fmtDate(p.start)} – ${fmtDate(p.end)}</span>`).join(' &nbsp;|&nbsp; ')}</div>`
      : '';

    html += `</div>
      <div class="year-legend">
        <span class="legend-item"><span class="legend-swatch cell-mykids"></span> Week-ends chez papa 👨‍👧‍👦</span>
        <span class="legend-item"><span class="legend-swatch cell-holiday-mine"></span> Congés scolaires chez papa</span>
        <span class="legend-item"><span class="legend-swatch cell-holiday"></span> Congés scolaires chez maman</span>
        <span class="legend-item"><span class="legend-swatch cell-today-mini"></span> Aujourd'hui</span>
        <span class="legend-item">★ Jour férié</span>
      </div>
      ${footerHtml}`;

    content.innerHTML = html;

    document.getElementById('btn-prev-year').onclick = () => {
      state.calendarDate = new Date(startYear, startMonth - 1, 1); renderYear();
    };
    document.getElementById('btn-next-year').onclick = () => {
      state.calendarDate = new Date(startYear, startMonth + 1, 1); renderYear();
    };
    document.getElementById('btn-today-year').onclick = () => {
      const t = new Date();
      state.calendarDate = new Date(t.getFullYear(), t.getMonth() - 3, 1);
      renderYear();
    };
    document.querySelectorAll('.year-mini-table td[data-day]').forEach(td => {
      td.onclick = () => {
        state.calendarDate = new Date(Number(td.dataset.year), Number(td.dataset.month), Number(td.dataset.day));
        setCalendarView('month');
      };
    });
  })();
}

/* ---------- Vue Mois ---------- */

export function renderMonth() {
  document.body.dataset.calview = 'month';
  const content = document.getElementById('content-view');
  const d = state.calendarDate;
  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const start = (first.getDay() + 6) % 7;

  (async () => {
    const [eventsData, alternanceEntries] = await Promise.all([fetchEvents(), fetchAlternance()]);
    const events = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);

    /* ── Utilitaires internes ─────────────────────────────────────────── */

    function parseLocalDate(str) {
      if (!str) return null;
      const s = typeof str === 'string' ? str : String(str);
      const parts = s.substring(0, 10).split('-');
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    function localKey(y, m, day) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    function isMySaturday(satDate) {
      if (!alternanceEntries || !alternanceEntries.length) return false;
      const ref = alternanceEntries.find(e => {
        const rd = parseLocalDate(e.startDate);
        return rd && rd <= satDate;
      });
      if (!ref) return false;
      const refDate = parseLocalDate(ref.startDate);
      const daysDiff = Math.round((satDate - refDate) / (24 * 60 * 60 * 1000));
      const weeksDiff = Math.round(daysDiff / 7);
      const sameAlternance = weeksDiff % 2 === 0;
      return sameAlternance ? ref.alternanceType === 'mine' : ref.alternanceType !== 'mine';
    }

    function computeHolidayMyDays(evStart, evEnd, myWeek) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const durationDays = Math.round((evEnd - evStart) / msPerDay) + 1;
      const myWeekdays = new Set();
      if (durationDays < 2) return myWeekdays;
      // Détecter si la période contient le 24 décembre
      function findChristmas() {
        for (let y = evStart.getFullYear(); y <= evEnd.getFullYear(); y++) {
          const dec24 = new Date(y, 11, 24);
          if (dec24 >= evStart && dec24 <= evEnd) return dec24;
        }
        return null;
      }
      let isMineFirstHalf;
      if (myWeek === 1) {
        isMineFirstHalf = true;
      } else if (myWeek === 2) {
        isMineFirstHalf = false;
      } else {
        const christmas = findChristmas();
        if (christmas) {
          // Règle Noël : années paires → Noël chez moi
          const isEvenYear = christmas.getFullYear() % 2 === 0;
          const halfDay = Math.floor(durationDays / 2);
          const dec24Idx = Math.round((christmas - evStart) / msPerDay);
          const christmasInFirstHalf = dec24Idx < halfDay;
          isMineFirstHalf = isEvenYear ? christmasInFirstHalf : !christmasInFirstHalf;
        } else {
          // Règle par défaut : samedi précédant
          let precedingSat = new Date(evStart);
          while (precedingSat.getDay() !== 6) {
            precedingSat.setDate(precedingSat.getDate() - 1);
          }
          isMineFirstHalf = isMySaturday(precedingSat);
        }
      }
      const halfDay = Math.floor(durationDays / 2);
      for (let i = 0; i < durationDays; i++) {
        const cur = new Date(evStart);
        cur.setDate(cur.getDate() + i);
        const dow = cur.getDay();
        if (dow === 0 || dow === 6) continue; // week-ends gérés par alternance
        const inFirstHalf = i < halfDay;
        if ((inFirstHalf && isMineFirstHalf) || (!inFirstHalf && !isMineFirstHalf)) {
          myWeekdays.add(localKey(cur.getFullYear(), cur.getMonth(), cur.getDate()));
        }
      }
      return myWeekdays;
    }

    /* ── 1. Indexation événements par date ────────────────────────────── */

    const eventsByDate = {};

    for (const ev of events) {
      if (!ev.date) continue;
      const baseDate = parseLocalDate(ev.date);
      const ey = baseDate.getFullYear();
      const em = baseDate.getMonth();
      const ed = baseDate.getDate();

      if ((ev.type === 'holiday' || ev.type === 'mykids') && ev.dateEnd) {
        const endDate = parseLocalDate(ev.dateEnd);
        let cur = new Date(baseDate);
        while (cur <= endDate) {
          if (cur.getFullYear() === year && cur.getMonth() === month) {
            const k = localKey(year, month, cur.getDate());
            if (!eventsByDate[k]) eventsByDate[k] = [];
            if (!eventsByDate[k].find(e => e.id === ev.id)) eventsByDate[k].push(ev);
          }
          cur.setDate(cur.getDate() + 1);
        }
        continue;
      }

      let occs = [];
      if (!ev.recurrence || ev.recurrence === 'none') {
        if (ey === year && em === month) occs = [ed];
      } else if (ev.recurrence === 'daily') {
        for (let day = 1; day <= last.getDate(); day++) occs.push(day);
      } else if (ev.recurrence === 'biweekly' || ev.recurrence === 'biweekly-2days') {
        let occ = new Date(baseDate);
        while (occ < new Date(year, month, 1)) occ.setDate(occ.getDate() + 14);
        while (occ.getFullYear() === year && occ.getMonth() === month && occ <= last) {
          occs.push(occ.getDate());
          if (ev.recurrence === 'biweekly-2days') {
            const next = occ.getDate() + 1;
            if (next <= last.getDate()) occs.push(next);
          }
          occ.setDate(occ.getDate() + 14);
        }
      } else if (ev.recurrence === 'weekly') {
        let occ = new Date(baseDate);
        while (occ < new Date(year, month, 1)) occ.setDate(occ.getDate() + 7);
        while (occ.getFullYear() === year && occ.getMonth() === month && occ <= last) {
          occs.push(occ.getDate());
          occ.setDate(occ.getDate() + 7);
        }
      } else if (ev.recurrence === 'monthly') {
        if (ed <= last.getDate()) occs = [ed];
      } else if (ev.recurrence === 'yearly') {
        if (em === month && ed <= last.getDate()) occs = [ed];
      }

      for (const day of occs) {
        const key = localKey(year, month, day);
        if (!eventsByDate[key]) eventsByDate[key] = [];
        eventsByDate[key].push(ev);
      }
    }

    /* ── 2. Calcul jours "chez moi" par alternance ────────────────────── */

    const myWeekendDays     = new Set(); // vert clair
    const myHolidayWeekdays = new Set(); // vert foncé

    for (let day = 1; day <= last.getDate(); day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === 6 && isMySaturday(date)) {
        myWeekendDays.add(localKey(year, month, day));
        if (day + 1 <= last.getDate()) myWeekendDays.add(localKey(year, month, day + 1));
      }
    }

    for (const ev of events) {
      if (ev.type !== 'holiday' || !ev.dateEnd) continue;
      const myWeek = ev.myHolidayWeek ? Number(ev.myHolidayWeek) : null;
      computeHolidayMyDays(parseLocalDate(ev.date), parseLocalDate(ev.dateEnd), myWeek)
        .forEach(k => myHolidayWeekdays.add(k));
    }

    /* ── 3. Rendu HTML ────────────────────────────────────────────────── */

    // Jours fériés pour l'année du mois affiché
    const frenchHolidays = getFrenchHolidays(year);

    let html = `
      <div class="calendar-title-bar">
        <button id="btn-prev-month">◀</button>
        <span>${first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
        <button id="btn-next-month">▶</button>
        <button id="btn-today" class="btn-today">Aujourd'hui</button>
      </div>
    `;
    html += `<table class="calendar-table"><tr>`;
    ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].forEach(j => {
      html += `<th>${j}</th>`;
    });
    html += '</tr><tr>';

    for (let i = 0; i < start; i++) html += '<td></td>';

    for (let day = 1; day <= last.getDate(); day++) {
      const date = new Date(year, month, day);
      const key  = localKey(year, month, day);
      const dayEvents = eventsByDate[key] || [];
      const isToday   = (date.toDateString() === new Date().toDateString());
      const hasMykidsManual  = dayEvents.some(ev => ev.type === 'mykids');
      const hasHoliday       = dayEvents.some(ev => ev.type === 'holiday');
      const isMyWeekend      = myWeekendDays.has(key);
      const isMyHolidayDay   = myHolidayWeekdays.has(key);
      const holidayName      = frenchHolidays.get(key);
      const isWeekendDay     = date.getDay() === 0 || date.getDay() === 6;
      let cellClass = '';
      if (hasMykidsManual || isMyWeekend) cellClass = 'cell-mykids';
      else if (isMyHolidayDay)            cellClass = 'cell-holiday-mine';
      else if (hasHoliday)                cellClass = 'cell-holiday';

      const holidayStar = holidayName ? `<span class='cell-holiday-star' title='${holidayName}'>★</span>` : '';
      const eventsHtml = dayEvents
        .filter(ev => ev.type !== 'mykids' && ev.type !== 'holiday')
        .map(ev => ev.title ? `<div class='event-title'>${ev.title}</div>` : '')
        .join('');
      // Pas d'icône de congés le week-end
      const iconsHtml = dayEvents
        .filter(ev => !(isWeekendDay && ev.type === 'holiday'))
        .map(ev => ev.icon || '').join(' ');

      html += `<td data-day="${day}"${cellClass ? ` class="${cellClass}"` : ''}>
        <div class="cell-rect">
          <div class="cell-zone-top">
            <span class="cell-day${isToday ? ' cell-day-today' : ''}">${day}</span>
          </div>
          ${holidayStar}
          <div class="cell-zone-middle">${eventsHtml || '&nbsp;'}</div>
          <div class="cell-zone-bottom">${iconsHtml}</div>
        </div>
      </td>`;
      if ((start + day) % 7 === 0) html += '</tr><tr>';
    }
    html += '</tr></table>';

    // Pied de page : congés scolaires du mois
    const monthStart = new Date(year, month, 1);
    const monthEnd   = new Date(year, month + 1, 0);
    const fmtDate = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const holidayPeriods = events
      .filter(ev => ev.type === 'holiday' && ev.dateEnd)
      .map(ev => ({ title: ev.title || 'Congés scolaires', start: parseLocalDate(ev.date), end: parseLocalDate(ev.dateEnd) }))
      .filter(ev => ev.start <= monthEnd && ev.end >= monthStart)
      .sort((a, b) => a.start - b.start);
    if (holidayPeriods.length > 0) {
      html += `<div class="print-footer-periods"><strong>Congés scolaires :</strong> ${holidayPeriods.map(p => `<span class="print-footer-item">${p.title} : ${fmtDate(p.start)} – ${fmtDate(p.end)}</span>`).join(' &nbsp;|&nbsp; ')}</div>`;
    }

    content.innerHTML = html;

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
  document.body.dataset.calview = 'week';
  const content = document.getElementById('content-view');
  content.innerHTML = '<div class="event-list-loading">Chargement…</div>';

  (async () => {
    const [eventsData, alternanceEntries] = await Promise.all([fetchEvents(), fetchAlternance()]);
    const events = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);

    /* ── Utilitaires ─────────────────────────────────────────────────── */
    function parseLocalDate(str) {
      if (!str) return null;
      const s = typeof str === 'string' ? str : String(str);
      const p = s.substring(0, 10).split('-');
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }
    function localKey(y, m, day) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    function isMySaturday(satDate) {
      if (!alternanceEntries || !alternanceEntries.length) return false;
      const ref = alternanceEntries.find(e => {
        const rd = parseLocalDate(e.startDate);
        return rd && rd <= satDate;
      });
      if (!ref) return false;
      const refDate = parseLocalDate(ref.startDate);
      const daysDiff = Math.round((satDate - refDate) / (24 * 60 * 60 * 1000));
      const weeksDiff = Math.round(daysDiff / 7);
      return weeksDiff % 2 === 0 ? ref.alternanceType === 'mine' : ref.alternanceType !== 'mine';
    }
    function computeHolidayMyDays(evStart, evEnd, myWeek) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const durationDays = Math.round((evEnd - evStart) / msPerDay) + 1;
      const myWeekdays = new Set();
      if (durationDays < 2) return myWeekdays;
      function findChristmas() {
        for (let y = evStart.getFullYear(); y <= evEnd.getFullYear(); y++) {
          const dec24 = new Date(y, 11, 24);
          if (dec24 >= evStart && dec24 <= evEnd) return dec24;
        }
        return null;
      }
      let isMineFirstHalf;
      if (myWeek === 1) { isMineFirstHalf = true; }
      else if (myWeek === 2) { isMineFirstHalf = false; }
      else {
        const christmas = findChristmas();
        if (christmas) {
          const isEvenYear = christmas.getFullYear() % 2 === 0;
          const halfDay = Math.floor(durationDays / 2);
          const dec24Idx = Math.round((christmas - evStart) / msPerDay);
          const christmasInFirstHalf = dec24Idx < halfDay;
          isMineFirstHalf = isEvenYear ? christmasInFirstHalf : !christmasInFirstHalf;
        } else {
          let precedingSat = new Date(evStart);
          while (precedingSat.getDay() !== 6) precedingSat.setDate(precedingSat.getDate() - 1);
          isMineFirstHalf = isMySaturday(precedingSat);
        }
      }
      const halfDay = Math.floor(durationDays / 2);
      for (let i = 0; i < durationDays; i++) {
        const cur = new Date(evStart); cur.setDate(cur.getDate() + i);
        const dow = cur.getDay();
        if (dow === 0 || dow === 6) continue;
        const inFirstHalf = i < halfDay;
        if ((inFirstHalf && isMineFirstHalf) || (!inFirstHalf && !isMineFirstHalf))
          myWeekdays.add(localKey(cur.getFullYear(), cur.getMonth(), cur.getDate()));
      }
      return myWeekdays;
    }

    /* ── Calcul du lundi de la semaine ───────────────────────────────── */
    const d = new Date(state.calendarDate);
    const dow = (d.getDay() + 6) % 7; // 0=lun, 6=dim
    d.setDate(d.getDate() - dow);
    d.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(d); dd.setDate(d.getDate() + i); return dd;
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* ── Jours fériés ────────────────────────────────────────────────── */
    const yearSet = [...new Set(weekDays.map(dd => dd.getFullYear()))];
    const frenchHolidays = new Map();
    yearSet.forEach(y => getFrenchHolidays(y).forEach((name, k) => frenchHolidays.set(k, name)));

    /* ── Indexation événements pour la semaine ───────────────────────── */
    const eventsByDate = {};
    for (const ev of events) {
      if (!ev.date) continue;
      const baseDate = parseLocalDate(ev.date);
      if ((ev.type === 'holiday' || ev.type === 'mykids') && ev.dateEnd) {
        const endDate = parseLocalDate(ev.dateEnd);
        let cur = new Date(baseDate);
        while (cur <= endDate) {
          const k = localKey(cur.getFullYear(), cur.getMonth(), cur.getDate());
          if (weekDays.some(wd => localKey(wd.getFullYear(), wd.getMonth(), wd.getDate()) === k)) {
            if (!eventsByDate[k]) eventsByDate[k] = [];
            if (!eventsByDate[k].find(e => e.id === ev.id)) eventsByDate[k].push(ev);
          }
          cur.setDate(cur.getDate() + 1);
        }
        continue;
      }
      for (const wd of weekDays) {
        const ey = baseDate.getFullYear(), em = baseDate.getMonth(), ed = baseDate.getDate();
        const wy = wd.getFullYear(), wm = wd.getMonth(), wday = wd.getDate();
        let match = false;
        if (!ev.recurrence || ev.recurrence === 'none') {
          match = ey === wy && em === wm && ed === wday;
        } else if (ev.recurrence === 'daily') {
          match = true;
        } else if (ev.recurrence === 'weekly') {
          const diff = Math.round((wd - baseDate) / 86400000);
          match = diff >= 0 && diff % 7 === 0;
        } else if (ev.recurrence === 'biweekly' || ev.recurrence === 'biweekly-2days') {
          const diff = Math.round((wd - baseDate) / 86400000);
          match = diff >= 0 && diff % 14 === 0;
          if (!match && ev.recurrence === 'biweekly-2days') {
            const prev = new Date(wd); prev.setDate(wd.getDate() - 1);
            const d2 = Math.round((prev - baseDate) / 86400000);
            match = d2 >= 0 && d2 % 14 === 0;
          }
        } else if (ev.recurrence === 'monthly') {
          match = ed === wday;
        } else if (ev.recurrence === 'yearly') {
          match = em === wm && ed === wday;
        }
        if (match) {
          const k = localKey(wy, wm, wday);
          if (!eventsByDate[k]) eventsByDate[k] = [];
          if (!eventsByDate[k].find(e => e.id === ev.id)) eventsByDate[k].push(ev);
        }
      }
    }

    /* ── Calcul couleurs ─────────────────────────────────────────────── */
    const myWeekendDays     = new Set();
    const myHolidayWeekdays = new Set();
    for (const wd of weekDays) {
      if (wd.getDay() === 6 && isMySaturday(wd)) {
        myWeekendDays.add(localKey(wd.getFullYear(), wd.getMonth(), wd.getDate()));
        const sun = new Date(wd); sun.setDate(wd.getDate() + 1);
        myWeekendDays.add(localKey(sun.getFullYear(), sun.getMonth(), sun.getDate()));
      }
    }
    const rangeStart = weekDays[0], rangeEnd = weekDays[6];
    for (const ev of events) {
      if (ev.type !== 'holiday' || !ev.dateEnd) continue;
      const evStart = parseLocalDate(ev.date), evEnd = parseLocalDate(ev.dateEnd);
      if (evEnd < rangeStart || evStart > rangeEnd) continue;
      const myWeek = ev.myHolidayWeek ? Number(ev.myHolidayWeek) : null;
      computeHolidayMyDays(evStart, evEnd, myWeek).forEach(k => myHolidayWeekdays.add(k));
    }

    /* ── Trouver heure min/max pour cadrage ──────────────────────────── */
    // Plage horaire : 7h–22h (événements à heure spécifique)
    const HOUR_START = 7, HOUR_END = 22;

    /* ── Rendu HTML ──────────────────────────────────────────────────── */
    const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    const weekStr = `Semaine ${getWeekNumber(d)} — ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} → ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    let html = `
      <div class="week-title-bar">
        <button id="btn-prev-week">◀</button>
        <span>${weekStr}</span>
        <button id="btn-next-week">▶</button>
        <button id="btn-today-week" class="btn-today">Aujourd'hui</button>
      </div>
      <div class="week-wrapper">
        <table class="week-table">
          <thead><tr>
            <th class="week-time-col"></th>`;

    weekDays.forEach((wd, i) => {
      const key = localKey(wd.getFullYear(), wd.getMonth(), wd.getDate());
      const isToday = wd.getTime() === today.getTime();
      const isWe    = wd.getDay() === 0 || wd.getDay() === 6;
      const hasMykids = (eventsByDate[key] || []).some(ev => ev.type === 'mykids');
      const isMyWe    = myWeekendDays.has(key);
      const isMyHol   = myHolidayWeekdays.has(key);
      const hasHol    = (eventsByDate[key] || []).some(ev => ev.type === 'holiday');
      let cls = 'week-day-header';
      if (hasMykids || isMyWe)  cls += ' wh-mykids';
      else if (isMyHol)          cls += ' wh-holiday-mine';
      else if (hasHol)           cls += ' wh-holiday';
      if (isToday)               cls += ' wh-today';
      if (isWe)                  cls += ' wh-weekend';
      const holidayName = frenchHolidays.get(key);
      html += `<th class="${cls}" data-date="${key}">
        <div class="week-day-name">${dayNames[i]}</div>
        <div class="week-day-num${isToday ? ' wdn-today' : ''}">${wd.getDate()}</div>
        ${holidayName ? `<div class="week-day-holiday">🎌 ${holidayName}</div>` : ''}
      </th>`;
    });
    html += '</tr></thead><tbody>';

    // Ligne "Journée entière" (événements sans heure, congés, etc.)
    html += '<tr><td class="week-time-label week-allday-label">Journée</td>';
    weekDays.forEach(wd => {
      const key = localKey(wd.getFullYear(), wd.getMonth(), wd.getDate());
      const evs = (eventsByDate[key] || []).filter(ev => !ev.eventTime || ev.eventTime === '00:00:00' || ev.eventTime === null);
      const isWe = wd.getDay() === 0 || wd.getDay() === 6;
      html += `<td class="week-allday-cell${isWe ? ' week-cell-we' : ''}" data-date="${key}" data-time="">`;
      evs.forEach(ev => {
        if (ev.type === 'mykids' || ev.type === 'holiday') return;
        if (ev.title) html += `<div class="week-ev week-ev-allday" data-id="${ev.id}">${ev.icon || ''} ${ev.title}<span class="week-ev-actions"><button class="week-ev-edit" data-id="${ev.id}" title="Modifier">✏️</button><button class="week-ev-del" data-id="${ev.id}" title="Supprimer">🗑️</button></span></div>`;
      });
      html += '</td>';
    });
    html += '</tr>';

    // Lignes horaires
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      html += `<tr><td class="week-time-label">${String(h).padStart(2,'0')}:00</td>`;
      weekDays.forEach(wd => {
        const key = localKey(wd.getFullYear(), wd.getMonth(), wd.getDate());
        const hStr = `${String(h).padStart(2,'0')}:`;
        const evs = (eventsByDate[key] || []).filter(ev => ev.eventTime && ev.eventTime.startsWith(hStr));
        const isWe = wd.getDay() === 0 || wd.getDay() === 6;
        const nowHour = (today.getTime() === wd.getTime()) ? new Date().getHours() : -1;
        const isCurrent = (h === nowHour);
        const timeStr = `${String(h).padStart(2,'0')}:00`;
        html += `<td class="week-cell${isWe ? ' week-cell-we' : ''}${isCurrent ? ' week-cell-now' : ''}" data-date="${key}" data-time="${timeStr}">`;
        evs.forEach(ev => {
          if (ev.title) html += `<div class="week-ev" data-id="${ev.id}">${ev.icon || ''} ${ev.title}<span class="week-ev-actions"><button class="week-ev-edit" data-id="${ev.id}" title="Modifier">✏️</button><button class="week-ev-del" data-id="${ev.id}" title="Supprimer">🗑️</button></span></div>`;
        });
        html += '</td>';
      });
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    content.innerHTML = html;

    document.getElementById('btn-prev-week').onclick = () => {
      state.calendarDate = new Date(d); state.calendarDate.setDate(d.getDate() - 7); renderWeek();
    };
    document.getElementById('btn-next-week').onclick = () => {
      state.calendarDate = new Date(d); state.calendarDate.setDate(d.getDate() + 7); renderWeek();
    };
    document.getElementById('btn-today-week').onclick = () => {
      state.calendarDate = new Date(); renderWeek();
    };
    // Clic sur un jour → vue mois
    document.querySelectorAll('.week-day-header[data-date]').forEach(th => {
      th.style.cursor = 'pointer';
      th.onclick = () => {
        const [y, m, day] = th.dataset.date.split('-').map(Number);
        state.calendarDate = new Date(y, m - 1, day);
        setCalendarView('month');
      };
    });
    // Clic sur une cellule vide → créer un événement (mode édition)
    document.querySelectorAll('.week-cell[data-date], .week-allday-cell[data-date]').forEach(td => {
      td.onclick = (e) => {
        // Ne pas déclencher si clic sur un bouton d'action
        if (e.target.closest('.week-ev-actions')) return;
        if (window.clepsydreApp) window.clepsydreApp.openCreateModal(td.dataset.date, td.dataset.time || '');
      };
    });
    // Boutons modifier / supprimer sur les événements
    document.querySelectorAll('.week-ev-edit').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (window.clepsydreApp) window.clepsydreApp.openEditModal(btn.dataset.id);
      };
    });
    document.querySelectorAll('.week-ev-del').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Supprimer cet événement ?') && window.clepsydreApp)
          window.clepsydreApp.deleteEventById(btn.dataset.id);
      };
    });
  })();
}
