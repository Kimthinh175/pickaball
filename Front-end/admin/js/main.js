// ==========================================
// PICKABALL ADMIN DASHBOARD CONTROLLER (ES MODULE)
// ==========================================

import { apiRequest, calculateTournamentStatus } from './core/api.js?v=29';
import { showToast } from './core/toast.js?v=29';
import { svgAvatar } from './core/avatar.js?v=29';
import { checkLogin, initAuth } from './core/auth.js?v=29';

import {
    cachedTournaments,
    loadTournaments,
    openTournamentDetail,
    deleteCurrentTournament
} from './modules/tournaments.js?v=29';

import {
    currentTournamentId,
    setCurrentTournamentId,
    refreshTournamentDetail,
    toggleTeamPaymentStatus,
    toggleMatchPaymentStatus
} from './modules/tournament-detail.js?v=29';

import {
    teamPool,
    activeSlot,
    selectedP1,
    selectedP2,
    setActiveSlot,
    updateSlotUI,
    selectPlayerForSlot,
    renderPlayerPickerList,
    addTeamToPool,
    removeTeamFromPool,
    renderTeamPool
} from './modules/team-pool.js?v=29';

import {
    groupBuilders,
    openAutoDivideModal,
    closeAutoDivideModal,
    updateAutoDivideLabel,
    submitAutoDivide,
    addNewGroupBuilder,
    removeGroupBuilder,
    updateGroupName,
    assignMatchupToGroup,
    removeMatchupFromGroup,
    randomAddTeamsToGroup,
    renderGroupBuilders
} from './modules/group-builder.js?v=29';

import {
    bracketStages,
    autoGenerateBracketsFromGroups,
    addNewBracketStage,
    removeBracketStage,
    updateBracketSlot,
    addMatchToStage,
    removeMatchFromStage,
    renderBracketBuilders
} from './modules/bracket-builder.js?v=29';

import {
    editingTournamentId,
    openCreateTournamentModal,
    closeCreateTournamentModal,
    openEditCurrentTournamentModal,
    addPrizeRow,
    removePrizeRow,
    handleBannerBoxClick,
    handleBannerUploadFile,
    openBannerLibraryModal,
    closeBannerLibraryModal,
    loadBannerLibrary,
    selectBannerFromLibrary,
    applyCustomBannerUrl,
    toggleRepositionBanner,
    startRepositionBanner,
    stopRepositionBanner,
    submitCreateTournament
} from './modules/tournament-form.js?v=29';

import {
    openEndTournamentModal,
    closeEndTournamentModal,
    addFinishPrizeRow,
    submitFinishTournament
} from './modules/tournament-finish.js?v=29';

import {
    cachedPlayers,
    loadPlayers,
    renderPlayerRanking,
    openPlayerModal,
    handlePlayerGenderChange,
    openEditPlayerModal,
    openEditPlayerModalById,
    closePlayerModal,
    previewPlayerAvatar,
    submitPlayerForm,
    deletePlayer,
    openPlayerProfileModal,
    openPlayerProfileModalById,
    closePlayerProfileModal,
    goToPlayerPage
} from './modules/players.js?v=29';

import {
    cachedBanners,
    loadBanners,
    renderBanners,
    openCreateBannerModal,
    openEditBannerModal,
    closeBannerManageModal,
    setBannerFormPreview,
    handleBannerFormFileChange,
    handleBannerFormUrlInput,
    handleSliderPosChange,
    toggleBannerReposition,
    stopBannerReposition,
    startBannerRepositionDrag,
    submitBannerForm,
    toggleBannerStatus,
    deleteBanner
} from './modules/banners.js?v=29';

// ==========================================
// EXPOSE HANDLERS TO WINDOW FOR INLINE HTML
// ==========================================
window.calculateTournamentStatus = calculateTournamentStatus;
window.showToast = showToast;
window.svgAvatar = svgAvatar;

// Tournaments
window.loadTournaments = loadTournaments;
window.openTournamentDetail = openTournamentDetail;
window.deleteCurrentTournament = deleteCurrentTournament;

// Tournament Detail
window.refreshTournamentDetail = refreshTournamentDetail;
window.toggleTeamPaymentStatus = toggleTeamPaymentStatus;
window.toggleMatchPaymentStatus = toggleMatchPaymentStatus;

// Team Pool & 2v2 Slots
window.setActiveSlot = setActiveSlot;
window.selectPlayerForSlot = selectPlayerForSlot;
window.renderPlayerPickerList = renderPlayerPickerList;
window.addTeamToPool = addTeamToPool;
window.removeTeamFromPool = removeTeamFromPool;
window.renderTeamPool = renderTeamPool;

// Group Builder
window.openAutoDivideModal = openAutoDivideModal;
window.closeAutoDivideModal = closeAutoDivideModal;
window.updateAutoDivideLabel = updateAutoDivideLabel;
window.submitAutoDivide = submitAutoDivide;
window.addNewGroupBuilder = addNewGroupBuilder;
window.removeGroupBuilder = removeGroupBuilder;
window.updateGroupName = updateGroupName;
window.assignMatchupToGroup = assignMatchupToGroup;
window.removeMatchupFromGroup = removeMatchupFromGroup;
window.randomAddTeamsToGroup = randomAddTeamsToGroup;
window.renderGroupBuilders = renderGroupBuilders;

// Bracket Builder
window.autoGenerateBracketsFromGroups = autoGenerateBracketsFromGroups;
window.addNewBracketStage = addNewBracketStage;
window.removeBracketStage = removeBracketStage;
window.updateBracketSlot = updateBracketSlot;
window.addMatchToStage = addMatchToStage;
window.removeMatchFromStage = removeMatchFromStage;
window.renderBracketBuilders = renderBracketBuilders;

