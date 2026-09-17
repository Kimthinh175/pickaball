// ==========================================
// CORE TOAST NOTIFICATION
// ==========================================

export function showToast(message, type = 'info') {
    const container = document.getElementById('admin-toast');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : 'ℹ️'));
    toast.innerHTML = `
        <span style="font-size: 15px; line-height: 1;">${icon}</span>
        <div class="toast-content" style="flex: 1;">
            <span>${message}</span>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}
