/**
 * transformations.js
 * Модуль математических преобразований графиков функций.
 * Поддерживает канонические преобразования:
 * - Сдвиги вдоль осей: y = f(x - a) + b
 * - Растяжение/сжатие вдоль осей: y = k * f(m * x)
 * - Симметрии: -f(x), f(-x), -f(-x)
 * - Частичные модульные преобразования: |f(x)|, f(|x|), |f(|x|)|
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TransformCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Преобразования в каталоге с описанием правил для зачета
   */
  const TRANSFORMATION_RULES = [
    {
      id: 'shift_x',
      name: 'Сдвиг вдоль оси Ox',
      formula: 'y = f(x - a)',
      latex: 'y = f(x - a)',
      type: 'shift',
      axis: 'x',
      param: 'a',
      summary: 'Сдвиг графика влево или вправо',
      mnemonic: 'Внимание на знак в скобках!',
      description: 'Если a > 0 (например, f(x - 3)), график сдвигается ВПРАВО на a единиц. Если a < 0 (например, f(x + 3)), график сдвигается ВЛЕВО на |a| единиц.',
      pointTransform: '(x_0; y_0) \\to (x_0 + a; y_0)',
      example: {
        fnId: 'parabola',
        a: 2, b: 0, k: 1, m: 1,
        caption: 'Парабола y = (x - 2)^2: сдвинута вправо на 2 клетки'
      }
    },
    {
      id: 'shift_y',
      name: 'Сдвиг вдоль оси Oy',
      formula: 'y = f(x) + b',
      latex: 'y = f(x) + b',
      type: 'shift',
      axis: 'y',
      param: 'b',
      summary: 'Сдвиг графика вверх или вниз',
      mnemonic: 'Прямой знак: плюс вверх, минус вниз',
      description: 'Если b > 0 (например, f(x) + 2), график поднимается ВВЕРХ на b единиц. Если b < 0 (например, f(x) - 2), график опускается ВНИЗ на |b| единиц.',
      pointTransform: '(x_0; y_0) \\to (x_0; y_0 + b)',
      example: {
        fnId: 'parabola',
        a: 0, b: 2, k: 1, m: 1,
        caption: 'Парабола y = x^2 + 2: поднята вверх на 2 клетки'
      }
    },
    {
      id: 'scale_y',
      name: 'Растяжение/сжатие вдоль оси Oy',
      formula: 'y = k \\cdot f(x)',
      latex: 'y = k \\cdot f(x)',
      type: 'scale',
      axis: 'y',
      param: 'k',
      summary: 'Вертикальное растяжение или сжатие',
      mnemonic: 'Коэффициент k умножает каждую высоту y',
      description: 'При |k| > 1 — РАСТЯЖЕНИЕ от оси Ox в |k| раз (график становится круче). При 0 < |k| < 1 — СЖАТИЕ к оси Ox в 1/|k| раз (график сплющивается). Если k < 0, дополнительно происходит переворот относительно Ox.',
      pointTransform: '(x_0; y_0) \\to (x_0; k \\cdot y_0)',
      example: {
        fnId: 'parabola',
        a: 0, b: 0, k: 2, m: 1,
        caption: 'Парабола y = 2x^2: растянута вдоль Oy в 2 раза'
      }
    },
    {
      id: 'scale_x',
      name: 'Сжатие/растяжение вдоль оси Ox',
      formula: 'y = f(m \\cdot x)',
      latex: 'y = f(m \\cdot x)',
      type: 'scale',
      axis: 'x',
      param: 'm',
      summary: 'Горизонтальное сжатие или растяжение',
      mnemonic: 'Обратный эффект: умножили на 2 — сжали в 2 раза!',
      description: 'При |m| > 1 — СЖАТИЕ к оси Oy в |m| раз (процесс идет быстрее). При 0 < |m| < 1 — РАСТЯЖЕНИЕ от оси Oy в 1/|m| раз. Если m < 0, зеркалится относительно Oy.',
      pointTransform: '(x_0; y_0) \\to (x_0 / m; y_0)',
      example: {
        fnId: 'sin',
        a: 0, b: 0, k: 1, m: 2,
        caption: 'Синусоида y = \\sin(2x): сжата вдоль Ox в 2 раза (период стал pi вместо 2pi)'
      }
    },
    {
      id: 'sym_ox',
      name: 'Полная симметрия относительно оси Ox',
      formula: 'y = -f(x)',
      latex: 'y = -f(x)',
      type: 'symmetry',
      summary: 'Зеркальное отражение сверху вниз',
      mnemonic: 'Верх меняется с низом',
      description: 'Вся положительная часть функции уходит в отрицательную, а отрицательная — в положительную. Точки на оси Ox остаются на месте.',
      pointTransform: '(x_0; y_0) \\to (x_0; -y_0)',
      example: {
        fnId: 'parabola',
        a: 0, b: 0, k: -1, m: 1,
        caption: 'y = -x^2: ветви параболы направлены вниз'
      }
    },
    {
      id: 'sym_oy',
      name: 'Полная симметрия относительно оси Oy',
      formula: 'y = f(-x)',
      latex: 'y = f(-x)',
      type: 'symmetry',
      summary: 'Зеркальное отражение слева направо',
      mnemonic: 'Лево и право меняются местами',
      description: 'Правая ветвь отображается налево, а левая — направо. Для четных функций (например, x^2) график не меняется, для нечетных — переворачивается.',
      pointTransform: '(x_0; y_0) \\to (-x_0; y_0)',
      example: {
        fnId: 'sqrt',
        a: 0, b: 0, k: 1, m: -1,
        caption: 'y = \\sqrt{-x}: ветвь корня развернута влево (x <= 0)'
      }
    },
    {
      id: 'sym_origin',
      name: 'Симметрия относительно начала координат O(0,0)',
      formula: 'y = -f(-x)',
      latex: 'y = -f(-x)',
      type: 'symmetry',
      summary: 'Центральная симметрия (поворот на 180°)',
      mnemonic: 'Одновременно отражение по обеим осям',
      description: 'Каждая точка (x, y) переходит в (-x, -y). Эквивалентно повороту всей плоскости на 180 градусов вокруг точки O(0,0).',
      pointTransform: '(x_0; y_0) \\to (-x_0; -y_0)',
      example: {
        fnId: 'parabola',
        a: 0, b: 0, k: -1, m: -1,
        caption: 'y = -(-x)^2 = -x^2'
      }
    },
    {
      id: 'abs_outer',
      name: 'Внешний модуль (частичная симметрия)',
      formula: 'y = |f(x)|',
      latex: 'y = |f(x)|',
      type: 'abs',
      summary: 'Все что ниже оси Ox зеркально отражается наверх',
      mnemonic: 'Нижнюю часть графика отбиваем наверх',
      description: '1. Часть графика выше или на оси Ox (где y >= 0) ОСТАЕТСЯ без изменений.\n2. Часть графика строго ниже оси Ox (где y < 0) ЗЕРКАЛЬНО ПЕРЕКИДЫВАЕТСЯ НАВЕРХ.\n3. В точках пересечения с Ox образуются характерные «изломы».',
      pointTransform: '(x_0; y_0) \\to (x_0; |y_0|)',
      example: {
        fnId: 'cube',
        a: 0, b: 0, k: 1, m: 1, absOuter: true,
        caption: 'y = |x^3|: левая ветвь поднята вверх'
      }
    },
    {
      id: 'abs_inner',
      name: 'Внутренний модуль (частичная симметрия)',
      formula: 'y = f(|x|)',
      latex: 'y = f(|x|)',
      type: 'abs',
      summary: 'Стираем левую часть, правую зеркалим налево',
      mnemonic: 'Стерли x < 0, правую часть повторили как крылья бабочки',
      description: '1. Левая полуплоскость (x < 0) ПОЛНОСТЬЮ СТИРАЕТСЯ.\n2. Правая полуплоскость (x >= 0) ОСТАЕТСЯ.\n3. Правая часть зеркально копируется в левую полуплоскость.\nФункция всегда становится ЧЕТНОЙ!',
      pointTransform: 'x \\ge 0: (x_0; y_0) \\to (\\pm x_0; y_0)',
      example: {
        fnId: 'cube',
        a: 0, b: 0, k: 1, m: 1, absInner: true,
        caption: 'y = |x|^3: четная чаша'
      }
    },
    {
      id: 'abs_both',
      name: 'Двойной модуль',
      formula: 'y = |f(|x|)|',
      latex: 'y = |f(|x|)|',
      type: 'abs',
      summary: 'Сначала f(|x|), затем ко всему модуль |...|',
      mnemonic: 'Сначала симметрия относительно Oy, затем все из-под Ox наверх',
      description: 'Комбинация двух действий: 1) Стереть левую часть, отразить правую налево f(|x|). 2) Затем все, что оказалось ниже оси Ox, перевернуть вверх.',
      pointTransform: '(x_0; y_0) \\to (|x_0|; |f(|x_0|)|)',
      example: {
        fnId: 'linear_down',
        a: 0, b: 0, k: 1, m: 1, absOuter: true, absInner: true,
        caption: 'y = |- |x| + 2|'
      }
    }
  ];

  /**
   * Преобразует числовое значение в красивый LaTeX-код дроби числа \pi
   */
  function toLatexPi(val) {
    if (Math.abs(val) < 1e-4) return null;
    const pi = Math.PI;
    const absVal = Math.abs(val);
    const fractions = [
      { ratio: 1/6,  latex: '\\frac{\\pi}{6}' },
      { ratio: 1/4,  latex: '\\frac{\\pi}{4}' },
      { ratio: 1/3,  latex: '\\frac{\\pi}{3}' },
      { ratio: 1/2,  latex: '\\frac{\\pi}{2}' },
      { ratio: 2/3,  latex: '\\frac{2\\pi}{3}' },
      { ratio: 3/4,  latex: '\\frac{3\\pi}{4}' },
      { ratio: 5/6,  latex: '\\frac{5\\pi}{6}' },
      { ratio: 1,    latex: '\\pi' },
      { ratio: 5/4,  latex: '\\frac{5\\pi}{4}' },
      { ratio: 4/3,  latex: '\\frac{4\\pi}{3}' },
      { ratio: 3/2,  latex: '\\frac{3\\pi}{2}' },
      { ratio: 7/4,  latex: '\\frac{7\\pi}{4}' },
      { ratio: 2,    latex: '2\\pi' }
    ];
    for (const f of fractions) {
      if (Math.abs(absVal - f.ratio * pi) < 0.06) {
        return f.latex;
      }
    }
    const intK = Math.round(absVal / pi);
    if (Math.abs(absVal - intK * pi) < 0.06 && intK > 0) {
      return intK === 1 ? '\\pi' : `${intK}\\pi`;
    }
    return null;
  }

  /**
   * Вычисляет значение преобразованной функции g(x)
   * на основе базовой функции baseFn, параметров сдвига/растяжения и модификаторов
   *
   * Каноническая формула:
   * g(x) = k * baseFn( m * (x - a) ) + b
   * с возможными модулями:
   * absInner: аргумент берется по модулю: |x - a| или |x|
   * absOuter: все значение берется по модулю: |g(x)|
   */
  function evaluateTransformed(x, baseFn, params) {
    const a = params.a ?? 0;
    const b = params.b ?? 0;
    const k = params.k ?? 1;
    const m = params.m ?? 1;
    const absOuter = Boolean(params.absOuter);
    const absInner = Boolean(params.absInner);
    const symOx = Boolean(params.symOx);
    const symOy = Boolean(params.symOy);
    const baseParams = params.baseParams || {};

    // 1. Расчет аргумента x для базовой функции
    let effectiveX = x;

    // Внутренний модуль f(|x|) или f(|x - a|)
    if (absInner) {
      // Стандартное школьное преобразование: f(|x| - a) или f(|x|)
      // Для строгого f(|x|):
      effectiveX = Math.abs(effectiveX);
    }

    if (symOy) {
      effectiveX = -effectiveX;
    }

    // Сжатие/растяжение по X и сдвиг по X: m * (x - a)
    let internalArg = m * (effectiveX - a);

    // 2. Вычисление базовой функции
    let baseVal = baseFn(internalArg, baseParams);

    if (isNaN(baseVal)) return NaN;
    if (!isFinite(baseVal)) return baseVal;

    // 3. Вертикальное масштабирование и сдвиг
    let effectiveK = k;
    if (symOx) {
      effectiveK = -effectiveK;
    }

    let yVal = effectiveK * baseVal + b;

    // 4. Внешний модуль |...|
    if (absOuter) {
      yVal = Math.abs(yVal);
    }

    return yVal;
  }

  /**
   * Преобразует координаты характерных точек (x0, y0) базовой функции в новые координаты
   */
  function transformKeyPoint(pt, params) {
    const a = params.a ?? 0;
    const b = params.b ?? 0;
    const k = params.k ?? 1;
    const m = params.m ?? 1;
    const symOx = Boolean(params.symOx);
    const symOy = Boolean(params.symOy);
    const absOuter = Boolean(params.absOuter);
    const absInner = Boolean(params.absInner);

    if (m === 0) return null;

    let effK = symOx ? -k : k;
    let effM = symOy ? -m : m;

    // Исходная координата: (x0, y0)
    // Новая точка удовлетворяет: m*(x' - a) = x0 => x' = x0 / m + a
    let newX = pt.x / effM + a;
    let newY = effK * pt.y + b;

    if (absOuter) {
      newY = Math.abs(newY);
    }

    return {
      x: Number(newX.toFixed(3)),
      y: Number(newY.toFixed(3)),
      label: `(${formatNumber(newX)}; ${formatNumber(newY)})`,
      origLabel: pt.label || `(${pt.x}; ${pt.y})`
    };
  }

  /**
   * Преобразует асимптоты базовой функции в новые
   */
  function transformAsymptotes(asymptotes, params) {
    if (!asymptotes || !asymptotes.length) return [];

    const a = params.a ?? 0;
    const b = params.b ?? 0;
    const k = params.k ?? 1;
    const m = params.m ?? 1;
    const symOx = Boolean(params.symOx);
    const symOy = Boolean(params.symOy);
    const absOuter = Boolean(params.absOuter);

    let effK = symOx ? -k : k;
    let effM = symOy ? -m : m;

    return asymptotes.map(asymp => {
      if (asymp.type === 'vertical') {
        let newX = asymp.x / effM + a;
        return {
          type: 'vertical',
          x: newX,
          label: `x = ${formatNumber(newX)}`
        };
      } else if (asymp.type === 'horizontal') {
        let newY = effK * asymp.y + b;
        if (absOuter) newY = Math.abs(newY);
        return {
          type: 'horizontal',
          y: newY,
          label: `y = ${formatNumber(newY)}`
        };
      }
      return asymp;
    });
  }

  /**
   * Форматирует число для красивого отображения (убирает лишние нули)
   */
  function formatNumber(num) {
    if (Math.abs(num) < 1e-6) return '0';
    let rounded = Number(num.toFixed(2));
    return String(rounded).replace('.', ',');
  }

  /**
   * Генерирует читаемое математическое представление формулы после преобразований
   */
  function buildFormulaString(baseInfo, params) {
    const a = params.a ?? 0;
    const b = params.b ?? 0;
    const k = params.k ?? 1;
    const m = params.m ?? 1;
    const absOuter = Boolean(params.absOuter);
    const absInner = Boolean(params.absInner);
    const symOx = Boolean(params.symOx);
    const symOy = Boolean(params.symOy);

    let effK = symOx ? -k : k;
    let effM = symOy ? -m : m;

    // Внутренний аргумент
    let argStr = 'x';
    if (absInner) {
      argStr = '|x|';
    }

    if (a !== 0) {
      let aText = Math.abs(a);
      if (baseInfo.isTrig) {
        const piTex = toLatexPi(Math.abs(a));
        if (piTex) aText = piTex;
      }
      argStr = a > 0 ? `${argStr} - ${aText}` : `${argStr} + ${aText}`;
    }

    if (effM !== 1) {
      if (effM === -1) {
        argStr = `-${a !== 0 ? '(' + argStr + ')' : argStr}`;
      } else {
        argStr = `${effM}${a !== 0 ? '(' + argStr + ')' : argStr}`;
      }
    }

    // Подстановка аргумента в базовую формулу
    let coreStr = '';
    const id = baseInfo.id;

    if (id === 'parabola') {
      coreStr = `(${argStr})^2`;
    } else if (id === 'cube') {
      coreStr = `(${argStr})^3`;
    } else if (id === 'power4') {
      coreStr = `(${argStr})^4`;
    } else if (id === 'sqrt') {
      coreStr = `\\sqrt{${argStr}}`;
    } else if (id === 'cbrt') {
      coreStr = `\\sqrt[3]{${argStr}}`;
    } else if (id === 'hyperbola') {
      coreStr = `\\frac{1}{${argStr}}`;
    } else if (id === 'inv_sq') {
      coreStr = `\\frac{1}{(${argStr})^2}`;
    } else if (id === 'abs') {
      coreStr = `|${argStr}|`;
    } else if (id === 'sin') {
      coreStr = `\\sin(${argStr})`;
    } else if (id === 'cos') {
      coreStr = `\\cos(${argStr})`;
    } else if (id === 'tg') {
      coreStr = `\\operatorname{tg}(${argStr})`;
    } else if (id === 'ctg') {
      coreStr = `\\operatorname{ctg}(${argStr})`;
    } else if (id === 'exp_2') {
      coreStr = `2^{${argStr}}`;
    } else if (id === 'exp_half') {
      coreStr = `(0.5)^{${argStr}}`;
    } else if (id === 'exp_e') {
      coreStr = `e^{${argStr}}`;
    } else if (id === 'log_2') {
      coreStr = `\\log_2(${argStr})`;
    } else if (id === 'log_half') {
      coreStr = `\\log_{0.5}(${argStr})`;
    } else if (id === 'ln') {
      coreStr = `\\ln(${argStr})`;
    } else if (id === 'arcsin') {
      coreStr = `\\arcsin(${argStr})`;
    } else if (id === 'arccos') {
      coreStr = `\\arccos(${argStr})`;
    } else if (id === 'arctg') {
      coreStr = `\\operatorname{arctg}(${argStr})`;
    } else if (id === 'arcctg') {
      coreStr = `\\operatorname{arcctg}(${argStr})`;
    } else {
      coreStr = `f(${argStr})`;
    }

    // Вертикальный коэффициент k
    let fullStr = coreStr;
    if (effK !== 1) {
      if (effK === -1) {
        fullStr = `-${coreStr}`;
      } else {
        fullStr = `${effK} \\cdot ${coreStr}`;
      }
    }

    // Вертикальный сдвиг b
    if (b !== 0) {
      let bText = Math.abs(b);
      if (baseInfo.isInvTrig) {
        const piTex = toLatexPi(Math.abs(b));
        if (piTex) bText = piTex;
      }
      fullStr = b > 0 ? `${fullStr} + ${bText}` : `${fullStr} - ${bText}`;
    }

    // Внешний модуль
    if (absOuter) {
      fullStr = `\\left| ${fullStr} \\right|`;
    }

    return `y = ${fullStr}`;
  }

  /**
   * Возвращает список шагов преобразований для текущих параметров
   */
  function getActiveStepsList(params) {
    const steps = [];
    const a = params.a ?? 0;
    const b = params.b ?? 0;
    const k = params.k ?? 1;
    const m = params.m ?? 1;
    const absOuter = Boolean(params.absOuter);
    const absInner = Boolean(params.absInner);
    const symOx = Boolean(params.symOx);
    const symOy = Boolean(params.symOy);

    steps.push({
      step: 0,
      title: 'Базовый график',
      desc: 'Исходное положение функции y = f(x)'
    });

    if (absInner) {
      steps.push({
        step: steps.length,
        title: 'Внутренний модуль f(|x|)',
        desc: 'Стирание левой полуплоскости (x < 0) и зеркальное отражение правой налево (четность)'
      });
    }

    if (symOy || m < 0) {
      steps.push({
        step: steps.length,
        title: 'Отражение по Oy: f(-x)',
        desc: 'Зеркальное отражение графика слева направо'
      });
    }

    if (Math.abs(m) !== 1 && m !== 0) {
      let factor = Math.abs(m);
      steps.push({
        step: steps.length,
        title: `Масштаб по Ox: f(${factor}x)`,
        desc: factor > 1 ? `Сжатие к оси Oy в ${factor} раз(а)` : `Растяжение от оси Oy в ${(1/factor).toFixed(1)} раз(а)`
      });
    }

    if (a !== 0) {
      steps.push({
        step: steps.length,
        title: `Сдвиг по Ox: f(x - (${a}))`,
        desc: a > 0 ? `Сдвиг вправо на ${a} ед.` : `Сдвиг влево на ${Math.abs(a)} ед.`
      });
    }

    if (symOx || k < 0) {
      steps.push({
        step: steps.length,
        title: 'Отражение по Ox: -f(x)',
        desc: 'Зеркальное отражение графика сверху вниз'
      });
    }

    if (Math.abs(k) !== 1) {
      let factor = Math.abs(k);
      steps.push({
        step: steps.length,
        title: `Масштаб по Oy: ${factor} * f(x)`,
        desc: factor > 1 ? `Растяжение от оси Ox в ${factor} раз(а)` : `Сжатие к оси Ox в ${(1/factor).toFixed(1)} раз(а)`
      });
    }

    if (b !== 0) {
      steps.push({
        step: steps.length,
        title: `Сдвиг по Oy: f(x) + (${b})`,
        desc: b > 0 ? `Сдвиг вверх на ${b} ед.` : `Сдвиг вниз на ${Math.abs(b)} ед.`
      });
    }

    if (absOuter) {
      steps.push({
        step: steps.length,
        title: 'Внешний модуль |f(x)|',
        desc: 'Все части графика ниже оси Ox зеркально отражены наверх'
      });
    }

    return steps;
  }

  return {
    RULES: TRANSFORMATION_RULES,
    evaluateTransformed,
    transformKeyPoint,
    transformAsymptotes,
    buildFormulaString,
    getActiveStepsList,
    formatNumber
  };
}));
