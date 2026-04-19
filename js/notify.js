/**
 * notify.js — Enhanced notification queue system
 */
const Notify = (() => {
  const queue = [];
  let active = false;
  const MAX_VISIBLE = 3;
  const visibleNotifs = [];

  const STYLES = {
    default: { border: 'rgba(200,122,74,0.25)', text: '#e8c87a' },
    success: { border: 'rgba(100,200,150,0.35)', text: '#60e890' },
    warning: { border: 'rgba(255,180,60,0.35)', text: '#ffc040' },
    error: { border: 'rgba(255,80,80,0.35)', text: '#ff6060' },
    quest: { border: 'rgba(150,130,220,0.35)', text: '#b0a0ff' },
    info: { border: 'rgba(100,160,255,0.35)', text: '#80b0ff' },
  };

  function push(text, type = 'default', duration = 2800) {
    queue.push({ text, type, duration });
    processQueue();
  }

  function processQueue() {
    if (visibleNotifs.length >= MAX_VISIBLE || queue.length === 0) return;

    const item = queue.shift();
    showNotif(item);
  }

  function showNotif(item) {
    const style = STYLES[item.type] || STYLES.default;
    const el = document.createElement('div');
    el.className = 'notification';
    el.style.borderColor = style.border;
    el.style.color = style.text;

    // Prefix icon based on type
    const icons = {
      default: '📌', success: '✅', warning: '⚠️', error: '❌', quest: '📜', info: 'ℹ️'
    };
    const icon = icons[item.type] || '';

    el.innerHTML = icon ? `<span style="margin-right:6px">${icon}</span>${item.text}` : item.text;

    // Stack position
    const offset = visibleNotifs.length * 48;
    el.style.top = (76 + offset) + 'px';

    document.body.appendChild(el);
    visibleNotifs.push(el);

    setTimeout(() => {
      el.classList.add('fadeout');
      setTimeout(() => {
        el.remove();
        const idx = visibleNotifs.indexOf(el);
        if (idx >= 0) visibleNotifs.splice(idx, 1);
        processQueue();
      }, 500);
    }, item.duration);
  }

  // Convenience methods
  function success(text) { push(text, 'success'); }
  function warning(text) { push(text, 'warning'); }
  function error(text) { push(text, 'error'); }
  function quest(text) { push(text, 'quest'); }
  function info(text) { push(text, 'info'); }

  return { push, success, warning, error, quest, info };
})();
