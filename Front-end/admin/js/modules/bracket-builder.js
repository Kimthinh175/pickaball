// ==========================================
// MODULE: BRACKET BUILDER (KNOCKOUT)
// ==========================================

import { showToast } from '../core/toast.js?v=28';
import { groupBuilders } from './group-builder.js?v=28';

export let bracketStages = [];

export function resetBracketStages() {
    bracketStages.length = 0;
}

export function autoGenerateBracketsFromGroups() {
    if (groupBuilders.length === 0) {
        showToast('Cần tạo bảng đấu trước khi tạo sơ đồ knockout!', 'error');
        return;
    }
    bracketStages.length = 0;
    if (groupBuilders.length === 2) {
        bracketStages.push({
            stage_name: 'Bán kết',
            matches: [
                { slot_1: `Nhất ${groupBuilders[0].name}`, slot_2: `Nhì ${groupBuilders[1].name}` },
                { slot_1: `Nhất ${groupBuilders[1].name}`, slot_2: `Nhì ${groupBuilders[0].name}` }
            ]
        });
        bracketStages.push({
            stage_name: 'Chung kết',
            matches: [
                { slot_1: 'Thắng Bán kết 1', slot_2: 'Thắng Bán kết 2' }
            ]
        });
    } else if (groupBuilders.length === 4) {
        bracketStages.push({
            stage_name: 'Tứ kết',
            matches: [
                { slot_1: `Nhất ${groupBuilders[0].name}`, slot_2: `Nhì ${groupBuilders[1].name}` },
                { slot_1: `Nhất ${groupBuilders[2].name}`, slot_2: `Nhì ${groupBuilders[3].name}` },
                { slot_1: `Nhất ${groupBuilders[1].name}`, slot_2: `Nhì ${groupBuilders[0].name}` },
                { slot_1: `Nhất ${groupBuilders[3].name}`, slot_2: `Nhì ${groupBuilders[2].name}` }
            ]
        });
        bracketStages.push({
            stage_name: 'Bán kết',
            matches: [
                { slot_1: 'Thắng Tứ kết 1', slot_2: 'Thắng Tứ kết 2' },
                { slot_1: 'Thắng Tứ kết 3', slot_2: 'Thắng Tứ kết 4' }
            ]
        });
        bracketStages.push({
            stage_name: 'Chung kết',
            matches: [
                { slot_1: 'Thắng Bán kết 1', slot_2: 'Thắng Bán kết 2' }
            ]
        });
    } else {
        bracketStages.push({
            stage_name: 'Chung kết',
            matches: [
                { slot_1: `Nhất ${groupBuilders[0].name}`, slot_2: groupBuilders[1] ? `Nhất ${groupBuilders[1].name}` : 'Đội 2' }
            ]
        });
    }
    renderBracketBuilders();
    showToast('Đã tự động tạo sơ đồ thi đấu Knockout!', 'success');
}

export function addNewBracketStage() {
    bracketStages.push({
        stage_name: `Vòng ${bracketStages.length + 1}`,
        matches: [{ slot_1: '', slot_2: '' }]
    });
    renderBracketBuilders();
}

export function removeBracketStage(sIdx) {
    bracketStages.splice(sIdx, 1);
    renderBracketBuilders();
}

export function updateBracketSlot(sIdx, mIdx, slotNum, val) {
    if (bracketStages[sIdx] && bracketStages[sIdx].matches[mIdx]) {
        bracketStages[sIdx].matches[mIdx][slotNum === 1 ? 'slot_1' : 'slot_2'] = val;
    }
}

export function addMatchToStage(sIdx) {
    if (bracketStages[sIdx]) {
        bracketStages[sIdx].matches.push({ slot_1: '', slot_2: '' });
        renderBracketBuilders();
    }
}

export function removeMatchFromStage(sIdx, mIdx) {
    if (bracketStages[sIdx]) {
        bracketStages[sIdx].matches.splice(mIdx, 1);
        renderBracketBuilders();
    }
}

export function renderBracketBuilders() {
    const container = document.getElementById('brackets-builder-container');
    if (!container) return;

    if (bracketStages.length === 0) {
        container.innerHTML = `<div class="empty-placeholder">Chưa có sơ đồ thi đấu. Bấm "🔄 Tự động tạo theo bảng" hoặc "Thêm vòng đấu" ở trên.</div>`;
        return;
    }

    container.innerHTML = bracketStages.map((stg, sIdx) => `
        <div class="bracket-stage-card" style="border:1px solid var(--border); border-radius:10px; padding:16px; margin-bottom:16px; background:var(--panel);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <input type="text" value="${stg.stage_name}" oninput="bracketStages[${sIdx}].stage_name = this.value" style="font-weight:800; font-size:14px; padding:4px 8px; border-radius:6px; border:1px solid var(--border); width:160px;">
                <div style="display:flex; gap:8px;">
                    <button type="button" class="btn btn-sm btn-ghost" onclick="window.addMatchToStage(${sIdx})"><i data-lucide="plus"></i> Thêm trận</button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="window.removeBracketStage(${sIdx})"><i data-lucide="trash-2"></i> Xoá vòng</button>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:10px;">
                ${stg.matches.map((m, mIdx) => `
                    <div style="border:1px solid var(--border); border-radius:8px; padding:10px; background:#fff;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span style="font-size:11px; font-weight:800; color:var(--muted);">TRẬN #${mIdx+1}</span>
                            <button type="button" class="btn btn-sm btn-danger" style="padding:2px 6px; font-size:10px;" onclick="window.removeMatchFromStage(${sIdx}, ${mIdx})">✕</button>
                        </div>
                        <input type="text" value="${m.slot_1 || ''}" placeholder="Vị trí 1 (VD: Nhất bảng A)" oninput="window.updateBracketSlot(${sIdx}, ${mIdx}, 1, this.value)" style="width:100%; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px; margin-bottom:6px;">
                        <input type="text" value="${m.slot_2 || ''}" placeholder="Vị trí 2 (VD: Nhì bảng B)" oninput="window.updateBracketSlot(${sIdx}, ${mIdx}, 2, this.value)" style="width:100%; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px;">
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}
