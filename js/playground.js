/**
 * playground.js
 * Интерактивная лаборатория графиков и их преобразований.
 * Обеспечивает:
 * - Выбор базовой функции из списка
 * - Управление параметрами: a (сдвиг Ox), b (сдвиг Oy), k (растяжение Oy), m (сжатие Ox)
 * - Модификаторы: -f(x), f(-x), |f(x)|, f(|x|)
 * - Отображение начального графика (призрак) и итогового
 * - Стрелка вектора смещения
 * - Шаговый разбор преобразований
 * - Отображение углов в долях π для тригонометрии
 * - Авто-позиционирование по высоте под форму графика (корыто, парабола и т.д.)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Playground = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  let canvasInstance = null;
  let currentBaseFn = null;

  let state = {
    fnId: 'parabola',
    a: 0,
    b: 0,
    k: 1,
    m: 1,
    symOx: false,
    symOy: false,
    absOuter: false,
    absInner: false,
    showGhost: true,
    showVector: true,
    showAsymptotes: true,
    showKeyPoints: true
  };

  function init(canvasElement, controlsContainer) {
    canvasInstance = new window.MathCanvas(canvasElement, {
      isInteractive: true,
      defaultScale: 40,
      showGrid: true,
      showAxes: true,
      showLabels: true,
      showAsymptotes: true,
      showKeyPoints: true,
      showCrosshair: true
    });

    // Инспектор координат с поддержкой долей π
    canvasInstance.onInspectorMove = (mathX, mathY) => {
      const coordDisplay = document.getElementById('inspector-display');
      if (!coordDisplay) return;

      if (mathX === null) {
        coordDisplay.innerHTML = 'Наведите курсор или проведите пальцем по графику для инспекции координат (x, y)';
        return;
      }

      const isTrig = currentBaseFn && Boolean(currentBaseFn.isTrig);
      const isInvTrig = currentBaseFn && Boolean(currentBaseFn.isInvTrig);
      const formatPi = window.MathCanvas.formatPiValue;

      const xStr = isTrig ? formatPi(mathX) : formatNum(mathX);

      const curY = currentBaseFn ? window.TransformCore.evaluateTransformed(mathX, currentBaseFn.fn, state) : NaN;
      const origY = currentBaseFn ? currentBaseFn.fn(mathX) : NaN;

      const curYStr = isInvTrig && !isNaN(curY) ? formatPi(curY) : formatNum(curY);
      const origYStr = isInvTrig && !isNaN(origY) ? formatPi(origY) : formatNum(origY);

      let html = `<span class="inspector-badge">x = <b>${xStr}</b></span> `;
      if (!isNaN(curY) && isFinite(curY)) {
        html += `<span class="inspector-badge active-badge">g(x) = <b>${curYStr}</b></span> `;
      }
      if (state.showGhost && !isNaN(origY) && isFinite(origY)) {
        html += `<span class="inspector-badge ghost-badge">f(x)₀ = <b>${origYStr}</b></span>`;
      }
      coordDisplay.innerHTML = html;
    };

    renderControls(controlsContainer);
    setBaseFunction(state.fnId);
  }

  function formatNum(n) {
    if (Math.abs(n) < 1e-4) return '0';
    return Number(n.toFixed(2)).toString().replace('.', ',');
  }

  function formatParamValue(param, val) {
    if (param === 'a' && currentBaseFn && currentBaseFn.isTrig && window.MathCanvas?.formatPiValue) {
      return window.MathCanvas.formatPiValue(val);
    }
    if (param === 'b' && currentBaseFn && currentBaseFn.isInvTrig && window.MathCanvas?.formatPiValue) {
      return window.MathCanvas.formatPiValue(val);
    }
    return Number(val.toFixed(2)).toString().replace('.', ',');
  }

  function setBaseFunction(fnId) {
    const fnInfo = window.MathCore.getFunctionById(fnId);
    if (!fnInfo) return;

    currentBaseFn = fnInfo;
    state.fnId = fnId;

    // Автонастройка оптимальной вертикальной оси и масштаба
    const yRatio = fnInfo.originYRatio ?? 0.5;
    const targetScale = fnInfo.defaultScale ?? 40;
    canvasInstance.setOriginYRatio(yRatio, targetScale);
    canvasInstance.setTrigMode(Boolean(fnInfo.isTrig), Boolean(fnInfo.isInvTrig));

    const selectEl = document.getElementById('pg-func-select');
    if (selectEl && selectEl.value !== fnId) {
      selectEl.value = fnId;
    }

    const chipsA = document.getElementById('trig-chips-a');
    if (chipsA) chipsA.style.display = fnInfo.isTrig ? 'flex' : 'none';
    const chipsB = document.getElementById('trig-chips-b');
    if (chipsB) chipsB.style.display = fnInfo.isInvTrig ? 'flex' : 'none';

    ['a', 'b', 'k', 'm'].forEach(p => {
      const valDisplay = document.getElementById(`val-${p}`);
      if (valDisplay) valDisplay.textContent = formatParamValue(p, state[p]);
    });

    updateView();
  }

  function updateView() {
    if (!canvasInstance || !currentBaseFn) return;

    canvasInstance.clearLayers();

    // 1. Исходный график (призрак)
    if (state.showGhost) {
      canvasInstance.addLayer({
        id: 'ghost',
        fn: (x) => currentBaseFn.fn(x),
        params: {},
        style: 'ghost',
        color: 'rgba(100, 116, 139, 0.45)',
        asymptotes: state.showAsymptotes ? currentBaseFn.asymptotes : [],
        keyPoints: state.showKeyPoints ? currentBaseFn.keyPoints : []
      });
    }

    // 2. Преобразованные опорные точки и асимптоты
    const transformedPoints = state.showKeyPoints
      ? currentBaseFn.keyPoints.map(pt => window.TransformCore.transformKeyPoint(pt, state)).filter(Boolean)
      : [];

    const transformedAsymptotes = state.showAsymptotes
      ? window.TransformCore.transformAsymptotes(currentBaseFn.asymptotes, state)
      : [];

    // 3. Активный преобразованный график
    canvasInstance.addLayer({
      id: 'active',
      fn: (x) => window.TransformCore.evaluateTransformed(x, currentBaseFn.fn, state),
      params: state,
      style: 'active',
      color: '#2563EB',
      asymptotes: transformedAsymptotes,
      keyPoints: transformedPoints
    });

    // 4. Вектор сдвига со стрелкой
    if (state.showVector && (state.a !== 0 || state.b !== 0)) {
      const origAnchor = currentBaseFn.keyPoints[0] || { x: 0, y: 0 };
      const newAnchor = window.TransformCore.transformKeyPoint(origAnchor, state) || { x: state.a, y: state.b };
      canvasInstance.setDisplacementVector(
        origAnchor.x, origAnchor.y,
        newAnchor.x, newAnchor.y,
        `v = (${formatNum(state.a)}; ${formatNum(state.b)})`
      );
    } else {
      canvasInstance.displacementVector = null;
    }

    canvasInstance.render();
    updateFormulaCard();
  }

  function updateFormulaCard() {
    const formulaEl = document.getElementById('pg-formula-display');
    const stepsEl = document.getElementById('pg-steps-list');
    const baseInfoEl = document.getElementById('pg-base-info');

    if (!formulaEl || !currentBaseFn) return;

    const latexStr = window.TransformCore.buildFormulaString(currentBaseFn, state);
    if (window.renderMath) {
      window.renderMath(latexStr, formulaEl);
    } else {
      formulaEl.textContent = latexStr;
    }

    if (baseInfoEl) {
      baseInfoEl.innerHTML = `
        <div class="base-meta-row">
          <span>Базовая: <b>${currentBaseFn.name}</b></span>
          <span>D(f): <span class="math-inline">${currentBaseFn.domain}</span></span>
          <span>E(f): <span class="math-inline">${currentBaseFn.range}</span></span>
        </div>
      `;
      if (window.renderAllMathIn) window.renderAllMathIn(baseInfoEl);
    }

    if (stepsEl) {
      const steps = window.TransformCore.getActiveStepsList(state);
      stepsEl.innerHTML = steps.map((s, idx) => `
        <div class="step-item ${idx === steps.length - 1 ? 'step-item-active' : ''}">
          <div class="step-num">${s.step}</div>
          <div class="step-content">
            <div class="step-title">${s.title}</div>
            <div class="step-desc">${s.desc}</div>
          </div>
        </div>
      `).join('');
    }
  }

  function renderControls(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="pg-controls-wrapper">
        <!-- Выбор функции -->
        <div class="control-section">
          <label class="control-label" for="pg-func-select">
            <svg class="icon" viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" d="M4 19l4-14 4 14 4-14 4 14"/></svg>
            Выберите базовую функцию:
          </label>
          <div class="select-styled">
            <select id="pg-func-select">
              ${window.MathCore.CATEGORIES.filter(c => c.id !== 'all').map(cat => `
                <optgroup label="${cat.name}">
                  ${window.MathCore.getFunctionsByCategory(cat.id).map(f => `
                    <option value="${f.id}" ${f.id === state.fnId ? 'selected' : ''}>${f.name} (${f.unicode})</option>
                  `).join('')}
                </optgroup>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Пресеты быстрых преобразований -->
        <div class="control-section presets-section">
          <span class="section-subtitle">Быстрые примеры к зачету:</span>
          <div class="presets-grid">
            <button class="btn btn-preset" data-preset="reset">Исходный f(x)</button>
            <button class="btn btn-preset" data-preset="shift_right">Сдвиг вправо (+2)</button>
            <button class="btn btn-preset" data-preset="shift_up">Сдвиг вверх (+3)</button>
            <button class="btn btn-preset" data-preset="scale_2">Растяжение ×2</button>
            <button class="btn btn-preset" data-preset="flip_ox">Отражение -f(x)</button>
            <button class="btn btn-preset" data-preset="mod_outer">Модуль |f(x)|</button>
            <button class="btn btn-preset" data-preset="mod_inner">Модуль f(|x|)</button>
            <button class="btn btn-preset" data-preset="canonical">Сдвиг + модуль</button>
          </div>
        </div>

        <!-- Слайдеры коэффициентов -->
        <div class="control-section sliders-section">
          <span class="section-subtitle">Параметры преобразований: y = k · f(m(x - a)) + b</span>

          <!-- Сдвиг Ox (a) -->
          <div class="slider-control-card">
            <div class="slider-header">
              <span class="slider-title">Сдвиг вдоль Ox (параметр a)</span>
              <span class="slider-val" id="val-a">${state.a}</span>
            </div>
            <div class="slider-row">
              <button class="btn-step" data-stepper="a" data-dir="-1" title="Уменьшить">-</button>
              <input type="range" id="slider-a" min="-5" max="5" step="0.5" value="${state.a}" class="custom-slider">
              <button class="btn-step" data-stepper="a" data-dir="1" title="Увеличить">+</button>
            </div>
            <div class="slider-hint">a > 0: сдвиг вправо; a < 0: сдвиг влево</div>
            <div class="trig-step-chips" id="trig-chips-a" style="${currentBaseFn && currentBaseFn.isTrig ? 'display:flex;' : 'display:none;'}">
              <span class="chip-label">Быстрый сдвиг по π:</span>
              <button type="button" class="btn-chip" data-trig-a="-3.14159265">-π</button>
              <button type="button" class="btn-chip" data-trig-a="-1.5707963">-π/2</button>
              <button type="button" class="btn-chip" data-trig-a="-0.785398">-π/4</button>
              <button type="button" class="btn-chip" data-trig-a="0">0</button>
              <button type="button" class="btn-chip" data-trig-a="0.785398">+π/4</button>
              <button type="button" class="btn-chip" data-trig-a="1.5707963">+π/2</button>
              <button type="button" class="btn-chip" data-trig-a="3.14159265">+π</button>
            </div>
          </div>

          <!-- Сдвиг Oy (b) -->
          <div class="slider-control-card">
            <div class="slider-header">
              <span class="slider-title">Сдвиг вдоль Oy (параметр b)</span>
              <span class="slider-val" id="val-b">${state.b}</span>
            </div>
            <div class="slider-row">
              <button class="btn-step" data-stepper="b" data-dir="-1" title="Уменьшить">-</button>
              <input type="range" id="slider-b" min="-5" max="5" step="0.5" value="${state.b}" class="custom-slider">
              <button class="btn-step" data-stepper="b" data-dir="1" title="Увеличить">+</button>
            </div>
            <div class="slider-hint">b > 0: вверх; b < 0: вниз</div>
            <div class="trig-step-chips" id="trig-chips-b" style="${currentBaseFn && currentBaseFn.isInvTrig ? 'display:flex;' : 'display:none;'}">
              <span class="chip-label">Быстрый сдвиг по π:</span>
              <button type="button" class="btn-chip" data-trig-b="-1.5707963">-π/2</button>
              <button type="button" class="btn-chip" data-trig-b="0">0</button>
              <button type="button" class="btn-chip" data-trig-b="1.5707963">+π/2</button>
              <button type="button" class="btn-chip" data-trig-b="3.14159265">+π</button>
            </div>
          </div>

          <!-- Растяжение/сжатие Oy (k) -->
          <div class="slider-control-card">
            <div class="slider-header">
              <span class="slider-title">Масштаб вдоль Oy (параметр k)</span>
              <span class="slider-val" id="val-k">${state.k}</span>
            </div>
            <div class="slider-row">
              <button class="btn-step" data-stepper="k" data-dir="-0.5" title="Уменьшить">-</button>
              <input type="range" id="slider-k" min="-4" max="4" step="0.25" value="${state.k}" class="custom-slider">
              <button class="btn-step" data-stepper="k" data-dir="0.5" title="Увеличить">+</button>
            </div>
            <div class="slider-hint">|k| > 1: растяжение от Ox; |k| < 1: сжатие; k < 0: переворот</div>
          </div>

          <!-- Сжатие/растяжение Ox (m) -->
          <div class="slider-control-card">
            <div class="slider-header">
              <span class="slider-title">Масштаб вдоль Ox (параметр m)</span>
              <span class="slider-val" id="val-m">${state.m}</span>
            </div>
            <div class="slider-row">
              <button class="btn-step" data-stepper="m" data-dir="-0.5" title="Уменьшить">-</button>
              <input type="range" id="slider-m" min="-3" max="3" step="0.5" value="${state.m}" class="custom-slider">
              <button class="btn-step" data-stepper="m" data-dir="0.5" title="Увеличить">+</button>
            </div>
            <div class="slider-hint">|m| > 1: сжатие к Oy в m раз; |m| < 1: растяжение от Oy</div>
          </div>
        </div>

        <!-- Переключатели модулей и симметрий -->
        <div class="control-section toggles-section">
          <span class="section-subtitle">Отражения и модули:</span>
          <div class="toggles-grid">
            <label class="toggle-card">
              <input type="checkbox" id="toggle-abs-outer" ${state.absOuter ? 'checked' : ''}>
              <span class="toggle-text">Внешний модуль <b>|f(x)|</b> (низ наверх)</span>
            </label>
            <label class="toggle-card">
              <input type="checkbox" id="toggle-abs-inner" ${state.absInner ? 'checked' : ''}>
              <span class="toggle-text">Внутренний модуль <b>f(|x|)</b> (четность)</span>
            </label>
            <label class="toggle-card">
              <input type="checkbox" id="toggle-sym-ox" ${state.symOx ? 'checked' : ''}>
              <span class="toggle-text">Симметрия Ox <b>-f(x)</b></span>
            </label>
            <label class="toggle-card">
              <input type="checkbox" id="toggle-sym-oy" ${state.symOy ? 'checked' : ''}>
              <span class="toggle-text">Симметрия Oy <b>f(-x)</b></span>
            </label>
          </div>
        </div>

        <!-- Опции отображения на графике -->
        <div class="control-section display-options">
          <span class="section-subtitle">Элементы холста:</span>
          <div class="checkbox-row">
            <label class="custom-chk">
              <input type="checkbox" id="chk-ghost" ${state.showGhost ? 'checked' : ''}>
              <span>Исходный график (пунктир)</span>
            </label>
            <label class="custom-chk">
              <input type="checkbox" id="chk-vector" ${state.showVector ? 'checked' : ''}>
              <span>Стрелка сдвига</span>
            </label>
            <label class="custom-chk">
              <input type="checkbox" id="chk-asymptotes" ${state.showAsymptotes ? 'checked' : ''}>
              <span>Асимптоты</span>
            </label>
            <label class="custom-chk">
              <input type="checkbox" id="chk-points" ${state.showKeyPoints ? 'checked' : ''}>
              <span>Опорные точки</span>
            </label>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="action-buttons-row">
          <button class="btn btn-secondary" id="btn-reset-view">Центрировать холст</button>
          <button class="btn btn-primary" id="btn-reset-params">Сбросить параметры (f(x))</button>
        </div>
      </div>
    `;

    bindControlEvents();
  }

  function bindControlEvents() {
    const sel = document.getElementById('pg-func-select');
    if (sel) {
      sel.addEventListener('change', (e) => setBaseFunction(e.target.value));
    }

    ['a', 'b', 'k', 'm'].forEach(param => {
      const slider = document.getElementById(`slider-${param}`);
      const valDisplay = document.getElementById(`val-${param}`);

      if (slider) {
        slider.addEventListener('input', (e) => {
          let val = parseFloat(e.target.value);
          if (param === 'm' && val === 0) val = 0.5;
          state[param] = val;
          if (valDisplay) valDisplay.textContent = formatParamValue(param, val);
          updateView();
        });
      }
    });

    document.querySelectorAll('.btn-step').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const param = e.target.dataset.stepper;
        const dir = parseFloat(e.target.dataset.dir);
        let current = state[param];
        let next = Number((current + dir).toFixed(2));
        if (param === 'm' && next === 0) next = dir > 0 ? 0.5 : -0.5;

        state[param] = next;
        const slider = document.getElementById(`slider-${param}`);
        const valDisplay = document.getElementById(`val-${param}`);
        if (slider) slider.value = next;
        if (valDisplay) valDisplay.textContent = formatParamValue(param, next);
        updateView();
      });
    });

    // Быстрые кнопки сдвигов по π
    document.querySelectorAll('[data-trig-a]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = parseFloat(e.currentTarget.dataset.trigA);
        state.a = val;
        const slider = document.getElementById('slider-a');
        const valDisplay = document.getElementById('val-a');
        if (slider) slider.value = Math.min(5, Math.max(-5, val));
        if (valDisplay) valDisplay.textContent = formatParamValue('a', val);
        updateView();
      });
    });

    document.querySelectorAll('[data-trig-b]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = parseFloat(e.currentTarget.dataset.trigB);
        state.b = val;
        const slider = document.getElementById('slider-b');
        const valDisplay = document.getElementById('val-b');
        if (slider) slider.value = Math.min(5, Math.max(-5, val));
        if (valDisplay) valDisplay.textContent = formatParamValue('b', val);
        updateView();
      });
    });

    const bindToggle = (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          state[key] = e.target.checked;
          updateView();
        });
      }
    };

    bindToggle('toggle-abs-outer', 'absOuter');
    bindToggle('toggle-abs-inner', 'absInner');
    bindToggle('toggle-sym-ox', 'symOx');
    bindToggle('toggle-sym-oy', 'symOy');

    bindToggle('chk-ghost', 'showGhost');
    bindToggle('chk-vector', 'showVector');
    bindToggle('chk-asymptotes', 'showAsymptotes');
    bindToggle('chk-points', 'showKeyPoints');

    const btnResetView = document.getElementById('btn-reset-view');
    if (btnResetView) {
      btnResetView.addEventListener('click', () => canvasInstance?.resetView());
    }

    const btnResetParams = document.getElementById('btn-reset-params');
    if (btnResetParams) {
      btnResetParams.addEventListener('click', () => applyPreset('reset'));
    }

    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        applyPreset(e.target.dataset.preset);
      });
    });
  }

  function applyPreset(preset) {
    if (preset === 'reset') {
      state.a = 0;
      state.b = 0;
      state.k = 1;
      state.m = 1;
      state.symOx = false;
      state.symOy = false;
      state.absOuter = false;
      state.absInner = false;
    } else if (preset === 'shift_right') {
      state.a = 2;
    } else if (preset === 'shift_up') {
      state.b = 3;
    } else if (preset === 'scale_2') {
      state.k = 2;
    } else if (preset === 'flip_ox') {
      state.symOx = !state.symOx;
    } else if (preset === 'mod_outer') {
      state.absOuter = !state.absOuter;
    } else if (preset === 'mod_inner') {
      state.absInner = !state.absInner;
    } else if (preset === 'canonical') {
      state.a = 2;
      state.b = -1;
      state.k = 1.5;
      state.absOuter = true;
    }

    ['a', 'b', 'k', 'm'].forEach(p => {
      const slider = document.getElementById(`slider-${p}`);
      const valDisplay = document.getElementById(`val-${p}`);
      if (slider) slider.value = state[p];
      if (valDisplay) valDisplay.textContent = formatParamValue(p, state[p]);
    });

    const setChecked = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = val;
    };
    setChecked('toggle-abs-outer', state.absOuter);
    setChecked('toggle-abs-inner', state.absInner);
    setChecked('toggle-sym-ox', state.symOx);
    setChecked('toggle-sym-oy', state.symOy);

    updateView();
  }

  return {
    init,
    setBaseFunction,
    applyPreset,
    getState: () => ({ ...state })
  };
}));
