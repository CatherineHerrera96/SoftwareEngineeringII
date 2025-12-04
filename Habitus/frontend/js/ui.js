
export function showNotification(msg, type = 'success') {
    const container = document.getElementById('notification-area');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = msg;
    container.appendChild(el);

    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

export function initTheme() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.onclick = () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        btn.textContent = next === 'dark' ? '☀️' : '🌙';
    };
}
