// ==========================================
// PICKABALL ADMIN DASHBOARD CONTROLLER (UTF-8)
// ==========================================

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
    const match = window.location.pathname.match(/^(\/.*pickaball)/i);
    return (match ? match[1] : '') + '/api';
};
const API_BASE = getApiBase();

let cachedTournaments = [];
let cachedPlayers = [];
let currentTournamentId = null;

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('admin-toast');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Avatar generator fallback
function svgAvatar(name) {
    const initial = (name || '?').charAt(0).toUpperCase();
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23e2e8f0"/><text x="50%" y="55%" font-size="18" font-family="sans-serif" font-weight="bold" fill="%23475569" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(initial)}</text></svg>`;
}

// Global API Request Helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: { 'Accept': 'application/json' }
    };
    if (data && !(data instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    } else if (data instanceof FormData) {
        options.body = data;
    }

    try {
        const res = await fetch(url, options);
        if (res.status === 401) {
            checkLogin(false);
            return null;
        }
        const json = await res.json();
        return json;
    } catch (e) {
        console.error('API Error:', e);
        showToast('Lỗi kết nối máy chủ', 'error');
        return null;
    }
}

// Auth & Tabs
function checkLogin(isLoggedIn) {
    const loginSec = document.getElementById('login-section');
    const sidebar = document.getElementById('sidebar');
    const dashSec = document.getElementById('dashboard-section');

    if (isLoggedIn) {
        loginSec?.classList.add('hidden');
        sidebar?.classList.remove('hidden');
        dashSec?.classList.remove('hidden');
        loadData();
    } else {
        loginSec?.classList.remove('hidden');
        sidebar?.classList.add('hidden');
        dashSec?.classList.add('hidden');
    }
}

window.showTab = function(tabName) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));

    const navEl = document.getElementById(`nav-${tabName}`);
    if (navEl) navEl.classList.add('active');

    const tabEl = document.getElementById(`tab-${tabName}`);
    if (tabEl) tabEl.classList.remove('hidden');

    if (tabName === 'tournaments') {
        loadTournaments();
    } else if (tabName === 'rankings') {
        loadPlayers();
    }
    lucide.createIcons();
};

window.toggleAdminMobileMenu = function() {
    const topnav = document.getElementById('topnav');
    topnav?.classList.toggle('active');
};

window.toggleSidebarMenu = function() {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('active');
};

// Initial Load
async function loadData() {
    await Promise.all([loadTournaments(), loadPlayers()]);
}

