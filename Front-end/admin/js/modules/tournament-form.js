// ==========================================
// MODULE: TOURNAMENT FORM (CREATE & EDIT)
// ==========================================

import { apiRequest } from '../core/api.js?v=35';
import { showToast } from '../core/toast.js?v=35';
import { svgAvatar } from '../core/avatar.js?v=35';
import { teamPool, resetTeamPool, renderTeamPool, renderPlayerPickerList } from './team-pool.js?v=35';
import { groupBuilders, resetGroupBuilders, renderGroupBuilders } from './group-builder.js?v=35';
import { bracketStages, resetBracketStages, renderBracketBuilders } from './bracket-builder.js?v=35';
import { loadTournaments } from './tournaments.js?v=35';
import { currentTournamentId, refreshTournamentDetail } from './tournament-detail.js?v=35';
import { loadPlayers, cachedPlayers } from './players.js?v=35';

export let editingTournamentId = null;
let isRepositioning = false;
let startX = 0, startY = 0;
let posX = 50, posY = 50;

function setBannerPreview(url, pos) {
    const bannerSelected = document.getElementById('modal-t-banner-selected');
    const bannerPos = document.getElementById('modal-t-banner-position');
    const preview = document.getElementById('modal-t-banner-preview');
    const placeholder = document.getElementById('modal-t-banner-placeholder');
    const overlay = document.getElementById('modal-t-banner-overlay');
    const btnRepo = document.getElementById('btn-reposition-banner');

    if (bannerSelected) bannerSelected.value = url || '';
    if (bannerPos) bannerPos.value = pos || '50% 50%';

    if (preview) {
        if (url && url.trim() !== '') {
            preview.src = url.startsWith('http') ? url : (url.startsWith('public/') || url.startsWith('Back-end/') ? '../' + url : url);
            preview.style.objectPosition = pos || '50% 50%';
            preview.classList.remove('hidden');
            if (placeholder) placeholder.classList.add('hidden');
            if (overlay) overlay.classList.remove('hidden');
            if (btnRepo) btnRepo.classList.remove('hidden');
        } else {
            preview.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
            if (overlay) overlay.classList.add('hidden');
            if (btnRepo) btnRepo.classList.add('hidden');
        }
    }
}

