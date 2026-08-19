// ==========================================
// PICKABALL ADMIN DASHBOARD CONTROLLER (ES MODULE)
// ==========================================

import { apiRequest, calculateTournamentStatus } from './core/api.js?v=28';
import { showToast } from './core/toast.js?v=28';
import { svgAvatar } from './core/avatar.js?v=28';
import { checkLogin, initAuth } from './core/auth.js?v=28';

import {
    cachedTournaments,
    loadTournaments,
    openTournamentDetail,
    deleteCurrentTournament
} from './modules/tournaments.js?v=28';

import {
    currentTournamentId,
    setCurrentTournamentId,
    refreshTournamentDetail,
    toggleTeamPaymentStatus,
    toggleMatchPaymentStatus
} from './modules/tournament-detail.js?v=28';

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
} from './modules/team-pool.js?v=28';

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
} from './modules/group-builder.js?v=28';

import {
    bracketStages,
    autoGenerateBracketsFromGroups,
    addNewBracketStage,
    removeBracketStage,
    updateBracketSlot,
    addMatchToStage,
    removeMatchFromStage,
    renderBracketBuilders
} from './modules/bracket-builder.js?v=28';

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
} from './modules/tournament-form.js?v=28';

import {
    openEndTournamentModal,
    closeEndTournamentModal,
    addFinishPrizeRow,
    submitFinishTournament
} from './modules/tournament-finish.js?v=28';

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
    closePlayerProfileModal
} from './modules/players.js?v=28';

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

// TAB SWITCHING
window.showTab = function(tabName) {
    if (tabName === 'rankings') {
        if (!document.getElementById('tab-rankings')) {
            window.location.href = 'rankings';
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

    // Close mobile menu if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
    }
    if (window.lucide) window.lucide.createIcons();
};

window.toggleAdminMobileMenu = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('mobile-open');
};

window.toggleSidebarMenu = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
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
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check if hash has tab
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
        window.showTab(hash);
    }

    // Initialize Auth
    initAuth(() => {
        initCurrentPageData();
    });

    // Check if session is already active
    const checkRes = await apiRequest('/admin/auth/check');
    if (checkRes && checkRes.status === 'success') {
        checkLogin(true, () => {
            initCurrentPageData();
        });
    } else {
        checkLogin(false);
    }

    if (window.lucide) window.lucide.createIcons();
});
