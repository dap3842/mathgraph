/**
 * transforms-view.js
 * Визуальный атлас всех видов преобразований графиков («Список преобразований»).
 * Для каждого преобразования:
 * - Интерактивный мини-холст (зум + / - и перетаскивание)
 * - Исходный график пунктиром -> преобразованный яркой линией + стрелка
 * - Формула KaTeX и мнемоническое правило для зачета
 * - Закон изменения координат точки (x0, y0) -> (x', y')
 * - Раскрывающиеся методические аккордеоны
 * - Кнопка переноса пресета в интерактивную Лабораторию
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TransformsView = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  let containerEl = null;
  const miniCanvasesMap = new Map();

  function init(targetContainer) {
    containerEl = targetContainer;
    renderView();
  }

  function renderView() {
    if (!containerEl) return;

    const rules = window.TransformCore.RULES;
    miniCanvasesMap.clear();

    containerEl.innerHTML = `
      <div class="transforms-intro-banner">
        <div class="intro-content">
          <h2>Справочник всех преобразований графиков</h2>
          <p>
            Каждое преобразование показано наглядно: <b>исходный график f(x)</b> изображён серым пунктиром,
            а <b>результат</b> — яркой синей линией со стрелками направления.
            Каждый график можно приближать, отдалять и двигать пальцем или мышкой!
          </p>
        </div>
      </div>

      <!-- Канонический алгоритм сложного преобразования для зачета -->
      <div class="canonical-rule-banner">
        <div class="banner-badge">Правило для зачёта</div>
        <h3>Универсальный порядок сложного преобразования: <code>y = A · f(B(x - C)) + D</code></h3>
        <p class="banner-math math-display">
          (x_0; y_0) \\longrightarrow \\left( \\frac{x_0}{B} + C; \\; A \\cdot y_0 + D \\right)
        </p>
        <div class="canonical-steps-pills">
          <span class="step-pill">1. Сжатие к Oy в B раз</span>
          <span class="step-pill">2. Сдвиг вдоль Ox на C</span>
          <span class="step-pill">3. Растяжение от Ox в A раз</span>
          <span class="step-pill">4. Сдвиг вдоль Oy на D</span>
          <span class="step-pill">5. Модули (если есть)</span>
        </div>
      </div>

      <div class="transforms-cards-grid" id="transforms-cards-grid">
        ${rules.map(rule => `
          <div class="transform-card" data-rule-id="${rule.id}">
            <div class="transform-card-canvas">
              <canvas id="transform-canvas-${rule.id}" class="mini-canvas" width="340" height="220"></canvas>
              <span class="transform-type-tag transform-type-${rule.type}">
                ${rule.type === 'shift' ? 'Сдвиг' : rule.type === 'scale' ? 'Масштаб' : rule.type === 'symmetry' ? 'Симметрия' : 'Модуль'}
              </span>

              <!-- Интерактивные кнопки масштаба прямо на карточке -->
              <div class="card-canvas-controls">
                <button class="btn-canvas-ctrl btn-zoom-in" data-rule-fn="${rule.id}" title="Приблизить">+</button>
                <button class="btn-canvas-ctrl btn-zoom-out" data-rule-fn="${rule.id}" title="Отдалить">−</button>
                <button class="btn-canvas-ctrl btn-zoom-reset" data-rule-fn="${rule.id}" title="Сбросить масштаб">⟲</button>
              </div>
            </div>

            <div class="transform-card-body">
              <div class="transform-header-row">
                <h3 class="transform-title">${rule.name}</h3>
                <div class="transform-latex math-display">${rule.latex}</div>
              </div>

              <div class="mnemonic-box">
                <div class="mnemonic-title">💡 Мнемоническое правило:</div>
                <div class="mnemonic-text">${rule.mnemonic}</div>
              </div>

              <div class="transform-details-text">
                ${rule.description.replace(/\n/g, '<br>')}
              </div>

              <div class="coord-rule-box">
                <span class="coord-rule-label">Пересчёт координат точек:</span>
                <span class="coord-rule-math math-inline">${rule.pointTransform}</span>
              </div>

              <!-- Раскрывающееся пояснение -->
              <details class="transform-accordion">
                <summary>Подробный алгоритм построения</summary>
                <div class="accordion-content">
                  <p><b>Как строить на зачете:</b></p>
                  <ol>
                    <li>Нанесите узловые опорные точки базового графика (вершина, нули, точки x = ±1).</li>
                    <li>Примените формулу преобразования к координатам каждой опорной точки: ${rule.pointTransform}.</li>
                    <li>Постройте асимптоты (если они есть у функции).</li>
                    <li>Плавно соедините полученные точки с сохранением формы исходной кривой.</li>
                  </ol>
                </div>
              </details>

              <div class="transform-card-footer">
                <button class="btn btn-secondary btn-try-transform" data-rule-id="${rule.id}">
                  Попробовать этот вид в лаборатории →
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    if (window.renderAllMathIn) {
      window.renderAllMathIn(containerEl);
    }

    // Инициализация интерактивных мини-холстов
    rules.forEach(rule => {
      initTransformMiniCanvas(rule);
    });

    // Обработка кнопок зума на карточках
    containerEl.querySelectorAll('.btn-canvas-ctrl').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ruleId = btn.dataset.ruleFn;
        const mini = miniCanvasesMap.get(ruleId);
        if (!mini) return;

        if (btn.classList.contains('btn-zoom-in')) {
          mini.setZoom(mini.scale * 1.25);
        } else if (btn.classList.contains('btn-zoom-out')) {
          mini.setZoom(mini.scale * 0.8);
        } else if (btn.classList.contains('btn-zoom-reset')) {
          mini.resetView();
        }
      });
    });

    // Обработка кнопки перехода в лабораторию
    containerEl.querySelectorAll('.btn-try-transform').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ruleId = e.currentTarget.dataset.ruleId;
        const rule = rules.find(r => r.id === ruleId);
        if (rule && window.AppRouter) {
          window.AppRouter.switchTab('playground', rule.example.fnId, rule.example);
        }
      });
    });
  }

  function initTransformMiniCanvas(rule) {
    const canvasEl = document.getElementById(`transform-canvas-${rule.id}`);
    if (!canvasEl) return;

    const baseFn = window.MathCore.getFunctionById(rule.example.fnId || 'parabola');
    if (!baseFn) return;

    // Включаем интерактивность (isInteractive: true)!
    const mini = new window.MathCanvas(canvasEl, {
      isInteractive: true,
      defaultScale: baseFn.isTrig ? 24 : 26,
      originYRatio: baseFn.originYRatio ?? 0.5,
      showGrid: true,
      showAxes: true,
      showLabels: true,
      showAsymptotes: true,
      showKeyPoints: true,
      showCrosshair: true,
      isTrigMode: Boolean(baseFn.isTrig),
      isInvTrigMode: Boolean(baseFn.isInvTrig)
    });

    // 1. Исходный график (призрак)
    mini.addLayer({
      id: 'ghost',
      fn: baseFn.fn,
      params: {},
      style: 'ghost',
      color: 'rgba(100, 116, 139, 0.45)',
      asymptotes: baseFn.asymptotes,
      keyPoints: baseFn.keyPoints
    });

    // 2. Преобразованный график
    const params = {
      a: rule.example.a ?? 0,
      b: rule.example.b ?? 0,
      k: rule.example.k ?? 1,
      m: rule.example.m ?? 1,
      absOuter: Boolean(rule.example.absOuter),
      absInner: Boolean(rule.example.absInner),
      symOx: Boolean(rule.example.symOx),
      symOy: Boolean(rule.example.symOy)
    };

    const transformedPoints = baseFn.keyPoints.map(pt => window.TransformCore.transformKeyPoint(pt, params)).filter(Boolean);
    const transformedAsymptotes = window.TransformCore.transformAsymptotes(baseFn.asymptotes, params);

    mini.addLayer({
      id: 'active',
      fn: (x) => window.TransformCore.evaluateTransformed(x, baseFn.fn, params),
      params: params,
      style: 'active',
      color: '#2563EB',
      asymptotes: transformedAsymptotes,
      keyPoints: transformedPoints
    });

    // 3. Вектор сдвига, если есть
    if (params.a !== 0 || params.b !== 0) {
      const origAnchor = baseFn.keyPoints[0] || { x: 0, y: 0 };
      const newAnchor = window.TransformCore.transformKeyPoint(origAnchor, params) || { x: params.a, y: params.b };
      mini.setDisplacementVector(origAnchor.x, origAnchor.y, newAnchor.x, newAnchor.y, 'сдвиг');
    }

    mini.render();
    miniCanvasesMap.set(rule.id, mini);
  }

  return {
    init,
    renderView
  };
}));
