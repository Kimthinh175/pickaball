// ==========================================
// MODULE: TOURNAMENTS LIST & GENERAL
// ==========================================

import { apiRequest, calculateTournamentStatus } from '../core/api.js?v=28';
import { showToast } from '../core/toast.js?v=28';
import { setCurrentTournamentId, refreshTournamentDetail, currentTournamentId } from './tournament-detail.js?v=28';

export let cachedTournaments = [];

export async function loadTournaments() {
    const res = await apiRequest('/tournaments');
    if (!res || res.status !== 'success' || !Array.isArray(res.data)) return;
    cachedTournaments = res.data;

    const grid = document.getElementById('admin-tournaments-list');
    const count = document.getElementById('tournament-count');
    const total = document.getElementById('stat-total');
    const statOngoing = document.getElementById('stat-ongoing');
    const statDone = document.getElementById('stat-done');

    const totalCount = cachedTournaments.length;
    const ongoingCount = cachedTournaments.filter(t => calculateTournamentStatus(t.start_date, t.end_date) === 'Đang diễn ra').length;
    const doneCount = cachedTournaments.filter(t => calculateTournamentStatus(t.start_date, t.end_date) === 'Đã kết thúc').length;

    if (total) total.textContent = totalCount;
    if (statOngoing) statOngoing.textContent = ongoingCount;
    if (statDone) statDone.textContent = doneCount;
    if (count) count.textContent = `${totalCount} giải`;

    if (!grid) return;

    if (totalCount === 0) {
        grid.innerHTML = `<p class="text-muted" style="padding:20px; grid-column:1/-1;">Chưa có giải đấu nào.</p>`;
        return;
    }

    const badgeClassMap = {
        'Sắp diễn ra': 'upcoming',
        'Đang diễn ra': 'ongoing',
        'Đã kết thúc': 'done'
    };

    grid.innerHTML = cachedTournaments.map(t => {
        const computedStatus = calculateTournamentStatus(t.start_date, t.end_date);
        const bClass = badgeClassMap[computedStatus] || 'upcoming';
        const bannerPath = t.banner ? (t.banner.startsWith('http') ? t.banner : `../${t.banner}`) : '../public/banners/1.jpg';
        const dateStr = t.start_date ? t.start_date : 'Chưa xếp lịch';

        return `
            <div class="tournament-item" onclick="window.openTournamentDetail(${t.id})">
                <div style="width:100%; aspect-ratio:16/9; overflow:hidden; border-radius:6px; margin-bottom:12px; position:relative; background:#0f172a;">
                    <img src="${bannerPath}" style="width:100%; height:100%; object-fit:cover; object-position:${t.banner_position || '50% 50%'};" alt="Banner">
                </div>
                <div class="tournament-item-title">${t.title}</div>
                <div class="tournament-item-desc">${t.description ? t.description : 'Không có mô tả'}</div>
                <div class="tournament-item-foot">
                    <span class="t-badge ${bClass}">${computedStatus}</span>
                    <span style="font-size:12px; color:var(--muted); font-weight:700;">📅 ${dateStr}</span>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

export function openTournamentDetail(id) {
    setCurrentTournamentId(id);
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const detailTab = document.getElementById('tab-tournament-detail');
    if (detailTab) {
        detailTab.classList.add('active');
    }
    refreshTournamentDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function deleteCurrentTournament() {
    if (!currentTournamentId) return;
    if (!confirm('Bạn có chắc chắn muốn xoá giải đấu này? Thao tác này không thể hoàn tác!')) return;

    const res = await apiRequest(`/admin/tournaments?id=${currentTournamentId}`, 'DELETE');
    if (res && res.status === 'success') {
        showToast('Đã xoá giải đấu thành công!', 'success');
        window.showTab('tournaments');
        loadTournaments();
    } else {
        showToast(res?.message || 'Có lỗi xảy ra khi xoá giải', 'error');
    }
}
