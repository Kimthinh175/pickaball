// ==========================================
// MODULE: PLAYERS & RANKINGS (PAGINATION)
// ==========================================

import { API_BASE, apiRequest } from '../core/api.js?v=28';
import { showToast } from '../core/toast.js?v=28';
import { svgAvatar } from '../core/avatar.js?v=28';

export let cachedPlayers = [];
const PAGE_SIZE = 15;

let activeFilteredList = [];
let currentPage = 1;

export function getPlayerAvatarUrl(p) {
    if (p && p.avatar && p.avatar.trim() !== '') {
        return (p.avatar.startsWith('http') || p.avatar.startsWith('data:'))
            ? p.avatar
            : API_BASE.replace('/api', '') + '/' + p.avatar;
    }
    return svgAvatar(p ? p.name : '?');
}

export async function loadPlayers() {
    const res = await apiRequest('/players');
    if (!res || !Array.isArray(res.data)) return;
    cachedPlayers = res.data;
    renderPlayerRanking();
}

export function renderPlayerRanking() {
    const tbody = document.getElementById('admin-rankings-list');
    if (!tbody) return;

    const searchVal = (document.getElementById('search-player-admin')?.value || '').toLowerCase().trim();
    const genderVal = document.getElementById('filter-gender')?.value || 'all';
    const sortVal   = document.getElementById('sort-players')?.value || 'points_desc';

    // Stat cards
    const totalEl       = document.getElementById('stat-player-total');
    const highestEl     = document.getElementById('stat-player-highest');
    const genderRatioEl = document.getElementById('stat-player-gender');
    const countEl       = document.getElementById('player-count');

    if (totalEl) totalEl.textContent = cachedPlayers.length;
    if (highestEl) {
        const maxPts = cachedPlayers.length > 0 ? Math.max(...cachedPlayers.map(p => parseFloat(p.points) || 0)) : 0;
        highestEl.textContent = `${maxPts.toFixed(2)} điểm`;
    }
    if (genderRatioEl) {
        const maleCount   = cachedPlayers.filter(p => p.gender === 'Nam').length;
        const femaleCount = cachedPlayers.filter(p => p.gender === 'Nữ').length;
        genderRatioEl.textContent = `${maleCount} Nam / ${femaleCount} Nữ`;
    }

    let list = [...cachedPlayers];
    if (searchVal) list = list.filter(p => p.name.toLowerCase().includes(searchVal));
    if (genderVal !== 'all') list = list.filter(p => p.gender === genderVal);

    if (sortVal === 'points_desc')     list.sort((a, b) => b.points - a.points);
    else if (sortVal === 'points_asc') list.sort((a, b) => a.points - b.points);
    else if (sortVal === 'date_desc')  list.sort((a, b) => (b.id || 0) - (a.id || 0));
    else if (sortVal === 'date_asc')   list.sort((a, b) => (a.id || 0) - (b.id || 0));

    activeFilteredList = list;
    currentPage = 1;  // reset về trang 1 khi filter thay đổi

    if (activeFilteredList.length === 0) {
        if (countEl) countEl.textContent = '0 tuyển thủ';
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align:center; padding:32px;">Không tìm thấy tuyển thủ nào phù hợp.</td></tr>';
        const mobileList = document.getElementById('admin-rankings-mobile');
        if (mobileList) mobileList.innerHTML = '<div style="text-align:center; padding:32px 16px; color:var(--muted); font-size:14px; font-weight:700;">Không tìm thấy tuyển thủ nào.</div>';
        renderAdminPagination(0, 0);
        return;
    }

    renderPage();
}

