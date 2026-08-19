function calculateTournamentStatus(startDateStr, endDateStr) {
    if (!startDateStr) return 'Sắp diễn ra';
    const now = new Date();
    const start = new Date(startDateStr);
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (now < start) return 'Sắp diễn ra';
    if (!endDateStr) return 'Đang diễn ra';
    return 'Đã kết thúc';
}

const getApiBase = () => {
    const match = window.location.pathname.match(/^(\/[^/]*pickaball[^/]*)/i);
    return (match ? match[1] : '') + '/api';
};
const API_BASE = getApiBase();

// ====== UTILS ======
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 2500);
}

function svgAvatar(name) {
    const colors = ['#0b6996','#0b8a6e','#6b0b99','#99490b','#0b3d99'];
    const h = [...name].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
    const bg = colors[Math.abs(h) % colors.length];
    const parts = name.trim().split(/\s+/);
    const ini = parts.length >= 2
        ? (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>
        <rect width='96' height='96' rx='48' fill='${bg}'/>
        <text x='48' y='63' font-family='Arial' font-size='32' fill='#fff' text-anchor='middle' font-weight='bold'>${ini}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function avatarOf(player) {
    if (player.avatar && player.avatar.trim() !== '') {
        return player.avatar.startsWith('http') || player.avatar.startsWith('data:')
            ? player.avatar
            : API_BASE.replace('/api', '') + '/' + player.avatar;
    }
    return svgAvatar(player.name);
}

function fmtDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ====== TOURNAMENT PAGE ======
async function fetchTournaments() {
    const list = document.getElementById('tournaments-list');
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
            const badgeClass = t.status === 'Đang diễn ra' ? 'badge-ongoing' : (t.status === 'Đã kết thúc' ? 'badge-done' : 'badge-upcoming');
            const bannerId = (t.id % 3) + 1;
            return `
            <a href="tournament?id=${t.id}" class="tour-card neo-box" style="text-decoration:none;">
                <div style="width: 100%; aspect-ratio: 16/7; border-bottom: 3px solid var(--black); border-radius: calc(var(--radius) - 3px) calc(var(--radius) - 3px) 0 0; overflow: hidden; background: var(--black);">
                    <img src="public/banners/${bannerId}.jpg" style="width: 100%; height: 100%; object-fit: cover;" alt="Banner">
                </div>
                <div class="card-body" style="position:relative;">
                    <span class="badge-status ${badgeClass}">${t.status || 'Sắp diễn ra'}</span>
                    <div class="card-title" style="padding-top: 10px;">${t.title}</div>
                    <div class="card-desc">${t.description || ''}</div>
                    <div class="card-date">
                        ${fmtDate(t.created_at)}
                    </div>
                </div>
            </a>
        `}).join('');
    } catch (e) {
        console.error(e);
        list.innerHTML = `<div class="empty" style="grid-column:1/-1">Không thể kết nối máy chủ.</div>`;
    }
}

