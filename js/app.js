/**
 * app.js
 * Главный модуль управления SPA (Single Page Application).
 * - Маршрутизация по вкладкам (#playground, #catalog, #transforms, #cheatsheet, #trainer)
 * - Интеграция KaTeX с надежным отказоустойчивым fallback на Unicode
 * - Автоматический повторный рендеринг при готовности KaTeX
 * - Синхронизация состояния между вкладками
 */

(function () {
  'use strict';

  // Комплексный fallback на красивый Unicode для случаев, когда KaTeX не загружен
  function formatLatexFallback(latexString) {
    if (!latexString) return '';
    return latexString
      .replace(/\\mathbb\{R\}/g, 'ℝ')
      .replace(/\\mathbb\{N\}/g, 'ℕ')
      .replace(/\\mathbb\{Z\}/g, 'ℤ')
      .replace(/\\sqrt\[3\]\{([^}]+)\}/g, '∛($1)')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\operatorname\{tg\}/g, 'tg')
      .replace(/\\operatorname\{ctg\}/g, 'ctg')
      .replace(/\\operatorname\{arctg\}/g, 'arctg')
      .replace(/\\operatorname\{arcctg\}/g, 'arcctg')
      .replace(/\\arcsin/g, 'arcsin')
      .replace(/\\arccos/g, 'arccos')
      .replace(/\\sin/g, 'sin')
      .replace(/\\cos/g, 'cos')
      .replace(/\\log_\{([^}]+)\}/g, 'log_$1')
      .replace(/\\ln/g, 'ln')
      .replace(/\\pi/g, 'π')
      .replace(/\\infty/g, '∞')
      .replace(/\\cup/g, '∪')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\pm/g, '±')
      .replace(/\\to/g, '→')
      .replace(/\\longrightarrow/g, '⟶')
      .replace(/\\left\|/g, '|')
      .replace(/\\right\|/g, '|')
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\left\[/g, '[')
      .replace(/\\right\]/g, ']')
      .replace(/\\\{/g, '{')
      .replace(/\\\}/g, '}')
      .replace(/\\\\/g, '; ')
      .replace(/\^2\b/g, '²')
      .replace(/\^3\b/g, '³')
      .replace(/\^4\b/g, '⁴')
      .replace(/\^5\b/g, '⁵')
      .replace(/\\;/g, ' ')
      .replace(/\\quad/g, '  ')
      .replace(/\\/g, ''); // убираем оставшиеся обратные слэши
  }

  function renderMath(latexString, targetEl) {
    if (!targetEl) return;
    targetEl.dataset.rawLatex = latexString;

    if (window.katex) {
      try {
        const isDisplay = targetEl.classList.contains('math-display');
        window.katex.render(latexString, targetEl, {
          throwOnError: false,
          displayMode: isDisplay
        });
        return;
      } catch (e) {
        console.warn('KaTeX render error:', e);
      }
    }

    targetEl.textContent = formatLatexFallback(latexString);
  }

  function renderAllMathIn(container) {
    if (!container) return;
    container.querySelectorAll('.math-display, .math-inline').forEach(el => {
      const raw = el.dataset.rawLatex || el.textContent.trim();
      renderMath(raw, el);
    });
  }

  window.renderMath = renderMath;
  window.renderAllMathIn = renderAllMathIn;

  // Автоматический перезапуск рендеринга формул, когда KaTeX готов
  function setupKatexWatcher() {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.katex) {
        clearInterval(interval);
        // Перерисовываем все уже отрендеренные формулы через настоящий KaTeX
        renderAllMathIn(document.body);
      } else if (attempts > 30) {
        clearInterval(interval);
      }
    }, 100);

    window.addEventListener('load', () => {
      if (window.katex) {
        renderAllMathIn(document.body);
      }
    });
  }

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

      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('nav-tab-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      document.querySelectorAll('.tab-view').forEach(view => {
        const isCurrent = view.id === `view-${tabId}`;
        view.classList.toggle('tab-view-active', isCurrent);
      });

      if (updateHash) {
        window.location.hash = tabId;
      }

      window.scrollTo({ top: 0, behavior: 'instant' });

      if (tabId === 'playground') {
        if (customFnId && window.Playground) {
          window.Playground.setBaseFunction(customFnId);
          if (customParams) {
            setTimeout(() => {
              if (customParams.a !== undefined) document.getElementById('slider-a').value = customParams.a;
              if (customParams.b !== undefined) document.getElementById('slider-b').value = customParams.b;
              if (customParams.k !== undefined) document.getElementById('slider-k').value = customParams.k;
              if (customParams.m !== undefined) document.getElementById('slider-m').value = customParams.m;
              document.getElementById('slider-a')?.dispatchEvent(new Event('input'));
            }, 50);
          }
        }
      }

      // После переключения вкладки удостоверяемся, что формулы отрисованы
      setTimeout(() => {
        const activeView = document.getElementById(`view-${tabId}`);
        if (activeView) renderAllMathIn(activeView);
      }, 20);
    }
  };

  window.AppRouter = AppRouter;

  // 3. Запуск при загрузке документа
  document.addEventListener('DOMContentLoaded', () => {
    setupKatexWatcher();

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
