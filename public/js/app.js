    // Affichage dynamique du champ récurrence
    const eventType = document.getElementById('event-type');
    const recurrenceRow = document.getElementById('recurrence-row');
    if (eventType && recurrenceRow) {
      const updateRecurrenceVisibility = () => {
        recurrenceRow.style.display = eventType.value === 'recurring' ? '' : 'none';
      };
      eventType.addEventListener('change', updateRecurrenceVisibility);
      updateRecurrenceVisibility();
    }
    // Validation du formulaire événement : texte et icône obligatoires si cases cochées
    import { showNotification } from './ui.js';
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
      eventForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const showTitle = document.getElementById('event-show-title');
        const titleInput = document.getElementById('event-title');
        const showIcon = document.getElementById('event-show-icon');
        const iconInput = document.getElementById('event-icon');
        // Validation texte
        if (showTitle && showTitle.checked && titleInput && !titleInput.value.trim()) {
          titleInput.focus();
          titleInput.style.borderColor = '#e53935';
          setTimeout(()=>{titleInput.style.borderColor = ''}, 1500);
          showNotification('Veuillez saisir un texte à afficher dans la zone centrale.', 'error');
          return false;
        }
        // Validation icône
        if (showIcon && showIcon.checked && iconInput && !iconInput.value.trim()) {
          iconInput.focus();
          iconInput.style.borderColor = '#e53935';
          setTimeout(()=>{iconInput.style.borderColor = ''}, 1500);
          showNotification('Veuillez choisir une icône à afficher dans la zone inférieure.', 'error');
          return false;
        }
        // Validation heure Telegram
        const telegramCheckbox = document.getElementById('event-telegram');
        const telegramTime = document.getElementById('event-telegram-time');
        if (telegramCheckbox && telegramCheckbox.checked && telegramTime && !telegramTime.value) {
          telegramTime.focus();
          telegramTime.style.borderColor = '#e53935';
          setTimeout(()=>{telegramTime.style.borderColor = ''}, 1500);
          showNotification('Veuillez indiquer une heure pour la notification Telegram.', 'error');
          return false;
        }
        // Construction du payload
        const dateInput = document.getElementById('event-date');
        const recurrenceInput = document.getElementById('event-recurrence');
        const payload = {
          title: titleInput.value.trim(),
          type: document.getElementById('event-type').value,
          date: dateInput && dateInput.value ? dateInput.value : null,
          showTitle: showTitle.checked,
          showIcon: showIcon.checked,
          icon: iconInput.value.trim(),
          sendTelegram: telegramCheckbox.checked,
          telegramTime: telegramCheckbox.checked ? telegramTime.value : null,
          recurrence: recurrenceInput && recurrenceInput.value ? recurrenceInput.value : null
        };
        try {
          const { createEvent } = await import('./events.js');
          await createEvent(payload);
          showNotification('Événement enregistré', 'success');
          // Fermer la modale sans toucher au mode édition
          const modal = document.getElementById('modal-event');
          if (modal) modal.style.display = 'none';
          // Rafraîchir la vue calendrier
          if (typeof setCalendarView === 'function') setCalendarView('month');
        } catch (err) {
          showNotification('Erreur lors de l’enregistrement', 'error');
        }
      });
    }
  // Activation dynamique du champ heure pour Telegram
  const telegramCheckbox = document.getElementById('event-telegram');
  const telegramTime = document.getElementById('event-telegram-time');
  if (telegramCheckbox && telegramTime) {
    const updateTelegramTime = () => {
      if (telegramCheckbox.checked) {
        telegramTime.style.display = '';
        telegramTime.disabled = false;
      } else {
        telegramTime.style.display = 'none';
        telegramTime.disabled = true;
        telegramTime.value = '';
      }
    };
    telegramCheckbox.addEventListener('change', updateTelegramTime);
    updateTelegramTime();
  }
// app.js
import { initEditModeToggle } from './ui.js';
import { setCalendarView } from './calendar.js';

import { requireEditMode } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initEditModeToggle();

  document.querySelectorAll('.btn-calnav').forEach(btn => {
    btn.onclick = () => setCalendarView(btn.dataset.calview);
  });

  // Contrôle mode édition pour le bouton "Créer un événement"
  const btnCreate = document.getElementById('btn-create-event');
  if (btnCreate) {
    btnCreate.addEventListener('click', (e) => {
      if (!requireEditMode('créer un événement')) {
        e.preventDefault();
        return false;
      }
      // Ouvrir la modale événement
      const modal = document.getElementById('modal-event');
      if (modal) modal.style.display = 'flex';
    });
  }
  // Fermer la modale événement
  const btnCloseModal = document.getElementById('modal-event-close');
  if (btnCloseModal) {
    btnCloseModal.onclick = () => {
      const modal = document.getElementById('modal-event');
      if (modal) modal.style.display = 'none';
    };
  }

  // Sélection rapide d’icône
  const iconList = document.getElementById('event-icon-list');
  const iconInput = document.getElementById('event-icon');
  if (iconList && iconInput) {
    iconList.addEventListener('change', e => {
      if (iconList.value) iconInput.value = iconList.value;
    });
  }

  setCalendarView('month');
});
