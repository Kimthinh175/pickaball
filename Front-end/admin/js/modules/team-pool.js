// ==========================================
// MODULE: TEAM POOL & 2v2 PLAYER PICKER
// ==========================================

import { API_BASE } from '../core/api.js?v=28';
import { showToast } from '../core/toast.js?v=28';
import { svgAvatar } from '../core/avatar.js?v=28';
import { cachedPlayers } from './players.js?v=28';
import { groupBuilders, renderGroupBuilders } from './group-builder.js?v=28';

export let teamPool = [];
export let activeSlot = 1;
export let selectedP1 = null;
export let selectedP2 = null;

export function resetTeamPool() {
    teamPool.length = 0;
    activeSlot = 1;
    selectedP1 = null;
    selectedP2 = null;
    clearSlotUI();
}

export function setActiveSlot(num) {
    activeSlot = num;
    updateSlotUI();
    renderPlayerPickerList();
}

export function updateSlotUI() {
    [1, 2].forEach(num => {
        const s = document.getElementById(`slot-p${num}`);
        if (!s) return;
        const selected = num === 1 ? selectedP1 : selectedP2;
        s.className = `player-slot-box ${activeSlot === num ? 'active' : ''} ${selected ? 'has-player' : ''}`;
        const label = s.querySelector('.slot-label-small');
        if (label) label.textContent = `Tuyển thủ ${num}` + (activeSlot === num ? ' (Đang chọn)' : '');
    });

    const addBtn = document.getElementById('btn-add-team-to-pool');
    if (addBtn) {
        const isReady = !!(selectedP1 && selectedP2);
        addBtn.disabled = !isReady;
        if (isReady) {
            addBtn.style.background = '#10b981';
            addBtn.style.borderColor = '#10b981';
            addBtn.style.color = '#fff';
            addBtn.style.opacity = '1';
            addBtn.style.cursor = 'pointer';
        } else {
            addBtn.style.background = '#94a3b8';
            addBtn.style.borderColor = '#94a3b8';
            addBtn.style.color = '#ffffff';
            addBtn.style.opacity = '0.7';
            addBtn.style.cursor = 'not-allowed';
        }
    }
}

function clearSlotUI() {
    const p1Name = document.getElementById('slot-p1-name');
    const p1Pts = document.getElementById('slot-p1-pts');
    const p1Ava = document.getElementById('slot-p1-avatar');
    if (p1Name) { p1Name.textContent = 'Chưa chọn'; p1Name.style.color = 'var(--muted)'; }
    if (p1Pts) p1Pts.textContent = '';
    if (p1Ava) { p1Ava.src = '../public/favicon.svg'; p1Ava.onerror = null; }

    const p2Name = document.getElementById('slot-p2-name');
    const p2Pts = document.getElementById('slot-p2-pts');
    const p2Ava = document.getElementById('slot-p2-avatar');
    if (p2Name) { p2Name.textContent = 'Chưa chọn'; p2Name.style.color = 'var(--muted)'; }
    if (p2Pts) p2Pts.textContent = '';
    if (p2Ava) { p2Ava.src = '../public/favicon.svg'; p2Ava.onerror = null; }

    updateSlotUI();
    renderPlayerPickerList();
}

export function selectPlayerForSlot(player) {
    const fb = svgAvatar(player.name || 'P');
    const ava = player.avatar ? (player.avatar.startsWith('http') ? player.avatar : (player.avatar.startsWith('public/') || player.avatar.startsWith('Back-end/') ? '../' + player.avatar : API_BASE.replace('/api', '') + '/' + player.avatar)) : fb;

    if (activeSlot === 1) {
        if (selectedP2 && selectedP2.id === player.id) {
            showToast('Tuyển thủ này đã được chọn ở ô 2!', 'error');
            return;
        }
        selectedP1 = player;
        const nameEl = document.getElementById('slot-p1-name');
        const ptsEl = document.getElementById('slot-p1-pts');
        const avaEl = document.getElementById('slot-p1-avatar');
        if (nameEl) { nameEl.textContent = player.name; nameEl.style.color = 'var(--text)'; }
        if (ptsEl) ptsEl.textContent = `${parseFloat(player.points || 0).toFixed(2)} pts`;
        if (avaEl) {
            avaEl.src = ava;
            avaEl.onerror = function() { this.onerror = null; this.src = fb; };
        }
        activeSlot = 2;
    } else {
        if (selectedP1 && selectedP1.id === player.id) {
            showToast('Tuyển thủ này đã được chọn ở ô 1!', 'error');
            return;
        }
        selectedP2 = player;
        const nameEl = document.getElementById('slot-p2-name');
        const ptsEl = document.getElementById('slot-p2-pts');
        const avaEl = document.getElementById('slot-p2-avatar');
        if (nameEl) { nameEl.textContent = player.name; nameEl.style.color = 'var(--text)'; }
        if (ptsEl) ptsEl.textContent = `${parseFloat(player.points || 0).toFixed(2)} pts`;
        if (avaEl) {
            avaEl.src = ava;
            avaEl.onerror = function() { this.onerror = null; this.src = fb; };
        }
    }
    updateSlotUI();
    renderPlayerPickerList();
}

