// ==========================================
// CORE API CLIENT
// ==========================================

import { showToast } from './toast.js?v=28';

export function calculateTournamentStatus(startDateStr, endDateStr) {
    if (!startDateStr) return 'Sắp diễn ra';
    const now = new Date();
    const start = new Date(startDateStr);
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (now < start) return 'Sắp diễn ra';
    if (!endDateStr) return 'Đang diễn ra';
    return 'Đã kết thúc';
}

export const getApiBase = () => {
    const match = window.location.pathname.match(/^(\/.*pickaball)/i);
    return (match ? match[1] : '') + '/api';
};

export const API_BASE = getApiBase();

export async function apiRequest(endpoint, method = 'GET', data = null, onUnauthorized = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('admin_token');
    
    const options = {
        method,
        headers: { 'Accept': 'application/json' }
    };
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && !(data instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    } else if (data instanceof FormData) {
        options.body = data;
    }

    try {
        const res = await fetch(url, options);
        if (res.status === 401) {
            localStorage.removeItem('admin_token');
            if (typeof onUnauthorized === 'function') onUnauthorized();
            return null;
        }
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        showToast('Lỗi kết nối máy chủ', 'error');
        return null;
    }
}
