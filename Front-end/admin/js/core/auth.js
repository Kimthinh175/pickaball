// ==========================================
// CORE AUTHENTICATION & LOGIN
// ==========================================

import { apiRequest } from './api.js?v=28';
import { showToast } from './toast.js?v=28';

export function checkLogin(isLoggedIn, onLoginSuccess = null) {
    const loginSec = document.getElementById('login-section');
    const sidebar = document.getElementById('sidebar');
    const dashSec = document.getElementById('dashboard-section');

    if (isLoggedIn) {
        document.documentElement.classList.add('is-authenticated');
        loginSec?.classList.add('hidden');
        sidebar?.classList.remove('hidden');
        dashSec?.classList.remove('hidden');
        if (typeof onLoginSuccess === 'function') onLoginSuccess();
    } else {
        document.documentElement.classList.remove('is-authenticated');
        loginSec?.classList.remove('hidden');
        sidebar?.classList.add('hidden');
        dashSec?.classList.add('hidden');
    }
}

export function initAuth(onLoginSuccess = null) {
    // LOGIN FORM
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;

        const res = await apiRequest('/admin/auth/login', 'POST', { username: user, password: pass });
        if (res && res.status === 'success') {
            if (res.token) {
                localStorage.setItem('admin_token', res.token);
            }
            showToast('Đăng nhập thành công!', 'success');
            checkLogin(true, onLoginSuccess);
        } else {
            showToast(res?.message || 'Tài khoản hoặc mật khẩu không chính xác', 'error');
        }
    });

    // LOGOUT
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await apiRequest('/admin/auth/logout', 'POST');
        localStorage.removeItem('admin_token');
        checkLogin(false);
    });

    // PASSWORD CHANGE
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
}
