// ==========================================
// MODULE: TOURNAMENT DETAIL & TEAM PAYMENTS
// ==========================================

import { API_BASE, apiRequest } from '../core/api.js?v=28';
import { showToast } from '../core/toast.js?v=28';
import { svgAvatar } from '../core/avatar.js?v=28';

export let currentTournamentId = null;

export function setCurrentTournamentId(id) {
    currentTournamentId = id;
}

export function getPlayerAvatarUrl(avatarPath, name) {
    if (avatarPath && avatarPath.trim() !== '') {
        return (avatarPath.startsWith('http') || avatarPath.startsWith('data:'))
            ? avatarPath
            : API_BASE.replace('/api', '') + '/' + avatarPath;
    }
    return svgAvatar(name || '?');
}

export async function refreshTournamentDetail() {
    if (!currentTournamentId) return;
    const res = await apiRequest(`/tournaments/detail?id=${currentTournamentId}`);
    if (!res || !res.data) return;

    const data = res.data;
    const t = data.tournament;
    const teams = data.teams || [];
    const matchups = data.matchups || [];
    const groups = data.groups || [];
    const brackets = data.brackets || [];

    // Title & Description
    const titleEl = document.getElementById('detail-title');
    const subEl = document.getElementById('detail-sub');
    if (titleEl) titleEl.textContent = t.title || 'Chi tiết giải đấu';
    if (subEl) subEl.textContent = t.description || 'Quản lý danh sách các đội tham gia và trạng thái đóng lệ phí';

    // Final Results Banner (if finished)
    const resultsContainer = document.getElementById('tournament-results-banner');
    if (resultsContainer) {
        if (t.end_date && t.final_results) {
            let results = [];
            try { results = typeof t.final_results === 'string' ? JSON.parse(t.final_results) : t.final_results; } catch(e) {}
            if (Array.isArray(results) && results.length > 0) {
                resultsContainer.style.display = 'block';
                resultsContainer.innerHTML = `
                    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color:#fff; border-radius:12px; padding:20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h3 style="margin:0; color:#fbbf24; font-size:18px; display:flex; align-items:center; gap:8px;">
                                🏆 KẾT QUẢ CHUNG CUỘC
                            </h3>
                            <span style="font-size:11px; background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:6px;">Giải đấu đã kết thúc</span>
                        </div>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
                            ${results.map(r => `
                                <div style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px;">
                                    <div style="display:flex; align-items:center; gap:6px; font-weight:800; font-size:13px; color:#f8fafc;">
                                        <span>${r.medal || '🥇'}</span>
                                        <span>${r.rank}</span>
                                    </div>
                                    <div style="color:#fbbf24; font-weight:700; font-size:14px; margin-top:4px;">${r.team_name || 'Chưa rõ'}</div>
                                    ${r.reward ? `<div style="font-size:11px; color:#94a3b8; margin-top:2px;">🎁 ${r.reward}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                resultsContainer.style.display = 'none';
            }
        } else {
            resultsContainer.style.display = 'none';
        }
    }

    // 1. RENDER TEAMS LIST (MAIN PAYMENT MANAGEMENT)
    const teamsList = document.getElementById('tournament-teams-list');
    const teamStatsEl = document.getElementById('tournament-team-stats');
    if (teamStatsEl) {
        const paidCount = teams.filter(tm => tm.status === 'Đã chuyển khoản').length;
        teamStatsEl.textContent = `Tổng: ${teams.length} đội | Đã đóng tiền: ${paidCount}/${teams.length} đội`;
    }

    if (teamsList) {
        if (teams.length === 0) {
            teamsList.innerHTML = `<div class="empty-placeholder" style="padding: 24px; text-align:center; color:var(--muted);">Chưa có đội nào tham gia giải đấu này.</div>`;
        } else {
            teamsList.innerHTML = `
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:14px;">
                    ${teams.map((tm, idx) => {
                        const isPaid = tm.status === 'Đã chuyển khoản';
                        const p1Ava = getPlayerAvatarUrl(tm.p1_avatar, tm.p1_name || 'A');
                        const p2Ava = getPlayerAvatarUrl(tm.p2_avatar, tm.p2_name || 'B');
                        const fb1 = svgAvatar(tm.p1_name || 'A');
                        const fb2 = svgAvatar(tm.p2_name || 'B');

                        const cardStyle = isPaid
                            ? 'background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); border: 1.5px solid #86efac; box-shadow: 0 2px 10px rgba(16, 185, 129, 0.08);'
                            : 'background: linear-gradient(180deg, #ffffff 0%, #fef2f2 100%); border: 1.5px solid #fca5a5; box-shadow: 0 2px 10px rgba(239, 68, 68, 0.08);';

                        const tagStyle = isPaid
                            ? 'color: #15803d; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25);'
                            : 'color: #b91c1c; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);';

                        const btnStyle = isPaid
                            ? 'background:#10b981; color:#fff; border: 1px solid #10b981;'
                            : 'background:#fee2e2; color:#dc2626; border: 1.5px solid #fca5a5; font-weight:800;';

                        return `
                            <div class="team-payment-card" style="border-radius:12px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; gap:12px; transition: all 0.2s ease; ${cardStyle}">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="font-weight:800; font-size:11px; padding:3px 8px; border-radius:6px; ${tagStyle}">ĐỘI #${idx+1}</span>
                                        ${tm.group_name ? `<span style="font-size:11px; font-weight:800; color:var(--primary); background:#e0f2fe; padding:3px 8px; border-radius:6px;">${tm.group_name}</span>` : ''}
                                    </div>
                                    <button class="btn btn-sm" style="padding:4px 10px; font-size:11px; ${btnStyle}" onclick="window.toggleTeamPaymentStatus(${tm.id || 0}, ${tm.p1_id || tm.player1_id || 0}, ${tm.p2_id || tm.player2_id || 0}, '${isPaid ? 'Chưa chuyển khoản' : 'Đã chuyển khoản'}', '${(tm.p1_name || 'VĐV 1') + ' & ' + (tm.p2_name || 'VĐV 2')}')">
                                        ${isPaid ? '<i data-lucide="check"></i> Đã đóng tiền' : '<i data-lucide="x"></i> Chưa đóng tiền'}
                                    </button>
                                </div>

                                <div style="display:flex; flex-direction:column; gap:8px; background:#ffffff; padding:10px 12px; border-radius:10px; border:1px solid ${isPaid ? '#dcfce7' : '#fee2e2'};">
                                    <div style="display:flex; align-items:center; justify-content:space-between;">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <img src="${p1Ava}" onerror="this.onerror=null;this.src='${fb1}';" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0;">
                                            <span style="font-size:13.5px; font-weight:700;">${tm.p1_name || 'Tự do'}</span>
                                        </div>
                                        <span style="font-size:12px; font-weight:800; color:#d97706; background:#fef3c7; padding:2px 6px; border-radius:4px;">${parseFloat(tm.p1_points || 0).toFixed(2)} pts</span>
                                    </div>
                                    
                                    <div style="height:1px; background:#f1f5f9;"></div>

                                    <div style="display:flex; align-items:center; justify-content:space-between;">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <img src="${p2Ava}" onerror="this.onerror=null;this.src='${fb2}';" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0;">
                                            <span style="font-size:13.5px; font-weight:700;">${tm.p2_name || 'Tự do'}</span>
                                        </div>
                                        <span style="font-size:12px; font-weight:800; color:#d97706; background:#fef3c7; padding:2px 6px; border-radius:4px;">${parseFloat(tm.p2_points || 0).toFixed(2)} pts</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    }

    // 2. RENDER GROUPS IN ADMIN DETAIL
    const groupsSec = document.getElementById('admin-detail-groups-section');
    const groupsList = document.getElementById('admin-detail-groups-list');
    if (groupsSec && groupsList) {
        if (groups.length > 0) {
            groupsSec.style.display = 'block';
            groupsList.innerHTML = groups.map(g => {
                const matches = g.matches || [];
                let mHtml = '';
                if (matches.length === 0) {
                    mHtml = '<div style="font-size:13px; color:var(--muted); padding:12px; background:#f8fafc; border-radius:8px; text-align:center;">Chưa có trận đấu trong bảng này.</div>';
                } else {
                    mHtml = `
                        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:10px;">
                            ${matches.map((gm, gmIdx) => {
                                const p1Ava = getPlayerAvatarUrl(gm.t1_p1_avatar, gm.t1_p1_name || 'A');
                                const p2Ava = getPlayerAvatarUrl(gm.t1_p2_avatar, gm.t1_p2_name || 'B');
                                const p3Ava = getPlayerAvatarUrl(gm.t2_p1_avatar, gm.t2_p1_name || 'C');
                                const p4Ava = getPlayerAvatarUrl(gm.t2_p2_avatar, gm.t2_p2_name || 'D');
                                const fb1 = svgAvatar(gm.t1_p1_name || 'A');
                                const fb2 = svgAvatar(gm.t1_p2_name || 'B');
                                const fb3 = svgAvatar(gm.t2_p1_name || 'C');
                                const fb4 = svgAvatar(gm.t2_p2_name || 'D');

                                return `
                                    <div style="padding:12px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,0.03);">
                                        <div style="font-size:10.5px; font-weight:800; color:var(--primary); margin-bottom:8px; display:flex; justify-content:space-between;">
                                            <span>TRẬN #${gmIdx+1}</span>
                                            <span style="font-size:10px; font-weight:700; color:${gm.status === 'Đã chuyển khoản' ? '#16a34a' : '#dc2626'};">${gm.status}</span>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                                <div style="display:flex; align-items:center; gap:4px;">
                                                    <img src="${p1Ava}" onerror="this.onerror=null;this.src='${fb1}';" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                                                    <span style="font-size:12px; font-weight:700;" class="truncate">${gm.t1_p1_name || 'Tự do'}</span>
                                                </div>
                                                <div style="display:flex; align-items:center; gap:4px;">
                                                    <img src="${p2Ava}" onerror="this.onerror=null;this.src='${fb2}';" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                                                    <span style="font-size:12px; font-weight:700;" class="truncate">${gm.t1_p2_name || 'Tự do'}</span>
                                                </div>
                                            </div>

                                            <span style="font-size:10px; font-weight:900; color:#0284c7; background:#e0f2fe; padding:4px 6px; border-radius:6px; flex-shrink:0;">VS</span>

                                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                                <div style="display:flex; align-items:center; gap:4px;">
                                                    <img src="${p3Ava}" onerror="this.onerror=null;this.src='${fb3}';" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                                                    <span style="font-size:12px; font-weight:700;" class="truncate">${gm.t2_p1_name || 'Tự do'}</span>
                                                </div>
                                                <div style="display:flex; align-items:center; gap:4px;">
                                                    <img src="${p4Ava}" onerror="this.onerror=null;this.src='${fb4}';" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                                                    <span style="font-size:12px; font-weight:700;" class="truncate">${gm.t2_p2_name || 'Tự do'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }
                return `
                    <div style="margin-bottom:20px;">
                        <h3 style="font-size:15px; font-weight:800; color:var(--primary); margin-bottom:10px;">🏆 ${g.name}</h3>
                        ${mHtml}
                    </div>
                `;
            }).join('');
        } else {
            groupsSec.style.display = 'none';
        }
    }

    // 3. RENDER BRACKETS IN ADMIN DETAIL
    const bracketsSec = document.getElementById('admin-detail-brackets-section');
    const bracketsList = document.getElementById('admin-detail-brackets-list');
    if (bracketsSec && bracketsList) {
        if (brackets.length > 0) {
            bracketsSec.style.display = 'block';
            const stagesMap = {};
            brackets.forEach(b => {
                const sName = b.stage_name || 'Vòng đấu';
                if (!stagesMap[sName]) stagesMap[sName] = [];
                stagesMap[sName].push(b);
            });

            const stagePriority = { 'vòng 1/16': 1, 'vòng 1/8': 2, 'tứ kết': 3, 'bán kết': 4, 'chung kết': 5, 'tranh hạng 3': 6 };
            const stageNames = Object.keys(stagesMap).sort((a, b) => {
                const pA = stagePriority[a.toLowerCase()] || (10 - stagesMap[a].length);
                const pB = stagePriority[b.toLowerCase()] || (10 - stagesMap[b].length);
                return pA - pB;
            });

            let bracketHtml = '<div class="bracket-tree-container" style="display:flex; align-items:stretch; overflow-x:auto; padding:20px 10px; gap:40px; min-height:480px;">';

            stageNames.forEach((stage, sIdx) => {
                const stageMatches = stagesMap[stage];
                const isLastStage = sIdx === stageNames.length - 1;
                const isFinal = stage.toLowerCase().includes('chung kết') || isLastStage;

                let groupsHtml = '';
                if (isLastStage || stageMatches.length === 1) {
                    groupsHtml = `
                        <div class="bracket-group" style="display:flex; flex-direction:column; flex:1; position:relative;">
                            ${stageMatches.map(bm => `
                                <div class="bracket-match-wrap" style="display:flex; flex-direction:column; justify-content:center; flex:1; padding:8px 0;">
                                    <div style="padding:10px 12px; background:#fff; border:1.5px solid ${isFinal ? '#f59e0b' : '#e2e8f0'}; border-radius:10px; box-shadow:${isFinal ? '0 4px 12px rgba(245,158,11,0.12)' : '0 1px 4px rgba(0,0,0,0.03)'}; position:relative; z-index:2;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                            <span style="font-size:10px; font-weight:800; color:${isFinal ? '#d97706' : 'var(--primary)'}; background:${isFinal ? '#fef3c7' : 'rgba(55,157,224,0.1)'}; border:1px solid ${isFinal ? '#fde68a' : 'rgba(55,157,224,0.2)'}; padding:2px 6px; border-radius:4px;">
                                                ${isFinal ? 'TRẬN CHUNG KẾT' : `TRẬN #${bm.match_order}`}
                                            </span>
                                            ${bm.status === 'finished' ? '<span style="font-size:9.5px; font-weight:800; color:#15803d; background:#dcfce7; padding:1px 5px; border-radius:4px;">Kết thúc</span>' : (bm.status === 'live' ? '<span style="font-size:9.5px; font-weight:800; color:#b91c1c; background:#fee2e2; padding:1px 5px; border-radius:4px;">Đang đấu</span>' : '')}
                                        </div>
                                        <div style="font-size:12px; font-weight:700; padding:6px 8px; background:${bm.winner_id && bm.winner_id == 1 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}; border-radius:6px; margin-bottom:4px; display:flex; justify-content:space-between;">
                                            <span class="truncate">${bm.slot_1_label || 'TBD'}</span>
                                            <span style="font-weight:900; color:${bm.score_1 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${bm.score_1 || 0}</span>
                                        </div>
                                        <div style="font-size:12px; font-weight:700; padding:6px 8px; background:${bm.winner_id && bm.winner_id == 2 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}; border-radius:6px; display:flex; justify-content:space-between;">
                                            <span class="truncate">${bm.slot_2_label || 'TBD'}</span>
                                            <span style="font-weight:900; color:${bm.score_2 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${bm.score_2 || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    for (let i = 0; i < stageMatches.length; i += 2) {
                        const m1 = stageMatches[i];
                        const m2 = stageMatches[i + 1];

                        groupsHtml += `
                            <div class="bracket-group" style="display:flex; flex-direction:column; flex:1; position:relative;">
                                <!-- Trận 1 -->
                                <div class="bracket-match-wrap" style="display:flex; flex-direction:column; justify-content:center; flex:1; padding:8px 0;">
                                    <div style="padding:10px 12px; background:#fff; border:1.5px solid #e2e8f0; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,0.03); position:relative; z-index:2;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                            <span style="font-size:10px; font-weight:800; color:var(--primary); background:rgba(55,157,224,0.1); border:1px solid rgba(55,157,224,0.2); padding:2px 6px; border-radius:4px;">TRẬN #${m1.match_order}</span>
                                            ${m1.status === 'finished' ? '<span style="font-size:9.5px; font-weight:800; color:#15803d; background:#dcfce7; padding:1px 5px; border-radius:4px;">Kết thúc</span>' : (m1.status === 'live' ? '<span style="font-size:9.5px; font-weight:800; color:#b91c1c; background:#fee2e2; padding:1px 5px; border-radius:4px;">Đang đấu</span>' : '')}
                                        </div>
                                        <div style="font-size:12px; font-weight:700; padding:6px 8px; background:${m1.winner_id && m1.winner_id == 1 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}; border-radius:6px; margin-bottom:4px; display:flex; justify-content:space-between;">
                                            <span class="truncate">${m1.slot_1_label || 'TBD'}</span>
                                            <span style="font-weight:900; color:${m1.score_1 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m1.score_1 || 0}</span>
                                        </div>
                                        <div style="font-size:12px; font-weight:700; padding:6px 8px; background:${m1.winner_id && m1.winner_id == 2 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}; border-radius:6px; display:flex; justify-content:space-between;">
                                            <span class="truncate">${m1.slot_2_label || 'TBD'}</span>
                                            <span style="font-weight:900; color:${m1.score_2 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m1.score_2 || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                ${m2 ? `
                                    <!-- Trận 2 -->
                                    <div class="bracket-match-wrap" style="display:flex; flex-direction:column; justify-content:center; flex:1; padding:8px 0;">
                                        <div style="padding:10px 12px; background:#fff; border:1.5px solid #e2e8f0; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,0.03); position:relative; z-index:2;">
                                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                                <span style="font-size:10px; font-weight:800; color:var(--primary); background:rgba(55,157,224,0.1); border:1px solid rgba(55,157,224,0.2); padding:2px 6px; border-radius:4px;">TRẬN #${m2.match_order}</span>
                                                ${m2.status === 'finished' ? '<span style="font-size:9.5px; font-weight:800; color:#15803d; background:#dcfce7; padding:1px 5px; border-radius:4px;">Kết thúc</span>' : (m2.status === 'live' ? '<span style="font-size:9.5px; font-weight:800; color:#b91c1c; background:#fee2e2; padding:1px 5px; border-radius:4px;">Đang đấu</span>' : '')}
                                            </div>
                                            <div style="font-size:12px; font-weight:700; padding:6px 8px; background:${m2.winner_id && m2.winner_id == 1 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}; border-radius:6px; margin-bottom:4px; display:flex; justify-content:space-between;">
                                                <span class="truncate">${m2.slot_1_label || 'TBD'}</span>
                                                <span style="font-weight:900; color:${m2.score_1 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m2.score_1 || 0}</span>
                                            </div>
                                            <div style="font-size:12px; font-weight:700; padding:6px 8px; background:${m2.winner_id && m2.winner_id == 2 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}; border-radius:6px; display:flex; justify-content:space-between;">
                                                <span class="truncate">${m2.slot_2_label || 'TBD'}</span>
                                                <span style="font-weight:900; color:${m2.score_2 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m2.score_2 || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- SVG Dây nối cho cặp 2 trận -->
                                    <svg class="bracket-svg-connector" viewBox="0 0 40 100" preserveAspectRatio="none" style="position:absolute; right:-40px; top:0; width:40px; height:100%; pointer-events:none; overflow:visible; z-index:1;">
                                        <path d="M 0,25 H 20 V 75 H 0 M 20,50 H 40" stroke="#94a3b8" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
                                    </svg>
                                ` : `
                                    <!-- SVG Dây nối cho trận lẻ -->
                                    <svg class="bracket-svg-connector" viewBox="0 0 40 100" preserveAspectRatio="none" style="position:absolute; right:-40px; top:0; width:40px; height:100%; pointer-events:none; overflow:visible; z-index:1;">
                                        <path d="M 0,50 H 40" stroke="#94a3b8" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" />
                                    </svg>
                                `}
                            </div>
                        `;
                    }
                }

                bracketHtml += `
                    <div class="bracket-round" style="display:flex; flex-direction:column; width:260px; min-width:240px; flex-shrink:0;">
                        <div class="bracket-title ${isFinal ? 'final' : ''}" style="font-family:'Paytone One', sans-serif; font-size:13.5px; font-weight:800; text-align:center; padding:7px 14px; border-radius:10px; margin-bottom:20px; ${isFinal ? 'background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color:#d97706; border:1.5px solid #f59e0b;' : 'background:linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); color:#0369a1; border:1.5px solid #7dd3fc;'}">
                            ${isFinal ? '👑 ' : '🏆 '}${stage}
                        </div>
                        <div class="bracket-matches" style="display:flex; flex-direction:column; flex:1;">
                            ${groupsHtml}
                        </div>
                    </div>
                `;
            });

            bracketHtml += '</div>';
            bracketsList.innerHTML = bracketHtml;
        } else {
            bracketsSec.style.display = 'none';
        }
    }

    if (window.lucide) window.lucide.createIcons();
}

export async function toggleTeamPaymentStatus(teamId, p1Id, p2Id, newStatus, teamName) {
    if (!currentTournamentId) return;

    const actionText = newStatus === 'Đã chuyển khoản'
        ? `Xác nhận Đội "${teamName || 'này'}" ĐÃ ĐÓNG lệ phí giải?`
        : `Xác nhận chuyển trạng thái Đội "${teamName || 'này'}" thành CHƯA ĐÓNG lệ phí?`;

    if (!confirm(actionText)) {
        return;
    }

    const res = await apiRequest(`/admin/tournaments/team-payment`, 'POST', {
        team_id: teamId || 0,
        tournament_id: currentTournamentId,
        p1_id: p1Id || 0,
        p2_id: p2Id || 0,
        status: newStatus
    });
    if (res && res.status === 'success') {
        showToast('Đã cập nhật trạng thái đóng tiền của đội!', 'success');
        refreshTournamentDetail();
    } else {
        showToast(res?.message || 'Có lỗi xảy ra khi cập nhật', 'error');
    }
}

export async function toggleMatchPaymentStatus(matchId, newStatus) {
    const res = await apiRequest(`/admin/matches/status`, 'POST', {
        match_id: matchId,
        status: newStatus
    });
    if (res && res.status === 'success') {
        showToast('Đã cập nhật trạng thái tiền kèo!', 'success');
        refreshTournamentDetail();
    } else {
        showToast(res?.message || 'Có lỗi xảy ra', 'error');
    }
}
