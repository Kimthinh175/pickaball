// ==========================================
// MODULE: TOURNAMENTS LIST
// ==========================================

import { API_BASE, calculateTournamentStatus, fmtDate } from '../core/api.js?v=16';

export async function fetchTournaments() {
    const list = document.getElementById('tournaments-list');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/tournaments`);
        const data = await res.json();

        if (data.status !== 'success' || !data.data.length) {
            list.innerHTML = `
                <div class="empty" style="grid-column:1/-1">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    Hiện chưa có giải đấu nào.
                </div>`;
            return;
        }

        list.innerHTML = data.data.map(t => {
            const computedStatus = calculateTournamentStatus(t.start_date, t.end_date);
            const badgeClass = computedStatus === 'Đang diễn ra' ? 'badge-ongoing' : (computedStatus === 'Đã kết thúc' ? 'badge-done' : 'badge-upcoming');
            const bannerPath = t.banner ? (t.banner.startsWith('http') ? t.banner : t.banner) : 'public/banners/1.jpg';

            return `
            <a href="tournament?id=${t.id}" class="tour-card neo-box" style="text-decoration:none;">
                <div style="width: 100%; aspect-ratio: 16/7; border-bottom: 3px solid var(--black); border-radius: calc(var(--radius) - 3px) calc(var(--radius) - 3px) 0 0; overflow: hidden; background: var(--black);">
                    <img src="${bannerPath}" style="width: 100%; height: 100%; object-fit: cover; object-position: ${t.banner_position || '50% 50%'};" alt="Banner">
                </div>
                <div class="card-body" style="position:relative;">
                    <span class="badge-status ${badgeClass}">${computedStatus}</span>
                    <div class="card-title" style="padding-top: 10px;">${t.title}</div>
                    <div class="card-desc">${t.description || ''}</div>
                    <div class="card-date">
                        ${fmtDate(t.start_date || t.created_at)}
                    </div>
                </div>
            </a>
        `;}).join('');
    } catch (e) {
        console.error(e);
        list.innerHTML = `<div class="empty" style="grid-column:1/-1">Không thể kết nối máy chủ.</div>`;
    }
}
