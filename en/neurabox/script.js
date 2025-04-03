// Код для /en/neurabox/script.js

document.addEventListener('DOMContentLoaded', function() {

    // --- Обновление года в футере ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Анимация при прокрутке (Intersection Observer) ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        animatedElements.forEach(el => el.classList.add('is-visible'));
    }

    const galleryImages = document.querySelectorAll('.screenshot-gallery .gallery-image');

    // Проверяем, есть ли картинки и загрузилась ли библиотека basicLightbox
    if (galleryImages.length > 0 && typeof basicLightbox !== 'undefined') {
        galleryImages.forEach(img => {
            // Убираем добавление cursor: pointer из JS, так как добавили в CSS
            // img.style.cursor = 'pointer';
            img.addEventListener('click', () => {
                // Создаем и показываем лайтбокс
                basicLightbox.create(`
                    <img src="${img.src}" style="max-width: 90vw; max-height: 90vh;">
                `).show();
            });
        });
    }

});