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
import { state } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    // Gestion du bouton "Événements" (sidebar) avec affichage moderne
    const btnEvents = document.querySelector('.nav-item[data-view="events"]');
    if (btnEvents) {
      btnEvents.onclick = async () => {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        btnEvents.classList.add('active');
        const content = document.getElementById('content-view');
        content.innerHTML = '<div class="event-list-loading">Chargement...</div>';
        const { fetchEvents } = await import('./events.js');
        const eventsData = await fetchEvents();
        let events = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);
        // Tri alphabétique par titre (insensible à la casse)
        events = events.slice().sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }));
        if (!events.length) {
          content.innerHTML = '<div class="event-list-empty">Aucun événement enregistré.</div>';
          return;
        }
        // Importe le state pour le mode édition et affiche la liste stylée
        import('./state.js').then(({ state }) => {
          const editMode = state.editMode;
          content.innerHTML = `
            <div class="event-list-title">📅 Tous les événements</div>
            <div class="event-list-modern">
              ${events.map(ev => `
                <div class="event-card">
                  <div class="event-card-header">
                    <span class="event-card-title">${ev.title || '(Sans titre)'}</span>
                    ${ev.icon ? `<span class="event-card-icon">${ev.icon}</span>` : ''}
                  </div>
                  <div class="event-card-details">
                    <span class="event-card-date">${ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : ''}</span>
                    ${ev.recurrence && ev.recurrence !== 'none' ? `<span class="event-card-recurrence">${ev.recurrence}</span>` : ''}
                    ${ev.sendTelegram ? `<span class="event-card-telegram">🔔 Telegram${ev.telegramTime ? ' à ' + ev.telegramTime : ''}</span>` : ''}
                  </div>
                  ${editMode ? `<div class="event-card-actions-bar">
                    <button class="event-edit-btn" title="Modifier" data-id="${ev.id}">✏️</button>
                    <button class="event-delete-btn" title="Supprimer" data-id="${ev.id}">🗑️</button>
                  </div>` : ''}
                </div>
              `).join('')}
            </div>
          `;
        });
        // Actions Modifier/Supprimer (listeners à ajouter ici)
        setTimeout(() => {
          document.querySelectorAll('.event-edit-btn').forEach(btn => {
            btn.onclick = () => {
              const eventId = btn.getAttribute('data-id');
              // TODO: ouvrir la modale d'édition pour l'événement eventId
              alert('Modifier événement ' + eventId);
            };
          });
          document.querySelectorAll('.event-delete-btn').forEach(btn => {
            btn.onclick = () => {
              const eventId = btn.getAttribute('data-id');
              import('./ui.js').then(({ showNotification }) => {
                // Affiche le toast avec boutons Oui/Annuler
                showNotification(
                  `<div>Confirmer la suppression ?</div>
                   <div style='margin-top:8px;'>
                     <button id='toast-confirm-yes' style='background:#e53935;color:#fff;border:none;padding:6px 16px;border-radius:6px;margin-right:8px;cursor:pointer;'>Oui</button>
                     <button id='toast-confirm-no' style='background:#eee;color:#333;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;'>Annuler</button>
                   </div>`,
                  'warning',
                  10000 // Toast visible 10s
                );
                setTimeout(() => {
                  const btnYes = document.getElementById('toast-confirm-yes');
                  const btnNo = document.getElementById('toast-confirm-no');
                  if (btnYes) {
                    btnYes.onclick = () => {
                      import('./events.js').then(({ deleteEvent }) => {
                        deleteEvent(eventId).then(() => {
                          showNotification('Événement supprimé', 'success');
                          // Rafraîchir la liste après suppression
                          const activeNav = document.querySelector('.nav-item.active');
                          if (activeNav && activeNav.dataset.view === 'events') {
                            activeNav.click();
                          }
                        });
                      });
                      // Ferme le toast
                      btnYes.closest('.toast')?.remove();
                    };
                  }
                  if (btnNo) {
                    btnNo.onclick = () => {
                      // Ferme le toast
                      btnNo.closest('.toast')?.remove();
                    };
                  }
                }, 100); // Laisse le temps au DOM d'insérer le toast
              });
            };
          });
        }, 0);
      };
    }
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

  // Ajout : réaffichage de la liste si editMode change et vue événements active
const editModeToggle = document.getElementById('edit-mode-toggle');
if (editModeToggle) {
  editModeToggle.addEventListener('change', () => {
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && activeNav.dataset.view === 'events') {
      // Simule un clic pour forcer le réaffichage
      activeNav.click();
    }
  });
}

  setCalendarView('month');
});