export function renderPlayerPickerList() {
    const container = document.getElementById('player-picker-list');
    if (!container) return;
    const searchVal = (document.getElementById('matchup-search-player')?.value || '').toLowerCase().trim();
    const genderVal = document.getElementById('matchup-filter-gender')?.value || 'all';

    // Collect IDs of players who are ALREADY ASSIGNED TO A CREATED TEAM in teamPool
    const usedPlayerIds = new Set();
    teamPool.forEach(t => {
        if (t.p1_id) usedPlayerIds.add(Number(t.p1_id));
        if (t.p2_id) usedPlayerIds.add(Number(t.p2_id));
    });

    let list = (cachedPlayers || []).filter(p => {
        if (usedPlayerIds.has(Number(p.id))) return false;
        if (searchVal && !p.name.toLowerCase().includes(searchVal)) return false;
        if (genderVal !== 'all' && (p.gender || 'Nam') !== genderVal) return false;
        return true;
    });

    if (list.length === 0) {
        container.innerHTML = '<div class="text-muted" style="padding:16px; text-align:center; font-size:12.5px; font-weight:700;">Không có tuyển thủ khả dụng (tất cả đã được gán vào các đội hoặc không khớp tìm kiếm).</div>';
        return;
    }

    container.innerHTML = list.map(p => {
        const fb = svgAvatar(p.name || 'P');
        const ava = p.avatar ? (p.avatar.startsWith('http') ? p.avatar : (p.avatar.startsWith('public/') || p.avatar.startsWith('Back-end/') ? '../' + p.avatar : API_BASE.replace('/api', '') + '/' + p.avatar)) : fb;
        const isSlot1 = selectedP1 && selectedP1.id === p.id;
        const isSlot2 = selectedP2 && selectedP2.id === p.id;
        const isSelected = isSlot1 || isSlot2;

        let badgeHtml = '';
        if (isSlot1) badgeHtml = `<span style="font-size:10px; font-weight:800; color:var(--primary); background:rgba(55,157,224,0.15); padding:2px 6px; border-radius:4px; margin-left:auto;">Ô 1</span>`;
        if (isSlot2) badgeHtml = `<span style="font-size:10px; font-weight:800; color:var(--primary); background:rgba(55,157,224,0.15); padding:2px 6px; border-radius:4px; margin-left:auto;">Ô 2</span>`;

        return `
            <div class="player-picker-item ${isSelected ? 'active' : ''}" style="${isSelected ? 'border-color:var(--primary); background:rgba(55,157,224,0.06);' : ''}" onclick='window.selectPlayerForSlot(${JSON.stringify(p)})'>
                <img src="${ava}" onerror="this.onerror=null;this.src='${fb}';" class="player-picker-avatar" alt="Avatar">
                <div class="player-picker-info" style="display:flex; align-items:center; gap:8px; width:100%;">
                    <div>
                        <span class="player-picker-name" style="${isSelected ? 'color:var(--primary); font-weight:800;' : ''}">${p.name}</span>
                        <span class="player-picker-pts">${p.gender === 'Nữ' ? '👩' : '👨'} ${parseFloat(p.points || 0).toFixed(2)} pts</span>
                    </div>
                    ${badgeHtml}
                </div>
            </div>
        `;
    }).join('');
}

