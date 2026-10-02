/**
 * trainer.js
 * Тренажёр для зачёта по графикам и преобразованиям.
 * Два целенаправленных режима:
 * 1. «Угадай функцию по графику» (показан график -> выбери верную формулу из 4 вариантов)
 * 2. «Угадай преобразование» (показан базовый пунктиром и новый сплошным -> определи вид преобразования)
 * Мгновенная проверка, подсчет баллов, удобные крупные кнопки для мобильных.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Trainer = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  let containerEl = null;
  let canvasInstance = null;

  let currentMode = 'guess_func'; // 'guess_func' | 'guess_transform'
  let currentQuestion = null;
  let hasAnswered = false;
  let score = 0;
  let totalAnswered = 0;

  function init(targetContainer) {
    containerEl = targetContainer;
    renderLayout();
    loadNewQuestion();
  }

  function renderLayout() {
    if (!containerEl) return;

    containerEl.innerHTML = `
      <div class="trainer-header-bar">
        <div>
          <h2>Тренажёр самопроверки к зачёту</h2>
          <p class="trainer-subtitle">Проверьте, насколько легко вы узнаете графики и преобразования с первого взгляда</p>
        </div>

        <div class="trainer-score-badge">
          <span class="score-label">Правильно:</span>
          <span class="score-number" id="trainer-score-display">${score} / ${totalAnswered}</span>
        </div>
      </div>

      <div class="trainer-mode-selector">
        <button class="mode-btn ${currentMode === 'guess_func' ? 'mode-btn-active' : ''}" data-mode="guess_func">
          1. Угадай функцию по графику
        </button>
        <button class="mode-btn ${currentMode === 'guess_transform' ? 'mode-btn-active' : ''}" data-mode="guess_transform">
          2. Угадай преобразование
        </button>
      </div>

      <div class="trainer-card">
        <div class="trainer-canvas-container">
          <canvas id="trainer-canvas" width="500" height="320" class="trainer-canvas"></canvas>
          <div class="trainer-canvas-hint" id="trainer-canvas-hint">
            Серый пунктир — исходный f(x), синяя линия — результат
          </div>
        </div>

        <div class="trainer-interactive-panel">
          <div class="question-title" id="question-text">
            Загрузка вопроса...
          </div>

          <div class="options-grid" id="options-grid">
            <!-- Кнопки вариантов ответов -->
          </div>

          <div class="feedback-card" id="feedback-card" style="display: none;">
            <div class="feedback-title" id="feedback-title"></div>
            <div class="feedback-desc" id="feedback-desc"></div>
            <button class="btn btn-primary btn-next-q" id="btn-next-question">
              Следующий вопрос →
            </button>
          </div>
        </div>
      </div>
    `;

    bindModeEvents();
    initCanvas();
  }

  function initCanvas() {
    const canvasEl = document.getElementById('trainer-canvas');
    if (!canvasEl) return;

    canvasInstance = new window.MathCanvas(canvasEl, {
      isInteractive: true,
      defaultScale: 32,
      showGrid: true,
      showAxes: true,
      showLabels: true,
      showAsymptotes: true,
      showKeyPoints: true,
      showCrosshair: false
    });
  }

  function bindModeEvents() {
    containerEl.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentMode = e.currentTarget.dataset.mode;
        containerEl.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('mode-btn-active'));
        e.currentTarget.classList.add('mode-btn-active');
        loadNewQuestion();
      });
    });

    const nextBtn = document.getElementById('btn-next-question');
    if (nextBtn) {
      nextBtn.addEventListener('click', loadNewQuestion);
    }
  }

  /**
   * Генерация нового случайного вопроса в зависимости от выбранного режима
   */
  function loadNewQuestion() {
    hasAnswered = false;
    const feedbackCard = document.getElementById('feedback-card');
    if (feedbackCard) feedbackCard.style.display = 'none';

    if (currentMode === 'guess_func') {
      generateGuessFuncQuestion();
    } else {
      generateGuessTransformQuestion();
    }

    renderQuestionUI();
  }

  /**
   * Режим 1: Угадай функцию по графику
   */
  function generateGuessFuncQuestion() {
    const all = window.MathCore.FUNCTIONS;
    // Выбираем случайную функцию
    const target = all[Math.floor(Math.random() * all.length)];

    // Подбираем 3 дистрактора из той же или смежных категорий
    const distractors = all
      .filter(f => f.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = [target, ...distractors].sort(() => 0.5 - Math.random());

    currentQuestion = {
      type: 'func',
      target,
      options,
      correctIndex: options.indexOf(target),
      prompt: 'Какая функция изображена на графике?',
      hint: `Обратите внимание на характерные точки: ${target.keyPoints.slice(0, 2).map(p => p.label).join(', ')}${target.asymptotes.length ? ' и асимптоты' : ''}.`
    };

    // Отрисовка на холсте
    canvasInstance.clearLayers();
    canvasInstance.setTrigMode(Boolean(target.isTrig));
    canvasInstance.addLayer({
      id: target.id,
      fn: target.fn,
      params: {},
      style: 'active',
      color: '#2563EB',
      asymptotes: target.asymptotes,
      keyPoints: target.keyPoints
    });
    canvasInstance.render();

    const hintEl = document.getElementById('trainer-canvas-hint');
    if (hintEl) hintEl.textContent = 'Определите формулу функции по ключевым точкам и асимптотам';
  }

  /**
   * Режим 2: Угадай преобразование
   */
  function generateGuessTransformQuestion() {
    const transformCandidates = [
      {
        baseId: 'parabola',
        params: { a: 2, b: 0, k: 1, m: 1 },
        correct: 'y = (x - 2)^2',
        ruleName: 'Сдвиг вправо на 2 единицы вдоль Ox: y = f(x - 2)',
        distractors: ['y = (x + 2)^2', 'y = x^2 + 2', 'y = 2x^2']
      },
      {
        baseId: 'parabola',
        params: { a: 0, b: 3, k: 1, m: 1 },
        correct: 'y = x^2 + 3',
        ruleName: 'Сдвиг вверх на 3 единицы вдоль Oy: y = f(x) + 3',
        distractors: ['y = (x - 3)^2', 'y = x^2 - 3', 'y = 3x^2']
      },
      {
        baseId: 'parabola',
        params: { a: 0, b: 0, k: -1, m: 1, symOx: true },
        correct: 'y = -x^2',
        ruleName: 'Симметрия относительно оси Ox: y = -f(x)',
        distractors: ['y = (-x)^2', 'y = x^2 - 1', 'y = |x^2|']
      },
      {
        baseId: 'cube',
        params: { a: 0, b: 0, k: 1, m: 1, absOuter: true },
        correct: 'y = |x^3|',
        ruleName: 'Внешний модуль: y = |f(x)| (нижняя часть отражена наверх)',
        distractors: ['y = |x|^3', 'y = -x^3', 'y = (x - 1)^3']
      },
      {
        baseId: 'cube',
        params: { a: 0, b: 0, k: 1, m: 1, absInner: true },
        correct: 'y = |x|^3',
        ruleName: 'Внутренний модуль: y = f(|x|) (чётная функция, чаша)',
        distractors: ['y = |x^3|', 'y = x^3', 'y = -x^3']
      },
      {
        baseId: 'sqrt',
        params: { a: 3, b: 0, k: 1, m: 1 },
        correct: 'y = \\sqrt{x - 3}',
        ruleName: 'Сдвиг вправо на 3: y = \\sqrt{x - 3}',
        distractors: ['y = \\sqrt{x + 3}', 'y = \\sqrt{x} + 3', 'y = \\sqrt{x} - 3']
      },
      {
        baseId: 'abs',
        params: { a: 0, b: -2, k: 1, m: 1 },
        correct: 'y = |x| - 2',
        ruleName: 'Сдвиг вниз на 2 единицы: y = |x| - 2',
        distractors: ['y = |x - 2|', 'y = |x + 2|', 'y = -|x|']
      },
      {
        baseId: 'exp_2',
        params: { a: 1, b: 0, k: 1, m: 1 },
        correct: 'y = 2^{x - 1}',
        ruleName: 'Сдвиг вправо на 1: y = 2^{x - 1}',
        distractors: ['y = 2^{x + 1}', 'y = 2^x - 1', 'y = 2^x + 1']
      },
      {
        baseId: 'exp_2',
        params: { a: 0, b: 2, k: 1, m: 1 },
        correct: 'y = 2^x + 2',
        ruleName: 'Сдвиг вверх на 2 единицы (асимптота y = 2): y = 2^x + 2',
        distractors: ['y = 2^{x + 2}', 'y = 2^{x - 2}', 'y = 2^x - 2']
      },
      {
        baseId: 'hyperbola',
        params: { a: 2, b: 0, k: 1, m: 1 },
        correct: 'y = \\frac{1}{x - 2}',
        ruleName: 'Сдвиг гиперболы вправо на 2 (асимптота x = 2): y = \\frac{1}{x - 2}',
        distractors: ['y = \\frac{1}{x + 2}', 'y = \\frac{1}{x} + 2', 'y = -\\frac{1}{x}']
      }
    ];

    const pick = transformCandidates[Math.floor(Math.random() * transformCandidates.length)];
    const baseFn = window.MathCore.getFunctionById(pick.baseId);

    const options = [pick.correct, ...pick.distractors].sort(() => 0.5 - Math.random());

    currentQuestion = {
      type: 'transform',
      baseFn,
      params: pick.params,
      correct: pick.correct,
      ruleName: pick.ruleName,
      options,
      correctIndex: options.indexOf(pick.correct),
      prompt: `Какое преобразование функции ${baseFn.name} (${baseFn.unicode}) изображено?`,
      hint: pick.ruleName
    };

    // Отрисовка
    canvasInstance.clearLayers();
    canvasInstance.setTrigMode(false);

    // Призрак
    canvasInstance.addLayer({
      id: 'ghost',
      fn: baseFn.fn,
      params: {},
      style: 'ghost',
      color: 'rgba(100, 116, 139, 0.45)',
      asymptotes: baseFn.asymptotes,
      keyPoints: baseFn.keyPoints
    });

    // Результат
    const newPts = baseFn.keyPoints.map(p => window.TransformCore.transformKeyPoint(p, pick.params)).filter(Boolean);
    const newAsymp = window.TransformCore.transformAsymptotes(baseFn.asymptotes, pick.params);

    canvasInstance.addLayer({
      id: 'active',
      fn: (x) => window.TransformCore.evaluateTransformed(x, baseFn.fn, pick.params),
      params: pick.params,
      style: 'active',
      color: '#2563EB',
      asymptotes: newAsymp,
      keyPoints: newPts
    });

    if (pick.params.a !== 0 || pick.params.b !== 0) {
      const origAnchor = baseFn.keyPoints[0] || { x: 0, y: 0 };
      const newAnchor = window.TransformCore.transformKeyPoint(origAnchor, pick.params) || { x: pick.params.a, y: pick.params.b };
      canvasInstance.setDisplacementVector(origAnchor.x, origAnchor.y, newAnchor.x, newAnchor.y, 'сдвиг');
    } else {
      canvasInstance.displacementVector = null;
    }

    canvasInstance.render();

    const hintEl = document.getElementById('trainer-canvas-hint');
    if (hintEl) hintEl.textContent = 'Серый пунктир — исходный график f(x), синяя линия — результат';
  }

  function renderQuestionUI() {
    const titleEl = document.getElementById('question-text');
    const optionsGrid = document.getElementById('options-grid');

    if (!titleEl || !optionsGrid || !currentQuestion) return;

    titleEl.innerHTML = currentQuestion.prompt;

    optionsGrid.innerHTML = currentQuestion.options.map((opt, idx) => {
      const label = currentQuestion.type === 'func' ? `${opt.name} (${opt.latex})` : opt;
      return `
        <button class="option-btn" data-opt-idx="${idx}">
          <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
          <span class="opt-math math-inline">${label}</span>
        </button>
      `;
    }).join('');

    if (window.renderAllMathIn) {
      window.renderAllMathIn(optionsGrid);
    }

    optionsGrid.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (hasAnswered) return;
        handleAnswer(parseInt(e.currentTarget.dataset.optIdx, 10));
      });
    });
  }

  function handleAnswer(selectedIndex) {
    hasAnswered = true;
    totalAnswered++;

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    if (isCorrect) score++;

    // Обновление счетчика
    const scoreDisplay = document.getElementById('trainer-score-display');
    if (scoreDisplay) scoreDisplay.textContent = `${score} / ${totalAnswered}`;

    // Подсветка кнопок
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach((btn, idx) => {
      if (idx === currentQuestion.correctIndex) {
        btn.classList.add('opt-correct');
      } else if (idx === selectedIndex) {
        btn.classList.add('opt-wrong');
      }
      btn.disabled = true;
    });

    // Показ карточки обратной связи
    const feedbackCard = document.getElementById('feedback-card');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackDesc = document.getElementById('feedback-desc');

    if (feedbackCard && feedbackTitle && feedbackDesc) {
      feedbackCard.className = `feedback-card ${isCorrect ? 'feedback-success' : 'feedback-error'}`;
      feedbackTitle.innerHTML = isCorrect ? 'Верно! Отличная работа!' : 'Не совсем так!';
      feedbackDesc.innerHTML = currentQuestion.hint;
      feedbackCard.style.display = 'block';

      if (window.renderAllMathIn) window.renderAllMathIn(feedbackDesc);
    }
  }

  return {
    init,
    loadNewQuestion
  };
}));
