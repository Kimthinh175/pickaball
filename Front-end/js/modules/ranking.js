// ==========================================
// MODULE: RANKINGS & PLAYER PROFILES
// ==========================================

import { API_BASE, avatarOf, toast, svgAvatar } from '../core/api.js?v=16';

let cachedPlayers = [];
let displayedPlayersCount = 10;
const PLAYERS_PER_PAGE = 10;

export async function fetchRanking() {
    const list = document.getElementById('ranking-list');
    const podiumSection = document.getElementById('podium-section');
    const podium = document.getElementById('podium');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/players`);
        const data = await res.json();

        if (data.status !== 'success' || !data.data.length) {
            list.innerHTML = `<tr><td colspan="3" class="empty">Chưa có dữ liệu tuyển thủ.</td></tr>`;
            return;
        }

        cachedPlayers = data.data;

        // Render Clean & Modern Podium
        if (cachedPlayers.length >= 3 && podium && podiumSection) {
            const top3 = cachedPlayers.slice(0, 3);

            podiumSection.style.display = 'block';
            podium.innerHTML = `
                <div class="clean-podium-wrap">
                    <!-- RANK 2: HẠNG NHÌ -->
                    <div class="pod-column pod-col-2" onclick="window.openPlayerProfile(${top3[1].id})">
                        <div class="pod-avatar-box">
                            <div class="pod-avatar-glow glow-silver"></div>
                            <img class="pod-avatar-img" src="${avatarOf(top3[1])}" alt="${top3[1].name}" onerror="this.src='${svgAvatar(top3[1].name)}'">
                            <span class="pod-medal-badge">🥈</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name" title="${top3[1].name}">${top3[1].name}</div>
                            <div class="pod-points"><span class="pts-val">${parseFloat(top3[1].points || 0).toFixed(2)}</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <!-- 3D Stand -->
                        <div class="pod-stand stand-2">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number">2</div>
                            <div class="stand-label">Hạng Nhì</div>
                        </div>
                    </div>

                    <!-- RANK 1: VÔ ĐỊCH / QUÁN QUÂN -->
                    <div class="pod-column pod-col-1" onclick="window.openPlayerProfile(${top3[0].id})">
                        <div class="crown-float-icon">👑</div>
                        
                        <div class="pod-avatar-box main-box">
                            <div class="pod-avatar-glow glow-gold"></div>
                            <img class="pod-avatar-img main-img" src="${avatarOf(top3[0])}" alt="${top3[0].name}" onerror="this.src='${svgAvatar(top3[0].name)}'">
                            <span class="pod-medal-badge gold-medal-badge">🥇</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name main-name" title="${top3[0].name}">${top3[0].name}</div>
                            <div class="pod-points main-points"><span class="pts-val">${parseFloat(top3[0].points || 0).toFixed(2)}</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <!-- 3D Stand -->
                        <div class="pod-stand stand-1">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number main-num">1</div>
                            <div class="stand-label main-label">Vô Địch</div>
                        </div>
                    </div>

                    <!-- RANK 3: HẠNG BA -->
                    <div class="pod-column pod-col-3" onclick="window.openPlayerProfile(${top3[2].id})">
                        <div class="pod-avatar-box">
                            <div class="pod-avatar-glow glow-bronze"></div>
                            <img class="pod-avatar-img" src="${avatarOf(top3[2])}" alt="${top3[2].name}" onerror="this.src='${svgAvatar(top3[2].name)}'">
                            <span class="pod-medal-badge">🥉</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name" title="${top3[2].name}">${top3[2].name}</div>
                            <div class="pod-points"><span class="pts-val">${parseFloat(top3[2].points || 0).toFixed(2)}</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <!-- 3D Stand -->
                        <div class="pod-stand stand-3">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number">3</div>
                            <div class="stand-label">Hạng Ba</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (podiumSection) {
            podiumSection.style.display = 'none';
        }

        renderRankingTable();

        // Filters binding
        document.getElementById('search-player')?.addEventListener('input', () => {
            displayedPlayersCount = PLAYERS_PER_PAGE;
            renderRankingTable();
        });
        document.getElementById('filter-gender')?.addEventListener('change', () => {
            displayedPlayersCount = PLAYERS_PER_PAGE;
            renderRankingTable();
        });

    } catch (e) {
        console.error(e);
        list.innerHTML = `<tr><td colspan="3" class="empty">Không thể kết nối máy chủ.</td></tr>`;
    }
}

export function renderRankingTable() {
    const list = document.getElementById('ranking-list');
    const loadMoreBtn = document.getElementById('btn-load-more');
    if (!list) return;

    const searchVal = (document.getElementById('search-player')?.value || '').toLowerCase().trim();
    const genderVal = document.getElementById('filter-gender')?.value || 'all';

    let filtered = cachedPlayers.filter(p => {
        const matchName = p.name.toLowerCase().includes(searchVal);
        const matchGender = genderVal === 'all' || p.gender === genderVal;
        return matchName && matchGender;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="3" class="empty">Không tìm thấy tuyển thủ nào phù hợp.</td></tr>`;
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    const toShow = filtered.slice(0, displayedPlayersCount);

    list.innerHTML = toShow.map((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
        const rankClass = idx === 0 ? 'rk-1' : idx === 1 ? 'rk-2' : idx === 2 ? 'rk-3' : '';
        const genderBadge = p.gender === 'Nữ' ? '<span class="badge-pink" style="margin-left:6px; font-size:11px; padding:2px 6px; border-radius:10px;">Nữ</span>' : '';

        return `
            <tr onclick="window.openPlayerProfile(${p.id})" style="cursor:pointer;">
                <td class="rk ${rankClass}">${medal ? `${medal} ` : ''}${idx + 1}</td>
                <td>
                    <div class="player-cell">
                        <img class="avatar" src="${avatarOf(p)}" alt="${p.name}" onerror="this.src='${svgAvatar(p.name)}'">
                        <div class="player-meta-box">
                            <span class="player-name">${p.name}</span>
                            ${genderBadge}
                        </div>
                    </div>
                </td>
                <td class="pts-col"><strong>${parseFloat(p.points || 0).toFixed(2)}</strong> điểm</td>
            </tr>
        `;
    }).join('');

    if (loadMoreBtn) {
        loadMoreBtn.style.display = filtered.length > displayedPlayersCount ? 'inline-block' : 'none';
    }
}

export function renderMorePlayers() {
    displayedPlayersCount += PLAYERS_PER_PAGE;
    renderRankingTable();
}

export function openPlayerProfile(id) {
    const player = cachedPlayers.find(p => p.id == id);
    if (!player) return;

    const modal = document.getElementById('modal-player-profile');
    if (!modal) return;

    document.getElementById('profile-name').textContent = player.name;
    document.getElementById('profile-gender').textContent = player.gender || 'Nam';
    document.getElementById('profile-points').textContent = parseFloat(player.points || 0).toFixed(2);
    document.getElementById('profile-avatar').src = avatarOf(player);

    const bioEl = document.getElementById('profile-bio');
    if (player.bio && player.bio.trim()) {
        bioEl.textContent = player.bio;
        bioEl.style.display = 'block';
    } else {
        bioEl.style.display = 'none';
    }

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function closePlayerProfileModal() {
    document.getElementById('modal-player-profile')?.classList.remove('active');
}
