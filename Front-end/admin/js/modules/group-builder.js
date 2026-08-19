// ==========================================
// MODULE: GROUP BUILDER & AUTO DIVIDE
// ==========================================

import { showToast } from '../core/toast.js?v=28';
import { svgAvatar } from '../core/avatar.js?v=28';
import { teamPool } from './team-pool.js?v=28';

export let groupBuilders = [];

export function resetGroupBuilders() {
    groupBuilders.length = 0;
}

export function openAutoDivideModal() {
    const countEl = document.getElementById('auto-divide-team-count');
    if (countEl) countEl.textContent = teamPool.length;
    document.getElementById('modal-auto-divide')?.classList.add('active');
    updateAutoDivideLabel();
}

export function closeAutoDivideModal() {
    document.getElementById('modal-auto-divide')?.classList.remove('active');
}

export function updateAutoDivideLabel() {
    const mode = document.querySelector('input[name="auto_divide_mode"]:checked')?.value;
    const label = document.getElementById('auto-divide-count-label');
    const input = document.getElementById('auto-divide-count');
    if (mode === 'by_groups') {
        if (label) label.textContent = 'Số lượng bảng đấu:';
        if (input) {
            input.min = 1;
            input.max = Math.max(1, teamPool.length);
            input.value = teamPool.length <= 3 ? 1 : 2;
        }
    } else {
        if (label) label.textContent = 'Số đội trong mỗi bảng:';
        if (input) { input.min = 2; input.max = 20; input.value = 4; }
    }
}

export function submitAutoDivide() {
    if (teamPool.length === 0) {
        showToast('Chưa có đội nào trong danh sách!', 'error');
        return;
    }
    const mode = document.querySelector('input[name="auto_divide_mode"]:checked')?.value;
    const countVal = parseInt(document.getElementById('auto-divide-count')?.value || '2', 10);
    if (isNaN(countVal) || countVal <= 0) {
        showToast('Số lượng không hợp lệ!', 'error');
        return;
    }

    let numGroups = countVal;
    if (mode === 'by_teams') {
        numGroups = Math.ceil(teamPool.length / countVal);
    }
    if (numGroups < 1) numGroups = 1;

    if (numGroups > 1 && teamPool.length < numGroups * 2) {
        showToast(`Lưu ý: Với ${teamPool.length} đội chia vào ${numGroups} bảng, có bảng chỉ có 1 đội (không đủ tạo cặp đấu).`, 'warning');
    }

    const indices = teamPool.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    groupBuilders.length = 0;
    for (let g = 0; g < numGroups; g++) {
        groupBuilders.push({
            name: `Bảng ${String.fromCharCode(65 + g)}`,
            selected_team_indices: []
        });
    }

    indices.forEach((teamIdx, i) => {
        const gIdx = i % numGroups;
        groupBuilders[gIdx].selected_team_indices.push(teamIdx);
    });

    closeAutoDivideModal();
    renderGroupBuilders();
    showToast(`Đã tự động chia thành ${numGroups} bảng đấu!`, 'success');
}

export function addNewGroupBuilder() {
    const nextChar = String.fromCharCode(65 + groupBuilders.length);
    groupBuilders.push({
        name: `Bảng ${nextChar}`,
        selected_team_indices: []
    });
    renderGroupBuilders();
}

export function removeGroupBuilder(gIdx) {
    const index = parseInt(gIdx, 10);
    groupBuilders.splice(index, 1);
    renderGroupBuilders();
}

export function updateGroupName(gIdx, val) {
    if (groupBuilders[gIdx]) {
        groupBuilders[gIdx].name = val;
    }
}

export function assignMatchupToGroup(gIdx) {
    const sel = document.getElementById(`group-add-matchup-${gIdx}`);
    if (!sel || sel.value === '') return;
    const mIdx = Number(sel.value);
    
    if (!groupBuilders[gIdx].selected_team_indices) {
        groupBuilders[gIdx].selected_team_indices = [];
    }
    if (!groupBuilders[gIdx].selected_team_indices.includes(mIdx)) {
        groupBuilders[gIdx].selected_team_indices.push(mIdx);
        renderGroupBuilders();
    }
}

