// ==========================================
// PICKABALL CLIENT MAIN CONTROLLER (ES MODULE)
// ==========================================

import { calculateTournamentStatus, toast, svgAvatar, avatarOf, fmtDate } from './core/api.js?v=18';
import { fetchRanking, renderMorePlayers, openPlayerProfile, closePlayerProfileModal, goToRankingPage, openAvatarZoom, closeAvatarZoom } from './modules/ranking.js?v=18';
import { fetchTournaments } from './modules/tournaments.js?v=18';
import { fetchTournamentDetail } from './modules/tournament-detail.js?v=18';
import { initSlider, goToSlide, nextSlide, prevSlide } from './modules/slider.js?v=18';

// Expose handlers to window for inline HTML onclick attributes
window.calculateTournamentStatus = calculateTournamentStatus;
window.toast = toast;
window.svgAvatar = svgAvatar;
window.avatarOf = avatarOf;
window.fmtDate = fmtDate;

window.renderMorePlayers = renderMorePlayers;
window.openPlayerProfile = openPlayerProfile;
window.closePlayerProfileModal = closePlayerProfileModal;
window.openAvatarZoom = openAvatarZoom;
window.closeAvatarZoom = closeAvatarZoom;
window.goToRankingPage = goToRankingPage;

window.goToSlide = goToSlide;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;

// ==========================================
// FACEBOOK GROUP INVITATION POPUP
// ==========================================
const FB_JOINED_KEY = 'picko247_fb_joined';
const FB_GROUP_URL = 'https://www.facebook.com/picko247?mibextid=wwXIfr&rdid=SICBPNokIWV2uIAV&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1KZtciCpUK%2F%3Fmibextid%3DwwXIfr#';

export function initFbGroupPopup() {
    const modal = document.getElementById('modal-fb-group');
    if (!modal) return;

    // Chỉ hiển thị khi check localStorage chưa bấm tham gia
    const hasJoined = localStorage.getItem(FB_JOINED_KEY);
    if (hasJoined === 'true') {
        return;
    }

    // Hiển thị mượt mà sau 800ms
    setTimeout(() => {
        if (localStorage.getItem(FB_JOINED_KEY) !== 'true') {
            modal.classList.add('active');
        }
    }, 800);
}

export function joinFbGroup() {
    // 1. Lưu trạng thái vào localStorage -> Không bao giờ hiện lại nữa
    localStorage.setItem(FB_JOINED_KEY, 'true');

    // 2. Đóng popup
    const modal = document.getElementById('modal-fb-group');
    if (modal) {
        modal.classList.remove('active');
    }

    // 3. Mở link Facebook trong tab mới
    window.open(FB_GROUP_URL, '_blank', 'noopener,noreferrer');
}

export function closeFbModal(e) {
    if (e && e.target && (e.target.classList.contains('fb-modal-container') || e.target.closest('.fb-modal-container')) && !e.target.classList.contains('fb-modal-close') && !e.target.classList.contains('btn-fb-later')) {
        return;
    }
    const modal = document.getElementById('modal-fb-group');
    if (modal) {
        modal.classList.remove('active');
    }
}

window.joinFbGroup = joinFbGroup;
window.closeFbModal = closeFbModal;

// Close on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal-fb-group');
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    }
});

window.toggleMobileMenu = function() {
    const topnav = document.getElementById('topnav');
    const menuToggle = document.getElementById('menu-toggle');
    if (topnav && menuToggle) {
        topnav.classList.toggle('open');
        menuToggle.classList.toggle('open');
    }
};

// ==========================================
// INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Highlight active nav link
    const links = document.querySelectorAll('.topnav a');
    links.forEach(a => {
        const href = a.getAttribute('href');
        if (href && (window.location.pathname.endsWith(href) || (href === './' && (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html'))))) {
            a.classList.add('active');
        }
    });

    initSlider();
    if (document.getElementById('ranking-list')) fetchRanking();
    if (document.getElementById('tournaments-list')) fetchTournaments();
    if (document.getElementById('td-title')) fetchTournamentDetail();

    // Khởi tạo popup mời vào group Facebook (ở trang chủ)
    initFbGroupPopup();

    if (window.lucide) window.lucide.createIcons();
});
