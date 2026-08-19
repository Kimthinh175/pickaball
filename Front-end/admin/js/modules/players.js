// ==========================================
// MODULE: PLAYERS & RANKINGS (WITH INFINITE SCROLL)
// ==========================================

import { API_BASE, apiRequest } from '../core/api.js?v=28';
import { showToast } from '../core/toast.js?v=28';
import { svgAvatar } from '../core/avatar.js?v=28';

export let cachedPlayers = [];
const PAGE_SIZE = 20;

let activeFilteredList = [];
let renderedCount = 0;
let scrollObserver = null;

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

    if (scrollObserver) {
        scrollObserver.disconnect();
        scrollObserver = null;
    }

    const searchVal = (document.getElementById('search-player-admin')?.value || '').toLowerCase().trim();
    const genderVal = document.getElementById('filter-gender')?.value || 'all';
    const sortVal = document.getElementById('sort-players')?.value || 'points_desc';

    // Update stat cards
    const totalEl = document.getElementById('stat-player-total');
    const highestEl = document.getElementById('stat-player-highest');
    const genderRatioEl = document.getElementById('stat-player-gender');
    const countEl = document.getElementById('player-count');

    if (totalEl) totalEl.textContent = cachedPlayers.length;
    if (highestEl) {
        const maxPts = cachedPlayers.length > 0 ? Math.max(...cachedPlayers.map(p => parseFloat(p.points) || 0)) : 0;
        highestEl.textContent = `${maxPts.toFixed(2)} điểm`;
    }
    if (genderRatioEl) {
        const maleCount = cachedPlayers.filter(p => p.gender === 'Nam').length;
        const femaleCount = cachedPlayers.filter(p => p.gender === 'Nữ').length;
        genderRatioEl.textContent = `${maleCount} Nam / ${femaleCount} Nữ`;
    }

    let list = [...cachedPlayers];

    if (searchVal) {
        list = list.filter(p => p.name.toLowerCase().includes(searchVal));
    }

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

    activeFilteredList = list;
    renderedCount = 0;
    tbody.innerHTML = '';

    if (activeFilteredList.length === 0) {
        if (countEl) countEl.textContent = '0 tuyển thủ';
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align:center; padding:24px;">Không tìm thấy tuyển thủ nào phù hợp.</td></tr>';
        return;
    }

    // Load first batch
    loadMorePlayerRows();
    initInfiniteScroll();
}

function loadMorePlayerRows() {
    const tbody = document.getElementById('admin-rankings-list');
    const countEl = document.getElementById('player-count');
    if (!tbody) return;

    // Remove existing sentinel if present
    const oldSentinel = document.getElementById('ranking-sentinel');
    if (oldSentinel) oldSentinel.remove();

    const nextBatch = activeFilteredList.slice(renderedCount, renderedCount + PAGE_SIZE);
    if (nextBatch.length === 0) return;

    const rowsHtml = nextBatch.map((p, idx) => {
        const absoluteIndex = renderedCount + idx;
        const medal = absoluteIndex === 0 ? '🥇' : (absoluteIndex === 1 ? '🥈' : (absoluteIndex === 2 ? '🥉' : ''));
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
                        <button type="button" class="btn btn-sm" style="padding:5px 10px; font-size:12px;" onclick="window.openEditPlayerModalById(${p.id})" title="Sửa thông tin">
                            ✏️ Sửa
                        </button>
                        <button type="button" class="btn btn-sm btn-danger" style="padding:5px 10px; font-size:12px;" onclick="window.deletePlayer(${p.id})" title="Xoá tuyển thủ">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.insertAdjacentHTML('beforeend', rowsHtml);
    renderedCount += nextBatch.length;

    if (countEl) {
        countEl.textContent = `Hiển thị ${renderedCount} / ${activeFilteredList.length} tuyển thủ`;
    }

    // If there are more rows, add sentinel
    if (renderedCount < activeFilteredList.length) {
        const sentinelHtml = `
            <tr id="ranking-sentinel">
                <td colspan="5" style="text-align:center; padding:16px; color:var(--muted); font-size:13px; font-weight:700;">
                    <div style="display:inline-flex; align-items:center; gap:8px;">
                        <div style="width:16px; height:16px; border-radius:50%; border:2px solid var(--primary); border-top-color:transparent; animation:spin 0.8s linear infinite;"></div>
                        Đang tải thêm tuyển thủ...
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', sentinelHtml);

        const sentinelEl = document.getElementById('ranking-sentinel');
        if (sentinelEl && scrollObserver) {
            scrollObserver.observe(sentinelEl);
        }
    } else if (activeFilteredList.length > PAGE_SIZE) {
        const endNoticeHtml = `
            <tr id="ranking-sentinel">
                <td colspan="5" style="text-align:center; padding:12px; color:var(--muted); font-size:12.5px; font-weight:700; background:rgba(0,0,0,0.01);">
                    ✓ Đã tải hết toàn bộ ${activeFilteredList.length} tuyển thủ
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', endNoticeHtml);
    }

    if (window.lucide) window.lucide.createIcons();
}

function initInfiniteScroll() {
    if (!('IntersectionObserver' in window)) return;

    scrollObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
            if (renderedCount < activeFilteredList.length) {
                loadMorePlayerRows();
            }
        }
    }, {
        root: null,
        rootMargin: '150px',
        threshold: 0.1
    });

    const sentinelEl = document.getElementById('ranking-sentinel');
    if (sentinelEl) {
        scrollObserver.observe(sentinelEl);
    }
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
    document.getElementById('player-profile').value = p.profile || p.bio || '';
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
    const profile = document.getElementById('player-profile').value.trim();
    const fileInput = document.getElementById('player-avatar');

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