// Render nội dung trang hiện tại
function renderPage() {
    const tbody      = document.getElementById('admin-rankings-list');
    const mobileList = document.getElementById('admin-rankings-mobile');
    const countEl    = document.getElementById('player-count');
    if (!tbody) return;

    const totalPages = Math.ceil(activeFilteredList.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx   = startIdx + PAGE_SIZE;
    const pageBatch = activeFilteredList.slice(startIdx, endIdx);

    // ── Desktop: table rows ──────────────────────
    tbody.innerHTML = pageBatch.map((p, idx) => {
        const absoluteIndex = startIdx + idx;
        const medal = absoluteIndex === 0 ? '🥇' : absoluteIndex === 1 ? '🥈' : absoluteIndex === 2 ? '🥉' : '';
        const ava = getPlayerAvatarUrl(p);
        const fallbackSvg = svgAvatar(p.name);
        return `
            <tr>
                <td style="font-weight:800; text-align:center; color:var(--muted);">${medal ? `${medal} ` : ''}${absoluteIndex + 1}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.openPlayerProfileModalById(${p.id})">
                        <img src="${ava}" onerror="this.onerror=null;this.src='${fallbackSvg}';" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1.5px solid #e2e8f0; flex-shrink:0;">
                        <div>
                            <strong style="color:var(--primary); font-size:14px;">${p.name}</strong>
                            <div style="font-size:11px; color:var(--muted);">ID: #${p.id}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${p.gender === 'Nữ' ? 'badge-pink' : 'badge-blue'}">${p.gender || 'Nam'}</span></td>
                <td><strong style="color:#d97706; font-size:14.5px;">${parseFloat(p.points || 0).toFixed(2)}</strong> điểm</td>
                <td style="text-align:center;">
                    <div style="display:inline-flex; gap:6px;">
                        <button type="button" class="btn btn-sm" style="padding:5px 10px; font-size:12px;" onclick="window.openEditPlayerModalById(${p.id})">✏️ Sửa</button>
                        <button type="button" class="btn btn-sm btn-danger" style="padding:5px 10px; font-size:12px;" onclick="window.deletePlayer(${p.id})">🗑️</button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    // ── Mobile: card items ───────────────────────
    if (mobileList) {
        mobileList.innerHTML = pageBatch.map((p, idx) => {
            const absoluteIndex = startIdx + idx;
            const medal = absoluteIndex === 0 ? '🥇' : absoluteIndex === 1 ? '🥈' : absoluteIndex === 2 ? '🥉' : `#${absoluteIndex + 1}`;
            const ava = getPlayerAvatarUrl(p);
            const fallbackSvg = svgAvatar(p.name);
            const isFemale = p.gender === 'Nữ';
            return `
                <div class="player-mobile-card">
                    <div class="pmc-rank ${absoluteIndex < 3 ? 'pmc-rank-medal' : ''}">${medal}</div>
                    <img class="pmc-avatar" src="${ava}" onerror="this.onerror=null;this.src='${fallbackSvg}';"
                         onclick="window.openPlayerProfileModalById(${p.id})">
                    <div class="pmc-info" onclick="window.openPlayerProfileModalById(${p.id})">
                        <div class="pmc-name">${p.name}</div>
                        <div class="pmc-meta">
                            <span class="badge ${isFemale ? 'badge-pink' : 'badge-blue'}" style="font-size:10px; padding:2px 7px;">${p.gender || 'Nam'}</span>
                            <span class="pmc-pts">${parseFloat(p.points || 0).toFixed(2)} điểm</span>
                        </div>
                    </div>
                    <div class="pmc-actions">
                        <button class="pmc-btn pmc-btn-edit" onclick="window.openEditPlayerModalById(${p.id})" title="Sửa">✏️</button>
                        <button class="pmc-btn pmc-btn-del" onclick="window.deletePlayer(${p.id})" title="Xoá">🗑️</button>
                    </div>
                </div>`;
        }).join('');
    }

    if (countEl) {
        countEl.textContent = `${startIdx + 1}–${Math.min(endIdx, activeFilteredList.length)} / ${activeFilteredList.length} tuyển thủ`;
    }

    renderAdminPagination(totalPages, activeFilteredList.length);
    if (window.lucide) window.lucide.createIcons();
}

