// ==========================================
// MODULE: SLIDER
// ==========================================

let currentSlide = 0;
let slideInterval;

export function initSlider() {
    const slides = document.getElementById('hero-slides');
    if (!slides) return;
    
    slideInterval = setInterval(() => {
        goToSlide((currentSlide + 1) % 3);
    }, 4000);
}

export function goToSlide(index) {
    const slides = document.getElementById('hero-slides');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides || !dots.length) return;

    currentSlide = index;
    slides.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        goToSlide((currentSlide + 1) % 3);
    }, 4000);
}

export function nextSlide() {
    goToSlide((currentSlide + 1) % 3);
}

export function prevSlide() {
    goToSlide((currentSlide - 1 + 3) % 3);
}
