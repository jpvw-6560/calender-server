// app.js
import { initEditModeToggle, showNotification, requireEditMode } from './ui.js';
import { setCalendarView } from './calendar.js';
import { state } from './state.js';

// ID de l'événement en cours d'édition (null = création)
let currentEditId = null;

document.addEventListener('DOMContentLoaded', () => {

  // ── Visibilité du bouton "Créer" et du sous-item "Garde alternée" ────────
  function updateCreateButton() {
    const btnCreate  = document.getElementById('btn-create-event');
    const btnPdf     = document.getElementById('btn-print-pdf');
    const subAlt     = document.querySelector('.nav-item[data-view="alternance"]');
    const activeNav  = document.querySelector('.nav-item.active');
    const view       = activeNav ? activeNav.dataset.view : null;
    const onEvents   = (view === 'events' || view === 'alternance');
    // Bouton Créer : visible en vue événements ET en vue calendrier semaine (mode édition)
    if (btnCreate) btnCreate.style.display = (state.editMode && (view === 'events' || (!view && document.body.dataset.calview === 'week'))) ? '' : 'none';
    // Bouton PDF : visible uniquement sur la vue calendrier (aucun nav-item actif)
    if (btnPdf) btnPdf.style.display = (!view) ? '' : 'none';
    // Sous-item Garde alternée : visible quand Evénements ou Garde est actif
    if (subAlt) subAlt.style.display = onEvents ? '' : 'none';
  }

  // ── Gestion bouton "Événements" ──────────────────────────────────────────
  const btnEvents = document.querySelector('.nav-item[data-view="events"]');
  if (btnEvents) {
    btnEvents.onclick = async () => {
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      btnEvents.classList.add('active');
      updateCreateButton();
      await renderEventList();
    };
  }

  // ── Gestion bouton "Garde alternée" ─────────────────────────────────────
  const btnAlternance = document.querySelector('.nav-item[data-view="alternance"]');
  if (btnAlternance) {
    btnAlternance.onclick = async () => {
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      btnAlternance.classList.add('active');
      updateCreateButton();
      await renderAlternanceConfig();
    };
  }

  // ── Navigation calendrier ────────────────────────────────────────────────
  document.querySelectorAll('.btn-calnav[data-calview]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      // Gérer la classe active sur les boutons de vue (sur PC ; sur mobile, Mois reste toujours vert via CSS)
      document.querySelectorAll('.btn-calnav[data-calview]').forEach(b => b.classList.remove('btn-calnav-active'));
      btn.classList.add('btn-calnav-active');
      updateCreateButton();
      setCalendarView(btn.dataset.calview);
    };
  });

  // ── Bouton "Créer un événement" ─────────────────────────────────────────
  const btnCreate = document.getElementById('btn-create-event');
  if (btnCreate) {
    btnCreate.addEventListener('click', (e) => {
      if (!requireEditMode('créer un événement')) { e.preventDefault(); return; }
      currentEditId = null;
      resetModalForm();
      document.getElementById('modal-event-title').textContent = 'Créer un événement';
      document.getElementById('modal-event').style.display = 'flex';
    });
  }

  // ── Bouton "Calendrier en PDF" ──────────────────────────────────────────
  const btnPdf = document.getElementById('btn-print-pdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', async () => {
      // Mémoriser l'état actuel
      const prevView = state.currentView;
      const prevDate = new Date(state.calendarDate);

      // Basculer sur la vue année si ce n'est pas déjà le cas
      if (document.body.dataset.calview !== 'year') {
        setCalendarView('year');
        // Attendre que la vue soit rendue
        await new Promise(r => setTimeout(r, 350));
      }

      // Toujours paysage pour la vue année
      const style = document.createElement('style');
      style.id = 'print-orientation-override';
      style.textContent = '@page { size: A4 landscape; }';
      document.head.appendChild(style);

      // Injecter la date d'impression
      const footer = document.getElementById('print-date-footer');
      if (footer) {
        const now = new Date();
        footer.textContent = 'Imprimé le ' + now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }

      window.print();

      setTimeout(() => {
        style.remove();
        // Restaurer la vue précédente si elle était différente
        if (prevView && prevView !== 'year') {
          state.calendarDate = prevDate;
          setCalendarView(prevView);
        }
      }, 1500);
    });
  }

  // ── Fermer la modale ─────────────────────────────────────────────────────
  const btnCloseModal = document.getElementById('modal-event-close');
  if (btnCloseModal) {
    btnCloseModal.onclick = () => {
      document.getElementById('modal-event').style.display = 'none';
      document.getElementById('modal-event-title').textContent = 'Créer un événement';
      currentEditId = null;
    };
  }

  // ── Formulaire événement (création ET modification) ──────────────────────
  const eventForm = document.getElementById('event-form');
  if (eventForm) {

    // Affichage dynamique selon le type
    const eventType = document.getElementById('event-type');
    const recurrenceRow = document.getElementById('recurrence-row');
    const dateEndRow    = document.getElementById('date-end-row');
    const dateStartLabel= document.getElementById('date-start-label');

    const updateFieldVisibility = () => {
      const t = eventType.value;
      recurrenceRow.style.display      = t === 'recurring' ? '' : 'none';
      dateEndRow.style.display         = (t === 'holiday' || t === 'mykids') ? '' : 'none';
      const holidayWeekRow = document.getElementById('holiday-week-row');
      if (holidayWeekRow) holidayWeekRow.style.display = t === 'holiday' ? '' : 'none';
      dateStartLabel.textContent       = (t === 'holiday' || t === 'mykids') ? 'Du :' : "Date de l'événement :";
      const timeRow = document.getElementById('event-time-row');
      if (timeRow) timeRow.style.display = (t === 'single' || t === 'recurring' || t === 'birthday') ? '' : 'none';
    };
    if (eventType) {
      eventType.addEventListener('change', updateFieldVisibility);
      updateFieldVisibility();
    }

    // Affichage dynamique heure Telegram
    const telegramCb        = document.getElementById('event-telegram');
    const telegramTimeInput = document.getElementById('event-telegram-time');
    if (telegramCb && telegramTimeInput) {
      const updateTelegramTime = () => {
        telegramTimeInput.style.display = telegramCb.checked ? '' : 'none';
        telegramTimeInput.disabled = !telegramCb.checked;
        if (!telegramCb.checked) telegramTimeInput.value = '';
      };
      telegramCb.addEventListener('change', updateTelegramTime);
      updateTelegramTime();
    }

    // Sélection rapide icône
    const iconList  = document.getElementById('event-icon-list');
    const iconInput = document.getElementById('event-icon');
    if (iconList && iconInput) {
      iconList.addEventListener('change', () => {
        if (iconList.value) {
          iconInput.value = iconList.value;
          iconList.value = ''; // Revenir à (choisir)
        }
      });
    }

    // Soumission
    eventForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const showTitleCb = document.getElementById('event-show-title');
      const titleInput  = document.getElementById('event-title');
      const showIconCb  = document.getElementById('event-show-icon');
      const iconInp     = document.getElementById('event-icon');
      const telegramChk = document.getElementById('event-telegram');
      const telegramT   = document.getElementById('event-telegram-time');
      const dateInput   = document.getElementById('event-date');
      const dateEndInput= document.getElementById('event-date-end');
      const recInput    = document.getElementById('event-recurrence');
      const typeInput   = document.getElementById('event-type');

      // Validations
      if (showTitleCb.checked && !titleInput.value.trim()) {
        titleInput.focus(); titleInput.style.borderColor = '#e53935';
        setTimeout(() => { titleInput.style.borderColor = ''; }, 1500);
        showNotification('Veuillez saisir un texte à afficher.', 'error'); return;
      }
      if (showIconCb.checked && !iconInp.value.trim()) {
        iconInp.focus(); iconInp.style.borderColor = '#e53935';
        setTimeout(() => { iconInp.style.borderColor = ''; }, 1500);
        showNotification('Veuillez choisir une icône.', 'error'); return;
      }
      if (telegramChk.checked && !telegramT.value) {
        telegramT.focus(); telegramT.style.borderColor = '#e53935';
        setTimeout(() => { telegramT.style.borderColor = ''; }, 1500);
        showNotification('Veuillez indiquer une heure pour Telegram.', 'error'); return;
      }
      if ((typeInput.value === 'holiday' || typeInput.value === 'mykids') && !dateEndInput.value) {
        dateEndInput.focus(); dateEndInput.style.borderColor = '#e53935';
        setTimeout(() => { dateEndInput.style.borderColor = ''; }, 1500);
        showNotification('Veuillez indiquer la date de fin des vacances.', 'error'); return;
      }

      const payload = {
        title:           titleInput.value.trim(),
        type:            typeInput.value,
        date:            dateInput.value || null,
        dateEnd:         (typeInput.value === 'holiday' || typeInput.value === 'mykids') ? (dateEndInput.value || null) : null,
        showTitle:       showTitleCb.checked,
        showIcon:        showIconCb.checked,
        icon:            iconInp.value.trim(),
        sendTelegram:    telegramChk.checked,
        telegramTime:    telegramChk.checked ? telegramT.value : null,
        recurrence:      typeInput.value === 'recurring' ? (recInput ? recInput.value : null) : null,
        myHolidayWeek:   typeInput.value === 'holiday' ? (Number(document.getElementById('event-holiday-week')?.value) || null) : null,
        eventTime:       document.getElementById('event-time')?.value || null,
      };

      try {
        if (currentEditId) {
          const { updateEvent } = await import('./events.js');
          await updateEvent(currentEditId, payload);
          showNotification('Événement modifié avec succès', 'success');
        } else {
          const { createEvent } = await import('./events.js');
          await createEvent(payload);
          showNotification('Événement enregistré', 'success');
        }
        document.getElementById('modal-event').style.display = 'none';
        document.getElementById('modal-event-title').textContent = 'Créer un événement';
        currentEditId = null;
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.dataset.view === 'events') {
          await renderEventList();
        } else if (document.body.dataset.calview === 'week') {
          setCalendarView('week');
        } else {
          setCalendarView('month');
        }
      } catch {
        showNotification("Erreur lors de l'enregistrement", 'error');
      }
    });
  }

  // ── Toggle mode édition : rafraîchir la vue active + bouton ────────────
  const editModeToggle = document.getElementById('editmode-toggle');
  if (editModeToggle) {
    editModeToggle.addEventListener('change', async () => {
      updateCreateButton();
      const activeNav = document.querySelector('.nav-item.active');
      if (activeNav && activeNav.dataset.view === 'events')     await renderEventList();
      if (activeNav && activeNav.dataset.view === 'alternance') await renderAlternanceConfig();
    });
  }

  initEditModeToggle();
  // Au démarrage : aucun nav-item actif → calendrier affiché, boutons masqués
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  updateCreateButton();
  setCalendarView('month');

  // ── API globale pour calendar.js (create / edit depuis vue semaine) ───────
  window.clepsydreApp = {
    openCreateModal(dateStr, timeStr) {
      if (!state.editMode) return;
      currentEditId = null;
      resetModalForm();
      // Pré-sélectionner type "Ponctuel" et déclencher la visibilité
      const typeSelect = document.getElementById('event-type');
      typeSelect.value = 'single';
      typeSelect.dispatchEvent(new Event('change'));
      if (dateStr) document.getElementById('event-date').value = dateStr;
      if (timeStr) {
        const timeInp = document.getElementById('event-time');
        if (timeInp) timeInp.value = timeStr;
      }
      document.getElementById('modal-event-title').textContent = 'Créer un événement';
      document.getElementById('modal-event').style.display = 'flex';
    },
    async openEditModal(eventId) {
      if (!state.editMode) return;
      try {
        const { fetchEventById } = await import('./events.js');
        const ev = await fetchEventById(eventId);
        const typeSelect = document.getElementById('event-type');
        typeSelect.value = ev.type || 'single';
        typeSelect.dispatchEvent(new Event('change'));
        document.getElementById('event-date').value         = toInputDate(ev.date);
        document.getElementById('event-date-end').value     = toInputDate(ev.dateEnd);
        document.getElementById('event-title').value        = ev.title || '';
        document.getElementById('event-show-title').checked = ev.showTitle === 1 || ev.showTitle === true;
        document.getElementById('event-icon').value         = ev.icon || '';
        document.getElementById('event-show-icon').checked  = ev.showIcon === 1 || ev.showIcon === true;
        const telegramCb = document.getElementById('event-telegram');
        const telegramT  = document.getElementById('event-telegram-time');
        telegramCb.checked = ev.sendTelegram === 1 || ev.sendTelegram === true;
        telegramCb.dispatchEvent(new Event('change'));
        telegramT.value = ev.telegramTime ? ev.telegramTime.substring(0, 5) : '';
        if (ev.type === 'recurring') document.getElementById('event-recurrence').value = ev.recurrence || 'weekly';
        if (ev.type === 'holiday') {
          const hwSel = document.getElementById('event-holiday-week');
          if (hwSel) hwSel.value = ev.myHolidayWeek ? String(ev.myHolidayWeek) : '0';
        }
        const timeInp = document.getElementById('event-time');
        if (timeInp) timeInp.value = ev.eventTime ? ev.eventTime.substring(0, 5) : '';
        currentEditId = eventId;
        document.getElementById('modal-event-title').textContent = 'Modifier un événement';
        document.getElementById('modal-event').style.display = 'flex';
      } catch {
        showNotification("Impossible de charger l'événement", 'error');
      }
    },
    async deleteEventById(eventId) {
      if (!state.editMode) return;
      const { deleteEvent } = await import('./events.js');
      await deleteEvent(eventId);
      showNotification('Événement supprimé', 'success');
      setCalendarView('week');
    },
  };
});

