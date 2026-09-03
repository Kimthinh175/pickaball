// ==========================================
// MODULE: RANKINGS & PLAYER PROFILES
// ==========================================

import { API_BASE, avatarOf, toast, svgAvatar } from '../core/api.js?v=16';

let cachedPlayers = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

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

        // Render Clean & Modern Podium (Hỗ trợ hiển thị khi có 1, 2 hoặc 3+ người, thiếu vị trí nào thì hiển thị ô trống)
        if (cachedPlayers.length > 0 && podium && podiumSection) {
            const p1 = cachedPlayers[0] || null;
            const p2 = cachedPlayers[1] || null;
            const p3 = cachedPlayers[2] || null;

            podiumSection.style.display = 'block';
            podium.innerHTML = `
                <div class="clean-podium-wrap">
                    <!-- RANK 2: HẠNG NHÌ -->
                    ${p2 ? `
                    <div class="pod-column pod-col-2" onclick="window.openPlayerProfile(${p2.id})">
                        <div class="pod-avatar-box">
                            <div class="pod-avatar-glow glow-silver"></div>
                            <img class="pod-avatar-img" src="${avatarOf(p2)}" alt="${p2.nickname || p2.name}" onerror="this.src='${svgAvatar(p2.nickname || p2.name)}'">
                            <span class="pod-medal-badge">🥈</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name" title="${p2.nickname || p2.name}">${p2.nickname || p2.name}</div>
                            ${p2.nickname ? `<div class="pod-realname">${p2.name}</div>` : ''}
                            <div class="pod-points"><span class="pts-val">${parseFloat(p2.points || 0).toFixed(2)}</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <div class="pod-stand stand-2">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number">2</div>
                            <div class="stand-label">Hạng Nhì</div>
                        </div>
                    </div>
                    ` : `
                    <div class="pod-column pod-col-2 empty-slot">
                        <div class="pod-avatar-box">
                            <div class="pod-avatar-empty"><span>?</span></div>
                            <span class="pod-medal-badge" style="opacity: 0.6;">🥈</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name">Chưa có</div>
                            <div class="pod-points"><span class="pts-val">--</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <div class="pod-stand stand-2">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number">2</div>
                            <div class="stand-label">Hạng Nhì</div>
                        </div>
                    </div>
                    `}

                    <!-- RANK 1: VÔ ĐỊCH / QUÁN QUÂN -->
                    ${p1 ? `
                    <div class="pod-column pod-col-1" onclick="window.openPlayerProfile(${p1.id})">
                        <div class="crown-float-icon">👑</div>
                        
                        <div class="pod-avatar-box main-box">
                            <div class="pod-avatar-glow glow-gold"></div>
                            <img class="pod-avatar-img main-img" src="${avatarOf(p1)}" alt="${p1.nickname || p1.name}" onerror="this.src='${svgAvatar(p1.nickname || p1.name)}'">
                            <span class="pod-medal-badge gold-medal-badge">🥇</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name main-name" title="${p1.nickname || p1.name}">${p1.nickname || p1.name}</div>
                            ${p1.nickname ? `<div class="pod-realname main-realname">${p1.name}</div>` : ''}
                            <div class="pod-points main-points"><span class="pts-val">${parseFloat(p1.points || 0).toFixed(2)}</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <div class="pod-stand stand-1">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number main-num">1</div>
                            <div class="stand-label main-label">Vô Địch</div>
                        </div>
                    </div>
                    ` : `
                    <div class="pod-column pod-col-1 empty-slot">
                        <div class="crown-float-icon" style="opacity: 0.4;">👑</div>
                        
                        <div class="pod-avatar-box main-box">
                            <div class="pod-avatar-empty"><span>?</span></div>
                            <span class="pod-medal-badge gold-medal-badge" style="opacity: 0.6;">🥇</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name main-name">Chưa có</div>
                            <div class="pod-points main-points"><span class="pts-val">--</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <div class="pod-stand stand-1">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number main-num">1</div>
                            <div class="stand-label main-label">Vô Địch</div>
                        </div>
                    </div>
                    `}

                    <!-- RANK 3: HẠNG BA -->
                    ${p3 ? `
                    <div class="pod-column pod-col-3" onclick="window.openPlayerProfile(${p3.id})">
                        <div class="pod-avatar-box">
                            <div class="pod-avatar-glow glow-bronze"></div>
                            <img class="pod-avatar-img" src="${avatarOf(p3)}" alt="${p3.nickname || p3.name}" onerror="this.src='${svgAvatar(p3.nickname || p3.name)}'">
                            <span class="pod-medal-badge">🥉</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name" title="${p3.nickname || p3.name}">${p3.nickname || p3.name}</div>
                            ${p3.nickname ? `<div class="pod-realname">${p3.name}</div>` : ''}
                            <div class="pod-points"><span class="pts-val">${parseFloat(p3.points || 0).toFixed(2)}</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <div class="pod-stand stand-3">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number">3</div>
                            <div class="stand-label">Hạng Ba</div>
                        </div>
                    </div>
                    ` : `
                    <div class="pod-column pod-col-3 empty-slot">
                        <div class="pod-avatar-box">
                            <div class="pod-avatar-empty"><span>?</span></div>
                            <span class="pod-medal-badge" style="opacity: 0.6;">🥉</span>
                        </div>
                        
                        <div class="pod-info">
                            <div class="pod-name">Chưa có</div>
                            <div class="pod-points"><span class="pts-val">--</span> <span class="pts-unit">điểm</span></div>
                        </div>

                        <div class="pod-stand stand-3">
                            <div class="stand-shine-bar"></div>
                            <div class="stand-number">3</div>
                            <div class="stand-label">Hạng Ba</div>
                        </div>
                    </div>
                    `}
                </div>
            `;
        } else if (podiumSection) {
            podiumSection.style.display = 'none';
        }

        renderRankingTable();

        // Filters binding – reset về trang 1 khi filter thay đổi
        document.getElementById('search-player')?.addEventListener('input', () => {
            currentPage = 1;
            renderRankingTable();
        });
        document.getElementById('filter-gender')?.addEventListener('change', () => {
            currentPage = 1;
            renderRankingTable();
        });

    } catch (e) {
        console.error(e);
        list.innerHTML = `<tr><td colspan="3" class="empty">Không thể kết nối máy chủ.</td></tr>`;
    }
}