// ====== TOURNAMENT DETAIL PAGE ======
async function fetchTournamentDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if(!id) return;

    try {
        const res = await fetch(`${API_BASE}/tournaments/detail?id=${id}`);
        const data = await res.json();
        if(data.status === 'success') {
            const t = data.data.tournament;
            document.getElementById('td-title').innerText = t.title;
            document.getElementById('td-desc').innerText = t.description || 'Không có mô tả';
            
            const statusEl = document.getElementById('td-status');
            statusEl.innerText = t.status || 'Sắp diễn ra';
            statusEl.className = 'badge-status ' + (t.status === 'Đang diễn ra' ? 'badge-ongoing' : (t.status === 'Đã kết thúc' ? 'badge-done' : 'badge-upcoming'));
            
            const bannerId = (t.id % 3) + 1;
            document.getElementById('td-banner').src = `public/banners/${bannerId}.jpg`;
            
            document.getElementById('td-date').innerHTML = `Khởi tạo: ` + fmtDate(t.created_at);
            
            const plist = document.getElementById('td-players');
            const podSection = document.getElementById('td-podium-section');
            const podEl = document.getElementById('td-podium');
            const ongoingBlocks = document.getElementById('td-ongoing-blocks');
            const finishedBlocks = document.getElementById('td-finished-blocks');
            const playerCardsEl = document.getElementById('td-player-cards');
            const groupsEl = document.getElementById('td-groups');
            const bracketsEl = document.getElementById('td-brackets');
            
            if (t.status === 'Đã kết thúc') {
                ongoingBlocks.style.display = 'none';
                finishedBlocks.style.display = 'block';
                
                if(data.data.players.length === 0) {
                    plist.innerHTML = '<tr><td colspan="4" class="empty">Chưa có kết quả.</td></tr>';
                    return;
                }
                
                // Sort by points awarded descending
                const players = data.data.players.sort((a,b) => b.points_awarded - a.points_awarded);
                
                // Podium
                if(players.length >= 3 && players[0].points_awarded > 0) {
                    const order = [players[1], players[0], players[2]];
                    const positions = [
                        { cls: 'pod-2', medal: '🥈', label: 'Hạng Nhì' },
                        { cls: 'pod-1', medal: '🥇', label: 'Vô Địch' },
                        { cls: 'pod-3', medal: '🥉', label: 'Hạng Ba' },
                    ];
                    podEl.innerHTML = order.map((p, i) => `
                        <div class="pod ${positions[i].cls}">
                            <div class="ava-wrap">
                                <img class="ava ${i === 1 ? 'ava-gold' : ''}" src="${avatarOf(p)}" alt="${p.name}" onerror="this.src='${svgAvatar(p.name)}'">
                            </div>
                            <div class="pod-name">${p.name}</div>
                            <div style="margin-bottom: 8px;"><span class="score-pill" style="padding: 2px 10px; font-size: 13px;">${p.points_awarded > 0 ? '+' : ''}${parseFloat(p.points_awarded || 0).toFixed(2)}</span></div>
                            <div class="stand">
                                <div class="medal">${positions[i].medal}</div>
                                <div class="rank-label">${positions[i].label}</div>
                            </div>
                        </div>
                    `).join('');
                    podSection.style.display = 'block';
                } else {
                    podSection.style.display = 'none';
                }
                
                const medalIcon = ['🥇', '🥈', '🥉'];
                
                plist.innerHTML = players.map((p, index) => `
                    <tr>
                        <td class="rk">${index < 3 && p.points_awarded > 0 ? medalIcon[index] : '#' + (index + 1)}</td>
                        <td>
                            <div class="player-info">
                                <img class="ava" src="${avatarOf(p)}" alt="${p.name}" onerror="this.src='${svgAvatar(p.name)}'">
                                <span class="player-name">${p.name}</span>
                            </div>
                        </td>
                        <td><span style="font-weight:800; color:var(--text); text-transform:uppercase; font-size: 13px;">${p.placement === 'khac' ? 'Khác' : (p.placement || 'Đang thi đấu')}</span></td>
                        <td>
                            <span class="score-pill" style="color: ${p.points_awarded > 0 ? '#10b981' : (p.points_awarded < 0 ? '#ef4444' : 'var(--muted)')}; background: transparent; padding: 0; box-shadow: none; border: none; font-size: 16px;">
                                ${p.points_awarded > 0 ? '+' : ''}${parseFloat(p.points_awarded || 0).toFixed(2)}
                            </span>
                        </td>
                    </tr>
                `).join('');
            } else {
                // Ongoing or Upcoming
                ongoingBlocks.style.display = 'block';
                finishedBlocks.style.display = 'none';
                
                if (data.data.players.length === 0) {
                    playerCardsEl.innerHTML = '<div class="empty" style="grid-column: 1/-1">Chưa có VĐV đăng ký.</div>';
                } else {
                    playerCardsEl.innerHTML = data.data.players.map(p => `
                        <div class="neo-box" style="padding: 16px; display: flex; align-items: center; gap: 16px; border-radius: 8px;">
                            <img class="ava" src="${avatarOf(p)}" alt="${p.name}" onerror="this.src='${svgAvatar(p.name)}'" style="width: 48px; height: 48px;">
                            <div>
                                <div style="font-family: 'Paytone One', sans-serif; font-size: 16px;">${p.name}</div>
                                <div style="color: var(--action); font-weight: 800; font-size: 13px; font-family: 'Nunito', sans-serif;">Điểm trình: ${parseFloat(p.points).toFixed(2)}</div>
                            </div>
                        </div>
                    `).join('');
                }

                // Render Groups
                if (!data.data.groups || data.data.groups.length === 0) {
                    groupsEl.innerHTML = '<div class="empty">Chưa tạo bảng đấu.</div>';
                    groupsEl.className = 'empty';
                } else {
                    groupsEl.className = '';
                    groupsEl.innerHTML = data.data.groups.map(g => `
                        <div style="margin-bottom: 24px;">
                            <h3 style="font-family: 'Paytone One', sans-serif; margin-bottom: 12px; color: var(--action);">${g.name}</h3>
                            <table class="tbl">
                                <thead>
                                    <tr>
                                        <th style="width: 50px;">#</th>
                                        <th>Tuyển thủ</th>
                                        <th>Điểm trình</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${g.members.length === 0 ? '<tr><td colspan="3" class="empty">Chưa có VĐV</td></tr>' : g.members.map((m, i) => `
                                        <tr>
                                            <td style="font-weight: 800;">${i+1}</td>
                                            <td>
                                                <div class="player-info">
                                                    <img class="ava" src="${avatarOf(m)}" alt="${m.name}" onerror="this.src='${svgAvatar(m.name)}'" style="width: 32px; height: 32px;">
                                                    <span class="player-name">${m.name}</span>
                                            </td>
                                            <td><span class="score-pill" style="font-size: 12px; padding: 2px 8px;">${parseFloat(m.points).toFixed(2)}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('');
                }

                // Render Brackets (Tree Layout with SVG lines)
                if (!data.data.brackets || data.data.brackets.length === 0) {
                    bracketsEl.innerHTML = '<div class="empty">Chưa tạo sơ đồ thi đấu.</div>';
                    bracketsEl.className = 'empty';
                } else {
                    bracketsEl.className = '';
                    // Group matches by stage
                    const stagesOrder = [];
                    const stages = {};
                    
                    // Simple logic to maintain correct stage order based on the DB (since DB sorted it DESC, it might be Chung kết -> Bán kết. Let's reverse it to Vòng loại -> Bán kết -> Chung kết)
                    // The DB order is stage_name DESC, which usually puts 'Tứ kết' before 'Bán kết' before 'Chung kết' alphabetically, but it's not guaranteed.
                    // Let's just group them maintaining the reverse order of what we received so the Final is on the right.
                    const reversedBrackets = [...data.data.brackets].reverse();
                    reversedBrackets.forEach(b => {
                        if (!stages[b.stage_name]) {
                            stages[b.stage_name] = [];
                            stagesOrder.push(b.stage_name);
                        }
                        stages[b.stage_name].push(b);
                    });
                    
                    bracketsEl.innerHTML = `
                        <div class="bracket-wrapper" style="position: relative; display: flex; gap: 60px; overflow-x: auto; padding: 20px 10px; min-height: 400px;">
                            <svg id="bracket-lines" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; min-width: 100%;"></svg>
                            ${stagesOrder.map(stage => `
                                <div class="bracket-column" style="display: flex; flex-direction: column; justify-content: space-around; gap: 24px; min-width: 280px; position: relative; z-index: 2;">
                                    <h3 style="font-family: 'Paytone One', sans-serif; margin-bottom: 16px; color: var(--text); border-bottom: 3px solid var(--black); padding-bottom: 8px; text-align: center;">${stage}</h3>
                                    <div style="display: flex; flex-direction: column; justify-content: space-around; flex: 1; gap: 24px;">
                                        ${stages[stage].map(m => `
                                            <div class="neo-box bracket-match" style="padding: 0; display: flex; flex-direction: column; background: white;">
                                                <div style="padding: 8px 16px; background: var(--black); color: white; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 12px; display: flex; justify-content: space-between;">
                                                    <span>Trận ${m.match_order}</span>
                                                    <span style="color: ${m.status === 'pending' ? '#f59e0b' : '#10b981'}">${m.status === 'pending' ? 'Sắp diễn ra' : 'Đã xong'}</span>
                                                </div>
                                                <div style="padding: 12px 16px; display: flex; flex-direction: column; gap: 8px;">
                                                    <!-- Player 1 -->
                                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                                        <div class="player-info" style="gap: 8px;">
                                                            <img class="ava" src="${m.p1_id ? avatarOf({avatar: m.p1_avatar}) : ''}" onerror="this.src='${svgAvatar(m.p1_name || '?')}'" style="width: 28px; height: 28px;">
                                                            <span class="player-name" style="font-size: 14px; ${m.winner_id && m.winner_id == m.player_1_id ? 'color: var(--action); font-weight: 800;' : ''}">${m.p1_name || 'TBD'}</span>
                                                        </div>
                                                        <span style="font-family: 'Paytone One', sans-serif; font-size: 16px;">${m.score_1 || '-'}</span>
                                                    </div>
                                                    <!-- Divider -->
                                                    <div style="height: 1px; background: #e5e7eb; position: relative; margin: 4px 0;">
                                                        <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 0 4px; font-size: 10px; color: var(--muted); font-weight: 800;">VS</span>
                                                    </div>
                                                    <!-- Player 2 -->
                                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                                        <div class="player-info" style="gap: 8px;">
                                                            <img class="ava" src="${m.p2_id ? avatarOf({avatar: m.p2_avatar}) : ''}" onerror="this.src='${svgAvatar(m.p2_name || '?')}'" style="width: 28px; height: 28px;">
                                                            <span class="player-name" style="font-size: 14px; ${m.winner_id && m.winner_id == m.player_2_id ? 'color: var(--action); font-weight: 800;' : ''}">${m.p2_name || 'TBD'}</span>
                                                        </div>
                                                        <span style="font-family: 'Paytone One', sans-serif; font-size: 16px;">${m.score_2 || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;

                    // Draw SVG lines after DOM is updated
                    setTimeout(drawBracketLines, 50);
                }
            }
        }
    } catch(e) {
    }
}

// ====== RANKING PAGE ======
let allPlayers = [];
let filteredPlayers = [];
let visiblePlayersCount = 0;
const PLAYERS_PER_PAGE = 10;

async function fetchRanking() {
    const tbody = document.getElementById('ranking-list');
    try {
        const res = await fetch(`${API_BASE}/players`);
        const data = await res.json();

        if (data.status !== 'success' || !data.data.length) {
            tbody.innerHTML = `<tr><td colspan="3" class="empty">Chưa có tuyển thủ nào.</td></tr>`;
            return;
        }

        allPlayers = data.data;
        filteredPlayers = allPlayers;
        visiblePlayersCount = 0;

        // Render podium top 3 (always from allPlayers)
        const podiumSection = document.getElementById('podium-section');
        const podiumEl = document.getElementById('podium');
        if (podiumSection && allPlayers.length >= 3) {
            const order = [allPlayers[1], allPlayers[0], allPlayers[2]]; // 2nd, 1st, 3rd
            const positions = [
                { cls: 'pod-2', medal: '🥈', label: 'Người người kính ngưỡng' },
                { cls: 'pod-1', medal: '🥇', label: 'Vô địch thiên hạ' },
                { cls: 'pod-3', medal: '🥉', label: 'Thiên hạ đệ tam' },
            ];
            podiumEl.innerHTML = order.map((p, i) => `
                <div class="pod ${positions[i].cls}">
                    <div class="ava-wrap">
                        <img class="ava ${i === 1 ? 'ava-gold' : ''}" src="${avatarOf(p)}" alt="${p.name}" onerror="this.src='${svgAvatar(p.name)}'">
                    </div>
                    <div class="pod-name">${p.name}</div>
                    <div style="margin-bottom: 8px;"><span class="score-pill" style="padding: 2px 10px; font-size: 12px;">${parseFloat(p.points).toFixed(2)}</span></div>
                    <div class="stand">
                        <div class="medal">${positions[i].medal}</div>
                        <div class="rank-label">${positions[i].label}</div>
                    </div>
                </div>
            `).join('');
            podiumSection.style.display = '';
        }

        // Setup filter listeners
        const searchInput = document.getElementById('search-player');
        const genderFilter = document.getElementById('filter-gender');
        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (genderFilter) genderFilter.addEventListener('change', applyFilters);

        // Render initial table rows
        renderMorePlayers();

    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="3" class="empty">Không thể kết nối máy chủ.</td></tr>`;
    }
}

window.applyFilters = function() {
    const search = (document.getElementById('search-player')?.value || '').toLowerCase();
    const gender = document.getElementById('filter-gender')?.value || 'all';

    filteredPlayers = allPlayers.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search);
        const matchGender = gender === 'all' || p.gender === gender;
        return matchSearch && matchGender;
    });

    visiblePlayersCount = 0;
    const tbody = document.getElementById('ranking-list');
    if (tbody) tbody.innerHTML = '';
    
    if (filteredPlayers.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="empty">Không tìm thấy tuyển thủ nào phù hợp.</td></tr>`;
        const btnLoadMore = document.getElementById('btn-load-more');
        if (btnLoadMore) btnLoadMore.style.display = 'none';
        return;
    }
    
    renderMorePlayers();
};

window.renderMorePlayers = function() {
    const tbody = document.getElementById('ranking-list');
    const btnLoadMore = document.getElementById('btn-load-more');
    const medalIcon = ['🥇', '🥈', '🥉'];
    
    if (!tbody || !filteredPlayers.length) return;

    const nextLimit = Math.min(visiblePlayersCount + PLAYERS_PER_PAGE, filteredPlayers.length);
    const playersToRender = filteredPlayers.slice(visiblePlayersCount, nextLimit);
    
    const html = playersToRender.map((p, index) => {
        const absoluteIndex = visiblePlayersCount + index;
        const genderColor = p.gender === 'Nữ' ? '#c73a80' : '#2360b8';
        const genderBg = p.gender === 'Nữ' ? 'rgba(219,39,119,.09)' : 'rgba(37,99,235,.1)';
        
        return `
            <tr>
                <td class="rk">${absoluteIndex < 3 ? medalIcon[absoluteIndex] : '#' + (absoluteIndex + 1)}</td>
                <td>
                    <div class="player-info">
                        <img class="ava ${absoluteIndex === 0 ? 'ava-gold' : ''}" src="${avatarOf(p)}" alt="${p.name}" onerror="this.src='${svgAvatar(p.name)}'">
                        <div>
                            <div class="player-name">${p.name}</div>
                            <span style="display:inline-block; margin-top: 4px; font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 600; color: ${genderColor}; background: ${genderBg};">${p.gender || 'Nam'}</span>
                        </div>
                    </div>
                </td>
                <td><span class="score-pill">${parseFloat(p.points).toFixed(2)}</span></td>
            </tr>
        `;
    }).join('');
    
    if (visiblePlayersCount === 0) {
        tbody.innerHTML = html;
    } else {
        tbody.insertAdjacentHTML('beforeend', html);
    }
    
    visiblePlayersCount = nextLimit;
    
    if (btnLoadMore) {
        btnLoadMore.style.display = (visiblePlayersCount < filteredPlayers.length) ? 'inline-block' : 'none';
    }
};

// ====== SLIDER LOGIC ======
let currentSlide = 0;
let slideInterval;

function initSlider() {
    const slides = document.getElementById('hero-slides');
    if (!slides) return;
    
    slideInterval = setInterval(() => {
        goToSlide((currentSlide + 1) % 3);
    }, 4000);
}

window.goToSlide = function(index) {
    const slides = document.getElementById('hero-slides');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides || !dots.length) return;

    currentSlide = index;
    slides.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Reset interval on manual click
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        goToSlide((currentSlide + 1) % 3);
    }, 4000);
};

window.nextSlide = function() {
    goToSlide((currentSlide + 1) % 3);
};

window.prevSlide = function() {
    goToSlide((currentSlide - 1 + 3) % 3);
};

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
    // Highlight active nav link
    const links = document.querySelectorAll('.topnav a');
    links.forEach(a => {
        if (window.location.pathname.endsWith(a.getAttribute('href'))) {
            a.classList.add('active');
        }
    });

    initSlider();
    if (document.getElementById('tournaments-list')) fetchTournaments();
    if (document.getElementById('ranking-list')) fetchRanking();
    if (document.getElementById('td-title')) fetchTournamentDetail();
});
