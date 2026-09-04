// ==========================================
// POPUP MANAGEMENT MODULE (ES MODULE)
// ==========================================

import { apiRequest } from '../core/api.js?v=31';
import { showToast } from '../core/toast.js?v=31';

let currentPopupData = null;

export async function loadPopupSettings() {
    const form = document.getElementById('form-popup-settings');
    if (!form) return;

    try {
        const res = await apiRequest('/admin/popup', 'GET');
        if (res && res.status === 'success' && res.data) {
            currentPopupData = res.data;
            populatePopupForm(res.data);
            updatePopupLivePreview();
        }
    } catch (err) {
        console.error("Error loading popup settings:", err);
        showToast("Không thể tải cấu hình popup", "error");
    }
}

export function populatePopupForm(data) {
    const toggleEl = document.getElementById('popup-is-active');
    const titleEl = document.getElementById('popup-title');
    const descEl = document.getElementById('popup-desc');
    const urlEl = document.getElementById('popup-target-url');
    const btnTextEl = document.getElementById('popup-button-text');
    const statusTextEl = document.getElementById('popup-status-text');
    const statusBadgeEl = document.getElementById('popup-status-badge');
    const updatedEl = document.getElementById('popup-last-updated');

    const isActive = parseInt(data.is_active, 10) === 1;

    if (toggleEl) toggleEl.checked = isActive;
    if (titleEl) titleEl.value = data.title || '';
    if (descEl) descEl.value = data.description || '';
    if (urlEl) urlEl.value = data.target_url || '';
    if (btnTextEl) btnTextEl.value = data.button_text || 'Tham gia nhóm ngay';

    // Status UI
    updateStatusBadgeUI(isActive);

    if (updatedEl && data.updated_at) {
        updatedEl.textContent = data.updated_at;
    }
}

export function updateStatusBadgeUI(isActive) {
    const statusTextEl = document.getElementById('popup-status-text');
    const statusBadgeEl = document.getElementById('popup-status-badge');

    if (statusBadgeEl) {
        if (isActive) {
            statusBadgeEl.className = 'badge badge-green';
            statusBadgeEl.innerHTML = '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#16a34a; margin-right:6px;"></span> Đang BẬT (Hiển thị trang chủ)';
        } else {
            statusBadgeEl.className = 'badge badge-gray';
            statusBadgeEl.innerHTML = '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#94a3b8; margin-right:6px;"></span> Đang TẮT (Ẩn trang chủ)';
        }
    }

    if (statusTextEl) {
        statusTextEl.textContent = isActive ? 'Popup đang hoạt động' : 'Popup đang bị vô hiệu hoá';
    }

    // Preview overlay indicator
    const previewOverlay = document.getElementById('preview-inactive-overlay');
    if (previewOverlay) {
        previewOverlay.style.display = isActive ? 'none' : 'flex';
    }
}

export function onPopupToggleChange() {
    const toggleEl = document.getElementById('popup-is-active');
    const isActive = toggleEl ? toggleEl.checked : false;
    updateStatusBadgeUI(isActive);
}

export function previewPopupImage(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Kiểm tra dung lượng (báo nhẹ nếu > 15MB)
        if (file.size > 15 * 1024 * 1024) {
            showToast('File ảnh quá lớn (> 15MB), vui lòng chọn ảnh nhẹ hơn', 'error');
            return;
        }

        const fileNameEl = document.getElementById('popup-file-name');
        if (fileNameEl) {
            fileNameEl.textContent = `Đã chọn: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
            fileNameEl.style.display = 'block';
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('preview-popup-img');
            if (previewImg) {
                previewImg.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

export function updatePopupLivePreview() {
    const title = document.getElementById('popup-title')?.value || 'Cộng Đồng Pickleball PICKO 247';
    const desc = document.getElementById('popup-desc')?.value || 'Gia nhập nhóm Facebook để giao lưu với hàng nghìn VĐV...';
    const btnText = document.getElementById('popup-button-text')?.value || 'Tham gia nhóm ngay';
    const targetUrl = document.getElementById('popup-target-url')?.value || '#';

    const pTitle = document.getElementById('preview-popup-title');
    const pDesc = document.getElementById('preview-popup-desc');
    const pBtn = document.getElementById('preview-popup-btn-text');
    const pLink = document.getElementById('preview-popup-link-display');

    if (pTitle) pTitle.textContent = title;
    if (pDesc) pDesc.textContent = desc;
    if (pBtn) pBtn.textContent = btnText;
    if (pLink) pLink.textContent = targetUrl;

    // Ảnh nếu chưa chọn file mới
    const fileInput = document.getElementById('popup-file-input');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        if (currentPopupData && currentPopupData.image_url) {
            const previewImg = document.getElementById('preview-popup-img');
            if (previewImg) {
                let imgPath = currentPopupData.image_url;
                if (!imgPath.startsWith('http')) {
                    imgPath = '../' + imgPath;
                }
                previewImg.src = imgPath;
            }
        }
    }
}

export async function submitPopupForm(e) {
    if (e) e.preventDefault();

    const saveBtn = document.getElementById('btn-save-popup');
    const origBtnHtml = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px;"></span> Đang lưu cấu hình...';
    }

    try {
        const toggleEl = document.getElementById('popup-is-active');
        const title = document.getElementById('popup-title')?.value.trim() || '';
        const desc = document.getElementById('popup-desc')?.value.trim() || '';
        const targetUrl = document.getElementById('popup-target-url')?.value.trim() || '';
        const buttonText = document.getElementById('popup-button-text')?.value.trim() || '';
        const fileInput = document.getElementById('popup-file-input');

        if (!targetUrl) {
            showToast('Vui lòng nhập đường dẫn chuyển hướng khi nhấn', 'error');
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = origBtnHtml; }
            return;
        }

        const formData = new FormData();
        formData.append('is_active', toggleEl && toggleEl.checked ? 1 : 0);
        formData.append('title', title);
        formData.append('description', desc);
        formData.append('target_url', targetUrl);
        formData.append('button_text', buttonText);

        if (fileInput && fileInput.files && fileInput.files[0]) {
            formData.append('popup_file', fileInput.files[0]);
        }

        const res = await apiRequest('/admin/popup', 'POST', formData);

        if (res && res.status === 'success') {
            showToast('Đã lưu cấu hình Popup thành công!', 'success');
            currentPopupData = res.data;
            populatePopupForm(res.data);
            updatePopupLivePreview();

            // Clear file input
            if (fileInput) fileInput.value = '';
            const fileNameEl = document.getElementById('popup-file-name');
            if (fileNameEl) fileNameEl.style.display = 'none';
        } else {
            showToast(res.message || 'Lỗi khi lưu cấu hình', 'error');
        }
    } catch (err) {
        console.error("Submit popup error:", err);
        showToast('Có lỗi xảy ra trong quá trình lưu', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = origBtnHtml;
        }
    }
}

export function testOpenPopupTarget() {
    const url = document.getElementById('popup-target-url')?.value.trim();
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        showToast('Chưa có đường dẫn để thử nghiệm', 'error');
    }
}

// Gắn handlers lên window cho inline HTML
window.loadPopupSettings = loadPopupSettings;
window.previewPopupImage = previewPopupImage;
window.updatePopupLivePreview = updatePopupLivePreview;
window.submitPopupForm = submitPopupForm;
window.onPopupToggleChange = onPopupToggleChange;
window.testOpenPopupTarget = testOpenPopupTarget;