export function removeMatchupFromGroup(gIdx, mIdx) {
    if (!groupBuilders[gIdx] || !groupBuilders[gIdx].selected_team_indices) return;
    groupBuilders[gIdx].selected_team_indices = groupBuilders[gIdx].selected_team_indices.filter(id => id !== mIdx);
    renderGroupBuilders();
}

export function randomAddTeamsToGroup(gIdx) {
    try {
        const countInput = document.getElementById(`group-random-count-${gIdx}`);
        if (!countInput) {
            showToast('Không tìm thấy ô nhập số lượng.', 'error');
            return;
        }
        
        let numToPick = Number(countInput.value);
        if (isNaN(numToPick) || numToPick <= 0) {
            showToast('Số lượng đội không hợp lệ!', 'error');
            return;
        }

        const assignedTeamIndices = new Set();
        groupBuilders.forEach(g => {
            if (g.selected_team_indices) {
                g.selected_team_indices.forEach(idx => assignedTeamIndices.add(Number(idx)));
            }
        });

        const unassignedIndices = [];
        teamPool.forEach((t, i) => {
            if (!assignedTeamIndices.has(i)) {
                unassignedIndices.push(i);
            }
        });

        if (numToPick > unassignedIndices.length) {
            showToast('Số đội bốc ngẫu nhiên lớn hơn số đội chưa xếp bảng!', 'error');
            return;
        }

        // Shuffle
        for (let i = unassignedIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unassignedIndices[i], unassignedIndices[j]] = [unassignedIndices[j], unassignedIndices[i]];
        }

        const picked = unassignedIndices.slice(0, numToPick);
        if (!groupBuilders[gIdx].selected_team_indices) {
            groupBuilders[gIdx].selected_team_indices = [];
        }
        picked.forEach(mIdx => groupBuilders[gIdx].selected_team_indices.push(mIdx));
        
        renderGroupBuilders();
        showToast(`Đã thêm ngẫu nhiên ${numToPick} đội vào ${groupBuilders[gIdx].name}`, 'success');
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

export function renderGroupBuilders() {
    const container = document.getElementById('groups-builder-container');
    if (!container) return;

    // Determine assigned teams
    const assignedTeamIndices = new Set();
    groupBuilders.forEach(g => {
        if (g.selected_team_indices) {
            g.selected_team_indices.forEach(idx => assignedTeamIndices.add(Number(idx)));
        }
    });

    const unassignedCount = teamPool.length - assignedTeamIndices.size;

    if (groupBuilders.length === 0) {
        container.innerHTML = `<div class="empty-placeholder" style="padding:20px; text-align:center; color:var(--muted);">Chưa có bảng đấu nào. Bấm "🎲 Tự động chia" hoặc "Thêm thủ công" ở trên để tạo bảng.</div>`;
        return;
    }

    container.innerHTML = groupBuilders.map((g, gIdx) => {
        const selected = g.selected_team_indices || [];

        let assignedHtml = '';
        if (selected.length > 0) {
            assignedHtml = `
                <div style="margin-top: 12px; display:flex; flex-direction:column; gap:8px;">
                    ${selected.map(tIdx => {
                        const t = teamPool[tIdx];
                        if (!t) return '';
                        const ava1 = t.p1_avatar || svgAvatar(t.p1_name || 'A');
                        const ava2 = t.p2_avatar || svgAvatar(t.p2_name || 'B');
                        const fb1 = svgAvatar(t.p1_name || 'A');
                        const fb2 = svgAvatar(t.p2_name || 'B');

                        return `
                            <div class="admin-matchup-row" style="background:#fff; padding:8px 12px; border-radius:8px; border:1px solid #e2e8f0; font-size:13px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <strong style="color:var(--primary); font-size:13px;">ĐỘI #${Number(tIdx)+1}:</strong>
                                    <div style="display:flex; align-items:center; gap:5px;">
                                        <img src="${ava1}" onerror="this.onerror=null;this.src='${fb1}';" style="width:22px; height:22px; border-radius:50%; object-fit:cover;" title="${t.p1_name}">
                                        <span style="font-weight:700;">${t.p1_name}</span>
                                    </div>
                                    <span style="color:var(--muted); font-size:11px; font-weight:800;">&</span>
                                    <div style="display:flex; align-items:center; gap:5px;">
                                        <img src="${ava2}" onerror="this.onerror=null;this.src='${fb2}';" style="width:22px; height:22px; border-radius:50%; object-fit:cover;" title="${t.p2_name}">
                                        <span style="font-weight:700;">${t.p2_name}</span>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-sm btn-danger" style="padding:3px 10px; font-size:11px;" onclick="window.removeMatchupFromGroup(${gIdx}, ${tIdx})">✕ Bỏ</button>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${selected.length === 1 ? '<div style="font-size:12px; font-weight:700; color:#d97706; margin-top:8px; padding:6px 10px; background:#fffbeb; border:1px solid #fde68a; border-radius:6px;">⚠️ Bảng này chỉ có 1 đội (cần thêm ít nhất 1 đội nữa để tạo cặp đấu vòng tròn).</div>' : ''}
            `;
        } else {
            assignedHtml = `<div class="empty-placeholder" style="font-size:12px; padding:12px; margin-top:10px; text-align:center; color:var(--muted); background:#f8fafc; border-radius:6px;">Chưa có đội nào trong bảng này. Hãy chọn đội ở bên dưới hoặc bấm 'Bốc ngẫu nhiên'.</div>`;
        }

        // Unassigned teams options for select
        const unassignedOptions = teamPool
            .map((t, tIdx) => {
                if (assignedTeamIndices.has(tIdx)) return '';
                return `<option value="${tIdx}">Đội #${tIdx+1}: ${t.p1_name} & ${t.p2_name}</option>`;
            }).join('');

        let pickerHtml = '';
        if (teamPool.length === 0) {
            pickerHtml = `<div class="text-muted" style="font-size:12px; margin-top:10px; font-style:italic;">⚠️ Hãy tạo các Đội ở Mục 4 trước khi chia bảng.</div>`;
        } else if (unassignedOptions === '') {
            pickerHtml = `<div style="font-size:12px; margin-top:10px; color:#16a34a; font-weight:800;">✅ Tất cả ${teamPool.length} đội đã được chia vào các bảng.</div>`;
        } else {
            pickerHtml = `
                <div style="display:flex; gap:8px; margin-top:12px; align-items:center; flex-wrap:wrap;">
                    <select id="group-add-matchup-${gIdx}" style="padding:7px 10px; border:1.5px solid var(--border); border-radius:6px; font-size:13px; font-weight:700; flex:1; min-width:200px;">
                        <option value="">-- Chọn đội thêm vào bảng --</option>
                        ${unassignedOptions}
                    </select>
                    <button type="button" class="btn btn-sm" onclick="window.assignMatchupToGroup(${gIdx})">+ Thêm vào bảng</button>
                </div>
                <div style="display:flex; gap:8px; margin-top:8px; align-items:center; flex-wrap:wrap; background:#f8fafc; padding:8px 12px; border-radius:8px; border:1px solid #e2e8f0;">
                    <span style="font-size:12px; font-weight:800; color:var(--text);">🎲 Bốc thăm ngẫu nhiên:</span>
                    <input type="number" id="group-random-count-${gIdx}" min="1" max="${unassignedCount}" value="${Math.min(3, unassignedCount)}" style="width:65px; padding:4px 8px; font-size:13px; font-weight:700; border:1px solid #cbd5e1; border-radius:6px; text-align:center;" ${unassignedCount === 0 ? 'disabled' : ''}>
                    <span style="font-size:12px; color:var(--muted); font-weight:700;">đội (còn lại: ${unassignedCount})</span>
                    <button type="button" class="btn btn-sm btn-ghost" style="background:#fff; border:1px solid var(--border); font-size:12px;" onclick="window.randomAddTeamsToGroup(${gIdx})" ${unassignedCount === 0 ? 'disabled' : ''}>Bốc ngẫu nhiên</button>
                </div>
            `;
        }

        return `
            <div class="group-builder-card" style="border:1.5px solid var(--border); border-radius:10px; padding:16px; margin-bottom:16px; background:var(--panel);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="text" value="${g.name}" oninput="window.updateGroupName(${gIdx}, this.value)" style="font-weight:800; font-size:15px; padding:6px 10px; border-radius:6px; border:1px solid var(--border); width:140px;">
                        <span class="text-muted" style="font-size:13px; font-weight:800;">(${selected.length} Đội)</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger" onclick="window.removeGroupBuilder(${gIdx})"><i data-lucide="trash-2"></i> Xoá bảng</button>
                </div>
                
                ${assignedHtml}
                ${pickerHtml}
            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}
