document.addEventListener('DOMContentLoaded', function() {

    // --- Базовые элементы и переменные ---
    const currentYearSpan = document.getElementById('current-year');
    const langButtons = document.querySelectorAll('.lang-button'); // Кнопки языков
    const backLink = document.querySelector('a.back-link'); // Ссылка "Назад" (используем селектор)

    let currentLanguage = 'ru'; // Язык по умолчанию
    let translations = {}; // Здесь будут храниться загруженные переводы

    // --- Обновление года в футере ---
    function updateYear() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }

    // --- Локализация ---

    // Функция загрузки JSON файла переводов (загружает из папки /locales/ в КОРНЕ сайта)
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json?v=${Date.now()}`); // Абсолютный путь от корня
            if (!response.ok) {
                if (lang !== 'ru') {
                    console.warn(`Translation file not found for ${lang}. Falling back to 'ru'.`);
                    await loadTranslations('ru');
                    return;
                } else {
                    throw new Error(`HTTP error! status: ${response.status}. Could not load default language 'ru'.`);
                }
            }
            translations = await response.json();
            console.log(`Translations loaded for ${lang}.`);
        } catch (error) {
            console.error(`Could not load translations for ${lang}:`, error);
            translations = {};
        }
    }

    // Функция применения переводов к элементам страницы
    function applyTranslations() {
        if (!translations || Object.keys(translations).length === 0) {
            console.error("Translations not available or empty.");
            return;
        }

        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            if (translations[key] !== undefined) {
                if (key === 'footerText') { // Ключи, где может быть HTML
                    element.innerHTML = translations[key];
                } else {
                    element.textContent = translations[key];
                }
            } else {
                console.warn(`Translation key not found: ${key}`);
            }
        });

        document.querySelectorAll('[data-translate-alt]').forEach(element => {
            const key = element.dataset.translateAlt;
            if (translations[key] !== undefined) {
                element.setAttribute('alt', translations[key]);
            } else {
                console.warn(`Translation key (alt) not found: ${key}`);
            }
        });

        if (translations.projectStreamifyTitle) {
            document.title = translations.projectStreamifyTitle;
        } else {
            console.warn(`Translation key not found: projectStreamifyTitle`);
        }

        // Обновление ссылки "Назад к портфолио"
        if (backLink && translations.projectBackLink) {
            const backLinkSpan = backLink.querySelector('span');
            if (backLinkSpan) backLinkSpan.textContent = translations.projectBackLink;
            // Обновляем href ссылки "Назад"
            backLink.href = currentLanguage === 'ru' ? '/' : `/${currentLanguage}/`;
        }
        // Обновление ссылки в подвале
        const footerLink = document.querySelector('.project-footer a');
        if (footerLink && translations.projectFooterLink) {
            footerLink.textContent = translations.projectFooterLink;
            footerLink.href = currentLanguage === 'ru' ? '/' : `/${currentLanguage}/`;
        }


        updateLangSwitcherUI();
    }

    // Обновление активной кнопки языка
    function updateLangSwitcherUI() {
        langButtons.forEach(button => {
            if (button.dataset.lang === currentLanguage) {
                button.disabled = true;
                button.style.fontWeight = 'bold';
            } else {
                button.disabled = false;
                button.style.fontWeight = 'normal';
            }
            const langKey = `lang${button.dataset.lang.toUpperCase()}`;
            if(translations && translations[langKey]){
                button.textContent = translations[langKey];
            }
        });
    }

    // Функция смены языка
    async function setLanguage(lang) {
        if (!['ru', 'en', 'de'].includes(lang)) {
            console.warn(`Unsupported language: ${lang}. Defaulting to 'ru'.`);
            lang = 'ru';
        }
        if (lang === currentLanguage && Object.keys(translations).length > 0) {
            console.log(`Language ${lang} already set.`);
            return;
        }
        console.log(`Setting language to: ${lang}`);
        currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;
        await loadTranslations(lang);
        applyTranslations();
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
        animatedElements.forEach(el => observer.observe(el));
    } else {
        animatedElements.forEach(el => el.classList.add('is-visible'));
    }

    // --- Инициализация Лайтбокса для Галереи ---
    const galleryImages = document.querySelectorAll('.screenshot-gallery .gallery-image');
    if (galleryImages.length > 0 && typeof basicLightbox !== 'undefined') {
        galleryImages.forEach(img => {
            img.addEventListener('click', () => {
                basicLightbox.create(`
                    <img src="${img.src}" style="max-width: 90vw; max-height: 90vh;">
                `).show();
            });
        });
    } else if (galleryImages.length > 0) {
        console.warn("basicLightbox library not found, lightbox will not work.");
    }


    // --- Инициализация при загрузке страницы ---
    updateYear();

    const savedLang = localStorage.getItem('preferredLanguage');
    const browserLang = navigator.language ? navigator.language.split('-')[0].toLowerCase() : 'ru';
    const initialLang = savedLang || (['ru', 'en', 'de'].includes(browserLang) ? browserLang : 'ru');

    setLanguage(initialLang);

    window.setLanguage = setLanguage; // Делаем доступной для onclick

}); // Конец DOMContentLoaded