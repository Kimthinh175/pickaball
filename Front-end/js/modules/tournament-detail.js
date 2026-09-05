// ==========================================
// MODULE: TOURNAMENT DETAIL
// ==========================================

import { API_BASE, avatarOf, calculateTournamentStatus, fmtDate, svgAvatar } from '../core/api.js?v=16';

export async function fetchTournamentDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    try {
        const res = await fetch(`${API_BASE}/tournaments/detail?id=${id}`);
        const data = await res.json();
        if (data.status !== 'success') return;

        const t = data.data.tournament;
        const teams = data.data.teams || [];
        const matchups = data.data.matchups || [];
        const groups = data.data.groups || [];
        const brackets = data.data.brackets || [];

        // Title & Description
        document.getElementById('td-title').innerText = t.title;
        document.getElementById('td-desc').innerText = t.description || 'Không có mô tả';

        // Banner & Position
        const bannerEl = document.getElementById('td-banner');
        if (bannerEl) {
            bannerEl.src = t.banner ? (t.banner.startsWith('http') ? t.banner : t.banner) : 'public/banners/1.jpg';
            bannerEl.style.objectPosition = t.banner_position || '50% 50%';
        }

        // Status calculation
        const computedStatus = calculateTournamentStatus(t.start_date, t.end_date);
        const statusEl = document.getElementById('td-status');
        if (statusEl) {
            statusEl.innerText = computedStatus;
            statusEl.className = 'badge-status ' + (computedStatus === 'Đang diễn ra' ? 'badge-ongoing' : (computedStatus === 'Đã kết thúc' ? 'badge-done' : 'badge-upcoming'));
        }

        document.getElementById('td-date').innerHTML = `Ngày bắt đầu: ` + fmtDate(t.start_date || t.created_at);

        // Rules
        const rulesEl = document.getElementById('td-rules');
        if (rulesEl) {
            rulesEl.innerHTML = t.rules ? `<div style="font-size:14px; line-height:1.6; color:var(--text); white-space:pre-wrap;">${t.rules}</div>` : '<div class="text-muted" style="font-size:13px;">Chưa cập nhật thể lệ</div>';
        }

        // Prizes
        const prizesEl = document.getElementById('td-prizes');
        if (prizesEl) {
            let prizes = [];
            try { prizes = typeof t.prizes === 'string' ? JSON.parse(t.prizes) : (t.prizes || []); } catch(e) {}
            if (Array.isArray(prizes) && prizes.length > 0) {
                prizesEl.innerHTML = `
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px; margin-top:8px;">
                        ${prizes.map(p => {
                            const rawRank = p.rank || '';
                            const rName = rawRank.replace(/đồng hạng ba/gi, 'Hạng Ba');
                            let icon = '🎁';
                            let borderStyle = 'border: 1.5px solid #e2e8f0; background: #fff;';
                            let titleColor = 'color: var(--text);';
                            let rewardColor = 'color: #d97706;';

                            if (rName.includes('Nhất') || rName.includes('Vô địch') || rName.includes('1')) {
                                icon = '🥇';
                                borderStyle = 'border: 1.5px solid #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); box-shadow: 0 3px 8px rgba(245, 158, 11, 0.12);';
                                titleColor = 'color: #92400e;';
                                rewardColor = 'color: #b45309;';
                            } else if (rName.includes('Nhì') || rName.includes('Á quân') || rName.includes('2')) {
                                icon = '🥈';
                                borderStyle = 'border: 1.5px solid #94a3b8; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); box-shadow: 0 3px 8px rgba(148, 163, 184, 0.12);';
                                titleColor = 'color: #334155;';
                                rewardColor = 'color: #475569;';
                            } else if (rName.includes('Ba') || rName.includes('3')) {
                                icon = '🥉';
                                borderStyle = 'border: 1.5px solid #fb923c; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); box-shadow: 0 3px 8px rgba(251, 146, 60, 0.12);';
                                titleColor = 'color: #9a3412;';
                                rewardColor = 'color: #c2410c;';
                            } else if (rName.includes('Khuyến khích')) {
                                icon = '🎖️';
                                borderStyle = 'border: 1.5px solid #86efac; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);';
                                titleColor = 'color: #166534;';
                                rewardColor = 'color: #15803d;';
                            } else {
                                icon = '🏆';
                                borderStyle = 'border: 1.5px solid #cbd5e1; background: #fff;';
                                titleColor = 'color: var(--primary);';
                                rewardColor = 'color: #0284c7;';
                            }

                            return `
                                <div style="display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:12px; ${borderStyle}">
                                    <div style="font-size:32px; line-height:1; flex-shrink:0;">${icon}</div>
                                    <div style="flex:1; min-width:0;">
                                        <div style="font-family:'Paytone One', sans-serif; font-size:14px; font-weight:800; margin-bottom:4px; ${titleColor}">${rName}</div>
                                        <div style="font-size:13px; font-weight:700; ${rewardColor}">${p.reward || 'Chưa cập nhật'}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                prizesEl.innerHTML = '<div class="text-muted" style="font-size:13px;">Chưa cập nhật cơ cấu giải thưởng</div>';
            }
        }

        const ongoingBlocks = document.getElementById('td-ongoing-blocks');
        const finishedBlocks = document.getElementById('td-finished-blocks');

        if (computedStatus === 'Đã kết thúc') {
            if (ongoingBlocks) ongoingBlocks.style.display = 'none';
            if (finishedBlocks) finishedBlocks.style.display = 'block';

            // Render Final Results
            const podiumWrap = document.getElementById('td-final-podium-wrap');
            if (podiumWrap) {
                let results = [];
                try { results = typeof t.final_results === 'string' ? JSON.parse(t.final_results) : (t.final_results || []); } catch(e) {}

                if (Array.isArray(results) && results.length > 0) {
                    podiumWrap.innerHTML = `
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px;">
                            ${results.map(r => `
                                <div class="neo-box" style="padding:16px; text-align:center; background:#fff;">
                                    <div style="font-size:32px; margin-bottom:8px;">${r.medal || '🥇'}</div>
                                    <div style="font-family:'Paytone One', sans-serif; font-size:16px; color:var(--primary); margin-bottom:4px;">${(r.rank || '').replace(/đồng hạng ba/gi, 'Hạng Ba')}</div>
                                    <div style="font-weight:800; font-size:15px; color:#d97706; margin-bottom:6px;">${r.team_name || 'Đang cập nhật'}</div>
                                    ${r.reward ? `<div style="font-size:12px; color:var(--muted); font-weight:700;">🎁 ${r.reward}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    podiumWrap.innerHTML = `<div class="empty">Chưa cập nhật kết quả chung cuộc.</div>`;
                }
            }
        } else {
            if (ongoingBlocks) ongoingBlocks.style.display = 'block';
            if (finishedBlocks) finishedBlocks.style.display = 'none';

            // 1. Render Teams List (Danh sách Đội thi đấu - Nằm trên Bảng đấu)
            const teamsEl = document.getElementById('td-teams-list');
            const teamsCountEl = document.getElementById('td-teams-count');

            if (teamsCountEl) {
                const paidCount = teams.filter(tm => tm.status === 'Đã chuyển khoản').length;
                teamsCountEl.textContent = `Tổng: ${teams.length} đội | Đã đóng: ${paidCount}/${teams.length}`;
            }

            if (teamsEl) {
                if (teams.length === 0) {
                    teamsEl.innerHTML = '<div class="empty">Chưa có đội nào tham gia giải đấu này.</div>';
                } else {
                    teamsEl.innerHTML = teams.map((tm, idx) => {
                        const isPaid = tm.status === 'Đã chuyển khoản';
                        const p1Ava = tm.p1_avatar ? (tm.p1_avatar.startsWith('http') ? tm.p1_avatar : tm.p1_avatar) : svgAvatar(tm.p1_name || 'A');
                        const p2Ava = tm.p2_avatar ? (tm.p2_avatar.startsWith('http') ? tm.p2_avatar : tm.p2_avatar) : svgAvatar(tm.p2_name || 'B');
                        const fb1 = svgAvatar(tm.p1_name || 'A');
                        const fb2 = svgAvatar(tm.p2_name || 'B');

                        const cardStyle = isPaid
                            ? 'background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border: 1.5px solid #86efac; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.06);'
                            : 'background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%); border: 1.5px solid #fca5a5; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.06);';

                        const tagStyle = isPaid
                            ? 'color: #15803d; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25);'
                            : 'color: #b91c1c; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);';

                        const badgeStyle = isPaid
                            ? 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;'
                            : 'background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;';

                        return `
                            <div class="team-row-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 18px; border-radius:12px; transition:all 0.2s ease; gap:16px; flex-wrap:wrap; ${cardStyle}">
                                <!-- Bên trái: Tên Đội, Số thứ tự, Bảng đấu, và 2 Tuyển thủ (Căn trái) -->
                                <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap; flex:1; min-width:280px;">
                                    <div style="display:flex; align-items:center; gap:6px;">
                                        <span style="font-weight:800; font-size:11.5px; padding:3px 8px; border-radius:6px; ${tagStyle}">ĐỘI #${idx+1}</span>
                                        ${tm.group_name ? `<span style="font-weight:800; font-size:11px; padding:3px 8px; border-radius:6px; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">🏆 ${tm.group_name}</span>` : ''}
                                    </div>

                                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                                        <!-- VĐV 1 -->
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <img src="${p1Ava}" onerror="this.onerror=null;this.src='${fb1}';" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1.5px solid #e2e8f0;">
                                            <span style="font-size:13.5px; font-weight:700; color:var(--text);">
                                                ${tm.p1_nickname ? `<strong>${tm.p1_nickname}</strong> <span style="font-size:11.5px; color:var(--muted); font-weight:normal;">(${tm.p1_name})</span>` : (tm.p1_name || 'Tự do')}
                                            </span>
                                            ${tm.p1_points !== undefined && tm.p1_points !== null ? `<span style="font-size:11px; font-weight:800; color:#d97706; background:#fef3c7; padding:1px 6px; border-radius:4px;">${parseFloat(tm.p1_points).toFixed(2)} pts</span>` : ''}
                                        </div>

                                        <span style="color:var(--muted); font-weight:900; font-size:12px;">&amp;</span>

                                        <!-- VĐV 2 -->
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <img src="${p2Ava}" onerror="this.onerror=null;this.src='${fb2}';" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1.5px solid #e2e8f0;">
                                            <span style="font-size:13.5px; font-weight:700; color:var(--text);">
                                                ${tm.p2_nickname ? `<strong>${tm.p2_nickname}</strong> <span style="font-size:11.5px; color:var(--muted); font-weight:normal;">(${tm.p2_name})</span>` : (tm.p2_name || 'Tự do')}
                                            </span>
                                            ${tm.p2_points !== undefined && tm.p2_points !== null ? `<span style="font-size:11px; font-weight:800; color:#d97706; background:#fef3c7; padding:1px 6px; border-radius:4px;">${parseFloat(tm.p2_points).toFixed(2)} pts</span>` : ''}
                                        </div>
                                    </div>
                                </div>

                                <!-- Bên phải: Trạng thái đóng lệ phí (Căn phải) -->
                                <div style="flex-shrink:0;">
                                    <span style="font-size:11.5px; font-weight:800; padding:5px 12px; border-radius:8px; display:inline-flex; align-items:center; gap:5px; ${badgeStyle}">
                                        ${isPaid ? '✓ Đã đóng tiền' : '✕ Chưa đóng tiền'}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }

            // 2. Render Groups (Bảng đấu)
            const groupsEl = document.getElementById('td-groups');
            if (groupsEl) {
                if (groups.length === 0) {
                    groupsEl.innerHTML = '<div class="empty">Chưa tạo bảng đấu.</div>';
                } else {
                    groupsEl.innerHTML = groups.map((g, gIdx) => {
                        const matches = g.matches || [];
                        let matchesHtml = '';
                        if (matches.length === 0) {
                            matchesHtml = `<div style="font-size:13px; color:var(--muted); padding:14px; background:#fff; border-radius:10px; border:1px dashed #cbd5e1; text-align:center;">Bảng này chưa có đủ 2 đội để tạo trận đấu vòng tròn.</div>`;
                        } else {
                            matchesHtml = `
                                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:14px;">
                                    ${matches.map((gm, gmIdx) => {
                                        const p1Ava = gm.t1_p1_avatar ? (gm.t1_p1_avatar.startsWith('http') ? gm.t1_p1_avatar : gm.t1_p1_avatar) : svgAvatar(gm.t1_p1_name || 'A');
                                        const p2Ava = gm.t1_p2_avatar ? (gm.t1_p2_avatar.startsWith('http') ? gm.t1_p2_avatar : gm.t1_p2_avatar) : svgAvatar(gm.t1_p2_name || 'B');
                                        const p3Ava = gm.t2_p1_avatar ? (gm.t2_p1_avatar.startsWith('http') ? gm.t2_p1_avatar : gm.t2_p1_avatar) : svgAvatar(gm.t2_p1_name || 'C');
                                        const p4Ava = gm.t2_p2_avatar ? (gm.t2_p2_avatar.startsWith('http') ? gm.t2_p2_avatar : gm.t2_p2_avatar) : svgAvatar(gm.t2_p2_name || 'D');

                                        const fb1 = svgAvatar(gm.t1_p1_name || 'A');
                                        const fb2 = svgAvatar(gm.t1_p2_name || 'B');
                                        const fb3 = svgAvatar(gm.t2_p1_name || 'C');
                                        const fb4 = svgAvatar(gm.t2_p2_name || 'D');

                                        return `
                                            <div class="match-item neo-box" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:12px; padding:14px; box-shadow:0 2px 6px rgba(0,0,0,0.03); display:flex; flex-direction:column; gap:10px; transition:all 0.2s ease;">
                                                <!-- Header trận đấu -->
                                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                                    <span style="font-size:11px; font-weight:800; color:var(--primary); background:rgba(55,157,224,0.1); border:1px solid rgba(55,157,224,0.2); padding:2px 8px; border-radius:6px;">TRẬN #${gmIdx+1}</span>
                                                </div>

                                                <!-- Đội 1 (Ở trên) -->
                                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:6px;">
                                                    <div style="font-size:10px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.3px;">Đội 1</div>
                                                    
                                                    <!-- VĐV 1 -->
                                                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                                                        <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                                                            <img src="${p1Ava}" onerror="this.onerror=null;this.src='${fb1}';" style="width:22px; height:22px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;">
                                                            <span style="font-size:12.5px; font-weight:700; color:var(--text);" class="truncate" title="${gm.t1_p1_nickname ? `${gm.t1_p1_nickname} (${gm.t1_p1_name})` : (gm.t1_p1_name || 'Tự do')}">
                                                                ${gm.t1_p1_nickname ? `<strong>${gm.t1_p1_nickname}</strong> <span style="font-size:10.5px; color:var(--muted); font-weight:normal;">(${gm.t1_p1_name})</span>` : (gm.t1_p1_name || 'Tự do')}
                                                            </span>
                                                        </div>
                                                        ${gm.t1_p1_points !== undefined && gm.t1_p1_points !== null ? `<span style="font-size:10.5px; font-weight:800; color:#d97706; background:#fef3c7; padding:1px 5px; border-radius:4px; flex-shrink:0;">${parseFloat(gm.t1_p1_points).toFixed(2)}</span>` : ''}
                                                    </div>

                                                    <div style="height:1px; background:rgba(0,0,0,0.04);"></div>

                                                    <!-- VĐV 2 -->
                                                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                                                        <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                                                            <img src="${p2Ava}" onerror="this.onerror=null;this.src='${fb2}';" style="width:22px; height:22px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;">
                                                            <span style="font-size:12.5px; font-weight:700; color:var(--text);" class="truncate" title="${gm.t1_p2_nickname ? `${gm.t1_p2_nickname} (${gm.t1_p2_name})` : (gm.t1_p2_name || 'Tự do')}">
                                                                ${gm.t1_p2_nickname ? `<strong>${gm.t1_p2_nickname}</strong> <span style="font-size:10.5px; color:var(--muted); font-weight:normal;">(${gm.t1_p2_name})</span>` : (gm.t1_p2_name || 'Tự do')}
                                                            </span>
                                                        </div>
                                                        ${gm.t1_p2_points !== undefined && gm.t1_p2_points !== null ? `<span style="font-size:10.5px; font-weight:800; color:#d97706; background:#fef3c7; padding:1px 5px; border-radius:4px; flex-shrink:0;">${parseFloat(gm.t1_p2_points).toFixed(2)}</span>` : ''}
                                                    </div>
                                                </div>

                                                <!-- Divider VS ở giữa -->
                                                <div style="display:flex; align-items:center; gap:8px; margin:-2px 0;">
                                                    <div style="flex:1; height:1px; background:#e2e8f0;"></div>
                                                    <span style="font-family:'Paytone One', sans-serif; font-size:10px; font-weight:900; color:#0284c7; background:#e0f2fe; border:1px solid #bae6fd; padding:2px 8px; border-radius:6px; letter-spacing:0.5px;">VS</span>
                                                    <div style="flex:1; height:1px; background:#e2e8f0;"></div>
                                                </div>

                                                <!-- Đội 2 (Ở dưới) -->
                                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:6px;">
                                                    <div style="font-size:10px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.3px;">Đội 2</div>

                                                    <!-- VĐV 1 -->
                                                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                                                        <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                                                            <img src="${p3Ava}" onerror="this.onerror=null;this.src='${fb3}';" style="width:22px; height:22px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;">
                                                            <span style="font-size:12.5px; font-weight:700; color:var(--text);" class="truncate" title="${gm.t2_p1_nickname ? `${gm.t2_p1_nickname} (${gm.t2_p1_name})` : (gm.t2_p1_name || 'Tự do')}">
                                                                ${gm.t2_p1_nickname ? `<strong>${gm.t2_p1_nickname}</strong> <span style="font-size:10.5px; color:var(--muted); font-weight:normal;">(${gm.t2_p1_name})</span>` : (gm.t2_p1_name || 'Tự do')}
                                                            </span>
                                                        </div>
                                                        ${gm.t2_p1_points !== undefined && gm.t2_p1_points !== null ? `<span style="font-size:10.5px; font-weight:800; color:#d97706; background:#fef3c7; padding:1px 5px; border-radius:4px; flex-shrink:0;">${parseFloat(gm.t2_p1_points).toFixed(2)}</span>` : ''}
                                                    </div>

                                                    <div style="height:1px; background:rgba(0,0,0,0.04);"></div>

                                                    <!-- VĐV 2 -->
                                                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                                                        <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                                                            <img src="${p4Ava}" onerror="this.onerror=null;this.src='${fb4}';" style="width:22px; height:22px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;">
                                                            <span style="font-size:12.5px; font-weight:700; color:var(--text);" class="truncate" title="${gm.t2_p2_nickname ? `${gm.t2_p2_nickname} (${gm.t2_p2_name})` : (gm.t2_p2_name || 'Tự do')}">
                                                                ${gm.t2_p2_nickname ? `<strong>${gm.t2_p2_nickname}</strong> <span style="font-size:10.5px; color:var(--muted); font-weight:normal;">(${gm.t2_p2_name})</span>` : (gm.t2_p2_name || 'Tự do')}
                                                            </span>
                                                        </div>
                                                        ${gm.t2_p2_points !== undefined && gm.t2_p2_points !== null ? `<span style="font-size:10.5px; font-weight:800; color:#d97706; background:#fef3c7; padding:1px 5px; border-radius:4px; flex-shrink:0;">${parseFloat(gm.t2_p2_points).toFixed(2)}</span>` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `;
                        }

                        return `
                            <div class="group-table-wrap" style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:16px; padding:18px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:10px; border-bottom:1.5px solid #e2e8f0; flex-wrap:wrap; gap:8px;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="font-family:'Paytone One', sans-serif; font-size:15px; color:#0369a1; background:linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border:1.5px solid #7dd3fc; padding:4px 12px; border-radius:8px;">
                                            🏆 ${g.name}
                                        </span>
                                    </div>
                                    <span style="font-size:12px; font-weight:700; color:var(--muted);">${matches.length} trận đấu vòng tròn</span>
                                </div>
                                ${matchesHtml}
                            </div>
                        `;
                    }).join('');
                }
            }

            // 3. Render Brackets Knockout với Dây Nối
            const bracketsEl = document.getElementById('td-brackets');
            if (bracketsEl) {
                if (brackets.length === 0) {
                    bracketsEl.innerHTML = '<div class="empty">Chưa tạo sơ đồ thi đấu.</div>';
                } else {
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
                                    ${stageMatches.map(m => `
                                        <div class="bracket-match-wrap" style="display:flex; flex-direction:column; justify-content:center; flex:1; padding:8px 0;">
                                            <div class="neo-box bracket-card" style="background:#ffffff; border:1.5px solid ${isFinal ? '#f59e0b' : '#e2e8f0'}; border-radius:12px; padding:12px 14px; box-shadow:${isFinal ? '0 4px 14px rgba(245,158,11,0.12)' : '0 2px 6px rgba(0,0,0,0.03)'}; position:relative; z-index:2; transition:all 0.2s ease;">
                                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                                    <span style="font-size:10.5px; font-weight:800; color:${isFinal ? '#d97706' : 'var(--primary)'}; background:${isFinal ? '#fef3c7' : 'rgba(55,157,224,0.1)'}; border:1px solid ${isFinal ? '#fde68a' : 'rgba(55,157,224,0.2)'}; padding:2px 6px; border-radius:4px;">
                                                        ${isFinal ? 'TRẬN CHUNG KẾT' : `TRẬN #${m.match_order}`}
                                                    </span>
                                                    ${m.status === 'finished' ? '<span style="font-size:9.5px; font-weight:800; color:#15803d; background:#dcfce7; padding:1px 5px; border-radius:4px;">Kết thúc</span>' : (m.status === 'live' ? '<span style="font-size:9.5px; font-weight:800; color:#b91c1c; background:#fee2e2; padding:1px 5px; border-radius:4px;">Đang đấu</span>' : '')}
                                                </div>
                                                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:6px; font-size:12px; font-weight:700; margin-bottom:5px; background:${m.winner_id && m.winner_id == 1 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}">
                                                    <span class="truncate" style="color:var(--text);">${m.slot_1_label || 'TBD'}</span>
                                                    <span style="font-weight:900; color:${m.score_1 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m.score_1 || 0}</span>
                                                </div>
                                                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:6px; font-size:12px; font-weight:700; background:${m.winner_id && m.winner_id == 2 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}">
                                                    <span class="truncate" style="color:var(--text);">${m.slot_2_label || 'TBD'}</span>
                                                    <span style="font-weight:900; color:${m.score_2 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m.score_2 || 0}</span>
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
                                            <div class="neo-box bracket-card" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 14px; box-shadow:0 2px 6px rgba(0,0,0,0.03); position:relative; z-index:2; transition:all 0.2s ease;">
                                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                                    <span style="font-size:10.5px; font-weight:800; color:var(--primary); background:rgba(55,157,224,0.1); border:1px solid rgba(55,157,224,0.2); padding:2px 6px; border-radius:4px;">TRẬN #${m1.match_order}</span>
                                                    ${m1.status === 'finished' ? '<span style="font-size:9.5px; font-weight:800; color:#15803d; background:#dcfce7; padding:1px 5px; border-radius:4px;">Kết thúc</span>' : (m1.status === 'live' ? '<span style="font-size:9.5px; font-weight:800; color:#b91c1c; background:#fee2e2; padding:1px 5px; border-radius:4px;">Đang đấu</span>' : '')}
                                                </div>
                                                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:6px; font-size:12px; font-weight:700; margin-bottom:5px; background:${m1.winner_id && m1.winner_id == 1 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}">
                                                    <span class="truncate" style="color:var(--text);">${m1.slot_1_label || 'TBD'}</span>
                                                    <span style="font-weight:900; color:${m1.score_1 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m1.score_1 || 0}</span>
                                                </div>
                                                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:6px; font-size:12px; font-weight:700; background:${m1.winner_id && m1.winner_id == 2 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}">
                                                    <span class="truncate" style="color:var(--text);">${m1.slot_2_label || 'TBD'}</span>
                                                    <span style="font-weight:900; color:${m1.score_2 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m1.score_2 || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        ${m2 ? `
                                            <!-- Trận 2 -->
                                            <div class="bracket-match-wrap" style="display:flex; flex-direction:column; justify-content:center; flex:1; padding:8px 0;">
                                                <div class="neo-box bracket-card" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 14px; box-shadow:0 2px 6px rgba(0,0,0,0.03); position:relative; z-index:2; transition:all 0.2s ease;">
                                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                                        <span style="font-size:10.5px; font-weight:800; color:var(--primary); background:rgba(55,157,224,0.1); border:1px solid rgba(55,157,224,0.2); padding:2px 6px; border-radius:4px;">TRẬN #${m2.match_order}</span>
                                                        ${m2.status === 'finished' ? '<span style="font-size:9.5px; font-weight:800; color:#15803d; background:#dcfce7; padding:1px 5px; border-radius:4px;">Kết thúc</span>' : (m2.status === 'live' ? '<span style="font-size:9.5px; font-weight:800; color:#b91c1c; background:#fee2e2; padding:1px 5px; border-radius:4px;">Đang đấu</span>' : '')}
                                                    </div>
                                                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:6px; font-size:12px; font-weight:700; margin-bottom:5px; background:${m2.winner_id && m2.winner_id == 1 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}">
                                                        <span class="truncate" style="color:var(--text);">${m2.slot_1_label || 'TBD'}</span>
                                                        <span style="font-weight:900; color:${m2.score_1 > 0 ? 'var(--primary)' : 'var(--muted)'}; margin-left:6px;">${m2.score_1 || 0}</span>
                                                    </div>
                                                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:6px; font-size:12px; font-weight:700; background:${m2.winner_id && m2.winner_id == 2 ? '#dcfce7; border:1px solid #86efac;' : '#f8fafc; border:1px solid #f1f5f9;'}">
                                                        <span class="truncate" style="color:var(--text);">${m2.slot_2_label || 'TBD'}</span>
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
                    bracketsEl.innerHTML = bracketHtml;
                }
            }
        }
        if (window.lucide) window.lucide.createIcons();
    } catch(e) {
        console.error(e);
    }
}
