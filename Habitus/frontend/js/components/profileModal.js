// Modal control functions for profile settings
export function setupProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    const openBtn = document.getElementById('open-settings-modal');
    const closeBtn = document.getElementById('close-settings-modal');
    const overlay = document.getElementById('modal-overlay');

    // Open modal
    if (openBtn && modal) {
        openBtn.onclick = () => {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        };
    }

    // Close modal
    const closeModal = () => {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (overlay) overlay.onclick = closeModal;

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            closeModal();
        }
    });

    return closeModal;
}

export function setupSettingsTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.profile-tab-content');

    tabs.forEach(tab => {
        tab.onclick = () => {
            const tabName = tab.getAttribute('data-settings-tab');

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            contents.forEach(content => content.classList.remove('active'));

            const activeContent = document.getElementById(`tab-${tabName}`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        };
    });
}
