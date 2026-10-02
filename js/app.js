/**
 * app.js
 * Главный модуль управления SPA (Single Page Application).
 * - Маршрутизация по вкладкам (#playground, #catalog, #transforms, #cheatsheet, #trainer)
 * - Интеграция KaTeX с надежным отказоустойчивым fallback
 * - Синхронизация состояния между вкладками
 */

(function () {
  'use strict';

  // 1. Хелпер рендеринга формул KaTeX с текстовым fallback
  function renderMath(latexString, targetEl) {
    if (!targetEl) return;

    if (window.katex) {
      try {
        window.katex.render(latexString, targetEl, {
          throwOnError: false,
          displayMode: targetEl.classList.contains('math-display')
        });
        return;
      } catch (e) {
        console.warn('KaTeX render error:', e);
      }
    }

    // Fallback: заменяем популярные символы на читаемый Unicode
    let readable = latexString
      .replace(/\\mathbb\{R\}/g, 'ℝ')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\sqrt\[3\]\{([^}]+)\}/g, '∛($1)')
      .replace(/\\sin/g, 'sin')
      .replace(/\\cos/g, 'cos')
      .replace(/\\operatorname\{tg\}/g, 'tg')
      .replace(/\\operatorname\{ctg\}/g, 'ctg')
      .replace(/\\arcsin/g, 'arcsin')
      .replace(/\\arccos/g, 'arccos')
      .replace(/\\operatorname\{arctg\}/g, 'arctg')
      .replace(/\\operatorname\{arcctg\}/g, 'arcctg')
      .replace(/\\log_\{([^}]+)\}/g, 'log_$1')
      .replace(/\\ln/g, 'ln')
      .replace(/\\pi/g, 'π')
      .replace(/\\infty/g, '∞')
      .replace(/\\cup/g, '∪')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\left\|/g, '|')
      .replace(/\\right\|/g, '|')
      .replace(/\\{/g, '{')
      .replace(/\\}/g, '}')
      .replace(/\\\\/g, '; ');

    targetEl.textContent = readable;
  }

  function renderAllMathIn(container) {
    if (!container) return;

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
        return;
      } catch (e) {
        console.warn('renderMathInElement error:', e);
      }
    }

    // Обработка элементов с классом math-display и math-inline
    container.querySelectorAll('.math-display, .math-inline').forEach(el => {
      renderMath(el.textContent.trim(), el);
    });
  }

  window.renderMath = renderMath;
  window.renderAllMathIn = renderAllMathIn;

  // 2. Роутер вкладок SPA
  const AppRouter = {
    activeTab: 'playground',

    init() {
      this.bindTabButtons();
      this.handleHashChange();
      window.addEventListener('hashchange', () => this.handleHashChange());
    },

    bindTabButtons() {
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tabId = e.currentTarget.dataset.tab;
          this.switchTab(tabId);
        });
      });
    },

    handleHashChange() {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['playground', 'catalog', 'transforms', 'cheatsheet', 'trainer'];
      const targetTab = validTabs.includes(hash) ? hash : 'playground';
      this.switchTab(targetTab, null, null, false);
    },

    switchTab(tabId, customFnId = null, customParams = null, updateHash = true) {
      this.activeTab = tabId;

      // 1. Обновляем активную вкладку в навигации
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('nav-tab-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // 2. Переключаем видимость экранов
      document.querySelectorAll('.tab-view').forEach(view => {
        const isCurrent = view.id === `view-${tabId}`;
        view.classList.toggle('tab-view-active', isCurrent);
      });

      // 3. Обновляем URL хеш
      if (updateHash) {
        window.location.hash = tabId;
      }

      // 4. Скроллим наверх
      window.scrollTo({ top: 0, behavior: 'instant' });

      // 5. Вызываем жизненный цикл соответствующей вкладки
      if (tabId === 'playground') {
        if (customFnId && window.Playground) {
          window.Playground.setBaseFunction(customFnId);
          if (customParams) {
            // Применение параметров
            setTimeout(() => {
              if (customParams.a !== undefined) document.getElementById('slider-a').value = customParams.a;
              if (customParams.b !== undefined) document.getElementById('slider-b').value = customParams.b;
              if (customParams.k !== undefined) document.getElementById('slider-k').value = customParams.k;
              if (customParams.m !== undefined) document.getElementById('slider-m').value = customParams.m;
              // Запуск input события
              document.getElementById('slider-a')?.dispatchEvent(new Event('input'));
            }, 50);
          }
        }
      } else if (tabId === 'catalog') {
        // перерисовка каталога при входе
      } else if (tabId === 'trainer') {
        // перерисовка холста тренажера
      }
    }
  };

  window.AppRouter = AppRouter;

  // 3. Запуск при загрузке документа
  document.addEventListener('DOMContentLoaded', () => {
    // Инициализация модулей
    const pgCanvas = document.getElementById('pg-canvas');
    const pgControls = document.getElementById('pg-controls');
    if (pgCanvas && window.Playground) {
      window.Playground.init(pgCanvas, pgControls);
    }

    const catalogContainer = document.getElementById('catalog-content-container');
    if (catalogContainer && window.Catalog) {
      window.Catalog.init(catalogContainer);
    }

    const transformsContainer = document.getElementById('transforms-content-container');
    if (transformsContainer && window.TransformsView) {
      window.TransformsView.init(transformsContainer);
    }

    const cheatsheetContainer = document.getElementById('cheatsheet-content-container');
    if (cheatsheetContainer && window.CheatSheet) {
      window.CheatSheet.init(cheatsheetContainer);
    }

    const trainerContainer = document.getElementById('trainer-content-container');
    if (trainerContainer && window.Trainer) {
      window.Trainer.init(trainerContainer);
    }

    AppRouter.init();
  });

})();