export function renderRankingTable() {
    const list = document.getElementById('ranking-list');
    if (!list) return;

    const searchVal = (document.getElementById('search-player')?.value || '').toLowerCase().trim();
    const genderVal = document.getElementById('filter-gender')?.value || 'all';

    let filtered = cachedPlayers.filter(p => {
        const matchName = (p.name && p.name.toLowerCase().includes(searchVal)) || (p.nickname && p.nickname.toLowerCase().includes(searchVal));
        const matchGender = genderVal === 'all' || p.gender === genderVal;
        return matchName && matchGender;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="3" class="empty">Không tìm thấy tuyển thủ nào phù hợp.</td></tr>`;
        renderPagination(0, 0);
        return;
    }

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageItems = filtered.slice(startIdx, endIdx);

    list.innerHTML = pageItems.map((p, idx) => {
        const globalIdx = startIdx + idx;
        const medal = globalIdx === 0 ? '🥇' : globalIdx === 1 ? '🥈' : globalIdx === 2 ? '🥉' : '';
        const rankClass = globalIdx === 0 ? 'rk-1' : globalIdx === 1 ? 'rk-2' : globalIdx === 2 ? 'rk-3' : '';
        const rankDisplay = medal || (globalIdx + 1);

        return `
            <tr onclick="window.openPlayerProfile(${p.id})" style="cursor:pointer;">
                <td class="rk ${rankClass}">${rankDisplay}</td>
                <td>
                    <div class="player-cell">
                        <img class="avatar" src="${avatarOf(p)}" alt="${p.nickname || p.name}" onerror="this.src='${svgAvatar(p.nickname || p.name)}'">
                        <div class="player-meta-names">
                            ${p.nickname ? `
                                <span class="player-name">${p.nickname}</span>
                                <span class="player-realname">${p.name}</span>
                            ` : `
                                <span class="player-name">${p.name}</span>
                            `}
                        </div>
                    </div>
                </td>
                <td class="pts-col"><strong>${parseFloat(p.points || 0).toFixed(2)}</strong> điểm</td>
            </tr>
        `;
    }).join('');

    renderPagination(totalPages, filtered.length);
}

function renderPagination(totalPages, totalItems) {
    const container = document.getElementById('ranking-pagination');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    let html = `<div class="pagination">`;
    html += `<span class="pagination-info">Tổng: <strong>${totalItems}</strong> tuyển thủ</span>`;
    html += `<div class="pagination-btns">`;

    // Nút trang đầu
    html += `<button class="pg-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="window.goToRankingPage(1)" title="Trang đầu">«</button>`;
    // Nút trang trước
    html += `<button class="pg-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="window.goToRankingPage(${currentPage - 1})" title="Trang trước">‹</button>`;

    if (startPage > 1) {
        html += `<span class="pg-ellipsis">…</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pg-btn ${i === currentPage ? 'pg-active' : ''}" onclick="window.goToRankingPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        html += `<span class="pg-ellipsis">…</span>`;
    }

    // Nút trang sau
    html += `<button class="pg-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="window.goToRankingPage(${currentPage + 1})" title="Trang sau">›</button>`;
    // Nút trang cuối
    html += `<button class="pg-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="window.goToRankingPage(${totalPages})" title="Trang cuối">»</button>`;

    html += `</div></div>`;
    container.innerHTML = html;
}

export function goToRankingPage(page) {
    const searchVal = (document.getElementById('search-player')?.value || '').toLowerCase().trim();
    const genderVal = document.getElementById('filter-gender')?.value || 'all';
    const filtered = cachedPlayers.filter(p => {
        return ((p.name && p.name.toLowerCase().includes(searchVal)) || (p.nickname && p.nickname.toLowerCase().includes(searchVal))) && (genderVal === 'all' || p.gender === genderVal);
    });
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderRankingTable();

    // Scroll nhẹ lên bảng xếp hạng
    document.getElementById('ranking-list')?.closest('.section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Giữ lại để không gây lỗi nếu có nơi nào đó gọi
export function renderMorePlayers() {}

export function openPlayerProfile(id) {
    const player = cachedPlayers.find(p => p.id == id);
    if (!player) return;

    const modal = document.getElementById('modal-player-profile');
    if (!modal) return;

    // Tên & điểm (Biệt danh hiện chính, tên thật hiện nhỏ)
    const nameEl = document.getElementById('profile-name');
    const realnameEl = document.getElementById('profile-realname');
    if (player.nickname) {
        if (nameEl) nameEl.textContent = player.nickname;
        if (realnameEl) {
            realnameEl.textContent = `Tên thật: ${player.name}`;
            realnameEl.style.display = 'block';
        }
    } else {
        if (nameEl) nameEl.textContent = player.name;
        if (realnameEl) realnameEl.style.display = 'none';
    }
    document.getElementById('profile-points').textContent = parseFloat(player.points || 0).toFixed(2);
    document.getElementById('profile-avatar').src = avatarOf(player);

    // Rank badge (tìm vị trí trong cachedPlayers)
    const rankIdx = cachedPlayers.findIndex(p => p.id == id);
    const rankBadgeEl = document.getElementById('profile-rank-badge');
    if (rankBadgeEl) {
        if (rankIdx === 0) rankBadgeEl.textContent = '🥇';
        else if (rankIdx === 1) rankBadgeEl.textContent = '🥈';
        else if (rankIdx === 2) rankBadgeEl.textContent = '🥉';
        else rankBadgeEl.textContent = `#${rankIdx + 1}`;
        rankBadgeEl.className = 'profile-rank-badge' + (rankIdx < 3 ? ' rank-medal' : '');
    }

    // Giới tính
    const gender = player.gender || 'Nam';
    document.getElementById('profile-gender').textContent = gender;
    const genderIconEl = document.getElementById('profile-gender-icon');
    if (genderIconEl) genderIconEl.textContent = gender === 'Nữ' ? '👩' : '👨';
    const genderTagEl = document.getElementById('profile-gender-tag');
    if (genderTagEl) {
        genderTagEl.className = 'profile-tag tag-gender ' + (gender === 'Nữ' ? 'tag-female' : 'tag-male');
    }

    // Profile / mô tả — parse format "Tuổi: X\nMô tả: Y"
    const bioBox = document.getElementById('profile-bio');
    const bioText = document.getElementById('profile-bio-text');
    if (player.profile && player.profile.trim()) {
        const raw = player.profile.trim();
        const ageMatch = raw.match(/^Tuổi:\s*(\d+)/m);
        const descMatch = raw.match(/Mô tả:\s*([\s\S]*)/);

        let rendered = '';
        if (ageMatch) rendered += `Tuổi: ${ageMatch[1]}`;
        if (ageMatch && descMatch) rendered += '\n';
        if (descMatch) rendered += `Mô tả: ${descMatch[1].trim()}`;

        // Profile cũ (không có format mới) → hiển thị nguyên
        if (!ageMatch && !descMatch) rendered = raw;

        if (bioText) bioText.textContent = rendered;
        if (bioBox) bioBox.style.display = 'block';
    } else {
        if (bioBox) bioBox.style.display = 'none';
    }

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function closePlayerProfileModal() {
    document.getElementById('modal-player-profile')?.classList.remove('active');
}

export function openAvatarZoom(src, name) {
    const modal = document.getElementById('modal-avatar-zoom');
    const img = document.getElementById('avatar-zoom-img');
    const nameEl = document.getElementById('avatar-zoom-name');
    if (!modal || !img) return;

    img.src = src || '';
    if (nameEl) nameEl.textContent = name || '';
    modal.classList.add('active');
}

export function closeAvatarZoom(e) {
    if (e && e.target && (e.target.id === 'avatar-zoom-img' || e.target.closest('#avatar-zoom-img'))) {
        return; // Don't close when clicking directly on the enlarged image
    }
    const modal = document.getElementById('modal-avatar-zoom');
    if (modal) modal.classList.remove('active');
}

// Bind to window for global access
window.openAvatarZoom = openAvatarZoom;
window.closeAvatarZoom = closeAvatarZoom;

// Close on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const zoomModal = document.getElementById('modal-avatar-zoom');
        if (zoomModal && zoomModal.classList.contains('active')) {
            closeAvatarZoom();
        } else {
            closePlayerProfileModal();
        }
    }
});

