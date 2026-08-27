// ==========================================
// MODULE: ADMIN BANNERS MANAGEMENT
// ==========================================

import { apiRequest } from '../core/api.js?v=28';
import { showToast } from '../core/toast.js?v=28';

export let cachedBanners = [];
let editingBannerId = null;
let isBannerRepositioning = false;
let startY = 0;
let posY = 50;

export async function loadBanners() {
    const list = document.getElementById('admin-banners-list');
    if (list) {
        list.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center; padding:24px;">Đang tải danh sách banner...</td></tr>';
    }

    const res = await apiRequest('/admin/banners');
    if (res && res.status === 'success') {
        cachedBanners = res.data || [];
        renderBanners();
        updateBannerStats();
    } else {
        if (list) {
            list.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center; padding:24px;">Không thể tải danh sách banner</td></tr>';
        }
    }
}

export function updateBannerStats() {
    const totalEl = document.getElementById('stat-banner-total');
    const activeEl = document.getElementById('stat-banner-active');
    const inactiveEl = document.getElementById('stat-banner-inactive');

    const total = cachedBanners.length;
    const active = cachedBanners.filter(b => parseInt(b.is_active) === 1).length;
    const inactive = total - active;

    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (inactiveEl) inactiveEl.textContent = inactive;
}

export function renderBanners() {
    const list = document.getElementById('admin-banners-list');
    const mobileList = document.getElementById('admin-banners-mobile');
    const countEl = document.getElementById('banner-count');
    if (!list) return;

    if (countEl) countEl.textContent = `(${cachedBanners.length} banners)`;

    if (!cachedBanners.length) {
        const emptyHtml = `<div style="text-align:center; padding:36px; color:var(--muted);">
            <div style="font-size:36px; margin-bottom:8px;">🖼️</div>
            <div style="font-weight:700;">Chưa có banner nào</div>
            <div style="font-size:12px; margin-top:4px;">Nhấn "Thêm banner mới" để thêm banner hiển thị trên trang giải đấu</div>
        </div>`;
        list.innerHTML = `<tr><td colspan="6">${emptyHtml}</td></tr>`;
        if (mobileList) mobileList.innerHTML = emptyHtml;
        return;
    }

    // ── Desktop: table rows ──────────────────────────────────
    list.innerHTML = cachedBanners.map((b, idx) => {
        const imgSrc = b.image_url.startsWith('http') ? b.image_url : (b.image_url.startsWith('public/') ? '../' + b.image_url : b.image_url);
        const isActive = parseInt(b.is_active) === 1;
        const pos = b.image_position || '50% 50%';
        return `
            <tr>
                <td style="text-align:center; font-weight:800; color:var(--primary);">${b.order_num || idx + 1}</td>
                <td>
                    <div class="banner-tbl-thumb">
                        <img src="${imgSrc}" alt="${b.title || 'Banner'}" style="object-position:${pos};" onerror="this.src='../public/banners/1.jpg'">
                    </div>
                </td>
                <td>
                    <div style="font-weight:800; font-size:14px; color:var(--text);">${b.title || '<span class="text-muted" style="font-style:italic; font-weight:normal;">(Không có tiêu đề)</span>'}</div>
                    <div style="font-size:11px; color:var(--muted); margin-top:3px; word-break:break-all;">${b.image_url}</div>
                </td>
                <td style="text-align:center;">
                    <span style="display:inline-block; padding:4px 8px; border-radius:6px; background:#f1f5f9; font-size:12px; font-weight:700; font-family:monospace; color:#334155;">↕ ${pos}</span>
                </td>
                <td style="text-align:center;">
                    <button type="button" class="btn btn-sm ${isActive ? 'btn-success' : 'btn-ghost'}"
                            style="padding:4px 10px; font-size:12px; border-radius:20px; font-weight:800; cursor:pointer;"
                            onclick="toggleBannerStatus(${b.id})" title="Nhấp để ${isActive ? 'Ẩn' : 'Bật'} banner">
                        ${isActive ? '● Đang hiển thị' : '○ Đang ẩn'}
                    </button>
                </td>
                <td style="text-align:center;">
                    <div style="display:flex; justify-content:center; gap:6px;">
                        <button type="button" class="btn btn-sm btn-ghost" onclick="openEditBannerModal(${b.id})" style="padding:6px 10px;">
                            <i data-lucide="pencil" style="width:14px; height:14px;"></i> Sửa
                        </button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteBanner(${b.id})" style="padding:6px 10px;">
                            <i data-lucide="trash-2" style="width:14px; height:14px;"></i> Xóa
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    // ── Mobile: banner cards ─────────────────────────────────
    if (mobileList) {
        mobileList.innerHTML = cachedBanners.map((b, idx) => {
            const imgSrc = b.image_url.startsWith('http') ? b.image_url : (b.image_url.startsWith('public/') ? '../' + b.image_url : b.image_url);
            const isActive = parseInt(b.is_active) === 1;
            const pos = b.image_position || '50% 50%';
            const title = b.title || '(Không có tiêu đề)';
            return `
                <div class="banner-mobile-card">
                    <!-- Thumbnail -->
                    <div class="bmc-thumb">
                        <img src="${imgSrc}" alt="${title}" style="object-position:${pos};" onerror="this.src='../public/banners/1.jpg'">
                        <span class="bmc-order">#${b.order_num || idx + 1}</span>
                    </div>
                    <!-- Info + Actions -->
                    <div class="bmc-body">
                        <div class="bmc-title">${title}</div>
                        <div class="bmc-url">${b.image_url}</div>
                        <div class="bmc-footer">
                            <button type="button" class="btn btn-sm ${isActive ? 'btn-success' : 'btn-ghost'}"
                                    style="padding:4px 10px; font-size:11px; border-radius:20px; font-weight:800;"
                                    onclick="toggleBannerStatus(${b.id})">
                                ${isActive ? '● Hiển thị' : '○ Đang ẩn'}
                            </button>
                            <div style="display:flex; gap:6px;">
                                <button class="pmc-btn pmc-btn-edit" onclick="openEditBannerModal(${b.id})" title="Sửa">✏️</button>
                                <button class="pmc-btn pmc-btn-del" onclick="deleteBanner(${b.id})" title="Xóa">🗑️</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }


    if (window.lucide) window.lucide.createIcons();
}

// Modal open/close
export function openCreateBannerModal() {
    editingBannerId = null;
    const titleEl = document.getElementById('modal-banner-title-text');
    if (titleEl) titleEl.innerHTML = '<i data-lucide="plus"></i> Thêm banner mới';

    document.getElementById('banner-form-id').value = '';
    document.getElementById('banner-form-title').value = '';
    document.getElementById('banner-form-url').value = '';
    document.getElementById('banner-form-file').value = '';
    
    // Auto increment order
    const nextOrder = cachedBanners.length ? Math.max(...cachedBanners.map(b => parseInt(b.order_num) || 0)) + 1 : 1;
    document.getElementById('banner-form-order').value = nextOrder;
    
    document.getElementById('banner-form-active').checked = true;
    
    setBannerFormPreview('../public/banners/1.jpg', '50% 50%');

    document.getElementById('modal-banner-manage')?.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function openEditBannerModal(id) {
    const banner = cachedBanners.find(b => parseInt(b.id) === parseInt(id));
    if (!banner) return;

    editingBannerId = id;
    const titleEl = document.getElementById('modal-banner-title-text');
    if (titleEl) titleEl.innerHTML = '<i data-lucide="pencil"></i> Chỉnh sửa banner';

    document.getElementById('banner-form-id').value = banner.id;
    document.getElementById('banner-form-title').value = banner.title || '';
    document.getElementById('banner-form-url').value = banner.image_url || '';
    document.getElementById('banner-form-file').value = '';
    document.getElementById('banner-form-order').value = banner.order_num || 1;
    document.getElementById('banner-form-active').checked = parseInt(banner.is_active) === 1;

    const imgSrc = banner.image_url.startsWith('http') ? banner.image_url : (banner.image_url.startsWith('public/') ? '../' + banner.image_url : banner.image_url);
    setBannerFormPreview(imgSrc, banner.image_position || '50% 50%');

    document.getElementById('modal-banner-manage')?.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

export function closeBannerManageModal() {
    stopBannerReposition();
    document.getElementById('modal-banner-manage')?.classList.remove('active');
}

export function setBannerFormPreview(src, position = '50% 50%') {
    const preview = document.getElementById('banner-preview-img');
    const placeholder = document.getElementById('banner-preview-placeholder');
    const posInput = document.getElementById('banner-form-position');
    const posSlider = document.getElementById('banner-pos-slider');
    const posDisplay = document.getElementById('banner-pos-display');

    if (preview) {
        preview.src = src;
        preview.style.objectPosition = position;
        preview.classList.remove('hidden');
    }
    if (placeholder) placeholder.classList.add('hidden');
    if (posInput) posInput.value = position;

    // Parse Y percent from "50% 50%" or "50% 30%"
    let yPercent = 50;
    const match = position.match(/\s+(\d+(?:\.\d+)?)%/);
    if (match) {
        yPercent = parseFloat(match[1]);
    }
    posY = yPercent;
    if (posSlider) posSlider.value = Math.round(yPercent);
    if (posDisplay) posDisplay.textContent = `Vị trí Y: ${Math.round(yPercent)}% (${position})`;
}

export function handleBannerFormFileChange(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        setBannerFormPreview(e.target.result, document.getElementById('banner-form-position')?.value || '50% 50%');
    };
    reader.readAsDataURL(file);
}

export function handleBannerFormUrlInput() {
    const url = document.getElementById('banner-form-url')?.value.trim();
    if (url) {
        const fullSrc = url.startsWith('http') ? url : (url.startsWith('public/') ? '../' + url : url);
        setBannerFormPreview(fullSrc, document.getElementById('banner-form-position')?.value || '50% 50%');
    }
}

// Repositioning Tool (Slider and Drag)
export function handleSliderPosChange(val) {
    posY = parseFloat(val);
    const posStr = `50% ${Math.round(posY)}%`;
    const preview = document.getElementById('banner-preview-img');
    const posInput = document.getElementById('banner-form-position');
    const posDisplay = document.getElementById('banner-pos-display');

    if (preview) preview.style.objectPosition = posStr;
    if (posInput) posInput.value = posStr;
    if (posDisplay) posDisplay.textContent = `Vị trí Y: ${Math.round(posY)}% (${posStr})`;
}

export function toggleBannerReposition(e) {
    if (e) e.stopPropagation();
    isBannerRepositioning = !isBannerRepositioning;
    const bar = document.getElementById('banner-manage-reposition-bar');
    const preview = document.getElementById('banner-preview-img');
    const box = document.getElementById('banner-manage-preview-box');

    if (isBannerRepositioning) {
        if (bar) bar.classList.remove('hidden');
        if (box) box.classList.add('repositioning');
        if (preview) preview.style.cursor = 'grab';
        showToast('Kéo chuột lên/xuống trên ảnh hoặc dùng thanh trượt để chỉnh góc nhìn', 'info');
    } else {
        if (bar) bar.classList.add('hidden');
        if (box) box.classList.remove('repositioning');
        if (preview) preview.style.cursor = 'pointer';
    }
}

export function stopBannerReposition(e) {
    if (e) e.stopPropagation();
    isBannerRepositioning = false;
    const bar = document.getElementById('banner-manage-reposition-bar');
    const preview = document.getElementById('banner-preview-img');
    const box = document.getElementById('banner-manage-preview-box');

    if (bar) bar.classList.add('hidden');
    if (box) box.classList.remove('repositioning');
    if (preview) preview.style.cursor = 'pointer';
}

export function startBannerRepositionDrag(e) {
    if (!isBannerRepositioning) {
        toggleBannerReposition(e);
    }
    const preview = document.getElementById('banner-preview-img');
    if (!preview) return;

    preview.style.cursor = 'grabbing';
    startY = e.clientY || (e.touches && e.touches[0].clientY);

    const onMove = (moveEvent) => {
        const curY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);
        const deltaY = (curY - startY) * 0.3;

        posY = Math.max(0, Math.min(100, posY + deltaY));
        startY = curY;

        handleSliderPosChange(posY);
    };

    const onEnd = () => {
        if (preview) preview.style.cursor = 'grab';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
}

// Submit Form
export async function submitBannerForm(e) {
    e.preventDefault();

    const id = document.getElementById('banner-form-id')?.value;
    const title = document.getElementById('banner-form-title')?.value.trim();
    const orderNum = parseInt(document.getElementById('banner-form-order')?.value) || 0;
    const imagePosition = document.getElementById('banner-form-position')?.value || '50% 50%';
    const isActive = document.getElementById('banner-form-active')?.checked ? 1 : 0;
    const fileInput = document.getElementById('banner-form-file');
    const urlInput = document.getElementById('banner-form-url')?.value.trim();

    const formData = new FormData();
    if (id) formData.append('id', id);
    formData.append('title', title);
    formData.append('order_num', orderNum);
    formData.append('image_position', imagePosition);
    formData.append('is_active', isActive);

    if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('banner_file', fileInput.files[0]);
    } else if (urlInput) {
        formData.append('image_url', urlInput);
    } else if (!id) {
        showToast('Vui lòng chọn ảnh tải lên hoặc nhập URL ảnh', 'error');
        return;
    }

    const endpoint = id ? '/admin/banners/update' : '/admin/banners';
    const res = await apiRequest(endpoint, 'POST', formData);

    if (res && res.status === 'success') {
        showToast(res.message || 'Đã lưu banner thành công!', 'success');
        closeBannerManageModal();
        loadBanners();
    } else {
        showToast(res?.message || 'Có lỗi xảy ra khi lưu banner', 'error');
    }
}

export async function toggleBannerStatus(id) {
    const res = await apiRequest('/admin/banners/toggle', 'POST', { id });
    if (res && res.status === 'success') {
        showToast('Đã đổi trạng thái banner', 'success');
        loadBanners();
    } else {
        showToast(res?.message || 'Lỗi đổi trạng thái', 'error');
    }
}

export async function deleteBanner(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa banner này? Thao tác không thể hoàn tác.')) return;

    const res = await apiRequest('/admin/banners', 'DELETE', { id });
    if (res && res.status === 'success') {
        showToast('Đã xóa banner thành công!', 'success');
        loadBanners();
    } else {
        showToast(res?.message || 'Lỗi khi xóa banner', 'error');
    }
}