// Render thanh phân trang
function renderAdminPagination(totalPages, totalItems) {
    const container = document.getElementById('admin-player-pagination');
    if (!container) return;

    if (totalPages <= 1) { container.innerHTML = ''; return; }

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage   = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    let html = `<div class="pagination">`;
    html += `<span class="pagination-info">Tổng: <strong>${totalItems}</strong> tuyển thủ</span>`;
    html += `<div class="pagination-btns">`;

    html += `<button class="pg-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="window.goToPlayerPage(1)" title="Trang đầu">«</button>`;
    html += `<button class="pg-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="window.goToPlayerPage(${currentPage - 1})" title="Trang trước">‹</button>`;

    if (startPage > 1) html += `<span class="pg-ellipsis">…</span>`;

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pg-btn ${i === currentPage ? 'pg-active' : ''}" onclick="window.goToPlayerPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) html += `<span class="pg-ellipsis">…</span>`;

    html += `<button class="pg-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="window.goToPlayerPage(${currentPage + 1})" title="Trang sau">›</button>`;
    html += `<button class="pg-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="window.goToPlayerPage(${totalPages})" title="Trang cuối">»</button>`;

    html += `</div></div>`;
    container.innerHTML = html;
}

// Hàm public expose ra window
export function goToPlayerPage(page) {
    const totalPages = Math.ceil(activeFilteredList.length / PAGE_SIZE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPage();
    // Scroll lên đầu bảng
    document.getElementById('admin-rankings-list')?.closest('.card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}



// ==========================================
// HELPERS: Build & Parse profile string
// Format lưu: "Tuổi: X\nMô tả: Y"  hoặc chỉ "Mô tả: Y" nếu không có tuổi
// ==========================================
function buildProfile(age, desc) {
    const ageTrimmed = (age || '').toString().trim();
    const descTrimmed = (desc || '').trim();
    const parts = [];
    if (ageTrimmed) parts.push(`Tuổi: ${ageTrimmed}`);
    if (descTrimmed) parts.push(`Mô tả: ${descTrimmed}`);
    return parts.join('\n');
}

function parseProfile(profile) {
    const str = (profile || '').trim();
    let age = '';
    let desc = '';

    // Thử tách "Tuổi: X" ở dòng đầu
    const ageMatch = str.match(/^Tuổi:\s*(\d+)/m);
    if (ageMatch) {
        age = ageMatch[1];
    }

    // Tách phần "Mô tả: ..." (có thể multiline)
    const descMatch = str.match(/Mô tả:\s*([\s\S]*)/);
    if (descMatch) {
        desc = descMatch[1].trim();
    } else if (!ageMatch) {
        // profile cũ không theo format mới → đưa hết vào desc
        desc = str;
    } else if (ageMatch && !descMatch) {
        // chỉ có tuổi, không có mô tả
        desc = '';
    }

    return { age, desc };
}

export function handlePlayerGenderChange() {
    const isEdit = !!document.getElementById('player-id-input')?.value;
    if (isEdit) return;
    const gender = document.getElementById('player-gender')?.value;
    const pointsInput = document.getElementById('player-points');
    if (pointsInput) {
        pointsInput.value = (gender === 'Nữ') ? '2.10' : '2.60';
    }
}

export function openPlayerModal() {
    document.getElementById('player-id-input').value = '';
    document.getElementById('player-name').value = '';
    document.getElementById('player-gender').value = 'Nam';
    document.getElementById('player-points').value = '2.60';
    document.getElementById('player-profile').value = '';
    const ageEl = document.getElementById('player-age');
    const descEl = document.getElementById('player-desc');
    if (ageEl) ageEl.value = '';
    if (descEl) descEl.value = '';
    document.getElementById('player-avatar').value = '';
    document.getElementById('player-avatar-preview').style.display = 'none';
    document.getElementById('modal-player-title').innerHTML = '<i data-lucide="plus"></i> Tạo tuyển thủ mới';
    document.getElementById('modal-player-form')?.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function openEditPlayerModalById(id) {
    const p = cachedPlayers.find(x => Number(x.id) === Number(id));
    if (p) openEditPlayerModal(p);
}

export function openEditPlayerModal(p) {
    if (!p) return;
    document.getElementById('player-id-input').value = p.id;
    document.getElementById('player-name').value = p.name || '';
    document.getElementById('player-gender').value = p.gender || 'Nam';
    document.getElementById('player-points').value = p.points || '0.00';

    // Parse profile → age + desc
    const rawProfile = p.profile || p.bio || '';
    document.getElementById('player-profile').value = rawProfile; // hidden backup
    const { age, desc } = parseProfile(rawProfile);
    const ageEl = document.getElementById('player-age');
    const descEl = document.getElementById('player-desc');
    if (ageEl) ageEl.value = age;
    if (descEl) descEl.value = desc;

    document.getElementById('player-avatar').value = '';
    const preview = document.getElementById('player-avatar-preview');
    if (preview) {
        preview.src = getPlayerAvatarUrl(p);
        preview.style.display = 'block';
    }

    document.getElementById('modal-player-title').innerHTML = '<i data-lucide="pencil"></i> Chỉnh sửa tuyển thủ';
    document.getElementById('modal-player-form')?.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function closePlayerModal() {
    document.getElementById('modal-player-form')?.classList.remove('active');
}

export function previewPlayerAvatar(input) {
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
}

export async function submitPlayerForm(e) {
    e.preventDefault();
    const id = document.getElementById('player-id-input').value;
    const name = document.getElementById('player-name').value.trim();
    const gender = document.getElementById('player-gender').value;
    const points = parseFloat(document.getElementById('player-points').value || 0);
    const fileInput = document.getElementById('player-avatar');

    // Ghép tuổi + mô tả → profile
    const age = document.getElementById('player-age')?.value?.trim() || '';
    const desc = document.getElementById('player-desc')?.value?.trim() || '';
    const profile = buildProfile(age, desc);

    if (!name) {
        showToast('Vui lòng nhập tên tuyển thủ', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('gender', gender);
    formData.append('points', points);
    formData.append('profile', profile);
    if (fileInput && fileInput.files[0]) {
        formData.append('avatar_file', fileInput.files[0]);
    }

    let res;
    if (id) {
        formData.append('id', id);
        res = await apiRequest(`/admin/players/update`, 'POST', formData);
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
}

export async function deletePlayer(id) {
    if (!id) return;
    if (!confirm('Bạn có chắc chắn muốn xoá tuyển thủ này? Thao tác này sẽ xoá hoàn toàn tuyển thủ khỏi hệ thống!')) return;

    const res = await apiRequest(`/admin/players?id=${id}`, 'DELETE');
    if (res && res.status === 'success') {
        showToast('Đã xoá tuyển thủ thành công!', 'success');
        loadPlayers();
    } else {
        showToast(res?.message || 'Có lỗi xảy ra khi xoá tuyển thủ', 'error');
    }
}

export function openPlayerProfileModalById(id) {
    const p = cachedPlayers.find(x => Number(x.id) === Number(id));
    if (p) openPlayerProfileModal(p);
}

export function openPlayerProfileModal(p) {
    if (!p) return;
    const modal = document.getElementById('modal-player-profile');
    if (!modal) return;

    document.getElementById('profile-name').textContent = p.name;
    document.getElementById('profile-gender').textContent = p.gender || 'Nam';
    document.getElementById('profile-points').textContent = parseFloat(p.points || 0).toFixed(2);

    const ava = getPlayerAvatarUrl(p);
    const fallbackSvg = svgAvatar(p.name);
    const avaEl = document.getElementById('profile-avatar');
    avaEl.src = ava;
    avaEl.onerror = () => { avaEl.src = fallbackSvg; };

    const bioEl = document.getElementById('profile-bio');
    const bioText = p.profile || p.bio || '';
    if (bioText && bioText.trim()) {
        bioEl.textContent = bioText;
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