// Tournament Form & Banner
window.openCreateTournamentModal = openCreateTournamentModal;
window.closeCreateTournamentModal = closeCreateTournamentModal;
window.openEditCurrentTournamentModal = openEditCurrentTournamentModal;
window.addPrizeRow = addPrizeRow;
window.removePrizeRow = removePrizeRow;
window.handleBannerBoxClick = handleBannerBoxClick;
window.handleBannerUploadFile = handleBannerUploadFile;
window.openBannerLibraryModal = openBannerLibraryModal;
window.closeBannerLibraryModal = closeBannerLibraryModal;
window.loadBannerLibrary = loadBannerLibrary;
window.selectBannerFromLibrary = selectBannerFromLibrary;
window.applyCustomBannerUrl = applyCustomBannerUrl;
window.toggleRepositionBanner = toggleRepositionBanner;
window.startRepositionBanner = startRepositionBanner;
window.stopRepositionBanner = stopRepositionBanner;
window.submitCreateTournament = submitCreateTournament;

// Finish Tournament
window.openEndTournamentModal = openEndTournamentModal;
window.closeEndTournamentModal = closeEndTournamentModal;
window.addFinishPrizeRow = addFinishPrizeRow;
window.submitFinishTournament = submitFinishTournament;

// Players
window.loadPlayers = loadPlayers;
window.renderPlayerRanking = renderPlayerRanking;
window.openPlayerModal = openPlayerModal;
window.handlePlayerGenderChange = handlePlayerGenderChange;
window.openEditPlayerModal = openEditPlayerModal;
window.openEditPlayerModalById = openEditPlayerModalById;
window.closePlayerModal = closePlayerModal;
window.previewPlayerAvatar = previewPlayerAvatar;
window.submitPlayerForm = submitPlayerForm;
window.deletePlayer = deletePlayer;
window.openPlayerProfileModal = openPlayerProfileModal;
window.openPlayerProfileModalById = openPlayerProfileModalById;
window.closePlayerProfileModal = closePlayerProfileModal;
window.goToPlayerPage = goToPlayerPage;

// Banners
window.loadBanners = loadBanners;
window.renderBanners = renderBanners;
window.openCreateBannerModal = openCreateBannerModal;
window.openEditBannerModal = openEditBannerModal;
window.closeBannerManageModal = closeBannerManageModal;
window.setBannerFormPreview = setBannerFormPreview;
window.handleBannerFormFileChange = handleBannerFormFileChange;
window.handleBannerFormUrlInput = handleBannerFormUrlInput;
window.handleSliderPosChange = handleSliderPosChange;
window.toggleBannerReposition = toggleBannerReposition;
window.stopBannerReposition = stopBannerReposition;
window.startBannerRepositionDrag = startBannerRepositionDrag;
window.submitBannerForm = submitBannerForm;
window.toggleBannerStatus = toggleBannerStatus;
window.deleteBanner = deleteBanner;

// TAB SWITCHING
window.showTab = function(tabName) {
    if (tabName === 'rankings') {
        if (!document.getElementById('tab-rankings')) {
            window.location.href = 'rankings';
            return;
        }
    }
    if (tabName === 'banners') {
        if (!document.getElementById('tab-banners')) {
            window.location.href = 'banners';
            return;
        }
    }
    if (tabName === 'tournaments') {
        if (!document.getElementById('tab-tournaments')) {
            window.location.href = './';
            return;
        }
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(el => el.classList.remove('active'));

    const tabEl = document.getElementById(`tab-${tabName}`);
    if (tabEl) tabEl.classList.add('active');

    const navEl = document.getElementById(`nav-${tabName}`);
    if (navEl) navEl.classList.add('active');

    if (tabName === 'tournaments') loadTournaments();
    if (tabName === 'rankings' || tabName === 'players') loadPlayers();
    if (tabName === 'banners') loadBanners();

    // Close mobile sidebar menu if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        const btn = document.getElementById('sidebar-menu-toggle');
        if (btn) btn.classList.remove('active');
    }
    if (window.lucide) window.lucide.createIcons();
};

window.toggleAdminMobileMenu = function() {
    // Dùng trên login page — toggle topnav
    const topnav = document.getElementById('topnav');
    const btn = document.getElementById('menu-toggle');
    if (topnav) topnav.classList.toggle('open');
    if (btn) btn.classList.toggle('active');
};

window.toggleSidebarMenu = function() {
    // Dùng trên dashboard — toggle sidebar dropdown
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('sidebar-menu-toggle');
    if (sidebar) sidebar.classList.toggle('open');
    if (btn) btn.classList.toggle('active');
};

// ==========================================
// INITIALIZATION
// ==========================================
function initCurrentPageData() {
    if (document.getElementById('admin-tournaments-list')) {
        loadTournaments();
    }
    if (document.getElementById('admin-rankings-list')) {
        loadPlayers();
    }
    if (document.getElementById('admin-banners-list')) {
        loadBanners();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Instant Optimistic Auth (Zero Flash)
    const token = localStorage.getItem('admin_token');
    if (token) {
        checkLogin(true);
        initCurrentPageData();
    } else {
        checkLogin(false);
    }

    // 2. Check if hash has tab
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
        window.showTab(hash);
    }

    // 3. Initialize Auth Handlers
    initAuth(() => {
        initCurrentPageData();
    });

    // 4. Background Auth Verification
    apiRequest('/admin/auth/check').then((checkRes) => {
        if (checkRes && checkRes.status === 'success') {
            if (!token) {
                checkLogin(true, () => {
                    initCurrentPageData();
                });
            }
        } else {
            if (token) {
                localStorage.removeItem('admin_token');
            }
            checkLogin(false);
        }
    });

    if (window.lucide) window.lucide.createIcons();
});