// ── Rendu de la liste des événements ────────────────────────────────────────
async function renderEventList() {
  const content = document.getElementById('content-view');
  content.innerHTML = '<div class="event-list-loading">Chargement...</div>';
  const { fetchEvents, fetchAlternance, deleteAlternance } = await import('./events.js');
  const [eventsData, altEntries] = await Promise.all([fetchEvents(), fetchAlternance()]);
  let events = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);
  events = events.slice().sort((a, b) =>
    (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' })
  );
  const editMode = state.editMode;

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

  // Section garde alternée
  const altFormHtml = editMode ? `
    <div style="margin-bottom:10px;">
      <button id="alt-toggle-form" type="button"
        style="background:none;border:1px solid #7dd99a;border-radius:8px;padding:6px 16px;cursor:pointer;color:#1a7a3a;font-size:0.95em;font-weight:600;">
        ➕ Ajouter une référence
      </button>
      <div id="alt-form-container" style="display:none;background:#fff;border:1px solid #7dd99a;border-radius:10px;padding:14px 16px;margin-top:8px;color:#111;">
        <form id="alt-inline-form" style="display:flex;flex-direction:column;gap:12px;max-width:420px;">
          <label style="display:flex;flex-direction:column;gap:4px;color:#111;font-size:0.93em;">
            Samedi de référence
            <div style="display:flex;align-items:center;gap:6px;">
              <input type="date" id="alt-inline-date" required style="width:160px;cursor:pointer;color:#111;"
                onclick="this.showPicker&&this.showPicker()">
              <button type="button" onclick="document.getElementById('alt-inline-date').showPicker&&document.getElementById('alt-inline-date').showPicker()"
                style="border:none;background:none;font-size:1.2em;cursor:pointer;">📅</button>
            </div>
          </label>
          <label style="display:flex;flex-direction:column;gap:4px;color:#111;font-size:0.93em;">
            Ce samedi est
            <select id="alt-inline-type" style="width:240px;color:#111;">
              <option value="mine">👨‍👧‍👦 Mon week-end</option>
              <option value="other">👩 Week-end de l'autre parent</option>
            </select>
          </label>
          <label style="display:flex;flex-direction:column;gap:4px;color:#111;font-size:0.93em;">
            Commentaire (optionnel)
            <input type="text" id="alt-inline-comment" placeholder="ex: échange suite maladie" style="color:#111;width:100%;">
          </label>
          <button type="submit" class="btn-calnav" style="width:fit-content;height:36px;padding:0 20px;">Enregistrer</button>
        </form>
      </div>
    </div>` : '';

  const altListHtml = altEntries.length === 0
    ? `<div style="color:#888;font-style:italic;padding:6px 0;">Aucune référence enregistrée.</div>`
    : altEntries.map(e => `
        <div class="event-card">
          <div class="event-card-header">
            <span class="event-card-title">${e.alternanceType === 'mine' ? '👨‍👧‍👦 Mon week-end' : "👩 Week-end de l'autre parent"}</span>
          </div>
          <div class="event-card-details">
            <span class="event-card-date">${fmtDate(e.startDate)}</span>
            ${e.comment ? `<span class="event-card-recurrence">${e.comment}</span>` : ''}
          </div>
          ${editMode ? `<div class="event-card-actions-bar">
            <button class="alt-delete-inline-btn" title="Supprimer" data-id="${e.id}">🗑️</button>
          </div>` : ''}
        </div>`).join('');

  const altHtml = `
    <div class="event-list-title" style="margin-top:28px;">🔄 Références de garde alternée</div>
    ${altFormHtml}
    <div class="event-list-modern">${altListHtml}</div>`;

  if (!events.length && !altEntries.length) {
    content.innerHTML = '<div class="event-list-empty">Aucun événement enregistré.</div>';
    return;
  }

  const eventsHtml = events.length === 0 ? '' : `
    <div class="event-list-title">📅 Tous les événements</div>
    <div class="event-list-modern">
      ${events.map(ev => {
        const dateStr    = ev.date    ? new Date(ev.date).toLocaleDateString('fr-FR')    : '';
        const dateEndStr = ev.dateEnd ? new Date(ev.dateEnd).toLocaleDateString('fr-FR') : '';
        const plage = (ev.type === 'holiday' || ev.type === 'mykids') && dateEndStr
          ? `Du ${dateStr} au ${dateEndStr}`
          : dateStr;
        return `
        <div class="event-card">
          <div class="event-card-header">
            <span class="event-card-title">${ev.title || '(Sans titre)'}</span>
            ${ev.icon ? `<span class="event-card-icon">${ev.icon}</span>` : ''}
          </div>
          <div class="event-card-details">
            <span class="event-card-date">${plage}</span>
            ${(ev.type === 'birthday' || (ev.recurrence && ev.recurrence !== 'none')) ? `<span class="event-card-recurrence">${ev.type === 'birthday' ? 'Chaque année' : tradRecurrence(ev.recurrence)}</span>` : ''}
            ${ev.sendTelegram ? `<span class="event-card-telegram">🔔 Telegram${ev.telegramTime ? ' à ' + ev.telegramTime : ''}</span>` : ''}
          </div>
          ${editMode ? `<div class="event-card-actions-bar">
            <button class="event-edit-btn" title="Modifier" data-id="${ev.id}">✏️</button>
            <button class="event-delete-btn" title="Supprimer" data-id="${ev.id}">🗑️</button>
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>`;

  content.innerHTML = eventsHtml + altHtml;

  // Boutons modifier
  document.querySelectorAll('.event-edit-btn').forEach(btn => {
    btn.onclick = async () => {
      const eventId = btn.getAttribute('data-id');
      try {
        const { fetchEventById } = await import('./events.js');
        const ev = await fetchEventById(eventId);

        // Mettre à jour le type AVANT de déclencher change (pour recalcul visibilité)
        const typeSelect = document.getElementById('event-type');
        typeSelect.value = ev.type || 'single';
        typeSelect.dispatchEvent(new Event('change'));

        // Pré-remplir tous les champs avec les vraies valeurs BDD
        document.getElementById('event-date').value         = toInputDate(ev.date);
        document.getElementById('event-date-end').value     = toInputDate(ev.dateEnd);
        document.getElementById('event-title').value        = ev.title || '';
        document.getElementById('event-show-title').checked = ev.showTitle === 1 || ev.showTitle === true;
        document.getElementById('event-icon').value         = ev.icon || '';
        document.getElementById('event-show-icon').checked  = ev.showIcon === 1 || ev.showIcon === true;

        const telegramCb = document.getElementById('event-telegram');
        const telegramT  = document.getElementById('event-telegram-time');
        telegramCb.checked = ev.sendTelegram === 1 || ev.sendTelegram === true;
        telegramCb.dispatchEvent(new Event('change'));
        telegramT.value = ev.telegramTime ? ev.telegramTime.substring(0, 5) : '';

        if (ev.type === 'recurring') {
          document.getElementById('event-recurrence').value = ev.recurrence || 'weekly';
        }
        if (ev.type === 'holiday') {
          const hwSel = document.getElementById('event-holiday-week');
          if (hwSel) hwSel.value = ev.myHolidayWeek ? String(ev.myHolidayWeek) : '0';
        }
        const timeInp = document.getElementById('event-time');
        if (timeInp) timeInp.value = ev.eventTime ? ev.eventTime.substring(0, 5) : '';

        currentEditId = eventId;
        document.getElementById('modal-event-title').textContent = 'Modifier un événement';
        document.getElementById('modal-event').style.display = 'flex';
      } catch {
        showNotification("Impossible de charger l'événement", 'error');
      }
    };
  });

  // Boutons supprimer événement
  document.querySelectorAll('.event-delete-btn').forEach(btn => {
    btn.onclick = () => {
      const eventId = btn.getAttribute('data-id');
      showNotification(
        `<div>Confirmer la suppression ?</div>
         <div style='margin-top:8px;'>
           <button id='toast-confirm-yes' style='background:#e53935;color:#fff;border:none;padding:6px 16px;border-radius:6px;margin-right:8px;cursor:pointer;'>Oui</button>
           <button id='toast-confirm-no' style='background:#eee;color:#333;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;'>Annuler</button>
         </div>`,
        'warning', 10000
      );
      setTimeout(() => {
        const btnYes = document.getElementById('toast-confirm-yes');
        const btnNo  = document.getElementById('toast-confirm-no');
        if (btnYes) {
          btnYes.onclick = async () => {
            const { deleteEvent } = await import('./events.js');
            await deleteEvent(eventId);
            showNotification('Événement supprimé', 'success');
            await renderEventList();
          };
        }
        if (btnNo) { btnNo.onclick = () => btnNo.closest('.notification')?.remove(); }
      }, 100);
    };
  });

  // Toggle développer/refermer le formulaire de garde alternée
  document.getElementById('alt-toggle-form')?.addEventListener('click', () => {
    const container = document.getElementById('alt-form-container');
    const btn = document.getElementById('alt-toggle-form');
    const isOpen = container.style.display !== 'none';
    container.style.display = isOpen ? 'none' : 'block';
    btn.textContent = isOpen ? '➕ Ajouter une référence' : '➖ Refermer';
  });

  // Formulaire ajout garde alternée inline
  const altInlineForm = document.getElementById('alt-inline-form');
  if (altInlineForm) {
    altInlineForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { createAlternance } = await import('./events.js');
      const startDate = document.getElementById('alt-inline-date').value;
      const altType   = document.getElementById('alt-inline-type').value;
      const comment   = document.getElementById('alt-inline-comment').value.trim();
      if (!startDate) { showNotification('Veuillez choisir un samedi de référence.', 'error'); return; }
      const d = new Date(startDate + 'T00:00:00');
      if (d.getDay() !== 6) {
        showNotification('⚠️ La date choisie n\'est pas un samedi. Le calcul sera décalé.', 'warning');
      }
      try {
        await createAlternance({ startDate, alternanceType: altType, comment: comment || null });
        showNotification('Référence enregistrée', 'success');
        // Naviguer vers la vue Mois pour voir les couleurs mises à jour
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('.btn-calnav[data-calview="month"]')?.click();
      } catch {
        showNotification('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  // Boutons supprimer référence d'alternance (inline dans la liste événements)
  document.querySelectorAll('.alt-delete-inline-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await deleteAlternance(btn.dataset.id);
        showNotification('Référence supprimée', 'success');
        await renderEventList();
      } catch {
        showNotification('Erreur lors de la suppression', 'error');
      }
    };
  });
}

// ── Traduction des récurrences ──────────────────────────────────────────────
// Parse 'YYYY-MM-DD' ou ISO string sans décalage timezone
function toInputDate(val) {
  if (!val) return '';
  // Extrait les 10 premiers caractères : 'YYYY-MM-DD'
  const s = typeof val === 'string' ? val : (val.toISOString ? val.toISOString() : String(val));
  return s.substring(0, 10);
}
function tradRecurrence(r) {
  const map = {
    'daily':          'Tous les jours',
    'weekly':         'Toutes les semaines',
    'biweekly':       'Tous les 15 jours',
    'biweekly-2days': 'Week-end (sam+dim) / 15 jours',
    'monthly':        'Tous les mois',
    'yearly':         'Chaque année',
  };
  return map[r] || r;
}

// ── Réinitialiser le formulaire pour une création ───────────────────────────
function resetModalForm() {
  document.getElementById('event-form').reset();
  const recurrenceRow = document.getElementById('recurrence-row');
  if (recurrenceRow) recurrenceRow.style.display = 'none';
  const dateEndRow = document.getElementById('date-end-row');
  if (dateEndRow) dateEndRow.style.display = 'none';
  const telegramTimeInput = document.getElementById('event-telegram-time');
  if (telegramTimeInput) telegramTimeInput.style.display = 'none';
  const dateStartLabel = document.getElementById('date-start-label');
  if (dateStartLabel) dateStartLabel.textContent = "Date de l'événement :";
}

// ── Vue configuration garde alternée ────────────────────────────────────────
async function renderAlternanceConfig() {
  const content = document.getElementById('content-view');
  content.innerHTML = '<div class="event-list-loading">Chargement...</div>';

  const { fetchAlternance, createAlternance, deleteAlternance } = await import('./events.js');
  const entries = await fetchAlternance();
  const editMode = state.editMode;

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

  content.innerHTML = `
    <div class="event-list-title">🔄 Garde alternée — configuration</div>
    <div style="max-width:640px; margin:0 auto; padding:16px; color:#111;">

      <div style="background:#f0f9f3; border:1px solid #7dd99a; border-radius:10px; padding:16px; margin-bottom:24px; font-size:0.97em; line-height:1.7;">
        <strong>Règles appliquées automatiquement :</strong><br>
        🟢 <b>Week-end</b> : samedi + dimanche colorés en vert si c'est votre semaine.<br>
        🟢 <b>Congés de 15 jours</b> : semaine 1 si vous aviez le week-end précédant le début, sinon semaine 2.<br>
        🔵 <b>Congés d'1 jour ou semaine de l'autre parent</b> : fond bleu (pas chez vous).<br>
        <em>Pour modifier l'alternance à partir d'une date (ex: échange), ajoutez une nouvelle référence ci-dessous.</em>
      </div>

      ${editMode ? `
      <div style="background:#fff; border:1px solid #ddd; border-radius:10px; padding:16px; margin-bottom:24px; color:#111;">
        <div style="font-weight:600; margin-bottom:12px; color:#111;">➕ Ajouter un point de référence</div>
        <form id="alternance-form" style="display:flex; flex-direction:column; gap:10px;">
          <label style="display:flex; align-items:center; gap:10px;">
            <span style="width:160px;">Samedi de référence :</span>
            <input type="date" id="alt-start-date" required style="width:160px; cursor:pointer;"
              onclick="this.showPicker&&this.showPicker()">
            <button type="button"
              onclick="document.getElementById('alt-start-date').showPicker&&document.getElementById('alt-start-date').showPicker()"
              style="border:none;background:none;font-size:1.3em;cursor:pointer;" title="Ouvrir calendrier">📅</button>
          </label>
          <label style="display:flex; align-items:center; gap:10px;">
            <span style="width:160px;">Ce samedi est :</span>
            <select id="alt-type" style="width:200px;">
              <option value="mine">Mon week-end 👨‍👧‍👦</option>
              <option value="other">Le week-end de l'autre parent</option>
            </select>
          </label>
          <label style="display:flex; align-items:center; gap:10px;">
            <span style="width:160px;">Commentaire :</span>
            <input type="text" id="alt-comment" placeholder="Optionnel" style="flex:1;">
          </label>
          <div style="text-align:right;">
            <button type="submit" class="btn-calnav" style="width:auto;">Enregistrer</button>
          </div>
        </form>
      </div>` : ''}

      <div style="font-weight:600; margin-bottom:10px; color:#111;">Historique des références</div>
      ${entries.length === 0
        ? '<div style="color:#555; font-style:italic;">Aucune référence enregistrée. Ajoutez un point de départ ci-dessus.</div>'
        : `<div style="display:flex; flex-direction:column; gap:8px;">
            ${entries.map(e => `
              <div style="display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #ddd; border-radius:8px; padding:10px 14px;">
                <span style="font-size:1.3em;">${e.alternanceType === 'mine' ? '👨‍👧‍👦' : '👩'}</span>
                <div style="flex:1;">
                  <div style="font-weight:600;">${fmtDate(e.startDate)}</div>
                  <div style="font-size:0.9em; color:#555;">
                    ${e.alternanceType === 'mine' ? 'Mon week-end' : "Week-end de l'autre parent"}
                    ${e.comment ? ` — ${e.comment}` : ''}
                  </div>
                </div>
                ${editMode ? `<button class="alt-delete-btn" data-id="${e.id}"
                  style="background:#e53935;color:#fff;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;">🗑️</button>` : ''}
              </div>`).join('')}
          </div>`
      }
    </div>
  `;

  // Soumission formulaire
  const altForm = document.getElementById('alternance-form');
  if (altForm) {
    altForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const startDate = document.getElementById('alt-start-date').value;
      const altType   = document.getElementById('alt-type').value;
      const comment   = document.getElementById('alt-comment').value.trim();
      if (!startDate) { showNotification('Veuillez choisir un samedi de référence.', 'error'); return; }
      // Avertir si ce n'est pas un samedi
      const d = new Date(startDate + 'T00:00:00');
      if (d.getDay() !== 6) {
        showNotification('⚠️ La date choisie n\'est pas un samedi. Le calcul sera décalé.', 'warning');
      }
      try {
        await createAlternance({ startDate, alternanceType: altType, comment: comment || null });
        showNotification('Référence enregistrée', 'success');
        await renderAlternanceConfig();
        setCalendarView('month'); // Rafraîchir le calendrier
      } catch {
        showNotification('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  // Boutons supprimer
  document.querySelectorAll('.alt-delete-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await deleteAlternance(btn.dataset.id);
        showNotification('Référence supprimée', 'success');
        await renderAlternanceConfig();
        setCalendarView('month');
      } catch {
        showNotification('Erreur lors de la suppression', 'error');
      }
    };
  });
}

