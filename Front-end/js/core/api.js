// ==========================================
// CLIENT CORE UTILITIES & API BASE
// ==========================================

export function calculateTournamentStatus(startDateStr, endDateStr) {
    if (!startDateStr) return 'Sắp diễn ra';
    const now = new Date();
    const start = new Date(startDateStr);
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (now < start) return 'Sắp diễn ra';
    if (!endDateStr) return 'Đang diễn ra';
    return 'Đã kết thúc';
}

export const getApiBase = () => {
    const match = window.location.pathname.match(/^(\/[^/]*pickaball[^/]*)/i);
    return (match ? match[1] : '') + '/api';
};

export const API_BASE = getApiBase();

export function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 2500);
}

export function svgAvatar(name) {
    const colors = ['#0b6996','#0b8a6e','#6b0b99','#99490b','#0b3d99'];
    const h = [...(name || '?')].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
    const bg = colors[Math.abs(h) % colors.length];
    const parts = (name || '?').trim().split(/\s+/);
    const ini = parts.length >= 2
        ? (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
        : (name || '?').slice(0, 2).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>
        <rect width='96' height='96' rx='48' fill='${bg}'/>
        <text x='48' y='63' font-family='Arial' font-size='32' fill='#fff' text-anchor='middle' font-weight='bold'>${ini}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function avatarOf(player) {
    if (player && player.avatar && player.avatar.trim() !== '') {
        return player.avatar.startsWith('http') || player.avatar.startsWith('data:')
            ? player.avatar
            : API_BASE.replace('/api', '') + '/' + player.avatar;
    }
    return svgAvatar(player ? player.name : '?');
}

export function fmtDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
