document.addEventListener('DOMContentLoaded', function() {

    // --- Обновление года в футере ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Анимация при прокрутке (Intersection Observer) ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    // Проверяем, поддерживает ли браузер IntersectionObserver
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                // Когда элемент становится видимым
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible'); // Добавляем класс для запуска CSS анимации
                    observer.unobserve(entry.target); // Отключаем наблюдение после срабатывания анимации
                }
            });
        }, {
            threshold: 0.1 // Анимация сработает, когда 10% элемента видно
        });

        // Начинаем наблюдение за всеми элементами с классом .animate-on-scroll
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        // Если IntersectionObserver не поддерживается, просто делаем все элементы видимыми
        // (анимации не будет, но контент будет показан)
        animatedElements.forEach(el => el.classList.add('is-visible'));
    }

});