export async function openCreateTournamentModal() {
    editingTournamentId = null;
    if (!cachedPlayers || cachedPlayers.length === 0) {
        await loadPlayers();
    }
    const titleEl = document.getElementById('modal-tournament-title-text');
    const submitBtn = document.getElementById('btn-submit-create-tournament');
    if (titleEl) titleEl.innerHTML = '<i data-lucide="trophy"></i> Tạo giải đấu mới';
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="rocket"></i> Tạo giải đấu ngay';

    const titleInput = document.getElementById('modal-t-title');
    const descInput = document.getElementById('modal-t-desc');
    const dateInput = document.getElementById('modal-t-start-date');
    const rulesInput = document.getElementById('modal-t-rules');

    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (dateInput) dateInput.value = '';
    if (rulesInput) rulesInput.value = '';

    setBannerPreview('', '50% 50%');

    // Default Prizes
    const pContainer = document.getElementById('prize-rows-container');
    if (pContainer) {
        pContainer.innerHTML = `
            <div class="prize-item-row">
                <select style="width: 170px;" class="prize-rank-select">
                    <option value="Nhất (Vô địch)" selected>🥇 Nhất (Vô địch)</option>
                    <option value="Nhì (Á quân)">🥈 Nhì (Á quân)</option>
                    <option value="Hạng Ba">🥉 Hạng Ba</option>
                    <option value="Khuyến khích">🎖️ Khuyến khích</option>
                </select>
                <input type="text" class="prize-desc-input" placeholder="VD: 5.000.000 VNĐ + Cúp & Huy chương" value="5.000.000 VNĐ + Cúp & Huy chương">
                <button type="button" class="btn btn-sm btn-danger" onclick="removePrizeRow(this)">✕</button>
            </div>
            <div class="prize-item-row">
                <select style="width: 170px;" class="prize-rank-select">
                    <option value="Nhất (Vô địch)">🥇 Nhất (Vô địch)</option>
                    <option value="Nhì (Á quân)" selected>🥈 Nhì (Á quân)</option>
                    <option value="Hạng Ba">🥉 Hạng Ba</option>
                    <option value="Khuyến khích">🎖️ Khuyến khích</option>
                </select>
                <input type="text" class="prize-desc-input" placeholder="VD: 3.000.000 VNĐ + Huy chương Bạc" value="3.000.000 VNĐ + Huy chương Bạc">
                <button type="button" class="btn btn-sm btn-danger" onclick="removePrizeRow(this)">✕</button>
            </div>
            <div class="prize-item-row">
                <select style="width: 170px;" class="prize-rank-select">
                    <option value="Nhất (Vô địch)">🥇 Nhất (Vô địch)</option>
                    <option value="Nhì (Á quân)">🥈 Nhì (Á quân)</option>
                    <option value="Hạng Ba" selected>🥉 Hạng Ba</option>
                    <option value="Khuyến khích">🎖️ Khuyến khích</option>
                </select>
                <input type="text" class="prize-desc-input" placeholder="VD: 1.500.000 VNĐ + Huy chương Đồng" value="1.500.000 VNĐ + Huy chương Đồng">
                <button type="button" class="btn btn-sm btn-danger" onclick="removePrizeRow(this)">✕</button>
            </div>
        `;
    }

    resetTeamPool();
    resetGroupBuilders();
    resetBracketStages();

    renderPlayerPickerList();
    renderTeamPool();
    renderGroupBuilders();
    renderBracketBuilders();

    document.getElementById('modal-tournament')?.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function closeCreateTournamentModal() {
    document.getElementById('modal-tournament')?.classList.remove('active');
}

export async function openEditCurrentTournamentModal() {
    if (!currentTournamentId) {
        showToast('Chưa chọn giải đấu để chỉnh sửa', 'error');
        return;
    }
    if (!cachedPlayers || cachedPlayers.length === 0) {
        await loadPlayers();
    }
    const res = await apiRequest(`/tournaments/detail?id=${currentTournamentId}`);
    if (!res || !res.data) {
        showToast('Không thể tải thông tin giải đấu', 'error');
        return;
    }

    const data = res.data;
    const t = data.tournament;
    editingTournamentId = t.id;

    const titleEl = document.getElementById('modal-tournament-title-text');
    const submitBtn = document.getElementById('btn-submit-create-tournament');
    if (titleEl) titleEl.innerHTML = '<i data-lucide="edit"></i> Cập nhật thông tin giải đấu';
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="save"></i> Lưu thay đổi';

    const titleInput = document.getElementById('modal-t-title');
    const descInput = document.getElementById('modal-t-desc');
    const dateInput = document.getElementById('modal-t-start-date');
    const rulesInput = document.getElementById('modal-t-rules');

    if (titleInput) titleInput.value = t.title || '';
    if (descInput) descInput.value = t.description || '';
    if (dateInput) dateInput.value = t.start_date ? t.start_date.split('T')[0].split(' ')[0] : '';
    if (rulesInput) rulesInput.value = t.rules || '';

    setBannerPreview(t.banner || 'public/banners/1.jpg', t.banner_position || '50% 50%');

    // Prizes
    let prizes = [];
    try { prizes = typeof t.prizes === 'string' ? JSON.parse(t.prizes) : (t.prizes || []); } catch(e) {}
    if (!Array.isArray(prizes) || prizes.length === 0) {
        prizes = [
            { rank: 'Nhất (Vô địch)', reward: '' },
            { rank: 'Nhì (Á quân)', reward: '' },
            { rank: 'Hạng Ba', reward: '' }
        ];
    }
    const pContainer = document.getElementById('prize-rows-container');
    if (pContainer) {
        pContainer.innerHTML = prizes.map(p => `
            <div class="prize-item-row">
                <select style="width: 170px;" class="prize-rank-select">
                    <option value="Nhất (Vô địch)" ${p.rank === 'Nhất (Vô địch)' ? 'selected' : ''}>🥇 Nhất (Vô địch)</option>
                    <option value="Nhì (Á quân)" ${p.rank === 'Nhì (Á quân)' ? 'selected' : ''}>🥈 Nhì (Á quân)</option>
                    <option value="Hạng Ba" ${(p.rank === 'Hạng Ba' || p.rank === 'Đồng Hạng Ba') ? 'selected' : ''}>🥉 Hạng Ba</option>
                    <option value="Khuyến khích" ${p.rank === 'Khuyến khích' ? 'selected' : ''}>🎖️ Khuyến khích</option>
                </select>
                <input type="text" class="prize-desc-input" value="${p.reward || ''}" placeholder="Nhập phần thưởng...">
                <button type="button" class="btn btn-sm btn-danger" onclick="removePrizeRow(this)">✕</button>
            </div>
        `).join('');
    }

    // Populate Team Pool from data.teams and matchups
    resetTeamPool();
    const teams = data.teams || [];
    const matchups = data.matchups || [];
    const addedTeamsMap = {};

    // 1. Populate from data.teams (teams in tournament_teams)
    teams.forEach(tm => {
        const p1Id = Number(tm.p1_id || tm.player1_id || 0);
        const p2Id = Number(tm.p2_id || tm.player2_id || 0);
        if (p1Id || p2Id) {
            const key = (p1Id && p2Id) ? `${Math.min(p1Id, p2Id)}_${Math.max(p1Id, p2Id)}` : `${p1Id || p2Id}_0`;
            if (addedTeamsMap[key] === undefined) {
                addedTeamsMap[key] = teamPool.length;
                const ava1 = tm.p1_avatar ? (tm.p1_avatar.startsWith('http') ? tm.p1_avatar : `../${tm.p1_avatar}`) : svgAvatar(tm.p1_name || 'A');
                const ava2 = tm.p2_avatar ? (tm.p2_avatar.startsWith('http') ? tm.p2_avatar : `../${tm.p2_avatar}`) : svgAvatar(tm.p2_name || 'B');
                teamPool.push({
                    p1_id: p1Id || p2Id,
                    p1_name: tm.p1_name || tm.p2_name,
                    p1_avatar: ava1,
                    p1_points: tm.p1_points,
                    p2_id: p1Id && p2Id ? p2Id : null,
                    p2_name: tm.p2_name,
                    p2_avatar: ava2,
                    p2_points: tm.p2_points,
                    status: tm.status || 'Chưa chuyển khoản'
                });
            }
        }
    });

    // 2. Also check data.matchups for any teams not yet in teamPool
    matchups.forEach(m => {
        const t1p1 = Number(m.team1_p1_id || 0);
        const t1p2 = Number(m.team1_p2_id || 0);
        if (t1p1 || t1p2) {
            const team1Key = (t1p1 && t1p2) ? `${Math.min(t1p1, t1p2)}_${Math.max(t1p1, t1p2)}` : `${t1p1 || t1p2}_0`;
            if (addedTeamsMap[team1Key] === undefined) {
                addedTeamsMap[team1Key] = teamPool.length;
                const ava1 = m.t1_p1_avatar ? (m.t1_p1_avatar.startsWith('http') ? m.t1_p1_avatar : `../${m.t1_p1_avatar}`) : svgAvatar(m.t1_p1_name || 'A');
                const ava2 = m.t1_p2_avatar ? (m.t1_p2_avatar.startsWith('http') ? m.t1_p2_avatar : `../${m.t1_p2_avatar}`) : svgAvatar(m.t1_p2_name || 'B');
                teamPool.push({
                    p1_id: t1p1 || t1p2,
                    p1_name: m.t1_p1_name || m.t1_p2_name,
                    p1_avatar: ava1,
                    p1_points: m.t1_p1_points,
                    p2_id: t1p1 && t1p2 ? t1p2 : null,
                    p2_name: m.t1_p2_name,
                    p2_avatar: ava2,
                    p2_points: m.t1_p2_points,
                    status: m.t1_status || m.status || 'Chưa chuyển khoản'
                });
            }
        }

        const t2p1 = Number(m.team2_p1_id || 0);
        const t2p2 = Number(m.team2_p2_id || 0);
        if (t2p1 || t2p2) {
            const team2Key = (t2p1 && t2p2) ? `${Math.min(t2p1, t2p2)}_${Math.max(t2p1, t2p2)}` : `${t2p1 || t2p2}_0`;
            if (addedTeamsMap[team2Key] === undefined) {
                addedTeamsMap[team2Key] = teamPool.length;
                const ava1 = m.t2_p1_avatar ? (m.t2_p1_avatar.startsWith('http') ? m.t2_p1_avatar : `../${m.t2_p1_avatar}`) : svgAvatar(m.t2_p1_name || 'A');
                const ava2 = m.t2_p2_avatar ? (m.t2_p2_avatar.startsWith('http') ? m.t2_p2_avatar : `../${m.t2_p2_avatar}`) : svgAvatar(m.t2_p2_name || 'B');
                teamPool.push({
                    p1_id: t2p1 || t2p2,
                    p1_name: m.t2_p1_name || m.t2_p2_name,
                    p1_avatar: ava1,
                    p1_points: m.t2_p1_points,
                    p2_id: t2p1 && t2p2 ? t2p2 : null,
                    p2_name: m.t2_p2_name,
                    p2_avatar: ava2,
                    p2_points: m.t2_p2_points,
                    status: m.t2_status || m.status || 'Chưa chuyển khoản'
                });
            }
        }
    });

    // Populate Groups
    resetGroupBuilders();
    const groups = data.groups || [];
    groups.forEach(g => {
        const selectedIndices = [];
        (g.matches || []).forEach(gm => {
            const t1p1 = Number(gm.team1_p1_id || 0);
            const t1p2 = Number(gm.team1_p2_id || 0);
            const t2p1 = Number(gm.team2_p1_id || 0);
            const t2p2 = Number(gm.team2_p2_id || 0);
            const k1 = (t1p1 && t1p2) ? `${Math.min(t1p1, t1p2)}_${Math.max(t1p1, t1p2)}` : `${t1p1 || t1p2}_0`;
            const k2 = (t2p1 && t2p2) ? `${Math.min(t2p1, t2p2)}_${Math.max(t2p1, t2p2)}` : `${t2p1 || t2p2}_0`;
            if (addedTeamsMap[k1] !== undefined && !selectedIndices.includes(addedTeamsMap[k1])) selectedIndices.push(addedTeamsMap[k1]);
            if (addedTeamsMap[k2] !== undefined && !selectedIndices.includes(addedTeamsMap[k2])) selectedIndices.push(addedTeamsMap[k2]);
        });
        teams.forEach(tm => {
            if (tm.group_id && Number(tm.group_id) === Number(g.id)) {
                const p1Id = Number(tm.p1_id || tm.player1_id || 0);
                const p2Id = Number(tm.p2_id || tm.player2_id || 0);
                const key = (p1Id && p2Id) ? `${Math.min(p1Id, p2Id)}_${Math.max(p1Id, p2Id)}` : `${p1Id || p2Id}_0`;
                if (addedTeamsMap[key] !== undefined && !selectedIndices.includes(addedTeamsMap[key])) {
                    selectedIndices.push(addedTeamsMap[key]);
                }
            }
        });
        groupBuilders.push({
            name: g.name,
            selected_team_indices: selectedIndices
        });
    });

    // Populate Brackets
    resetBracketStages();
    const brackets = data.brackets || [];
    const stageMap = {};
    brackets.forEach(b => {
        const stgName = b.stage_name || 'Vòng đấu';
        if (!stageMap[stgName]) {
            stageMap[stgName] = [];
        }
        stageMap[stgName].push({
            slot_1: b.slot_1_label || '',
            slot_2: b.slot_2_label || ''
        });
    });
    Object.keys(stageMap).forEach(k => {
        bracketStages.push({
            stage_name: k,
            matches: stageMap[k]
        });
    });

    renderPlayerPickerList();
    renderTeamPool();
    renderGroupBuilders();
    renderBracketBuilders();

    document.getElementById('modal-tournament')?.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function addPrizeRow() {
    const container = document.getElementById('prize-rows-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'prize-item-row';
    div.innerHTML = `
        <select style="width: 170px;" class="prize-rank-select">
            <option value="Khuyến khích" selected>🎖️ Khuyến khích</option>
            <option value="Nhất (Vô địch)">🥇 Nhất (Vô địch)</option>
            <option value="Nhì (Á quân)">🥈 Nhì (Á quân)</option>
            <option value="Hạng Ba">🥉 Hạng Ba</option>
        </select>
        <input type="text" class="prize-desc-input" placeholder="VD: 500.000 VNĐ" value="">
        <button type="button" class="btn btn-sm btn-danger" onclick="removePrizeRow(this)">✕</button>
    `;
    container.appendChild(div);
}

export function removePrizeRow(btn) {
    if (btn) {
        const row = btn.closest('.prize-item-row');
        if (row) row.remove();
    }
}

// Banner Upload & Library
export function handleBannerBoxClick(e) {
    if (e.target.closest('#btn-reposition-banner') || e.target.closest('#banner-reposition-bar')) return;
    const fileInput = document.getElementById('modal-banner-file');
    if (fileInput) fileInput.click();
}

export async function handleBannerUploadFile(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('banner', file);

    const res = await apiRequest('/admin/banners/upload', 'POST', formData);
    if (res && res.status === 'success') {
        showToast('Đã tải lên banner!', 'success');
        const imgPath = res.data.image_url;
        setBannerPreview(imgPath, '50% 50%');
        closeBannerLibraryModal();
    } else {
        showToast(res?.message || 'Lỗi tải ảnh', 'error');
    }
}

export function openBannerLibraryModal() {
    loadBannerLibrary();
    document.getElementById('modal-banner-library')?.classList.add('active');
}

export function closeBannerLibraryModal() {
    document.getElementById('modal-banner-library')?.classList.remove('active');
}

export async function loadBannerLibrary() {
    const grid = document.getElementById('banner-library-grid');
    if (!grid) return;
    const res = await apiRequest('/tournament-banners');
    let banners = (res && res.data) ? res.data : [];

    const defaultBanners = [
        { id: 1, title: 'Banner Mẫu 1', image_url: 'public/banners/1.jpg' },
        { id: 2, title: 'Banner Mẫu 2', image_url: 'public/banners/2.jpg' },
        { id: 3, title: 'Banner Mẫu 3', image_url: 'public/banners/3.jpg' }
    ];

    const allBanners = [...defaultBanners, ...banners.filter(b => !defaultBanners.some(d => d.image_url === b.image_url))];

    grid.innerHTML = allBanners.map(b => `
        <div class="banner-lib-item" onclick="window.selectBannerFromLibrary('${b.image_url}')" style="cursor:pointer; border:2px solid var(--border); border-radius:8px; overflow:hidden; aspect-ratio:16/9; background:#0f172a; position:relative;">
            <img src="../${b.image_url}" style="width:100%; height:100%; object-fit:cover;" alt="Banner">
            <span style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:#fff; font-size:10px; padding:2px 6px; text-align:center;">${b.title}</span>
        </div>
    `).join('');
}

export function selectBannerFromLibrary(path) {
    setBannerPreview(path, '50% 50%');
    closeBannerLibraryModal();
}

export function applyCustomBannerUrl() {
    const url = document.getElementById('modal-t-banner-custom')?.value.trim();
    if (!url) return;
    setBannerPreview(url, '50% 50%');
    closeBannerLibraryModal();
}

// Banner Repositioning
export function toggleRepositionBanner(e) {
    if (e) e.stopPropagation();
    isRepositioning = !isRepositioning;
    const bar = document.getElementById('banner-reposition-bar');
    const overlay = document.getElementById('modal-t-banner-overlay');
    const preview = document.getElementById('modal-t-banner-preview');

    if (isRepositioning) {
        if (bar) bar.classList.remove('hidden');
        if (overlay) overlay.classList.add('hidden');
        if (preview) preview.style.cursor = 'grab';
        showToast('Kéo chuột lên/xuống trên ảnh để chỉnh vị trí', 'info');
    } else {
        if (bar) bar.classList.add('hidden');
        if (overlay) overlay.classList.remove('hidden');
        if (preview) preview.style.cursor = 'pointer';
    }
}

export function stopRepositionBanner(e) {
    if (e) e.stopPropagation();
    isRepositioning = false;
    const bar = document.getElementById('banner-reposition-bar');
    const overlay = document.getElementById('modal-t-banner-overlay');
    const preview = document.getElementById('modal-t-banner-preview');
    if (bar) bar.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');
    if (preview) preview.style.cursor = 'pointer';
}

export function startRepositionBanner(e) {
    if (!isRepositioning) {
        toggleRepositionBanner(e);
    }
    const preview = document.getElementById('modal-t-banner-preview');
    if (!preview) return;
    preview.style.cursor = 'grabbing';
    startX = e.clientX || (e.touches && e.touches[0].clientX);
    startY = e.clientY || (e.touches && e.touches[0].clientY);

    const onMove = (moveEvent) => {
        const curY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);
        const deltaY = (curY - startY) * 0.25;

        posY = Math.max(0, Math.min(100, posY + deltaY));
        startY = curY;

        const posStr = `50% ${Math.round(posY)}%`;
        preview.style.objectPosition = posStr;
        const bannerPos = document.getElementById('modal-t-banner-position');
        if (bannerPos) bannerPos.value = posStr;
    };

    const onEnd = () => {
        if (preview) preview.style.cursor = 'grab';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
}

// Submit Tournament Form
export async function submitCreateTournament(e) {
    if (e) e.preventDefault();
    const id = editingTournamentId;
    const title = document.getElementById('modal-t-title')?.value.trim() || '';
    const description = document.getElementById('modal-t-desc')?.value.trim() || '';
    const start_date = document.getElementById('modal-t-start-date')?.value || '';
    const rules = document.getElementById('modal-t-rules')?.value.trim() || '';
    const banner = document.getElementById('modal-t-banner-selected')?.value || 'public/banners/1.jpg';
    const banner_position = document.getElementById('modal-t-banner-position')?.value || '50% 50%';

    if (!title) {
        showToast('Vui lòng nhập tên giải đấu', 'error');
        return;
    }

    // Collect Prizes
    const pRows = document.querySelectorAll('#prize-rows-container .prize-item-row');
    const prizes = [];
    pRows.forEach(row => {
        const rank = row.querySelector('.prize-rank-select')?.value.trim() || '';
        const reward = row.querySelector('.prize-desc-input')?.value.trim() || '';
        if (rank) prizes.push({ rank, reward });
    });

    // Generate round-robin matchups from groups or team pool
    const matchups = [];
    const groupsPayload = [];

    groupBuilders.forEach(g => {
        const teams = g.selected_team_indices || [];
        const groupMatchIndices = [];

        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const t1 = teamPool[teams[i]];
                const t2 = teamPool[teams[j]];
                if (!t1 || !t2) continue;

                const matchIdx = matchups.length;
                matchups.push({
                    team1_p1_id: t1.p1_id,
                    team1_p2_id: t1.p2_id,
                    team2_p1_id: t2.p1_id,
                    team2_p2_id: t2.p2_id,
                    status: 'Chưa chuyển khoản'
                });
                groupMatchIndices.push(matchIdx);
            }
        }

        groupsPayload.push({
            name: g.name,
            match_indices: groupMatchIndices
        });
    });

    if (groupBuilders.length === 0 && teamPool.length >= 2) {
        for (let i = 0; i < teamPool.length; i++) {
            for (let j = i + 1; j < teamPool.length; j++) {
                const t1 = teamPool[i];
                const t2 = teamPool[j];
                matchups.push({
                    team1_p1_id: t1.p1_id,
                    team1_p2_id: t1.p2_id,
                    team2_p1_id: t2.p1_id,
                    team2_p2_id: t2.p2_id,
                    status: 'Chưa chuyển khoản'
                });
            }
        }
    }

    // Format Brackets Payload
    const bracketsPayload = [];
    bracketStages.forEach(stg => {
        (stg.matches || []).forEach((m, mIdx) => {
            bracketsPayload.push({
                stage_name: stg.stage_name,
                match_order: mIdx + 1,
                slot_1_label: m.slot_1 || '',
                slot_2_label: m.slot_2 || ''
            });
        });
    });

    // Format Teams Payload
    const teamsPayload = teamPool.map(t => ({
        player1_id: t.p1_id,
        player2_id: t.p2_id,
        status: t.status || 'Chưa chuyển khoản'
    }));

    const payload = {
        title,
        description,
        start_date,
        rules,
        banner,
        banner_position,
        prizes,
        teams: teamsPayload,
        matchups,
        groups: groupsPayload,
        brackets: bracketsPayload
    };

    const submitBtn = document.getElementById('btn-submit-create-tournament');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang lưu...';
    }

    let res;
    if (id) {
        payload.id = id;
        res = await apiRequest(`/admin/tournaments`, 'PUT', payload);
    } else {
        res = await apiRequest(`/admin/tournaments`, 'POST', payload);
    }

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = id ? '<i data-lucide="save"></i> Lưu thay đổi' : '<i data-lucide="rocket"></i> Tạo giải đấu ngay';
    }

    if (res && res.status === 'success') {
        showToast(id ? 'Đã cập nhật giải đấu!' : 'Đã tạo giải đấu thành công!', 'success');
        closeCreateTournamentModal();
        loadTournaments();
        if (id) refreshTournamentDetail();
        editingTournamentId = null;
    } else {
        showToast(res?.message || 'Có lỗi xảy ra', 'error');
    }
}