// TOURNAMENTS
async function loadTournaments() {
    const res = await apiRequest('/admin/tournaments');
    if (!res || !res.data) return;

    cachedTournaments = res.data;
    const total = document.getElementById('stat-total');
    const statOngoing = document.getElementById('stat-ongoing');
    const statDone = document.getElementById('stat-done');
    const count = document.getElementById('tournament-count');
    const grid = document.getElementById('admin-tournaments-list');

    const data = res.data;
    if (total) total.textContent = data.length;
    if (statOngoing) statOngoing.textContent = data.filter(t => calculateTournamentStatus(t.start_date, t.end_date) === 'Đang diễn ra').length;
    if (statDone) statDone.textContent = data.filter(t => calculateTournamentStatus(t.start_date, t.end_date) === 'Đã kết thúc').length;
    if (count) count.textContent = `${data.length} giải`;

    if (!grid) return;
    if (data.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="padding:20px;">Chưa có giải đấu nào. Hãy tạo giải đấu mới!</p>';
        return;
    }

    const badgeClass = {
        'Sắp diễn ra': 'upcoming',
        'Đang diễn ra': 'ongoing',
        'Đã kết thúc': 'done'
    };

    grid.innerHTML = data.map(t => {
        const statusText = calculateTournamentStatus(t.start_date, t.end_date);
        let bannerSrc = t.banner || 'public/banners/1.jpg';
        if (!bannerSrc.startsWith('http') && !bannerSrc.startsWith('public/')) {
            bannerSrc = bannerSrc.startsWith('../') ? bannerSrc : '../' + bannerSrc;
        }
        return `
            <div class="tournament-item" onclick="openTournamentDetail(${t.id})">
                <div class="tournament-item-img-wrap">
                    <img src="${bannerSrc}" alt="${t.title}" style="object-position: ${t.banner_position || '50% 50%'};" onerror="this.src='../public/banners/1.jpg'">
                </div>
                <div class="tournament-item-body">
                    <div class="tournament-item-title">${t.title}</div>
                    <div class="tournament-item-desc">${t.description || 'Chưa có mô tả'}</div>
                    <div class="tournament-item-foot">
                        <span class="t-badge ${badgeClass[statusText] || 'upcoming'}">${statusText}</span>
                        <span style="font-size:12px; color:var(--muted); font-weight:800;">Quản lý →</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

// TOURNAMENT DETAIL
window.openTournamentDetail = async function(id) {
    currentTournamentId = id;
    const tabTournaments = document.getElementById('tab-tournaments');
    const tabDetail = document.getElementById('tab-tournament-detail');
    if (tabTournaments) tabTournaments.classList.add('hidden');
    if (tabDetail) tabDetail.classList.remove('hidden');

    await refreshTournamentDetail();
};

async function refreshTournamentDetail() {
    if (!currentTournamentId) return;
    const res = await apiRequest(`/tournaments/detail?id=${currentTournamentId}`);
    if (!res || !res.data) return;

    const data = res.data;
    const t = data.tournament;
    const titleEl = document.getElementById('detail-title');
    const subEl = document.getElementById('detail-sub');
    const statsEl = document.getElementById('tournament-matchup-stats');
    const listEl = document.getElementById('tournament-matchups-list');

    if (titleEl) titleEl.textContent = t.title;
    if (subEl) {
        const st = calculateTournamentStatus(t.start_date, t.end_date);
        subEl.innerHTML = `Trạng thái: <strong>${st}</strong> &bull; Tổng cộng <strong>${data.matchups ? data.matchups.length : 0} kèo đấu</strong>`;
    }

    const matchups = data.matchups || [];
    const paidCount = matchups.filter(m => m.status === 'Đã chuyển khoản' || m.status === 'Đã chuyển tiền').length;
    if (statsEl) {
        statsEl.textContent = `Đã đóng lệ phí: ${paidCount}/${matchups.length} trận`;
    }

    if (!listEl) return;
    if (matchups.length === 0) {
        listEl.innerHTML = '<div class="text-muted" style="padding:20px;">Chưa có kèo đấu nào trong giải này.</div>';
        return;
    }

    // Map group names
    const matchGroupMap = {};
    if (data.groups) {
        data.groups.forEach(g => {
            let mIds = [];
            try { mIds = typeof g.matchup_indices === 'string' ? JSON.parse(g.matchup_indices) : (g.matchup_indices || []); } catch(e) {}
            if (Array.isArray(mIds)) {
                mIds.forEach(idx => {
                    if (matchups[idx]) matchGroupMap[matchups[idx].id] = g.name;
                });
            }
        });
    }

    listEl.innerHTML = matchups.map((m, idx) => {
        const isPaid = m.status === 'Đã chuyển khoản' || m.status === 'Đã chuyển tiền';
        const gName = matchGroupMap[m.id] || (m.group_id ? `Bảng #${m.group_id}` : 'Chưa chia bảng');
        const nextStatus = isPaid ? 'Chưa chuyển khoản' : 'Đã chuyển tiền';

        const t1_p1_ava = m.t1_p1_avatar ? (m.t1_p1_avatar.startsWith('http') ? m.t1_p1_avatar : API_BASE.replace('/api', '') + '/' + m.t1_p1_avatar) : svgAvatar(m.t1_p1_name);
        const t1_p2_ava = m.t1_p2_avatar ? (m.t1_p2_avatar.startsWith('http') ? m.t1_p2_avatar : API_BASE.replace('/api', '') + '/' + m.t1_p2_avatar) : svgAvatar(m.t1_p2_name);
        const t2_p1_ava = m.t2_p1_avatar ? (m.t2_p1_avatar.startsWith('http') ? m.t2_p1_avatar : API_BASE.replace('/api', '') + '/' + m.t2_p1_avatar) : svgAvatar(m.t2_p1_name);
        const t2_p2_ava = m.t2_p2_avatar ? (m.t2_p2_avatar.startsWith('http') ? m.t2_p2_avatar : API_BASE.replace('/api', '') + '/' + m.t2_p2_avatar) : svgAvatar(m.t2_p2_name);

        return `
            <div class="matchup-card-item">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:11px; font-weight:800; color:var(--primary); background:#e0f2fe; padding:2px 8px; border-radius:4px;">${gName} - TRẬN #${idx+1}</span>
                    <button type="button" class="btn btn-sm ${isPaid ? 'btn-success' : 'btn-warning'}" style="padding:2px 8px; font-size:11px;" onclick="toggleMatchPaymentStatus(${m.id}, '${nextStatus}')">
                        ${isPaid ? '✓ Đã đóng phí' : '✕ Chưa đóng'}
                    </button>
                </div>
                <div class="admin-matchup-row" style="padding:8px 0;">
                    <div class="admin-matchup-team">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <img src="${t1_p1_ava}" style="width:22px; height:22px; border-radius:50%; object-fit:cover;">
                            <span style="font-size:12px; font-weight:700;">${m.t1_p1_name}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <img src="${t1_p2_ava}" style="width:22px; height:22px; border-radius:50%; object-fit:cover;">
                            <span style="font-size:12px; font-weight:700;">${m.t1_p2_name}</span>
                        </div>
                    </div>
                    <span style="font-weight:900; color:var(--muted); font-size:11px;">VS</span>
                    <div class="admin-matchup-team">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <img src="${t2_p1_ava}" style="width:22px; height:22px; border-radius:50%; object-fit:cover;">
                            <span style="font-size:12px; font-weight:700;">${m.t2_p1_name}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <img src="${t2_p2_ava}" style="width:22px; height:22px; border-radius:50%; object-fit:cover;">
                            <span style="font-size:12px; font-weight:700;">${m.t2_p2_name}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

window.toggleMatchPaymentStatus = async function(matchId, status) {
    const res = await apiRequest(`/admin/matchups/status`, 'POST', { id: matchId, status });
    if (res && res.status === 'success') {
        showToast('Cập nhật trạng thái lệ phí thành công!', 'success');
        refreshTournamentDetail();
    } else {
        showToast(res?.message || 'Có lỗi xảy ra', 'error');
    }
};

window.deleteCurrentTournament = async function() {
    if (!currentTournamentId) return;
    if (!confirm('Bạn có chắc chắn muốn xoá vĩnh viễn giải đấu này?\nToàn bộ trận đấu, bảng đấu và sơ đồ sẽ bị xoá vĩnh viễn.')) return;

    const res = await apiRequest(`/admin/tournaments?id=${currentTournamentId}`, 'DELETE');
    if (res && res.status === 'success') {
        showToast('Đã xoá giải đấu thành công!', 'success');
        window.showTab('tournaments');
    } else {
        showToast(res?.message || 'Có lỗi xảy ra', 'error');
    }
};

// ==========================================
// PLAYERS & RANKINGS
// ==========================================
async function loadPlayers() {
    const res = await apiRequest('/players');
    if (!res || !res.data) return;
    cachedPlayers = res.data;
    renderPlayerRanking();
}

window.renderPlayerRanking = function() {
    const tbody = document.getElementById('admin-rankings-list');
    if (!tbody) return;

    const genderVal = document.getElementById('filter-gender')?.value || 'all';
    const sortVal = document.getElementById('sort-players')?.value || 'points_desc';

    let list = [...cachedPlayers];
    if (genderVal !== 'all') {
        list = list.filter(p => p.gender === genderVal);
    }

    if (sortVal === 'points_desc') {
        list.sort((a, b) => b.points - a.points);
    } else if (sortVal === 'points_asc') {
        list.sort((a, b) => a.points - b.points);
    } else if (sortVal === 'date_desc') {
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (sortVal === 'date_asc') {
        list.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center; padding:20px;">Không có dữ liệu tuyển thủ.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map((p, idx) => {
        const ava = p.avatar ? (p.avatar.startsWith('http') ? p.avatar : API_BASE.replace('/api', '') + '/' + p.avatar) : svgAvatar(p.name);
        return `
            <tr>
                <td style="font-weight:800; color:var(--muted);">${idx + 1}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick='openPlayerProfileModal(${JSON.stringify(p)})'>
                        <img src="${ava}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                        <div>
                            <strong style="color:var(--primary); font-size:13.5px;">${p.name}</strong>
                            <div style="font-size:11px; color:var(--muted);">ID: #${p.id}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${p.gender === 'Nữ' ? 'badge-pink' : 'badge-blue'}">${p.gender || 'Nam'}</span></td>
                <td><strong style="color:#d97706; font-size:14px;">${p.points}</strong> pts</td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
};

window.openPlayerModal = function() {
    document.getElementById('player-id-input').value = '';
    document.getElementById('player-name').value = '';
    document.getElementById('player-gender').value = 'Nam';
    document.getElementById('player-points').value = '0.00';
    document.getElementById('player-profile').value = '';
    document.getElementById('player-avatar').value = '';
    document.getElementById('player-avatar-preview').style.display = 'none';
    document.getElementById('modal-player-title').innerHTML = '<i data-lucide="plus"></i> Tạo tuyển thủ mới';
    document.getElementById('modal-player-form')?.classList.add('active');
    lucide.createIcons();
};

window.closePlayerModal = function() {
    document.getElementById('modal-player-form')?.classList.remove('active');
};

window.previewPlayerAvatar = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('player-avatar-preview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.submitPlayerForm = async function(e) {
    e.preventDefault();
    const id = document.getElementById('player-id-input').value;
    const name = document.getElementById('player-name').value.trim();
    const gender = document.getElementById('player-gender').value;
    const points = parseFloat(document.getElementById('player-points').value || 0);
    const bio = document.getElementById('player-profile').value.trim();
    const fileInput = document.getElementById('player-avatar');

    if (!name) {
        showToast('Vui lòng nhập tên tuyển thủ', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('gender', gender);
    formData.append('points', points);
    formData.append('bio', bio);
    if (fileInput && fileInput.files[0]) {
        formData.append('avatar', fileInput.files[0]);
    }

    let res;
    if (id) {
        formData.append('id', id);
        res = await apiRequest(`/admin/players`, 'POST', formData);
    } else {
        res = await apiRequest(`/admin/players`, 'POST', formData);
    }

    if (res && res.status === 'success') {
        showToast(id ? 'Đã cập nhật tuyển thủ thành công!' : 'Đã tạo tuyển thủ thành công!', 'success');
        closePlayerModal();
        loadPlayers();
    } else {
        showToast(res?.message || 'Có lỗi xảy ra', 'error');
    }
};

window.openPlayerProfileModal = function(p) {
    if (!p) return;
    const modal = document.getElementById('modal-player-profile');
    if (!modal) return;

    document.getElementById('profile-name').textContent = p.name;
    document.getElementById('profile-gender').textContent = p.gender || 'Nam';
    document.getElementById('profile-points').textContent = p.points || '0.0';

    const ava = p.avatar ? (p.avatar.startsWith('http') ? p.avatar : API_BASE.replace('/api', '') + '/' + p.avatar) : svgAvatar(p.name);
    document.getElementById('profile-avatar').src = ava;

    const bioEl = document.getElementById('profile-bio');
    if (p.bio && p.bio.trim()) {
        bioEl.textContent = p.bio;
        bioEl.style.display = 'block';
    } else {
        bioEl.style.display = 'none';
    }

    modal.classList.add('active');
    lucide.createIcons();
};

window.closePlayerProfileModal = function() {
    document.getElementById('modal-player-profile')?.classList.remove('active');
};

// ==========================================
// TOURNAMENT MODAL (CREATE / EDIT)
// ==========================================
window.openCreateTournamentModal = function() {
    editingTournamentId = null;
    document.getElementById('modal-tournament-title-text').innerHTML = '<i data-lucide="trophy"></i> Tạo giải đấu mới';
    document.getElementById('btn-submit-create-tournament').innerHTML = '<i data-lucide="rocket"></i> Tạo giải đấu ngay';
    document.getElementById('structure-update-warning').style.display = 'none';

    document.getElementById('modal-t-start-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-t-title').value = '';
    document.getElementById('modal-t-banner-selected').value = 'public/banners/1.jpg';
    document.getElementById('modal-t-banner-position').value = '50% 50%';
    document.getElementById('modal-t-desc').value = '';
    document.getElementById('modal-t-rules').value = '';

    const preview = document.getElementById('modal-t-banner-preview');
    const placeholder = document.getElementById('modal-t-banner-placeholder');
    const overlay = document.getElementById('modal-t-banner-overlay');
    const btnRepo = document.getElementById('btn-reposition-banner');

    if (preview) { preview.src = '../public/banners/1.jpg'; preview.classList.remove('hidden'); }
    if (placeholder) placeholder.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');
    if (btnRepo) btnRepo.classList.remove('hidden');

    // Reset Teams & Groups
    teamPool = [];
    groupBuilders = [];
    bracketStages = [];
    selectedP1 = null;
    selectedP2 = null;
    activeSlot = 1;

    renderTeamPool();
    renderGroupBuilders();
    renderBracketBuilders();
    renderPlayerPickerList();

    document.getElementById('modal-tournament')?.classList.add('active');
    lucide.createIcons();
};

window.closeCreateTournamentModal = function() {
    document.getElementById('modal-tournament')?.classList.remove('active');
};

window.openEditCurrentTournamentModal = async function() {
    if (!currentTournamentId) return;
    const res = await apiRequest(`/tournaments/detail?id=${currentTournamentId}`);
    if (!res || !res.data) return;

    const data = res.data;
    const t = data.tournament;
    editingTournamentId = t.id;

    document.getElementById('modal-tournament-title-text').innerHTML = '<i data-lucide="pencil"></i> Cập nhật thông tin giải đấu';
    document.getElementById('btn-submit-create-tournament').innerHTML = '<i data-lucide="save"></i> Lưu thay đổi';
    document.getElementById('structure-update-warning').style.display = 'block';
    document.getElementById('modal-t-update-structure').checked = false;

    document.getElementById('modal-t-start-date').value = t.start_date ? t.start_date.split(' ')[0] : '';
    document.getElementById('modal-t-title').value = t.title || '';
    document.getElementById('modal-t-desc').value = t.description || '';
    document.getElementById('modal-t-rules').value = t.rules || '';

    const bannerVal = t.banner || 'public/banners/1.jpg';
    document.getElementById('modal-t-banner-selected').value = bannerVal;
    document.getElementById('modal-t-banner-position').value = t.banner_position || '50% 50%';

    const preview = document.getElementById('modal-t-banner-preview');
    const placeholder = document.getElementById('modal-t-banner-placeholder');
    const overlay = document.getElementById('modal-t-banner-overlay');
    const btnRepo = document.getElementById('btn-reposition-banner');

    let fullSrc = bannerVal.startsWith('http') ? bannerVal : (bannerVal.startsWith('public/') ? '../' + bannerVal : bannerVal);
    if (preview) { preview.src = fullSrc; preview.style.objectPosition = t.banner_position || '50% 50%'; preview.classList.remove('hidden'); }
    if (placeholder) placeholder.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');
    if (btnRepo) btnRepo.classList.remove('hidden');

    // Prizes
    let prizes = [];
    try { prizes = typeof t.prizes === 'string' ? JSON.parse(t.prizes) : (t.prizes || []); } catch(e) {}
    const prizeContainer = document.getElementById('prize-rows-container');
    if (prizeContainer && Array.isArray(prizes) && prizes.length > 0) {
        prizeContainer.innerHTML = prizes.map(p => `
            <div class="prize-item-row">
                <select style="width: 170px;" class="prize-rank-select">
                    <option value="Nhất (Vô địch)" ${p.rank === 'Nhất (Vô địch)' ? 'selected' : ''}>🥇 Nhất (Vô địch)</option>
                    <option value="Nhì (Á quân)" ${p.rank === 'Nhì (Á quân)' ? 'selected' : ''}>🥈 Nhì (Á quân)</option>
                    <option value="Đồng Hạng Ba" ${p.rank === 'Đồng Hạng Ba' ? 'selected' : ''}>🥉 Đồng Hạng Ba</option>
                    <option value="Khuyến khích" ${p.rank === 'Khuyến khích' ? 'selected' : ''}>🎖️ Khuyến khích</option>
                </select>
                <input type="text" class="prize-desc-input" placeholder="Phần thưởng..." value="${p.reward || ''}">
                <button type="button" class="btn btn-sm btn-danger" onclick="removePrizeRow(this)">✕</button>
            </div>
        `).join('');
    }

    document.getElementById('modal-tournament')?.classList.add('active');
    lucide.createIcons();
};

// BANNER HANDLERS
window.handleBannerBoxClick = function(e) {
    if (e.target.closest('#btn-reposition-banner') || e.target.closest('#banner-reposition-bar') || e.target.closest('button')) return;
    document.getElementById('modal-banner-file')?.click();
};

window.handleBannerUploadFile = async function(input) {
    if (!input.files || !input.files[0]) return;
    const formData = new FormData();
    formData.append('banner', input.files[0]);

    const res = await apiRequest('/admin/media/upload', 'POST', formData);
    if (res && res.status === 'success') {
        const path = res.data?.url || res.url;
        document.getElementById('modal-t-banner-selected').value = path;
        const preview = document.getElementById('modal-t-banner-preview');
        const placeholder = document.getElementById('modal-t-banner-placeholder');
        const overlay = document.getElementById('modal-t-banner-overlay');
        const btnRepo = document.getElementById('btn-reposition-banner');

        const fullSrc = path.startsWith('http') ? path : (path.startsWith('public/') ? '../' + path : path);
        if (preview) { preview.src = fullSrc; preview.classList.remove('hidden'); }
        if (placeholder) placeholder.classList.add('hidden');
        if (overlay) overlay.classList.remove('hidden');
        if (btnRepo) btnRepo.classList.remove('hidden');

        showToast('Tải ảnh banner lên thành công!', 'success');
        closeBannerLibraryModal();
    } else {
        showToast(res?.message || 'Lỗi khi tải ảnh', 'error');
    }
};

window.openBannerLibraryModal = async function() {
    document.getElementById('modal-banner-library')?.classList.add('active');
    await loadBannerLibrary();
};

window.closeBannerLibraryModal = function() {
    document.getElementById('modal-banner-library')?.classList.remove('active');
};

async function loadBannerLibrary() {
    const grid = document.getElementById('banner-library-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="text-muted" style="padding:10px;">Đang tải thư viện ảnh...</div>';

    const res = await apiRequest('/admin/media');
    const banners = res?.data || [
        { url: 'public/banners/1.jpg' },
        { url: 'public/banners/2.jpg' },
        { url: 'public/banners/3.jpg' }
    ];

    grid.innerHTML = banners.map(b => {
        const fullSrc = b.url.startsWith('http') ? b.url : (b.url.startsWith('public/') ? '../' + b.url : b.url);
        return `
            <div class="banner-gallery-item" onclick="selectBannerFromLibrary('${b.url}')">
                <img src="${fullSrc}" alt="Banner">
            </div>
        `;
    }).join('');
}

window.selectBannerFromLibrary = function(path) {
    document.getElementById('modal-t-banner-selected').value = path;
    const preview = document.getElementById('modal-t-banner-preview');
    const placeholder = document.getElementById('modal-t-banner-placeholder');
    const overlay = document.getElementById('modal-t-banner-overlay');
    const btnRepo = document.getElementById('btn-reposition-banner');

    const fullSrc = path.startsWith('http') ? path : (path.startsWith('public/') ? '../' + path : path);
    if (preview) { preview.src = fullSrc; preview.classList.remove('hidden'); }
    if (placeholder) placeholder.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');
    if (btnRepo) btnRepo.classList.remove('hidden');

    closeBannerLibraryModal();
};

window.applyCustomBannerUrl = function() {
    const url = document.getElementById('modal-t-banner-custom')?.value.trim();
    if (!url) return;
    selectBannerFromLibrary(url);
};

let isRepositioning = false;
let startY = 0;
let currentPosY = 50;

window.toggleRepositionBanner = function(e) {
    e.stopPropagation();
    if (isRepositioning) stopRepositionBanner(e);
    else startRepositionBanner(e);
};

window.startRepositionBanner = function(e) {
    if (e) e.stopPropagation();
    isRepositioning = true;
    document.getElementById('banner-reposition-bar')?.classList.remove('hidden');
    document.getElementById('modal-t-banner-overlay')?.classList.add('hidden');

    const box = document.getElementById('banner-upload-box');
    if (box) {
        box.style.cursor = 'ns-resize';
        box.onmousedown = function(ev) {
            startY = ev.clientY;
            document.onmousemove = function(evMove) {
                const delta = evMove.clientY - startY;
                currentPosY = Math.min(100, Math.max(0, currentPosY + delta * 0.2));
                startY = evMove.clientY;
                const preview = document.getElementById('modal-t-banner-preview');
                if (preview) {
                    preview.style.objectPosition = `50% ${currentPosY}%`;
                }
                document.getElementById('modal-t-banner-position').value = `50% ${currentPosY.toFixed(1)}%`;
            };
            document.onmouseup = function() {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
    }
};

window.stopRepositionBanner = function(e) {
    if (e) e.stopPropagation();
    isRepositioning = false;
    document.getElementById('banner-reposition-bar')?.classList.add('hidden');
    document.getElementById('modal-t-banner-overlay')?.classList.remove('hidden');
    const box = document.getElementById('banner-upload-box');
    if (box) {
        box.style.cursor = 'pointer';
        box.onmousedown = null;
    }
};

window.addPrizeRow = function() {
    const container = document.getElementById('prize-rows-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'prize-item-row';
    div.innerHTML = `
        <select style="width: 170px;" class="prize-rank-select">
            <option value="Khuyến khích">🎖️ Khuyến khích</option>
            <option value="Nhất (Vô địch)">🥇 Nhất (Vô địch)</option>
            <option value="Nhì (Á quân)">🥈 Nhì (Á quân)</option>
            <option value="Đồng Hạng Ba">🥉 Đồng Hạng Ba</option>
        </select>
        <input type="text" class="prize-desc-input" placeholder="Mô tả phần thưởng...">
        <button type="button" class="btn btn-sm btn-danger" onclick="removePrizeRow(this)">✕</button>
    `;
    container.appendChild(div);
};

window.removePrizeRow = function(btn) {
    btn.closest('.prize-item-row')?.remove();
};

// ==========================================
// FINISH TOURNAMENT & RESULTS
// ==========================================
window.openEndTournamentModal = async function() {
    if (!currentTournamentId) return;
    const res = await apiRequest(`/tournaments/detail?id=${currentTournamentId}`);
    if (!res || !res.data) return;

    const data = res.data;
    const t = data.tournament;
    const matchups = data.matchups || [];
    const container = document.getElementById('finish-prizes-container');
    if (!container) return;

    // Collect team options
    const teamOptions = [];
    matchups.forEach(m => {
        const t1 = `${m.t1_p1_name} & ${m.t1_p2_name}`;
        const t2 = `${m.t2_p1_name} & ${m.t2_p2_name}`;
        if (m.t1_p1_name && !teamOptions.includes(t1)) teamOptions.push(t1);
        if (m.t2_p1_name && !teamOptions.includes(t2)) teamOptions.push(t2);
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

    container.innerHTML = prizes.map((p, idx) => {
        const found = existingResults.find(r => r.rank === p.rank);
        const currentWinner = found ? (found.team_name || `${found.p1_name || ''} & ${found.p2_name || ''}`.trim()) : '';
        const currentMedal = found ? found.medal : (rankMedals[p.rank] || '🥇');

        return `
            <div class="finish-prize-row" style="border:1px solid var(--border); border-radius:8px; padding:12px; background:var(--panel);">
                <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
                    <select class="finish-medal-select" style="width:70px; font-size:16px;">
                        <option value="🥇" ${currentMedal === '🥇' ? 'selected' : ''}>🥇</option>
                        <option value="🥈" ${currentMedal === '🥈' ? 'selected' : ''}>🥈</option>
                        <option value="🥉" ${currentMedal === '🥉' ? 'selected' : ''}>🥉</option>
                        <option value="🎖️" ${currentMedal === '🎖️' ? 'selected' : ''}>🎖️</option>
                        <option value="🏆" ${currentMedal === '🏆' ? 'selected' : ''}>🏆</option>
                    </select>
                    <input type="text" class="finish-rank-input" value="${p.rank}" placeholder="Hạng giải" style="font-weight:800; width:150px; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
                    <input type="text" class="finish-reward-input" value="${p.reward || ''}" placeholder="Phần thưởng" style="flex:1; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
                    <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.finish-prize-row').remove()">✕</button>
                </div>
                <div>
                    <label style="font-size:11px; color:var(--muted); font-weight:700; margin-bottom:4px; display:block;">Đội đạt giải:</label>
                    <select class="finish-winner-select" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border); font-weight:700;">
                        <option value="">-- Chọn Đội chiến thắng --</option>
                        ${teamOptions.map(opt => `<option value="${opt}" ${currentWinner === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('modal-finish-tournament')?.classList.add('active');
    lucide.createIcons();
};

window.closeEndTournamentModal = function() {
    document.getElementById('modal-finish-tournament')?.classList.remove('active');
};

window.addFinishPrizeRow = function() {
    const container = document.getElementById('finish-prizes-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'finish-prize-row';
    div.style = 'border:1px solid var(--border); border-radius:8px; padding:12px; background:var(--panel);';
    div.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
            <select class="finish-medal-select" style="width:70px; font-size:16px;">
                <option value="🥇">🥇</option>
                <option value="🥈">🥈</option>
                <option value="🥉">🥉</option>
                <option value="🎖️" selected>🎖️</option>
                <option value="🏆">🏆</option>
            </select>
            <input type="text" class="finish-rank-input" value="Khuyến khích" placeholder="Hạng giải" style="font-weight:800; width:150px; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            <input type="text" class="finish-reward-input" value="" placeholder="Phần thưởng" style="flex:1; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.finish-prize-row').remove()">✕</button>
        </div>
        <div>
            <label style="font-size:11px; color:var(--muted); font-weight:700; margin-bottom:4px; display:block;">Đội đạt giải:</label>
            <select class="finish-winner-select" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border); font-weight:700;">
                <option value="">-- Chọn Đội chiến thắng --</option>
            </select>
        </div>
    `;
    container.appendChild(div);
};

window.submitFinishTournament = async function(e) {
    e.preventDefault();
    if (!currentTournamentId) return;

    const rows = document.querySelectorAll('#finish-prizes-container .finish-prize-row');
    const finalResults = [];

    rows.forEach(row => {
        const medal = row.querySelector('.finish-medal-select')?.value || '🥇';
        const rank = row.querySelector('.finish-rank-input')?.value.trim() || '';
        const reward = row.querySelector('.finish-reward-input')?.value.trim() || '';
        const teamName = row.querySelector('.finish-winner-select')?.value.trim() || '';

        if (rank) {
            finalResults.push({
                medal,
                rank,
                reward,
                team_name: teamName
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
};

// ==========================================
// SETTINGS
// ==========================================
document.getElementById('form-password')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPass = document.getElementById('pwd-old').value;
    const newPass = document.getElementById('pwd-new').value;
    const confirmPass = document.getElementById('pwd-confirm').value;
    if (newPass !== confirmPass) {
        showToast('Mật khẩu mới và xác nhận không khớp!', 'error');
        return;
    }
    const res = await apiRequest('/admin/settings/password', 'POST', {
        old_password: oldPass,
        new_password: newPass
    });
    showToast(res?.message || 'Đã đổi mật khẩu', res?.status === 'success' ? 'success' : 'error');
    if (res && res.status === 'success') {
        document.getElementById('pwd-old').value = '';
        document.getElementById('pwd-new').value = '';
        document.getElementById('pwd-confirm').value = '';
    }
});

// LOGIN FORM
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;

    const res = await apiRequest('/admin/login', 'POST', { username: user, password: pass });
    if (res && res.status === 'success') {
        showToast('Đăng nhập thành công!', 'success');
        checkLogin(true);
    } else {
        showToast(res?.message || 'Tài khoản hoặc mật khẩu không chính xác', 'error');
    }
});

// LOGOUT
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await apiRequest('/admin/logout', 'POST');
    checkLogin(false);
});

// INITIALIZE
document.addEventListener('DOMContentLoaded', async () => {
    const authRes = await apiRequest('/admin/check-auth');
    if (authRes && authRes.logged_in) {
        checkLogin(true);
    } else {
        checkLogin(false);
    }
    lucide.createIcons();
});
