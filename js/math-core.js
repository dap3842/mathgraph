/**
 * math-core.js
 * База математических функций для зачета по графикам и их преобразованиям.
 * Включает точные формулы, D(f), E(f), ключевые опорные точки, асимптоты, свойства,
 * краткие описания для зачёта и настройки центрирования/масштаба.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MathCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Вспомогательная функция для кубического корня от отрицательных чисел
  function cbrt(x) {
    return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3);
  }

  const FUNCTIONS = [
    // -------------------------------------------------------------
    // 1. ЛИНЕЙНЫЕ И МОДУЛИ
    // -------------------------------------------------------------
    {
      id: 'linear_prop',
      name: 'Прямая пропорциональность',
      category: 'linear_abs',
      categoryName: 'Линейные и модуль',
      latex: 'y = x',
      unicode: 'y = x',
      description: 'Биссектриса I и III координатных углов. Проходит через начало координат под углом 45°.',
      shortTestDesc: 'Прямая под 45° через (0;0), биссектриса I и III четвертей',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = \\mathbb{R}',
      parity: 'odd',
      parityText: 'Нечетная (симметрия относительно O(0,0))',
      period: null,
      originYRatio: 0.5,
      defaultScale: 40,
      fn: (x) => x,
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0)' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: -1, label: '(-1; -1)' }
      ],
      defaultDomain: [-6, 6]
    },
    {
      id: 'linear_general',
      name: 'Линейная функция общего вида',
      category: 'linear_abs',
      categoryName: 'Линейные и модуль',
      latex: 'y = -0.5x + 2',
      unicode: 'y = -0.5x + 2',
      description: 'Прямая с отрицательным угловым коэффициентом (k = -0.5, b = 2). Убывает на всей числовой прямой.',
      shortTestDesc: 'Наклонная прямая: убывает при k < 0, сдвиг по Oy равен b',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = \\mathbb{R}',
      parity: 'neither',
      parityText: 'Общего вида',
      period: null,
      originYRatio: 0.5,
      defaultScale: 38,
      fn: (x) => -0.5 * x + 2,
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 2, label: '(0; 2)' },
        { x: 4, y: 0, label: '(4; 0)' },
        { x: 2, y: 1, label: '(2; 1)' }
      ],
      defaultDomain: [-6, 6]
    },
    {
      id: 'linear_const',
      name: 'Функция-константа',
      category: 'linear_abs',
      categoryName: 'Линейные и модуль',
      latex: 'y = 2',
      unicode: 'y = 2',
      description: 'Горизонтальная прямая, параллельная оси абсцисс Ox. Коэффициент k = 0.',
      shortTestDesc: 'Горизонтальная прямая параллельно Ox на высоте b',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = \\{2\\}',
      parity: 'even',
      parityText: 'Четная (симметрия относительно Oy)',
      period: null,
      originYRatio: 0.5,
      defaultScale: 40,
      fn: () => 2,
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 2, label: '(0; 2)' },
        { x: 2, y: 2, label: '(2; 2)' },
        { x: -2, y: 2, label: '(-2; 2)' }
      ],
      defaultDomain: [-6, 6]
    },
    {
      id: 'abs',
      name: 'Модуль аргумента',
      category: 'linear_abs',
      categoryName: 'Линейные и модуль',
      latex: 'y = |x|',
      unicode: 'y = |x|',
      description: '«Галочка» с прямым углом (90°) при вершине в точке (0; 0). Зеркальное отражение правой половины налево.',
      shortTestDesc: '«Галочка» под углом 90° с вершиной в (0;0), четная',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = [0; +\\infty)',
      parity: 'even',
      parityText: 'Четная (осевая симметрия относительно Oy)',
      period: null,
      originYRatio: 0.72,
      defaultScale: 40,
      fn: (x) => Math.abs(x),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0) вершина' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: 1, label: '(-1; 1)' },
        { x: 2, y: 2, label: '(2; 2)' }
      ],
      defaultDomain: [-6, 6]
    },
    {
      id: 'two_abs_sum',
      name: 'Сумма двух модулей («Корыто»)',
      category: 'two_abs',
      categoryName: 'Суммы модулей',
      latex: 'y = |x - 1| + |x + 2|',
      unicode: 'y = |x - 1| + |x + 2|',
      description: 'График типа «корыто». Между нулями модулей (-2 и 1) дно постоянно и равно расстоянию между ними (3). По краям — лучи с наклоном k = ±2.',
      shortTestDesc: '«Корыто»: плоское дно y = 3 на отрезке [-2; 1] и лучи с k = ±2',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = [3; +\\infty)',
      parity: 'neither',
      parityText: 'Симметрична относительно x = -0.5',
      period: null,
      originYRatio: 0.84, // Опускаем ось вниз, чтобы все корыто и лучи были видны!
      defaultScale: 24,   // Масштаб для комфортного обзора дна и уходящих вверх лучей
      fn: (x) => Math.abs(x - 1) + Math.abs(x + 2),
      asymptotes: [],
      keyPoints: [
        { x: -2, y: 3, label: '(-2; 3)' },
        { x: 1, y: 3, label: '(1; 3)' },
        { x: -0.5, y: 3, label: '(-0.5; 3) дно' },
        { x: -3, y: 5, label: '(-3; 5)' },
        { x: 2, y: 5, label: '(2; 5)' }
      ],
      defaultDomain: [-6, 6]
    },
    {
      id: 'two_abs_diff',
      name: 'Разность двух модулей («Ступенька»)',
      category: 'two_abs',
      categoryName: 'Суммы модулей',
      latex: 'y = |x - 1| - |x + 2|',
      unicode: 'y = |x - 1| - |x + 2|',
      description: 'График типа «ступенька». Слева нижнее плато (y = -3), справа верхнее плато (y = 3), между ними наклонный отрезок с k = -2.',
      shortTestDesc: '«Ступенька»: плато y = 3 при x < -2, плато y = -3 при x > 1, наклон с k = -2',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = [-3; 3]',
      parity: 'neither',
      parityText: 'Центральная симметрия относительно (-0.5; 0)',
      period: null,
      originYRatio: 0.5,
      defaultScale: 32,
      fn: (x) => Math.abs(x - 1) - Math.abs(x + 2),
      asymptotes: [],
      keyPoints: [
        { x: -2, y: 3, label: '(-2; 3)' },
        { x: 1, y: -3, label: '(1; -3)' },
        { x: -0.5, y: 0, label: '(-0.5; 0)' },
        { x: -4, y: 3, label: '(-4; 3)' },
        { x: 3, y: -3, label: '(3; -3)' }
      ],
      defaultDomain: [-6, 6]
    },

    // -------------------------------------------------------------
    // 2. СТЕПЕННЫЕ ФУНКЦИИ
    // -------------------------------------------------------------
    {
      id: 'parabola',
      name: 'Квадратичная парабола',
      category: 'powers',
      categoryName: 'Степенные функции',
      latex: 'y = x^2',
      unicode: 'y = x²',
      description: 'Классическая парабола с вершиной в (0; 0). Шаг от вершины: 1 влево/вправо → 1 вверх, 2 в стороны → 4 вверх, 3 в стороны → 9 вверх.',
      shortTestDesc: 'Парабола с вершиной в (0;0), ветви вверх, шаг приращений 1, 3, 5 клеток',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = [0; +\\infty)',
      parity: 'even',
      parityText: 'Четная (ось симметрии Oy)',
      period: null,
      originYRatio: 0.72,
      defaultScale: 36,
      fn: (x) => x * x,
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0) вершина' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: 1, label: '(-1; 1)' },
        { x: 2, y: 4, label: '(2; 4)' },
        { x: -2, y: 4, label: '(-2; 4)' }
      ],
      defaultDomain: [-4, 4]
    },
    {
      id: 'cube',
      name: 'Кубическая парабола',
      category: 'powers',
      categoryName: 'Степенные функции',
      latex: 'y = x^3',
      unicode: 'y = x³',
      description: 'Кубическая парабола с точкой перегиба в (0; 0). Правая ветвь устремлена вверх, левая — вниз. В окрестности нуля прижимается к Ox.',
      shortTestDesc: 'S-образная кривая, точка перегиба в (0;0), нечетная функция',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = \\mathbb{R}',
      parity: 'odd',
      parityText: 'Нечетная (центр симметрии O(0,0))',
      period: null,
      originYRatio: 0.5,
      defaultScale: 32,
      fn: (x) => x * x * x,
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0) перегиб' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: -1, label: '(-1; -1)' },
        { x: 2, y: 8, label: '(2; 8)' },
        { x: -2, y: -8, label: '(-2; -8)' }
      ],
      defaultDomain: [-3, 3]
    },
    {
      id: 'power4',
      name: 'Степенная функция 4-й степени',
      category: 'powers',
      categoryName: 'Степенные функции',
      latex: 'y = x^4',
      unicode: 'y = x⁴',
      description: 'Четная степенная функция. Дно параболы в интервале (-1; 1) более плоское, а за его пределами ветви взлетают круче x².',
      shortTestDesc: 'Четная чаша с плоским дном на (-1; 1) и очень крутыми ветвями',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = [0; +\\infty)',
      parity: 'even',
      parityText: 'Четная (ось симметрии Oy)',
      period: null,
      originYRatio: 0.72,
      defaultScale: 34,
      fn: (x) => Math.pow(x, 4),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0)' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: 1, label: '(-1; 1)' },
        { x: 2, y: 16, label: '(2; 16)' }
      ],
      defaultDomain: [-2.5, 2.5]
    },
    {
      id: 'power5',
      name: 'Степенная функция 5-й степени',
      category: 'powers',
      categoryName: 'Степенные функции',
      latex: 'y = x^5',
      unicode: 'y = x⁵',
      description: 'Нечетная степенная функция с быстрым ростом. В интервале (-1; 1) почти сливается с осью Ox.',
      shortTestDesc: 'Нечетная кривая, приплюснута к Ox около нуля, быстрее x³',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = \\mathbb{R}',
      parity: 'odd',
      parityText: 'Нечетная (симметрия относительно O(0,0))',
      period: null,
      originYRatio: 0.5,
      defaultScale: 32,
      fn: (x) => Math.pow(x, 5),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0)' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: -1, label: '(-1; -1)' }
      ],
      defaultDomain: [-2.2, 2.2]
    },

    // -------------------------------------------------------------
    // 3. КОРНИ И ДРОБНЫЕ СТЕПЕНИ
    // -------------------------------------------------------------
    {
      id: 'sqrt',
      name: 'Квадратный корень',
      category: 'roots',
      categoryName: 'Корни и дробные степени',
      latex: 'y = \\sqrt{x}',
      unicode: 'y = √x',
      description: 'Верхняя ветвь параболы, положенной на бок. Определена только для неотрицательных чисел (x >= 0). В начале координат касательная вертикальна.',
      shortTestDesc: 'Половина параболы на боку: только при x ≥ 0, рост плавно затухает',
      domain: 'D(f) = [0; +\\infty)',
      range: 'E(f) = [0; +\\infty)',
      parity: 'neither',
      parityText: 'Общего вида (определена при x >= 0)',
      period: null,
      originYRatio: 0.72,
      defaultScale: 32,
      fn: (x) => x < 0 ? NaN : Math.sqrt(x),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0)' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: 4, y: 2, label: '(4; 2)' },
        { x: 9, y: 3, label: '(9; 3)' }
      ],
      defaultDomain: [-1, 10]
    },
    {
      id: 'cbrt',
      name: 'Кубический корень',
      category: 'roots',
      categoryName: 'Корни и дробные степени',
      latex: 'y = \\sqrt[3]{x}',
      unicode: 'y = ∛x',
      description: 'Кубическая парабола, повернутая на бок (отраженная относительно прямой y = x). Определена на всей числовой прямой.',
      shortTestDesc: 'Кубическая парабола на боку, определена на всей оси ℝ, нечетная',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = \\mathbb{R}',
      parity: 'odd',
      parityText: 'Нечетная (симметрия относительно O(0,0))',
      period: null,
      originYRatio: 0.5,
      defaultScale: 30,
      fn: (x) => cbrt(x),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0) перегиб' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: -1, label: '(-1; -1)' },
        { x: 8, y: 2, label: '(8; 2)' },
        { x: -8, y: -2, label: '(-8; -2)' }
      ],
      defaultDomain: [-9, 9]
    },
    {
      id: 'power_2_3',
      name: 'Дробная степень x^(2/3)',
      category: 'roots',
      categoryName: 'Корни и дробные степени',
      latex: 'y = x^{2/3} = \\sqrt[3]{x^2}',
      unicode: 'y = x^(2/3)',
      description: '«Птичка» с острием в точке (0; 0). Четная функция, всегда неотрицательна, в нуле имеет точку возврата (касп).',
      shortTestDesc: '«Крылья чайки»: остриё в (0;0), четная функция, y ≥ 0',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = [0; +\\infty)',
      parity: 'even',
      parityText: 'Четная (симметрия относительно Oy)',
      period: null,
      originYRatio: 0.72,
      defaultScale: 30,
      fn: (x) => Math.pow(Math.abs(x), 2 / 3),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0) острие' },
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: 1, label: '(-1; 1)' },
        { x: 8, y: 4, label: '(8; 4)' },
        { x: -8, y: 4, label: '(-8; 4)' }
      ],
      defaultDomain: [-9, 9]
    },

    // -------------------------------------------------------------
    // 4. ДРОБНО-РАЦИОНАЛЬНЫЕ (ГИПЕРБОЛЫ)
    // -------------------------------------------------------------
    {
      id: 'hyperbola',
      name: 'Гипербола (обратная пропорциональность)',
      category: 'fractions',
      categoryName: 'Дроби и гиперболы',
      latex: 'y = \\frac{1}{x}',
      unicode: 'y = 1/x',
      description: 'Две ветви в I и III четвертях. Вертикальная асимптота x = 0 (ось Oy), горизонтальная асимптота y = 0 (ось Ox). Центр симметрии — O(0,0).',
      shortTestDesc: 'Гипербола в I и III четвертях, асимптоты x = 0 и y = 0',
      domain: 'D(f) = (-\\infty; 0) \\cup (0; +\\infty)',
      range: 'E(f) = (-\\infty; 0) \\cup (0; +\\infty)',
      parity: 'odd',
      parityText: 'Нечетная (симметрия относительно O(0,0))',
      period: null,
      originYRatio: 0.5,
      defaultScale: 36,
      fn: (x) => Math.abs(x) < 1e-7 ? (x >= 0 ? Infinity : -Infinity) : 1 / x,
      asymptotes: [
        { type: 'vertical', x: 0, label: 'x = 0' },
        { type: 'horizontal', y: 0, label: 'y = 0' }
      ],
      keyPoints: [
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: -1, label: '(-1; -1)' },
        { x: 2, y: 0.5, label: '(2; 0.5)' },
        { x: 0.5, y: 2, label: '(0.5; 2)' },
        { x: -2, y: -0.5, label: '(-2; -0.5)' }
      ],
      defaultDomain: [-6, 6]
    },
    {
      id: 'inv_sq',
      name: 'Обратная квадратичная («Вулкан»)',
      category: 'fractions',
      categoryName: 'Дроби и гиперболы',
      latex: 'y = \\frac{1}{x^2}',
      unicode: 'y = 1/x²',
      description: 'Обе ветви лежат в верхней полуплоскости (y > 0). При приближении к нулю с обеих сторон значения стремятся к +бесконечности.',
      shortTestDesc: '«Вулкан»: обе ветви вверху (y > 0), асимптоты x = 0 и y = 0, четная',
      domain: 'D(f) = (-\\infty; 0) \\cup (0; +\\infty)',
      range: 'E(f) = (0; +\\infty)',
      parity: 'even',
      parityText: 'Четная (осевая симметрия относительно Oy)',
      period: null,
      originYRatio: 0.72,
      defaultScale: 32,
      fn: (x) => Math.abs(x) < 1e-7 ? Infinity : 1 / (x * x),
      asymptotes: [
        { type: 'vertical', x: 0, label: 'x = 0' },
        { type: 'horizontal', y: 0, label: 'y = 0' }
      ],
      keyPoints: [
        { x: 1, y: 1, label: '(1; 1)' },
        { x: -1, y: 1, label: '(-1; 1)' },
        { x: 2, y: 0.25, label: '(2; 0.25)' },
        { x: -2, y: 0.25, label: '(-2; 0.25)' },
        { x: 0.5, y: 4, label: '(0.5; 4)' }
      ],
      defaultDomain: [-5, 5]
    },

    // -------------------------------------------------------------
    // 5. ПОКАЗАТЕЛЬНЫЕ И ЛОГАРИФМИЧЕСКИЕ
    // -------------------------------------------------------------
    {
      id: 'exp_2',
      name: 'Показательная функция (a > 1)',
      category: 'exp_log',
      categoryName: 'Показательные и логарифмы',
      latex: 'y = 2^x',
      unicode: 'y = 2ˣ',
      description: 'Быстрый лавинообразный рост. Всегда положительна (парит над Ox). Горизонтальная асимптота y = 0 при x → -∞. Фундаментальная точка — (0; 1).',
      shortTestDesc: 'Быстро возрастает, всегда y > 0, точка (0;1), асимптота y = 0 слева',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = (0; +\\infty)',
      parity: 'neither',
      parityText: 'Общего вида',
      period: null,
      originYRatio: 0.72,
      defaultScale: 36,
      fn: (x) => Math.pow(2, x),
      asymptotes: [
        { type: 'horizontal', y: 0, label: 'y = 0 (x → -∞)' }
      ],
      keyPoints: [
        { x: 0, y: 1, label: '(0; 1)' },
        { x: 1, y: 2, label: '(1; 2)' },
        { x: 2, y: 4, label: '(2; 4)' },
        { x: -1, y: 0.5, label: '(-1; 0.5)' }
      ],
      defaultDomain: [-4, 4]
    },
    {
      id: 'exp_half',
      name: 'Показательная функция (0 < a < 1)',
      category: 'exp_log',
      categoryName: 'Показательные и логарифмы',
      latex: 'y = (0.5)^x = \\left(\\frac{1}{2}\\right)^x',
      unicode: 'y = (1/2)ˣ',
      description: 'Убывающая показательная функция. Зеркальна графику 2^x относительно оси Oy (так как (1/2)^x = 2^(-x)). Асимптота y = 0 при x → +∞.',
      shortTestDesc: 'Убывает к нулю, всегда y > 0, точка (0;1), асимптота y = 0 справа',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = (0; +\\infty)',
      parity: 'neither',
      parityText: 'Общего вида (симметрична 2^x относительно Oy)',
      period: null,
      originYRatio: 0.72,
      defaultScale: 36,
      fn: (x) => Math.pow(0.5, x),
      asymptotes: [
        { type: 'horizontal', y: 0, label: 'y = 0 (x → +∞)' }
      ],
      keyPoints: [
        { x: 0, y: 1, label: '(0; 1)' },
        { x: 1, y: 0.5, label: '(1; 0.5)' },
        { x: -1, y: 2, label: '(-1; 2)' },
        { x: -2, y: 4, label: '(-2; 4)' }
      ],
      defaultDomain: [-4, 4]
    },
    {
      id: 'exp_e',
      name: 'Экспонента (основание e)',
      category: 'exp_log',
      categoryName: 'Показательные и логарифмы',
      latex: 'y = e^x',
      unicode: 'y = eˣ',
      description: 'Главная функция математического анализа (e ≈ 2.718). В точке (0; 1) касательная наклонена ровно под углом 45° (производная равна самой функции).',
      shortTestDesc: 'Экспонента Эйлера: рост e^x, проходит через (0;1) и (1; e ≈ 2.72)',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = (0; +\\infty)',
      parity: 'neither',
      parityText: 'Общего вида',
      period: null,
      originYRatio: 0.72,
      defaultScale: 36,
      fn: (x) => Math.exp(x),
      asymptotes: [
        { type: 'horizontal', y: 0, label: 'y = 0' }
      ],
      keyPoints: [
        { x: 0, y: 1, label: '(0; 1)' },
        { x: 1, y: 2.72, label: '(1; e ≈ 2.72)' },
        { x: -1, y: 0.37, label: '(-1; 1/e ≈ 0.37)' }
      ],
      defaultDomain: [-4, 4]
    },
    {
      id: 'log_2',
      name: 'Логарифмическая функция (a > 1)',
      category: 'exp_log',
      categoryName: 'Показательные и логарифмы',
      latex: 'y = \\log_2 x',
      unicode: 'y = log₂(x)',
      description: 'Обратная к функции 2^x (симметрия относительно прямой y = x). Определена строго при x > 0. Вертикальная асимптота x = 0 (ось Oy). Фундаментальная точка — (1; 0).',
      shortTestDesc: 'Возрастает, существует только при x > 0, корень (1;0), асимптота x = 0',
      domain: 'D(f) = (0; +\\infty)',
      range: 'E(f) = \\mathbb{R}',
      parity: 'neither',
      parityText: 'Общего вида (определена при x > 0)',
      period: null,
      originYRatio: 0.5,
      defaultScale: 34,
      fn: (x) => x <= 0 ? NaN : Math.log2(x),
      asymptotes: [
        { type: 'vertical', x: 0, label: 'x = 0' }
      ],
      keyPoints: [
        { x: 1, y: 0, label: '(1; 0) корень' },
        { x: 2, y: 1, label: '(2; 1)' },
        { x: 4, y: 2, label: '(4; 2)' },
        { x: 0.5, y: -1, label: '(0.5; -1)' }
      ],
      defaultDomain: [-1, 9]
    },
    {
      id: 'log_half',
      name: 'Логарифмическая функция (0 < a < 1)',
      category: 'exp_log',
      categoryName: 'Показательные и логарифмы',
      latex: 'y = \\log_{0.5} x = \\log_{1/2} x',
      unicode: 'y = log₀.₅(x)',
      description: 'Убывающий логарифм. Зеркален графику log_2(x) относительно оси Ox (так как log_(1/2) x = -log_2 x). При приближении к нулю уходит в +∞.',
      shortTestDesc: 'Убывает, только при x > 0, корень (1;0), асимптота x = 0 уходит вверх',
      domain: 'D(f) = (0; +\\infty)',
      range: 'E(f) = \\mathbb{R}',
      parity: 'neither',
      parityText: 'Общего вида (симметричен log₂(x) относительно Ox)',
      period: null,
      originYRatio: 0.5,
      defaultScale: 34,
      fn: (x) => x <= 0 ? NaN : Math.log(x) / Math.log(0.5),
      asymptotes: [
        { type: 'vertical', x: 0, label: 'x = 0' }
      ],
      keyPoints: [
        { x: 1, y: 0, label: '(1; 0)' },
        { x: 0.5, y: 1, label: '(0.5; 1)' },
        { x: 2, y: -1, label: '(2; -1)' },
        { x: 4, y: -2, label: '(4; -2)' }
      ],
      defaultDomain: [-1, 9]
    },
    {
      id: 'ln',
      name: 'Натуральный логарифм (ln x)',
      category: 'exp_log',
      categoryName: 'Показательные и логарифмы',
      latex: 'y = \\ln x',
      unicode: 'y = ln(x)',
      description: 'Логарифм по основанию e. Симметричен графику e^x относительно биссектрисы y = x. В точке (1; 0) производная равна 1.',
      shortTestDesc: 'Логарифм по основанию e, корень в (1;0), асимптота x = 0',
      domain: 'D(f) = (0; +\\infty)',
      range: 'E(f) = \\mathbb{R}',
      parity: 'neither',
      parityText: 'Общего вида',
      period: null,
      originYRatio: 0.5,
      defaultScale: 34,
      fn: (x) => x <= 0 ? NaN : Math.log(x),
      asymptotes: [
        { type: 'vertical', x: 0, label: 'x = 0' }
      ],
      keyPoints: [
        { x: 1, y: 0, label: '(1; 0)' },
        { x: 2.72, y: 1, label: '(e ≈ 2.72; 1)' },
        { x: 0.37, y: -1, label: '(1/e; -1)' }
      ],
      defaultDomain: [-1, 9]
    },

    // -------------------------------------------------------------
    // 6. ТРИГОНОМЕТРИЧЕСКИЕ ФУНКЦИИ
    // -------------------------------------------------------------
    {
      id: 'sin',
      name: 'Синус',
      category: 'trig',
      categoryName: 'Тригонометрия',
      latex: 'y = \\sin x',
      unicode: 'y = sin(x)',
      description: 'Непрерывная волна (синусоида) с амплитудой 1. Проходит через начало координат (0; 0) с возрастанием. Период T = 2π.',
      shortTestDesc: 'Синусоида от -1 до 1, период 2π, нечетная, выходит из (0;0)',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = [-1; 1]',
      parity: 'odd',
      parityText: 'Нечетная (симметрия относительно O(0,0))',
      period: 'T = 2\\pi',
      isTrig: true,
      originYRatio: 0.5,
      defaultScale: 38,
      fn: (x) => Math.sin(x),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0)' },
        { x: Math.PI / 2, y: 1, label: '(π/2; 1)' },
        { x: Math.PI, y: 0, label: '(π; 0)' },
        { x: 3 * Math.PI / 2, y: -1, label: '(3π/2; -1)' },
        { x: 2 * Math.PI, y: 0, label: '(2π; 0)' }
      ],
      defaultDomain: [-7, 7]
    },
    {
      id: 'cos',
      name: 'Косинус',
      category: 'trig',
      categoryName: 'Тригонометрия',
      latex: 'y = \\cos x',
      unicode: 'y = cos(x)',
      description: 'Синусоида, сдвинутая влево на π/2 (cos x = sin(x + π/2)). В нуле достигает максимума в точке (0; 1). Период T = 2π.',
      shortTestDesc: 'Синусоида, период 2π, четная (ось Oy), стартует из максимума (0;1)',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = [-1; 1]',
      parity: 'even',
      parityText: 'Четная (осевая симметрия относительно Oy)',
      period: 'T = 2\\pi',
      isTrig: true,
      originYRatio: 0.5,
      defaultScale: 38,
      fn: (x) => Math.cos(x),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 1, label: '(0; 1)' },
        { x: Math.PI / 2, y: 0, label: '(π/2; 0)' },
        { x: Math.PI, y: -1, label: '(π; -1)' },
        { x: 3 * Math.PI / 2, y: 0, label: '(3π/2; 0)' },
        { x: 2 * Math.PI, y: 1, label: '(2π; 1)' }
      ],
      defaultDomain: [-7, 7]
    },
    {
      id: 'tg',
      name: 'Тангенс',
      category: 'trig',
      categoryName: 'Тригонометрия',
      latex: 'y = \\operatorname{tg} x',
      unicode: 'y = tg(x)',
      description: 'Периодическая функция с периодом T = π. Вертикальные асимптоты в точках x = π/2 + πk. Возрастает на каждом периоде.',
      shortTestDesc: 'Возрастает в полосах шириной π, период π, асимптоты x = π/2 + πk',
      domain: 'D(f) = x \\neq \\frac{\\pi}{2} + \\pi k',
      range: 'E(f) = \\mathbb{R}',
      parity: 'odd',
      parityText: 'Нечетная (симметрия относительно O(0,0))',
      period: 'T = \\pi',
      isTrig: true,
      originYRatio: 0.5,
      defaultScale: 34,
      fn: (x) => {
        const norm = (x % Math.PI + Math.PI) % Math.PI;
        if (Math.abs(norm - Math.PI / 2) < 1e-4) return NaN;
        return Math.tan(x);
      },
      asymptotes: [
        { type: 'vertical', x: -Math.PI / 2, label: 'x = -π/2' },
        { type: 'vertical', x: Math.PI / 2, label: 'x = π/2' },
        { type: 'vertical', x: 3 * Math.PI / 2, label: 'x = 3π/2' }
      ],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0)' },
        { x: Math.PI / 4, y: 1, label: '(π/4; 1)' },
        { x: -Math.PI / 4, y: -1, label: '(-π/4; -1)' }
      ],
      defaultDomain: [-5, 5]
    },
    {
      id: 'ctg',
      name: 'Котангенс',
      category: 'trig',
      categoryName: 'Тригонометрия',
      latex: 'y = \\operatorname{ctg} x',
      unicode: 'y = ctg(x)',
      description: 'Периодическая функция с периодом T = π. Вертикальные асимптоты в точках x = πk. Убывает на каждом интервале определения.',
      shortTestDesc: 'Убывает на каждом интервале, период π, вертикальные асимптоты x = πk',
      domain: 'D(f) = x \\neq \\pi k',
      range: 'E(f) = \\mathbb{R}',
      parity: 'odd',
      parityText: 'Нечетная',
      period: 'T = \\pi',
      isTrig: true,
      originYRatio: 0.5,
      defaultScale: 34,
      fn: (x) => {
        const norm = (x % Math.PI + Math.PI) % Math.PI;
        if (norm < 1e-4 || Math.abs(norm - Math.PI) < 1e-4) return NaN;
        return 1 / Math.tan(x);
      },
      asymptotes: [
        { type: 'vertical', x: -Math.PI, label: 'x = -π' },
        { type: 'vertical', x: 0, label: 'x = 0' },
        { type: 'vertical', x: Math.PI, label: 'x = π' }
      ],
      keyPoints: [
        { x: Math.PI / 4, y: 1, label: '(π/4; 1)' },
        { x: Math.PI / 2, y: 0, label: '(π/2; 0)' },
        { x: 3 * Math.PI / 4, y: -1, label: '(3π/4; -1)' }
      ],
      defaultDomain: [-5, 5]
    },

    // -------------------------------------------------------------
    // 7. ОБРАТНЫЕ ТРИГОНОМЕТРИЧЕСКИЕ ФУНКЦИИ
    // -------------------------------------------------------------
    {
      id: 'arcsin',
      name: 'Арксинус',
      category: 'inv_trig',
      categoryName: 'Обратная тригонометрия',
      latex: 'y = \\arcsin x',
      unicode: 'y = arcsin(x)',
      description: 'Обратная к синусу на отрезке [-π/2; π/2]. Определена только для |x| <= 1. В граничных точках (-1; -π/2) и (1; π/2) касательные вертикальны.',
      shortTestDesc: 'Определен строго на [-1; 1], значения от -π/2 до π/2, нечетный',
      domain: 'D(f) = [-1; 1]',
      range: 'E(f) = [-\\frac{\\pi}{2}; \\frac{\\pi}{2}]',
      parity: 'odd',
      parityText: 'Нечетная (симметрия относительно O(0,0))',
      period: null,
      isInvTrig: true,
      originYRatio: 0.5,
      defaultScale: 48,
      fn: (x) => Math.abs(x) > 1 ? NaN : Math.asin(x),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0)' },
        { x: 1, y: Math.PI / 2, label: '(1; π/2)' },
        { x: -1, y: -Math.PI / 2, label: '(-1; -π/2)' },
        { x: 0.5, y: Math.PI / 6, label: '(0.5; π/6)' },
        { x: -0.5, y: -Math.PI / 6, label: '(-0.5; -π/6)' }
      ],
      defaultDomain: [-2.5, 2.5]
    },
    {
      id: 'arccos',
      name: 'Арккосинус',
      category: 'inv_trig',
      categoryName: 'Обратная тригонометрия',
      latex: 'y = \\arccos x',
      unicode: 'y = arccos(x)',
      description: 'Обратная к косинусу на отрезке [0; π]. Определена при |x| <= 1. Строго убывает. Центрально симметрична относительно точки (0; π/2).',
      shortTestDesc: 'Убывает от π до 0, строго на [-1; 1], симметрия относительно (0; π/2)',
      domain: 'D(f) = [-1; 1]',
      range: 'E(f) = [0; \\pi]',
      parity: 'neither',
      parityText: 'Центральная симметрия относительно точки (0; π/2)',
      period: null,
      isInvTrig: true,
      originYRatio: 0.65,
      defaultScale: 44,
      fn: (x) => Math.abs(x) > 1 ? NaN : Math.acos(x),
      asymptotes: [],
      keyPoints: [
        { x: 0, y: Math.PI / 2, label: '(0; π/2)' },
        { x: 1, y: 0, label: '(1; 0)' },
        { x: -1, y: Math.PI, label: '(-1; π)' },
        { x: 0.5, y: Math.PI / 3, label: '(0.5; π/3)' }
      ],
      defaultDomain: [-2.5, 2.5]
    },
    {
      id: 'arctg',
      name: 'Арктангенс',
      category: 'inv_trig',
      categoryName: 'Обратная тригонометрия',
      latex: 'y = \\operatorname{arctg} x',
      unicode: 'y = arctg(x)',
      description: 'Определена на всей числовой прямой. Зажата между двумя горизонтальными асимптотами y = π/2 (при x → +∞) и y = -π/2 (при x → -∞).',
      shortTestDesc: 'Возрастает на всей ℝ, зажата между асимптотами y = ±π/2',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = (-\\frac{\\pi}{2}; \\frac{\\pi}{2})',
      parity: 'odd',
      parityText: 'Нечетная (симметрия относительно O(0,0))',
      period: null,
      isInvTrig: true,
      originYRatio: 0.5,
      defaultScale: 38,
      fn: (x) => Math.atan(x),
      asymptotes: [
        { type: 'horizontal', y: Math.PI / 2, label: 'y = π/2' },
        { type: 'horizontal', y: -Math.PI / 2, label: 'y = -π/2' }
      ],
      keyPoints: [
        { x: 0, y: 0, label: '(0; 0)' },
        { x: 1, y: Math.PI / 4, label: '(1; π/4)' },
        { x: -1, y: -Math.PI / 4, label: '(-1; -π/4)' }
      ],
      defaultDomain: [-6, 6]
    },
    {
      id: 'arcctg',
      name: 'Арккотангенс',
      category: 'inv_trig',
      categoryName: 'Обратная тригонометрия',
      latex: 'y = \\operatorname{arcctg} x',
      unicode: 'y = arcctg(x)',
      description: 'Строго убывает на всей числовой прямой. Зажата между горизонтальными асимптотами y = π (при x → -∞) и y = 0 (при x → +∞). Центр симметрии — (0; π/2).',
      shortTestDesc: 'Убывает на всей ℝ, зажата между асимптотами y = π и y = 0',
      domain: 'D(f) = \\mathbb{R}',
      range: 'E(f) = (0; \\pi)',
      parity: 'neither',
      parityText: 'Центральная симметрия относительно точки (0; π/2)',
      period: null,
      isInvTrig: true,
      originYRatio: 0.65,
      defaultScale: 38,
      fn: (x) => Math.PI / 2 - Math.atan(x),
      asymptotes: [
        { type: 'horizontal', y: Math.PI, label: 'y = π' },
        { type: 'horizontal', y: 0, label: 'y = 0' }
      ],
      keyPoints: [
        { x: 0, y: Math.PI / 2, label: '(0; π/2)' },
        { x: 1, y: Math.PI / 4, label: '(1; π/4)' },
        { x: -1, y: 3 * Math.PI / 4, label: '(-1; 3π/4)' }
      ],
      defaultDomain: [-6, 6]
    }
  ];

  const CATEGORIES = [
    { id: 'all', name: 'Все графики' },
    { id: 'linear_abs', name: 'Линейные и модуль' },
    { id: 'two_abs', name: 'Суммы модулей' },
    { id: 'powers', name: 'Степенные' },
    { id: 'roots', name: 'Корни и степени' },
    { id: 'fractions', name: 'Дроби и гиперболы' },
    { id: 'exp_log', name: 'Показательные и логарифмы' },
    { id: 'trig', name: 'Тригонометрия' },
    { id: 'inv_trig', name: 'Обратная тригонометрия' }
  ];

  function getFunctionById(id) {
    return FUNCTIONS.find(f => f.id === id) || FUNCTIONS[0];
  }

  function getFunctionsByCategory(catId) {
    if (!catId || catId === 'all') return FUNCTIONS;
    return FUNCTIONS.filter(f => f.category === catId);
  }

  return {
    FUNCTIONS,
    CATEGORIES,
    getFunctionById,
    getFunctionsByCategory
  };
}));
