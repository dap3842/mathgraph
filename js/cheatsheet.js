/**
 * cheatsheet.js
 * Шпаргалка для быстрой подготовки к зачёту по графикам функций и преобразованиям.
 * Структурирована для максимальной скорости повторения:
 * - Сводная таблица функций (D(f), E(f), краткое описание для зачета, опорные точки, асимптоты)
 * - Сводная матрица преобразований (формула -> изменение координат)
 * - Пошаговый порядок построения сложных функций
 * - Кнопка печати / сохранения в PDF (window.print())
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CheatSheet = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  let containerEl = null;

  function init(targetContainer) {
    containerEl = targetContainer;
    renderCheatSheet();
  }

  function renderCheatSheet() {
    if (!containerEl) return;

    containerEl.innerHTML = `
      <div class="cheat-header-bar">
        <div>
          <h2>Экспресс-шпаргалка к зачёту</h2>
          <p class="cheat-subtitle">Краткая сводка: графики, их краткие описания и правила преобразований для сдачи зачета</p>
        </div>
        <button class="btn btn-primary btn-print" id="btn-print-cheatsheet">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Распечатать / Сохранить в PDF
        </button>
      </div>

      <!-- БЛОК 1: ПАСПОРТ БАЗОВЫХ ГРАФИКОВ С КРАТКИМ ОПИСАНИЕМ -->
      <section class="cheat-section">
        <h3 class="section-title">
          <span class="section-badge">Часть 1</span>
          Сводная таблица базовых графиков к зачёту
        </h3>
        <div class="table-responsive">
          <table class="cheat-table">
            <thead>
              <tr>
                <th style="min-width: 140px;">Функция</th>
                <th style="min-width: 220px;">Краткое описание графика</th>
                <th>Область D(f)</th>
                <th>Область E(f)</th>
                <th>Опорные точки наизусть</th>
                <th>Асимптоты</th>
                <th>Чётность</th>
              </tr>
            </thead>
            <tbody>
              ${window.MathCore.FUNCTIONS.map(fn => `
                <tr>
                  <td><b>${fn.name}</b><br><span class="math-inline">${fn.latex}</span></td>
                  <td><div class="short-test-desc"><b>${fn.shortTestDesc || fn.description}</b></div></td>
                  <td><span class="math-inline">${fn.domain}</span></td>
                  <td><span class="math-inline">${fn.range}</span></td>
                  <td>
                    ${fn.keyPoints.slice(0, 3).map(p => p.label).join(', ')}
                  </td>
                  <td>
                    ${fn.asymptotes.length ? fn.asymptotes.map(a => a.label).join('; ') : '—'}
                  </td>
                  <td>${fn.parity === 'even' ? 'Чётная' : fn.parity === 'odd' ? 'Нечётная' : 'Общего вида'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- БЛОК 2: ТАБЛИЦА ВСЕХ ПРЕОБРАЗОВАНИЙ -->
      <section class="cheat-section">
        <h3 class="section-title">
          <span class="section-badge">Часть 2</span>
          Таблица всех преобразований графиков
        </h3>
        <div class="table-responsive">
          <table class="cheat-table">
            <thead>
              <tr>
                <th>Преобразование</th>
                <th>Геометрическое действие</th>
                <th>Точка (x₀; y₀) переходит в:</th>
                <th>Мнемоническое правило</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>y = f(x - a)</b></td>
                <td>Сдвиг вдоль оси <b>Ox</b> на <b>a</b> единиц</td>
                <td><span class="math-inline">(x_0 + a; \\; y_0)</span></td>
                <td>Если минус — вправо; если плюс — влево</td>
              </tr>
              <tr>
                <td><b>y = f(x) + b</b></td>
                <td>Сдвиг вдоль оси <b>Oy</b> на <b>b</b> единиц</td>
                <td><span class="math-inline">(x_0; \\; y_0 + b)</span></td>
                <td>Плюс — вверх; минус — вниз</td>
              </tr>
              <tr>
                <td><b>y = k · f(x)</b></td>
                <td>Растяжение/сжатие вдоль оси <b>Oy</b></td>
                <td><span class="math-inline">(x_0; \\; k \\cdot y_0)</span></td>
                <td>|k| &gt; 1: растяжение от Ox; 0 &lt; |k| &lt; 1: сжатие к Ox</td>
              </tr>
              <tr>
                <td><b>y = f(m · x)</b></td>
                <td>Сжатие/растяжение вдоль оси <b>Ox</b></td>
                <td><span class="math-inline">(\\frac{x_0}{m}; \\; y_0)</span></td>
                <td>|m| &gt; 1: сжатие к Oy в m раз; |m| &lt; 1: растяжение</td>
              </tr>
              <tr>
                <td><b>y = -f(x)</b></td>
                <td>Симметрия относительно оси <b>Ox</b></td>
                <td><span class="math-inline">(x_0; \\; -y_0)</span></td>
                <td>Верх меняется с низом (переворот)</td>
              </tr>
              <tr>
                <td><b>y = f(-x)</b></td>
                <td>Симметрия относительно оси <b>Oy</b></td>
                <td><span class="math-inline">(-x_0; \\; y_0)</span></td>
                <td>Лево меняется с право</td>
              </tr>
              <tr>
                <td><b>y = -f(-x)</b></td>
                <td>Симметрия относительно центра <b>O(0,0)</b></td>
                <td><span class="math-inline">(-x_0; \\; -y_0)</span></td>
                <td>Поворот на 180° вокруг начала координат</td>
              </tr>
              <tr>
                <td><b>y = |f(x)|</b></td>
                <td>Внешний модуль (частичная симметрия)</td>
                <td><span class="math-inline">(x_0; \\; |y_0|)</span></td>
                <td>Всё, что ниже оси Ox, зеркально перекидываем наверх</td>
              </tr>
              <tr>
                <td><b>y = f(|x|)</b></td>
                <td>Внутренний модуль (четность)</td>
                <td><span class="math-inline">x_0 \\ge 0: (\\pm x_0; y_0)</span></td>
                <td>Левую часть стираем, правую зеркалим налево</td>
              </tr>
              <tr>
                <td><b>y = |f(|x|)|</b></td>
                <td>Двойной модуль</td>
                <td>Композиция двух правил</td>
                <td>Сначала f(|x|), затем весь низ отбиваем наверх</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- БЛОК 3: АЛГОРИТМ ПОСТРОЕНИЯ СЛОЖНЫХ ГРАФИКОВ -->
      <section class="cheat-section">
        <h3 class="section-title">
          <span class="section-badge">Часть 3</span>
          Порядок действий при построении y = A · f(B(x - C)) + D
        </h3>
        <div class="cheat-pipeline-box">
          <div class="pipeline-step-card">
            <div class="p-num">1</div>
            <div class="p-title">Базовый график</div>
            <div class="p-desc">Строим узловые точки базовой функции y = f(x)</div>
          </div>
          <div class="pipeline-arrow">→</div>
          <div class="pipeline-step-card">
            <div class="p-num">2</div>
            <div class="p-title">Сжатие по Ox</div>
            <div class="p-desc">y = f(B · x): сжимаем к оси Oy в B раз (x' = x/B)</div>
          </div>
          <div class="pipeline-arrow">→</div>
          <div class="pipeline-step-card">
            <div class="p-num">3</div>
            <div class="p-title">Сдвиг по Ox</div>
            <div class="p-desc">y = f(B(x - C)): сдвигаем по горизонтали на C единиц</div>
          </div>
          <div class="pipeline-arrow">→</div>
          <div class="pipeline-step-card">
            <div class="p-num">4</div>
            <div class="p-title">Масштаб по Oy</div>
            <div class="p-desc">y = A · f(...): растягиваем/сжимаем по вертикали в A раз</div>
          </div>
          <div class="pipeline-arrow">→</div>
          <div class="pipeline-step-card">
            <div class="p-num">5</div>
            <div class="p-title">Сдвиг по Oy</div>
            <div class="p-desc">y = ... + D: поднимаем на D вверх или опускаем вниз</div>
          </div>
        </div>
      </section>

      <!-- БЛОК 4: ЭКСПРЕСС-ПАМЯТКА ДЛЯ ЗАЧЕТА -->
      <section class="cheat-section">
        <h3 class="section-title">
          <span class="section-badge">Часть 4</span>
          Короткая памятка для отличного ответа
        </h3>
        <div class="quick-tips-grid">
          <div class="tip-card">
            <h4>💡 Как моментально вспомнить сдвиг аргумента?</h4>
            <p>В уравнении <b>f(x - 3)</b> выражение обращается в 0 при <b>x = 3</b> (справа от нуля!). Поэтому сдвиг идёт <b>вправо</b>. В <b>f(x + 3)</b> ноль при <b>x = -3</b> — сдвиг <b>влево</b>.</p>
          </div>
          <div class="tip-card">
            <h4>💡 Как строить сумму двух модулей (|x - a| + |x - b|)?</h4>
            <p>«Корыто»: найдите нули модулей <b>a</b> и <b>b</b>. Посчитайте значения в этих точках (оно равно <b>|b - a|</b>) и соедините горизонтальным отрезком («дно»). Влево и вправо проведите лучи с наклоном <b>k = ±2</b>.</p>
          </div>
          <div class="tip-card">
            <h4>💡 Сравнение логарифмов и экспонент</h4>
            <p>При <b>a &gt; 1</b> функции возрастают. При <b>0 &lt; a &lt; 1</b> — строго убывают. Экспонента всегда проходит через <b>(0; 1)</b> и имеет горизонтальную асимптоту <b>y = 0</b>. Логарифм проходит через <b>(1; 0)</b> и имеет вертикальную асимптоту <b>x = 0</b>.</p>
          </div>
          <div class="tip-card">
            <h4>💡 Обратные тригонометрические функции</h4>
            <p><b>arcsin(x)</b> и <b>arccos(x)</b> существуют ТОЛЬКО на отрезке <b>[-1; 1]</b>! <b>arctg(x)</b> существует везде и зажат между горизонтальными асимптотами <b>y = ±π/2</b>.</p>
          </div>
        </div>
      </section>
    `;

    if (window.renderAllMathIn) {
      window.renderAllMathIn(containerEl);
    }

    const printBtn = document.getElementById('btn-print-cheatsheet');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
  }

  return {
    init,
    renderCheatSheet
  };
}));
