// components/notifications.js
// Simple notification system for user feedback

export function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-area');

    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-area';
        container.className = 'notification-area';
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to container
    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('notification-fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

export function showError(message) {
    showNotification(message, 'error');
}

export function showSuccess(message) {
    showNotification(message, 'success');
}

export function showInfo(message) {
    showNotification(message, 'info');
}
