// app.js
import { initEditModeToggle } from './ui.js';
import { setCalendarView } from './calendar.js';

document.addEventListener('DOMContentLoaded', () => {
  initEditModeToggle();

  document.querySelectorAll('.btn-calnav').forEach(btn => {
    btn.onclick = () => setCalendarView(btn.dataset.calview);
  });

  setCalendarView('month');
});
