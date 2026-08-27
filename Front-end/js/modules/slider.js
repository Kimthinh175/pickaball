// ==========================================
// MODULE: SLIDER (DYNAMIC BANNERS)
// ==========================================

import { API_BASE } from '../core/api.js?v=17';

let currentSlide = 0;
let totalSlides = 3;
let slideInterval;

export async function initSlider() {
    const slidesContainer = document.getElementById('hero-slides');
    if (!slidesContainer) return;

    try {
        const res = await fetch(`${API_BASE}/banners`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                renderSlider(data.data);
                return;
            }
        }
    } catch (e) {
        console.warn('Could not load dynamic banners, using fallback', e);
    }

    // Fallback if API fails
    setupSlideInterval();
}

function renderSlider(banners) {
    const slidesContainer = document.getElementById('hero-slides');
    const dotsContainer = document.getElementById('hero-dots');
    if (!slidesContainer) return;

    totalSlides = banners.length;
    currentSlide = 0;

    slidesContainer.innerHTML = banners.map(b => {
        const imgSrc = b.image_url.startsWith('http') ? b.image_url : (b.image_url.startsWith('public/') ? b.image_url : 'public/' + b.image_url);
        const pos = b.image_position || '50% 50%';
        const title = b.title || 'Banner';

        return `
            <div class="hero-slide">
                <img src="${imgSrc}" alt="${title}" style="object-position: ${pos}; width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='public/banners/1.jpg'">
            </div>
        `;
    }).join('');

    if (dotsContainer) {
        dotsContainer.innerHTML = banners.map((_, i) => `
            <button class="hero-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})" aria-label="Slide ${i + 1}"></button>
        `).join('');
    }

    slidesContainer.style.transform = 'translateX(0%)';
    setupSlideInterval();
}

function setupSlideInterval() {
    clearInterval(slideInterval);
    if (totalSlides > 1) {
        slideInterval = setInterval(() => {
            goToSlide((currentSlide + 1) % totalSlides);
        }, 4000);
    }
}

export function goToSlide(index) {
    const slides = document.getElementById('hero-slides');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides || totalSlides === 0) return;

    currentSlide = (index + totalSlides) % totalSlides;
    slides.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });

    setupSlideInterval();
}

export function nextSlide() {
    goToSlide(currentSlide + 1);
}

export function prevSlide() {
    goToSlide(currentSlide - 1);
}