export function addTeamToPool() {
    if (!selectedP1 || !selectedP2) {
        showToast('Vui lòng chọn đủ 2 tuyển thủ cho đội', 'error');
        return;
    }
    const status = document.getElementById('matchup-status-select')?.value || 'Chưa chuyển khoản';
    
    const p1Ava = selectedP1.avatar ? (selectedP1.avatar.startsWith('http') ? selectedP1.avatar : (selectedP1.avatar.startsWith('public/') || selectedP1.avatar.startsWith('Back-end/') ? '../' + selectedP1.avatar : API_BASE.replace('/api', '') + '/' + selectedP1.avatar)) : svgAvatar(selectedP1.name || 'A');
    const p2Ava = selectedP2.avatar ? (selectedP2.avatar.startsWith('http') ? selectedP2.avatar : (selectedP2.avatar.startsWith('public/') || selectedP2.avatar.startsWith('Back-end/') ? '../' + selectedP2.avatar : API_BASE.replace('/api', '') + '/' + selectedP2.avatar)) : svgAvatar(selectedP2.name || 'B');

    teamPool.push({
        p1_id: selectedP1.id,
        p1_name: selectedP1.name,
        p1_avatar: p1Ava,
        p1_points: selectedP1.points,
        p2_id: selectedP2.id,
        p2_name: selectedP2.name,
        p2_avatar: p2Ava,
        p2_points: selectedP2.points,
        status: status
    });

    selectedP1 = null;
    selectedP2 = null;
    const statusSelect = document.getElementById('matchup-status-select');
    if (statusSelect) statusSelect.value = 'Chưa chuyển khoản';
    clearSlotUI();
    activeSlot = 1;
    updateSlotUI();
    renderTeamPool();
    renderGroupBuilders();
    renderPlayerPickerList();
}

export function removeTeamFromPool(index) {
    teamPool.splice(index, 1);
    groupBuilders.forEach(g => {
        if (Array.isArray(g.selected_team_indices)) {
            g.selected_team_indices = g.selected_team_indices
                .filter(i => i !== index)
                .map(i => (i > index ? i - 1 : i));
        }
    });
    renderTeamPool();
    renderGroupBuilders();
    renderPlayerPickerList();
}

export function renderTeamPool() {
    const container = document.getElementById('team-pool-container');
    const countEl = document.getElementById('team-pool-count');
    if (countEl) countEl.textContent = teamPool.length;

    if (!container) return;
    if (teamPool.length === 0) {
        container.innerHTML = `<div class="empty-placeholder" style="grid-column: 1/-1;">Chưa có đội nào được tạo. Hãy chọn 2 tuyển thủ ở trên và bấm "Thêm Đội vào danh sách".</div>`;
        return;
    }

    container.innerHTML = teamPool.map((t, idx) => {
        const ava1 = t.p1_avatar || svgAvatar(t.p1_name || 'A');
        const ava2 = t.p2_avatar || svgAvatar(t.p2_name || 'B');
        const fb1 = svgAvatar(t.p1_name || 'A');
        const fb2 = svgAvatar(t.p2_name || 'B');

        const isPaid = t.status === 'Đã chuyển khoản';
        const cardStyle = isPaid
            ? 'border: 1.5px solid #86efac; background: #f0fdf4;'
            : 'border: 1.5px solid #fca5a5; background: #fef2f2;';
        const badgeStyle = isPaid
            ? 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;'
            : 'background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;';

        return `
            <div class="matchup-card-item" style="${cardStyle}">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                    <span style="font-size:10px; font-weight:800; color:var(--muted); background:#fff; padding:2px 6px; border-radius:4px; border:1px solid rgba(0,0,0,0.06);">ĐỘI #${idx+1}</span>
                    <span style="font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; ${badgeStyle}">
                        ${isPaid ? '✓ ' : '✕ '} ${t.status}
                    </span>
                </div>
                
                <div class="admin-matchup-row" style="background:#fff; padding:8px; border-radius:8px; border:1px solid ${isPaid ? '#dcfce7' : '#fee2e2'};">
                    <div class="admin-matchup-team" style="flex-direction:column; align-items:flex-start; gap:6px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <img src="${ava1}" onerror="this.onerror=null;this.src='${fb1}';" style="width:22px; height:22px; border-radius:50%; object-fit:cover;">
                            <span class="truncate" style="font-size:12px; font-weight:700;">${t.p1_name || '?'}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <img src="${ava2}" onerror="this.onerror=null;this.src='${fb2}';" style="width:22px; height:22px; border-radius:50%; object-fit:cover;">
                            <span class="truncate" style="font-size:12px; font-weight:700;">${t.p2_name || '?'}</span>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger" style="padding:4px 8px; font-size:11px;" onclick="window.removeTeamFromPool(${idx})"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
}
