document.addEventListener('DOMContentLoaded', function() {

    // --- Базовые элементы и переменные ---
    const currentYearSpan = document.getElementById('current-year');
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const langButtons = document.querySelectorAll('.lang-button'); // Кнопки языков

    let currentLanguage = 'ru'; // Язык по умолчанию
    let translations = {}; // Здесь будут храниться загруженные переводы

    // Элементы для печатающегося текста
    const typedTextSpan = document.getElementById('typed-text');
    const cursorSpan = document.querySelector('.typed-cursor');
    let textArray = []; // Теперь массив будет загружаться из JSON
    let typingBaseText = ""; // Базовая часть фразы
    const typingDelay = 100;
    const erasingDelay = 50;
    const newTextDelay = 2000;
    let textArrayIndex = 0;
    let charIndex = 0;
    let typeTimeout, eraseTimeout; // Для остановки анимации при смене языка

    // --- Обновление года в футере ---
    function updateYear() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }

    // --- Мобильное меню ---
    function setupMobileMenu() {
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('ph-list');
                    icon.classList.toggle('ph-x');
                }
            });

            mainNav.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', () => {
                    // Плавно скроллим к секции
                    const targetId = link.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if(targetElement) {
                        // Учитываем высоту шапки при скролле
                        const headerOffset = document.querySelector('.site-header')?.offsetHeight || 0;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 10; // -10px для небольшого отступа

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                        });
                    }

                    // Закрываем меню
                    if (mainNav.classList.contains('active')) {
                        mainNav.classList.remove('active');
                        const icon = menuToggle.querySelector('i');
                        if (icon) {
                            icon.classList.remove('ph-x');
                            icon.classList.add('ph-list');
                        }
                    }
                });
            });
        }
    }

    // --- Локализация ---

    // Функция загрузки JSON файла переводов
    async function loadTranslations(lang) {
        try {
            // Добавляем случайный параметр к URL, чтобы обойти кэш при разработке
            // Для продакшена можно убрать "?v=..." или использовать версионирование
            const response = await fetch(`locales/${lang}.json?v=${Date.now()}`);
            if (!response.ok) {
                // Если файл не найден, пытаемся загрузить русский
                if (lang !== 'ru') {
                    console.warn(`Translation file not found for ${lang}. Falling back to 'ru'.`);
                    await loadTranslations('ru');
                    return; // Выходим, так как русский уже загружен (или будет ошибка)
                } else {
                    throw new Error(`HTTP error! status: ${response.status}. Could not load default language 'ru'.`);
                }
            }
            translations = await response.json();
            console.log(`Translations loaded for ${lang}.`);
        } catch (error) {
            console.error(`Could not load translations for ${lang}:`, error);
            translations = {}; // Очищаем переводы в случае ошибки
        }
    }

    // Функция применения переводов к элементам страницы
    function applyTranslations() {
        if (!translations || Object.keys(translations).length === 0) {
            console.error("Translations not available or empty.");
            return; // Нечего применять
        }

        // Перевод обычных текстовых элементов
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            if (translations[key] !== undefined) {
                // ВАЖНО: Используем innerHTML ТОЛЬКО для ключей, где ТОЧНО нужен HTML (ссылки, иконки)
                if (key === 'footerText' || key === 'aboutP3') { // Ключи, где может быть HTML
                    element.innerHTML = translations[key];
                } else {
                    element.textContent = translations[key]; // Безопаснее для простого текста
                }
            } else {
                console.warn(`Translation key not found: ${key}`);
            }
        });

        // Перевод атрибутов aria-label
        document.querySelectorAll('[data-translate-aria]').forEach(element => {
            const key = element.dataset.translateAria;
            if (translations[key] !== undefined) {
                element.setAttribute('aria-label', translations[key]);
            } else {
                console.warn(`Translation key (aria) not found: ${key}`);
            }
        });

        // Перевод базовой части подзаголовка (перед печатающимся текстом)
        document.querySelectorAll('[data-translate-base]').forEach(element => {
            const key = element.dataset.translateBase;
            if (translations[key] !== undefined) {
                // Находим дочерний span#typed-text и cursor и сохраняем их
                const typedSpan = element.querySelector('#typed-text');
                const cursorSpanElem = element.querySelector('.typed-cursor');
                // Устанавливаем базовый текст, сохраняя дочерние элементы
                element.textContent = translations[key]; // Устанавливаем базовый текст
                if (typedSpan) element.appendChild(typedSpan); // Возвращаем span для печати
                if (cursorSpanElem) element.appendChild(cursorSpanElem); // Возвращаем курсор
            } else {
                console.warn(`Translation key (base) not found: ${key}`);
            }
        });

        // Перевод Title страницы
        if (translations.pageTitle) {
            document.title = translations.pageTitle;
        } else {
            console.warn(`Translation key not found: pageTitle`);
        }

        // Обновление базового текста и массива для печатающегося эффекта
        if (typedTextSpan && cursorSpan) {
            typingBaseText = translations.heroSubtitleBase || "";
            textArray = [
                translations.heroTyped1 || "",
                translations.heroTyped2 || "",
                translations.heroTyped3 || "",
                translations.heroTyped4 || "",
                translations.heroTyped5 || ""
            ].filter(Boolean); // Убираем пустые строки

            // Перезапуск анимации печати
            resetAndStartTyping();
        } else {
            console.warn("Typing elements not found for translation update.");
        }

        // Обновление UI переключателя языков
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
            // Переводим текст кнопок (RU, EN, DE)
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
        document.documentElement.lang = lang; // Меняем атрибут lang у <html>
        await loadTranslations(lang);
        applyTranslations();
    }

    // --- Печатающийся текст (модифицированный) ---
    let typeInterval, eraseInterval; // Используем интервалы для более надежной очистки

    function type() {
        clearTimeout(typeTimeout);
        clearInterval(typeInterval); // Очищаем интервал печати
        if (!textArray || textArray.length === 0 || !typedTextSpan) return;

        let currentPhrase = textArray[textArrayIndex];
        if (charIndex < currentPhrase.length) {
            if (cursorSpan && !cursorSpan.classList.contains('typing')) cursorSpan.classList.add('typing');
            typedTextSpan.textContent += currentPhrase.charAt(charIndex);
            charIndex++;
            typeInterval = setTimeout(type, typingDelay); // Рекурсивный вызов
        } else {
            if (cursorSpan) cursorSpan.classList.remove('typing');
            eraseInterval = setTimeout(erase, newTextDelay); // Запускаем стирание
        }
    }

    function erase() {
        clearTimeout(eraseTimeout);
        clearInterval(eraseInterval); // Очищаем интервал стирания
        if (!textArray || textArray.length === 0 || !typedTextSpan) return;

        if (charIndex > 0) {
            if (cursorSpan && !cursorSpan.classList.contains('typing')) cursorSpan.classList.add('typing');
            let currentPhrase = textArray[textArrayIndex];
            typedTextSpan.textContent = currentPhrase.substring(0, charIndex - 1); // Стираем последний символ
            charIndex--;
            eraseInterval = setTimeout(erase, erasingDelay); // Рекурсивный вызов
        } else {
            if (cursorSpan) cursorSpan.classList.remove('typing');
            textArrayIndex++;
            if (textArrayIndex >= textArray.length) textArrayIndex = 0;
            // Новая фраза начнется в следующем вызове type
            typeInterval = setTimeout(type, typingDelay + 1100);
        }
    }

    // Функция для сброса и перезапуска анимации печати
    function resetAndStartTyping() {
        clearTimeout(typeTimeout);
        clearTimeout(eraseTimeout);
        clearInterval(typeInterval);
        clearInterval(eraseInterval);
        textArrayIndex = 0;
        charIndex = 0;
        if (typedTextSpan) {
            typedTextSpan.textContent = ""; // Начинаем с пустого для печати
        }
        if (typedTextSpan && cursorSpan && textArray.length > 0) {
            typeInterval = setTimeout(type, newTextDelay / 2);
        }
    }


    // --- Анимация при прокрутке (без изменений) ---
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

    // --- Инициализация при загрузке страницы ---
    updateYear();
    setupMobileMenu();

    // Определяем начальный язык
    const savedLang = localStorage.getItem('preferredLanguage');
    // Определяем язык браузера (берем только первые две буквы, например, 'ru' из 'ru-RU')
    const browserLang = navigator.language ? navigator.language.split('-')[0].toLowerCase() : 'ru';
    // Выбираем язык: сохраненный ИЛИ язык браузера (если он поддерживается) ИЛИ русский по умолчанию
    const initialLang = savedLang || (['ru', 'en', 'de'].includes(browserLang) ? browserLang : 'ru');

    // Устанавливаем язык при первой загрузке
    setLanguage(initialLang);

    // Делаем функцию setLanguage глобальной, чтобы ее можно было вызвать из onclick кнопок
    window.setLanguage = setLanguage;

}); // Конец DOMContentLoaded