// ==========================================
// PICKABALL CLIENT MAIN CONTROLLER (ES MODULE)
// ==========================================

import { calculateTournamentStatus, toast, svgAvatar, avatarOf, fmtDate } from './core/api.js?v=17';
import { fetchRanking, renderMorePlayers, openPlayerProfile, closePlayerProfileModal, goToRankingPage } from './modules/ranking.js?v=17';
import { fetchTournaments } from './modules/tournaments.js?v=17';
import { fetchTournamentDetail } from './modules/tournament-detail.js?v=17';
import { initSlider, goToSlide, nextSlide, prevSlide } from './modules/slider.js?v=17';

// Expose handlers to window for inline HTML onclick attributes
window.calculateTournamentStatus = calculateTournamentStatus;
window.toast = toast;
window.svgAvatar = svgAvatar;
window.avatarOf = avatarOf;
window.fmtDate = fmtDate;

window.renderMorePlayers = renderMorePlayers;
window.openPlayerProfile = openPlayerProfile;
window.closePlayerProfileModal = closePlayerProfileModal;
window.goToRankingPage = goToRankingPage;

window.goToSlide = goToSlide;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;

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

    if (window.lucide) window.lucide.createIcons();
});
