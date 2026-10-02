/**
 * catalog.js
 * Каталог базовых графиков функций для зачета («Список графиков»).
 * Отображает карточки со всеми функциями, их свойствами, формулами KaTeX
 * и автономными мини-холстами на светлой миллиметровке.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Catalog = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  let containerEl = null;
  let activeCategory = 'all';
  let searchQuery = '';
  const miniCanvases = [];

  function init(targetContainer) {
    containerEl = targetContainer;
    renderCatalog();
  }

  function renderCatalog() {
    if (!containerEl) return;

    containerEl.innerHTML = `
      <div class="catalog-header-bar">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" id="catalog-search" placeholder="Поиск графика (парабола, синус, корень, логарифм...)" value="${searchQuery}">
          ${searchQuery ? '<button id="catalog-clear-search" class="btn-clear-search">&times;</button>' : ''}
        </div>

        <div class="category-pills" id="catalog-category-pills">
          ${window.MathCore.CATEGORIES.map(cat => `
            <button class="pill-btn ${cat.id === activeCategory ? 'pill-btn-active' : ''}" data-cat="${cat.id}">
              ${cat.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="catalog-grid" id="catalog-grid">
        <!-- Карточки функций -->
      </div>
    `;

    bindHeaderEvents();
    renderCards();
  }

  function bindHeaderEvents() {
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderCards();
      });
    }

    const clearBtn = document.getElementById('catalog-clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchQuery = '';
        renderCatalog();
      });
    }

    const pillsContainer = document.getElementById('catalog-category-pills');
    if (pillsContainer) {
      pillsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.pill-btn');
        if (!btn) return;

        activeCategory = btn.dataset.cat;
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('pill-btn-active'));
        btn.classList.add('pill-btn-active');
        renderCards();
      });
    }
  }

  function renderCards() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    // Очищаем старые мини-холсты
    miniCanvases.length = 0;

    let list = window.MathCore.getFunctionsByCategory(activeCategory);

    if (searchQuery) {
      list = list.filter(f =>
        f.name.toLowerCase().includes(searchQuery) ||
        f.unicode.toLowerCase().includes(searchQuery) ||
        f.description.toLowerCase().includes(searchQuery) ||
        f.categoryName.toLowerCase().includes(searchQuery)
      );
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>По запросу «${searchQuery}» графики не найдены</p>
          <button class="btn btn-secondary" id="btn-reset-catalog-search">Показать все графики</button>
        </div>
      `;
      document.getElementById('btn-reset-catalog-search')?.addEventListener('click', () => {
        searchQuery = '';
        activeCategory = 'all';
        renderCatalog();
      });
      return;
    }

    grid.innerHTML = list.map(fn => `
      <div class="function-card" data-fn-id="${fn.id}">
        <div class="card-canvas-wrapper">
          <canvas id="mini-canvas-${fn.id}" class="mini-canvas" width="340" height="220"></canvas>
          <span class="card-category-tag">${fn.categoryName}</span>
        </div>

        <div class="card-content">
          <div class="card-header-row">
            <h3 class="card-title">${fn.name}</h3>
            <div class="card-latex math-display" id="latex-${fn.id}">${fn.latex}</div>
          </div>

          <p class="card-desc">${fn.description}</p>

          <div class="card-properties-table">
            <div class="prop-item">
              <span class="prop-label">Область D(f):</span>
              <span class="prop-val math-inline">${fn.domain}</span>
            </div>
            <div class="prop-item">
              <span class="prop-label">Область E(f):</span>
              <span class="prop-val math-inline">${fn.range}</span>
            </div>
            <div class="prop-item">
              <span class="prop-label">Чётность:</span>
              <span class="prop-val">${fn.parityText}</span>
            </div>
            ${fn.period ? `
              <div class="prop-item">
                <span class="prop-label">Период:</span>
                <span class="prop-val math-inline">${fn.period}</span>
              </div>
            ` : ''}
          </div>

          <!-- Опорные точки и асимптоты -->
          <div class="card-anchors-section">
            <div class="anchor-points-title">Характерные точки:</div>
            <div class="anchor-pills">
              ${fn.keyPoints.map(pt => `
                <span class="anchor-pill">${pt.label}</span>
              `).join('')}
            </div>
            ${fn.asymptotes && fn.asymptotes.length ? `
              <div class="asymptotes-pills">
                <span class="asymp-title">Асимптоты:</span>
                ${fn.asymptotes.map(asymp => `
                  <span class="asymp-pill">${asymp.label}</span>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="card-footer">
            <button class="btn btn-primary btn-open-lab" data-open-fn="${fn.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Исследовать в лаборатории
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Рендеринг формул KaTeX
    if (window.renderAllMathIn) {
      window.renderAllMathIn(grid);
    }

    // Инициализация мини-холстов
    list.forEach(fn => {
      initMiniCanvas(fn);
    });

    // Обработка клика «Исследовать в лаборатории»
    grid.querySelectorAll('.btn-open-lab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fnId = e.currentTarget.dataset.openFn;
        if (window.AppRouter) {
          window.AppRouter.switchTab('playground', fnId);
        }
      });
    });
  }

  function initMiniCanvas(fn) {
    const canvasEl = document.getElementById(`mini-canvas-${fn.id}`);
    if (!canvasEl) return;

    const mini = new window.MathCanvas(canvasEl, {
      isInteractive: false,
      defaultScale: fn.isTrig ? 24 : 28,
      showGrid: true,
      showAxes: true,
      showLabels: true,
      showAsymptotes: true,
      showKeyPoints: true,
      showCrosshair: false,
      isTrigMode: Boolean(fn.isTrig)
    });

    mini.addLayer({
      id: fn.id,
      fn: fn.fn,
      params: {},
      style: 'active',
      color: '#2563EB',
      asymptotes: fn.asymptotes,
      keyPoints: fn.keyPoints
    });

    mini.render();
    miniCanvases.push(mini);
  }

  return {
    init,
    renderCatalog
  };
}));
