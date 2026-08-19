// ==========================================
// CORE TOAST NOTIFICATION
// ==========================================

export function showToast(message, type = 'info') {
    const container = document.getElementById('admin-toast');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
