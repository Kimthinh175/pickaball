// ==========================================
// MODULE: TOURNAMENT FINISH & RESULTS
// ==========================================

import { apiRequest } from '../core/api.js?v=28';
import { showToast } from '../core/toast.js?v=28';
import { currentTournamentId, refreshTournamentDetail } from './tournament-detail.js?v=28';
import { loadTournaments } from './tournaments.js?v=28';

function getDefaultPointsForRank(rankName) {
    const lower = (rankName || '').toLowerCase();
    if (lower.includes('nhất') || lower.includes('vô địch') || lower.includes('1st')) return 0.15;
    if (lower.includes('nhì') || lower.includes('á quân') || lower.includes('2nd')) return 0.10;
    if (lower.includes('ba') || lower.includes('3rd')) return 0.05;
    if (lower.includes('khuyến khích')) return 0.05;
    return 0.00;
}

let cachedTeamOptions = [];

export async function openEndTournamentModal() {
    if (!currentTournamentId) {
        showToast('Chưa chọn giải đấu', 'error');
        return;
    }
    const res = await apiRequest(`/tournaments/detail?id=${currentTournamentId}`);
    if (!res || !res.data) {
        showToast('Không thể tải thông tin giải đấu', 'error');
        return;
    }

    const data = res.data;
    const t = data.tournament;
    const teams = data.teams || [];
    const matchups = data.matchups || [];
    const container = document.getElementById('finish-prizes-container');
    if (!container) return;

    // 1. Collect all participating teams
    cachedTeamOptions = [];
    if (teams.length > 0) {
        teams.forEach((tm, idx) => {
            const p1 = tm.p1_name || (tm.player1 ? tm.player1.name : '');
            const p2 = tm.p2_name || (tm.player2 ? tm.player2.name : '');
            const label = (p1 && p2) ? `${p1} & ${p2}` : (p1 || p2 || `Đội #${idx + 1}`);
            cachedTeamOptions.push({
                team_id: tm.id || null,
                p1_id: tm.player1_id || null,
                p2_id: tm.player2_id || null,
                name: label,
                text: `🏆 Đội #${idx + 1}: ${label}`
            });
        });
    }

    // Fallback if data.teams is empty, build from matchups
    if (cachedTeamOptions.length === 0) {
        matchups.forEach((m, idx) => {
            if (m.t1_p1_name && m.t1_p2_name) {
                const t1 = `${m.t1_p1_name} & ${m.t1_p2_name}`;
                if (!cachedTeamOptions.some(opt => opt.name === t1)) {
                    cachedTeamOptions.push({
                        team_id: null,
                        p1_id: m.team1_p1_id || null,
                        p2_id: m.team1_p2_id || null,
                        name: t1,
                        text: `🏆 ${t1}`
                    });
                }
            }
            if (m.t2_p1_name && m.t2_p2_name) {
                const t2 = `${m.t2_p1_name} & ${m.t2_p2_name}`;
                if (!cachedTeamOptions.some(opt => opt.name === t2)) {
                    cachedTeamOptions.push({
                        team_id: null,
                        p1_id: m.team2_p1_id || null,
                        p2_id: m.team2_p2_id || null,
                        name: t2,
                        text: `🏆 ${t2}`
                    });
                }
            }
        });
    }

    // Also include individual players from tournament if any
    (data.players || []).forEach(p => {
        if (p.name && !cachedTeamOptions.some(opt => opt.name === p.name)) {
            cachedTeamOptions.push({
                team_id: null,
                p1_id: p.id || null,
                p2_id: null,
                name: p.name,
                text: `👤 ${p.name}`
            });
        }
    });

    let prizes = [];
    try { prizes = typeof t.prizes === 'string' ? JSON.parse(t.prizes) : (t.prizes || []); } catch(e) {}
    if (!Array.isArray(prizes) || prizes.length === 0) {
        prizes = [
            { rank: 'Nhất (Vô địch)', reward: 'Huy chương Vàng & Cúp' },
            { rank: 'Nhì (Á quân)', reward: 'Huy chương Bạc' },
            { rank: 'Đồng Hạng Ba', reward: 'Huy chương Đồng' }
        ];
    }

    let existingResults = [];
    try { existingResults = typeof t.final_results === 'string' ? JSON.parse(t.final_results) : (t.final_results || []); } catch(e) {}

    const rankMedals = {
        'Nhất (Vô địch)': '🥇',
        'Nhì (Á quân)': '🥈',
        'Đồng Hạng Ba': '🥉',
        'Khuyến khích': '🎖️'
    };

    container.innerHTML = prizes.map(p => {
        const found = existingResults.find(r => r.rank === p.rank);
        const currentWinner = found ? (found.team_name || '') : '';
        const currentMedal = found ? found.medal : (rankMedals[p.rank] || '🥇');
        const defaultPts = getDefaultPointsForRank(p.rank);
        const currentPts = (found && found.points !== undefined) ? parseFloat(found.points).toFixed(2) : defaultPts.toFixed(2);

        return `
            <div class="finish-prize-row" style="border:1.5px solid var(--border); border-radius:12px; padding:14px 16px; background:var(--panel); margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
                    <select class="finish-medal-select" style="width:65px; font-size:16px; padding:6px 8px; border-radius:8px; border:1px solid var(--border); background:var(--panel2);">
                        <option value="🥇" ${currentMedal === '🥇' ? 'selected' : ''}>🥇</option>
                        <option value="🥈" ${currentMedal === '🥈' ? 'selected' : ''}>🥈</option>
                        <option value="🥉" ${currentMedal === '🥉' ? 'selected' : ''}>🥉</option>
                        <option value="🎖️" ${currentMedal === '🎖️' ? 'selected' : ''}>🎖️</option>
                        <option value="🏆" ${currentMedal === '🏆' ? 'selected' : ''}>🏆</option>
                    </select>
                    
                    <input type="text" class="finish-rank-input" value="${p.rank}" placeholder="Hạng giải" style="font-weight:800; width:140px; padding:7px 10px; border-radius:8px; border:1px solid var(--border);">
                    <input type="text" class="finish-reward-input" value="${p.reward || ''}" placeholder="Phần thưởng (VD: Cúp, Tiền thưởng...)" style="flex:1; min-width:150px; padding:7px 10px; border-radius:8px; border:1px solid var(--border);">
                    
                    <div style="display:flex; align-items:center; gap:6px; background:rgba(55,157,224,0.08); border:1px solid rgba(55,157,224,0.3); padding:4px 8px; border-radius:8px;">
                        <span style="font-size:11.5px; font-weight:800; color:var(--primary); white-space:nowrap;">Điểm +/-:</span>
                        <input type="number" step="0.05" class="finish-points-input" value="${currentPts}" placeholder="+0.15" style="width:78px; font-weight:900; color:var(--primary); padding:5px 6px; border-radius:6px; border:1px solid rgba(55,157,224,0.4); text-align:center; font-size:13px; background:#fff;">
                    </div>

                    <button type="button" class="btn btn-sm btn-danger" style="padding:7px 10px; border-radius:8px;" onclick="this.closest('.finish-prize-row').remove()">✕</button>
                </div>
                <div>
                    <label style="font-size:11.5px; color:var(--muted); font-weight:800; margin-bottom:5px; display:block;">Đội đạt giải:</label>
                    <select class="finish-winner-select" style="width:100%; padding:8px 12px; border-radius:8px; border:1.5px solid var(--border); font-weight:700; background:#fff;">
                        <option value="">-- Chọn Đội chiến thắng --</option>
                        ${cachedTeamOptions.map(opt => `
                            <option value="${opt.name}" data-team-id="${opt.team_id || ''}" data-p1="${opt.p1_id || ''}" data-p2="${opt.p2_id || ''}" ${currentWinner === opt.name ? 'selected' : ''}>
                                ${opt.text}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('modal-finish-tournament')?.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function closeEndTournamentModal() {
    document.getElementById('modal-finish-tournament')?.classList.remove('active');
}

export function addFinishPrizeRow() {
    const container = document.getElementById('finish-prizes-container');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'finish-prize-row';
    div.style = 'border:1.5px solid var(--border); border-radius:12px; padding:14px 16px; background:var(--panel); margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,0.03);';
    div.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
            <select class="finish-medal-select" style="width:65px; font-size:16px; padding:6px 8px; border-radius:8px; border:1px solid var(--border); background:var(--panel2);">
                <option value="🥇">🥇</option>
                <option value="🥈">🥈</option>
                <option value="🥉">🥉</option>
                <option value="🎖️" selected>🎖️</option>
                <option value="🏆">🏆</option>
            </select>
            <input type="text" class="finish-rank-input" value="Khuyến khích" placeholder="Hạng giải" style="font-weight:800; width:140px; padding:7px 10px; border-radius:8px; border:1px solid var(--border);">
            <input type="text" class="finish-reward-input" value="" placeholder="Phần thưởng" style="flex:1; min-width:150px; padding:7px 10px; border-radius:8px; border:1px solid var(--border);">
            
            <div style="display:flex; align-items:center; gap:6px; background:rgba(55,157,224,0.08); border:1px solid rgba(55,157,224,0.3); padding:4px 8px; border-radius:8px;">
                <span style="font-size:11.5px; font-weight:800; color:var(--primary); white-space:nowrap;">Điểm +/-:</span>
                <input type="number" step="0.05" class="finish-points-input" value="0.05" placeholder="+0.05" style="width:78px; font-weight:900; color:var(--primary); padding:5px 6px; border-radius:6px; border:1px solid rgba(55,157,224,0.4); text-align:center; font-size:13px; background:#fff;">
            </div>

            <button type="button" class="btn btn-sm btn-danger" style="padding:7px 10px; border-radius:8px;" onclick="this.closest('.finish-prize-row').remove()">✕</button>
        </div>
        <div>
            <label style="font-size:11.5px; color:var(--muted); font-weight:800; margin-bottom:5px; display:block;">Đội đạt giải:</label>
            <select class="finish-winner-select" style="width:100%; padding:8px 12px; border-radius:8px; border:1.5px solid var(--border); font-weight:700; background:#fff;">
                <option value="">-- Chọn Đội chiến thắng --</option>
                ${cachedTeamOptions.map(opt => `
                    <option value="${opt.name}" data-team-id="${opt.team_id || ''}" data-p1="${opt.p1_id || ''}" data-p2="${opt.p2_id || ''}">
                        ${opt.text}
                    </option>
                `).join('')}
            </select>
        </div>
    `;
    container.appendChild(div);
}

export async function submitFinishTournament(e) {
    if (e) e.preventDefault();
    if (!currentTournamentId) {
        showToast('Chưa chọn giải đấu', 'error');
        return;
    }

    const rows = document.querySelectorAll('#finish-prizes-container .finish-prize-row');
    const finalResults = [];

    rows.forEach(row => {
        const medal = row.querySelector('.finish-medal-select')?.value || '🥇';
        const rank = row.querySelector('.finish-rank-input')?.value.trim() || '';
        const reward = row.querySelector('.finish-reward-input')?.value.trim() || '';
        
        const selectEl = row.querySelector('.finish-winner-select');
        const teamName = selectEl?.value.trim() || '';
        const selectedOpt = selectEl?.options[selectEl.selectedIndex];
        const teamId = selectedOpt?.getAttribute('data-team-id') || null;
        const p1Id = selectedOpt?.getAttribute('data-p1') || null;
        const p2Id = selectedOpt?.getAttribute('data-p2') || null;

        const pointsRaw = row.querySelector('.finish-points-input')?.value;
        const points = (pointsRaw !== '' && !isNaN(parseFloat(pointsRaw))) ? parseFloat(pointsRaw) : getDefaultPointsForRank(rank);

        if (rank) {
            finalResults.push({
                medal,
                rank,
                reward,
                team_name: teamName,
                team_id: teamId,
                p1_id: p1Id,
                p2_id: p2Id,
                points: points
            });
        }
    });

    const applyPoints = document.getElementById('chk-auto-apply-points')?.checked ?? true;

    const payload = {
        id: currentTournamentId,
        final_results: finalResults,
        apply_points: applyPoints
    };

    const res = await apiRequest(`/admin/tournaments/finish`, 'POST', payload);
    if (res && res.status === 'success') {
        showToast('Đã lưu kết quả & kết thúc giải đấu!', 'success');
        closeEndTournamentModal();
        loadTournaments();
        refreshTournamentDetail();
    } else {
        showToast(res?.message || 'Có lỗi xảy ra', 'error');
    }
}
