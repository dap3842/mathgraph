/**
 * canvas-engine.js
 * Высокопроизводительный движок рендеринга математических графиков на Canvas 2D.
 * Особенности:
 * - Поддержка High-DPI (Retina) дисплеев
 * - Адаптивная миллиметровка в светлом академическом стиле
 * - Умный выбор шага сетки (Nice Numbers 1, 2, 5) и тригонометрическая Pi-разметка
 * - Корректная обработка разрывов и вертикальных/горизонтальных асимптот
 * - Сенсорные жесты: 1 палец Pan, 2 пальца Pinch-to-Zoom, колесо мыши
 * - Инспектор координат с перекрестием
 * - Отрисовка опорных точек и векторов сдвига
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MathCanvas = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  class CartesianCanvas {
    constructor(canvasElement, options = {}) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
      this.options = Object.assign({
        isInteractive: true,
        showGrid: true,
        showAxes: true,
        showLabels: true,
        showAsymptotes: true,
        showKeyPoints: true,
        showCrosshair: true,
        isTrigMode: false,
        theme: 'light',
        defaultScale: 40, // пикселей на 1 математическую единицу
        minScale: 8,
        maxScale: 350,
        originX: null,
        originY: null
      }, options);

      // Визуальная палитра (Академическая миллиметровка)
      this.colors = {
        bg: '#F8FAFC',
        paperGridSub: '#EEF2F6',   // мелкая сетка (миллиметровка)
        paperGridMain: '#CBD5E1',  // основные линии сетки
        axis: '#334155',           // координатные оси
        axisText: '#475569',       // подписи делений
        ghost: 'rgba(100, 116, 139, 0.45)', // исходная функция y = f(x)
        primary: '#2563EB',        // преобразованная функция y = g(x)
        secondary: '#059669',      // вторая функция (сравнение)
        asymptote: '#DC2626',      // асимптоты
        vector: '#EA580C',         // вектор смещения
        anchor: '#1E293B',         // опорные точки
        crosshair: 'rgba(37, 99, 235, 0.3)'
      };

      // Масштаб и центр координат
      this.scale = this.options.defaultScale;
      this.originX = this.options.originX;
      this.originY = this.options.originY;

      // Слои функций для отрисовки
      this.layers = []; // { id, fn, params, style: 'active' | 'ghost' | 'secondary', asymptotes, keyPoints }

      // Состояние жестов
      this.pointerCache = new Map();
      this.prevPinchDist = null;
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.cursorMathX = null;
      this.cursorMathY = null;
      this.onInspectorMove = null;

      // Вектор сдвига (опционально)
      this.displacementVector = null; // { from: [x,y], to: [x,y], label: 'v' }

      this.init();
    }

    init() {
      this.resize();
      this.canvas.style.touchAction = 'none';

      if (this.options.isInteractive) {
        this.bindEvents();
      }

      // Наблюдатель изменения размеров контейнера
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.canvas);
      } else {
        window.addEventListener('resize', () => this.resize());
      }

      this.render();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Реальные пиксели холста
      this.width = rect.width;
      this.height = rect.height;

      if (this.width === 0 || this.height === 0) return;

      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);

      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);

      // Если центр не был задан, устанавливаем в центр экрана
      if (this.originX === null) this.originX = this.width / 2;
      if (this.originY === null) this.originY = this.height / 2;

      this.render();
    }

    bindEvents() {
      const el = this.canvas;

      // Pointer Events для универсальной работы мыши и тач-экрана
      el.addEventListener('pointerdown', (e) => {
        el.setPointerCapture?.(e.pointerId);
        this.pointerCache.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.pointerCache.size === 1) {
          this.isDragging = true;
          this.dragStartX = e.clientX - this.originX;
          this.dragStartY = e.clientY - this.originY;
        } else if (this.pointerCache.size === 2) {
          this.isDragging = false;
          this.prevPinchDist = this.getPinchDistance();
        }
      });

      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        [this.cursorMathX, this.cursorMathY] = this.screenToMath(mouseX, mouseY);

        if (this.onInspectorMove) {
          this.onInspectorMove(this.cursorMathX, this.cursorMathY);
        }

        if (this.pointerCache.has(e.pointerId)) {
          this.pointerCache.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        if (this.pointerCache.size === 1 && this.isDragging) {
          this.originX = e.clientX - this.dragStartX;
          this.originY = e.clientY - this.dragStartY;
          this.render();
        } else if (this.pointerCache.size === 2 && this.prevPinchDist !== null) {
          const currentDist = this.getPinchDistance();
          if (currentDist > 0) {
            const zoomFactor = currentDist / this.prevPinchDist;
            const mid = this.getPinchMidpoint();
            const canvasMidX = mid.x - rect.left;
            const canvasMidY = mid.y - rect.top;

            this.zoomAtPoint(canvasMidX, canvasMidY, zoomFactor);
            this.prevPinchDist = currentDist;
            this.render();
          }
        } else if (this.options.showCrosshair) {
          this.render();
        }
      });

      const onPointerEnd = (e) => {
        el.releasePointerCapture?.(e.pointerId);
        this.pointerCache.delete(e.pointerId);

        if (this.pointerCache.size === 0) {
          this.isDragging = false;
          this.prevPinchDist = null;
        } else if (this.pointerCache.size === 1) {
          // Возврат к панорамированию
          const remaining = Array.from(this.pointerCache.values())[0];
          this.isDragging = true;
          this.dragStartX = remaining.x - this.originX;
          this.dragStartY = remaining.y - this.originY;
        }
        this.render();
      };

      el.addEventListener('pointerup', onPointerEnd);
      el.addEventListener('pointercancel', onPointerEnd);
      el.addEventListener('pointerleave', () => {
        this.cursorMathX = null;
        this.cursorMathY = null;
        if (this.onInspectorMove) this.onInspectorMove(null, null);
        this.render();
      });

      // Зум колесиком мыши
      el.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomDelta = e.deltaY < 0 ? 1.15 : 0.87;
        this.zoomAtPoint(mouseX, mouseY, zoomDelta);
        this.render();
      }, { passive: false });

      // Двойной клик/тап: сброс масштаба и центрирование
      let lastTapTime = 0;
      el.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
          this.resetView();
        }
        lastTapTime = currentTime;
      });
    }

    getPinchDistance() {
      const pts = Array.from(this.pointerCache.values());
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }

    getPinchMidpoint() {
      const pts = Array.from(this.pointerCache.values());
      if (pts.length < 2) return { x: 0, y: 0 };
      return {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2
      };
    }

    zoomAtPoint(screenX, screenY, factor) {
      const newScale = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scale * factor));
      if (newScale === this.scale) return;

      const [mathX, mathY] = this.screenToMath(screenX, screenY);
      this.scale = newScale;

      // Корректируем смещение так, чтобы точка под курсором осталась на месте
      this.originX = screenX - mathX * this.scale;
      this.originY = screenY + mathY * this.scale;
    }

    resetView() {
      this.scale = this.options.defaultScale;
      this.originX = this.width / 2;
      this.originY = this.height / 2;
      this.render();
    }

    setZoom(scale) {
      const factor = scale / this.scale;
      this.zoomAtPoint(this.width / 2, this.height / 2, factor);
      this.render();
    }

    mathToScreen(mathX, mathY) {
      return [
        this.originX + mathX * this.scale,
        this.originY - mathY * this.scale
      ];
    }

    screenToMath(screenX, screenY) {
      return [
        (screenX - this.originX) / this.scale,
        (this.originY - screenY) / this.scale
      ];
    }

    clearLayers() {
      this.layers = [];
      this.displacementVector = null;
    }

    addLayer(layer) {
      this.layers.push(layer);
    }

    setDisplacementVector(fromX, fromY, toX, toY, label = '') {
      this.displacementVector = {
        from: [fromX, fromY],
        to: [toX, toY],
        label
      };
    }

    setTrigMode(isTrig) {
      this.options.isTrigMode = Boolean(isTrig);
      this.render();
    }

    /**
     * Основной цикл отрисовки Canvas
     */
    render() {
      if (!this.width || !this.height) return;
      const ctx = this.ctx;

      // 1. Очистка и заливка фона бумажной миллиметровки
      ctx.fillStyle = this.colors.bg;
      ctx.fillRect(0, 0, this.width, this.height);

      // 2. Сетка
      if (this.options.showGrid) {
        this.drawGrid();
      }

      // 3. Координатные оси
      if (this.options.showAxes) {
        this.drawAxes();
      }

      // 4. Отрисовка асимптот для всех слоев
      if (this.options.showAsymptotes) {
        this.drawAsymptotes();
      }

      // 5. Вектор смещения
      if (this.displacementVector) {
        this.drawVector();
      }

      // 6. Отрисовка графиков функций
      this.layers.forEach(layer => {
        this.drawFunctionLayer(layer);
      });

      // 7. Опорные характерные точки
      if (this.options.showKeyPoints) {
        this.drawKeyPoints();
      }

      // 8. Инспектор координат
      if (this.options.showCrosshair && this.cursorMathX !== null) {
        this.drawCrosshair();
      }
    }

    /**
     * Алгоритм Nice Numbers для адаптивного шага координатной сетки
     */
    calculateGridStep() {
      if (this.options.isTrigMode) {
        // В тригонометрическом режиме шаги кратны pi
        if (this.scale > 80) return Math.PI / 4; // pi/4
        if (this.scale > 35) return Math.PI / 2; // pi/2
        if (this.scale > 15) return Math.PI;     // pi
        return 2 * Math.PI;                      // 2pi
      }

      // Минимальное расстояние между линиями в пикселях: ~50-80px
      const minPixelStep = 60;
      const rawStep = minPixelStep / this.scale;
      const power = Math.floor(Math.log10(rawStep));
      const fraction = rawStep / Math.pow(10, power);

      let niceFraction = 1;
      if (fraction > 5) niceFraction = 10;
      else if (fraction > 2) niceFraction = 5;
      else if (fraction > 1) niceFraction = 2;

      return niceFraction * Math.pow(10, power);
    }

    /**
     * Отрисовка адаптивной миллиметровки
     */
    drawGrid() {
      const ctx = this.ctx;
      const step = this.calculateGridStep();
      const pixelStep = step * this.scale;

      const [minX, maxY] = this.screenToMath(0, 0);
      const [maxX, minY] = this.screenToMath(this.width, this.height);

      // А) Мелкая сетка (миллиметровка: 1/5 от основного шага)
      if (pixelStep >= 40) {
        const subStep = step / 5;
        ctx.beginPath();
        ctx.strokeStyle = this.colors.paperGridSub;
        ctx.lineWidth = 0.5;

        const startSubX = Math.floor(minX / subStep) * subStep;
        for (let x = startSubX; x <= maxX; x += subStep) {
          const [sx] = this.mathToScreen(x, 0);
          ctx.moveTo(Math.round(sx) + 0.5, 0);
          ctx.lineTo(Math.round(sx) + 0.5, this.height);
        }

        const startSubY = Math.floor(minY / subStep) * subStep;
        for (let y = startSubY; y <= maxY; y += subStep) {
          const [, sy] = this.mathToScreen(0, y);
          ctx.moveTo(0, Math.round(sy) + 0.5);
          ctx.lineTo(this.width, Math.round(sy) + 0.5);
        }
        ctx.stroke();
      }

      // Б) Основная сетка
      ctx.beginPath();
      ctx.strokeStyle = this.colors.paperGridMain;
      ctx.lineWidth = 1;

      const startX = Math.floor(minX / step) * step;
      for (let x = startX; x <= maxX; x += step) {
        const [sx] = this.mathToScreen(x, 0);
        ctx.moveTo(Math.round(sx) + 0.5, 0);
        ctx.lineTo(Math.round(sx) + 0.5, this.height);
      }

      const startY = Math.floor(minY / step) * step;
      for (let y = startY; y <= maxY; y += step) {
        const [, sy] = this.mathToScreen(0, y);
        ctx.moveTo(0, Math.round(sy) + 0.5);
        ctx.lineTo(this.width, Math.round(sy) + 0.5);
      }
      ctx.stroke();

      // В) Числовые метки на сетке
      if (this.options.showLabels) {
        ctx.font = '11px "Fira Code", monospace, sans-serif';
        ctx.fillStyle = this.colors.axisText;

        // Фиксация меток у края экрана, если ось ушла за экран
        const clampedAxisY = Math.max(16, Math.min(this.height - 6, this.originY));
        const clampedAxisX = Math.max(24, Math.min(this.width - 20, this.originX));

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let x = startX; x <= maxX; x += step) {
          if (Math.abs(x) < step * 0.01) continue; // 0 рисуется отдельно
          const [sx] = this.mathToScreen(x, 0);
          const label = this.formatAxisLabel(x, true);
          ctx.fillText(label, sx, clampedAxisY + 4);
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let y = startY; y <= maxY; y += step) {
          if (Math.abs(y) < step * 0.01) continue;
          const [, sy] = this.mathToScreen(0, y);
          const label = this.formatAxisLabel(y, false);
          ctx.fillText(label, clampedAxisX - 6, sy);
        }

        // Подпись начала координат (0)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('0', clampedAxisX - 4, clampedAxisY + 4);
      }
    }

    formatAxisLabel(val, isX) {
      if (this.options.isTrigMode && isX) {
        const piRatio = val / Math.PI;
        if (Math.abs(piRatio - 1) < 0.01) return 'π';
        if (Math.abs(piRatio + 1) < 0.01) return '-π';
        if (Math.abs(piRatio - 2) < 0.01) return '2π';
        if (Math.abs(piRatio + 2) < 0.01) return '-2π';
        if (Math.abs(piRatio - 0.5) < 0.01) return 'π/2';
        if (Math.abs(piRatio + 0.5) < 0.01) return '-π/2';
        if (Math.abs(piRatio - 1.5) < 0.01) return '3π/2';
        if (Math.abs(piRatio + 1.5) < 0.01) return '-3π/2';
        if (Math.abs(piRatio - 0.25) < 0.01) return 'π/4';
        if (Math.abs(piRatio + 0.25) < 0.01) return '-π/4';
      }

      if (Math.abs(val) >= 10000 || (Math.abs(val) < 0.01 && val !== 0)) {
        return val.toExponential(1);
      }

      return Number(val.toFixed(2)).toString().replace('.', ',');
    }

    /**
     * Отрисовка главных координатных осей Ox и Oy
     */
    drawAxes() {
      const ctx = this.ctx;
      ctx.strokeStyle = this.colors.axis;
      ctx.lineWidth = 1.75;
      ctx.beginPath();

      // Ось Ox
      const hasOx = this.originY >= 0 && this.originY <= this.height;
      if (hasOx) {
        const y = Math.round(this.originY) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);

        // Стрелка Ox
        ctx.moveTo(this.width - 10, y - 4);
        ctx.lineTo(this.width, y);
        ctx.lineTo(this.width - 10, y + 4);
      }

      // Ось Oy
      const hasOy = this.originX >= 0 && this.originX <= this.width;
      if (hasOy) {
        const x = Math.round(this.originX) + 0.5;
        ctx.moveTo(x, this.height);
        ctx.lineTo(x, 0);

        // Стрелка Oy
        ctx.moveTo(x - 4, 10);
        ctx.lineTo(x, 0);
        ctx.lineTo(x + 4, 10);
      }
      ctx.stroke();

      // Подписи осей "x" и "y"
      ctx.font = 'bold 13px "Fira Sans", sans-serif';
      ctx.fillStyle = this.colors.axis;
      if (hasOx) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('x', this.width - 12, this.originY - 6);
      }
      if (hasOy) {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('y', this.originX + 8, 4);
      }
    }

    /**
     * Отрисовка асимптот
     */
    drawAsymptotes() {
      const ctx = this.ctx;
      const allAsymptotes = [];

      this.layers.forEach(l => {
        if (l.asymptotes) allAsymptotes.push(...l.asymptotes);
      });

      if (!allAsymptotes.length) return;

      ctx.save();
      ctx.strokeStyle = this.colors.asymptote;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);

      allAsymptotes.forEach(asymp => {
        ctx.beginPath();
        if (asymp.type === 'vertical') {
          const [sx] = this.mathToScreen(asymp.x, 0);
          if (sx >= -10 && sx <= this.width + 10) {
            ctx.moveTo(Math.round(sx) + 0.5, 0);
            ctx.lineTo(Math.round(sx) + 0.5, this.height);
            ctx.stroke();

            // Бейдж асимптоты
            if (asymp.label) {
              this.drawAsymptoteBadge(asymp.label, sx + 4, 22);
            }
          }
        } else if (asymp.type === 'horizontal') {
          const [, sy] = this.mathToScreen(0, asymp.y);
          if (sy >= -10 && sy <= this.height + 10) {
            ctx.moveTo(0, Math.round(sy) + 0.5);
            ctx.lineTo(this.width, Math.round(sy) + 0.5);
            ctx.stroke();

            if (asymp.label) {
              this.drawAsymptoteBadge(asymp.label, this.width - 55, sy - 8);
            }
          }
        }
      });

      ctx.restore();
    }

    drawAsymptoteBadge(text, x, y) {
      const ctx = this.ctx;
      ctx.save();
      ctx.setLineDash([]);
      ctx.font = '10px "Fira Code", monospace';
      const textWidth = ctx.measureText(text).width;

      ctx.fillStyle = 'rgba(254, 226, 226, 0.9)';
      ctx.strokeStyle = this.colors.asymptote;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - 3, y - 11, textWidth + 6, 15, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.colors.asymptote;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    /**
     * Отрисовка векторной стрелки сдвига
     */
    drawVector() {
      const v = this.displacementVector;
      if (!v) return;

      const [x1, y1] = this.mathToScreen(v.from[0], v.from[1]);
      const [x2, y2] = this.mathToScreen(v.to[0], v.to[1]);

      const dist = Math.hypot(x2 - x1, y2 - y1);
      if (dist < 4) return; // Слишком малое смещение

      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = this.colors.vector;
      ctx.fillStyle = this.colors.vector;
      ctx.lineWidth = 2;

      // Линия вектора
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Наконечник стрелки
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 9;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Подпись вектора
      if (v.label) {
        ctx.font = 'bold 11px "Fira Sans", sans-serif';
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 8;
        ctx.fillText(v.label, midX, midY);
      }
      ctx.restore();
    }

    /**
     * Отрисовка одного слоя графика функции с защитой от разрывов
     */
    drawFunctionLayer(layer) {
      const ctx = this.ctx;
      const fn = layer.fn;
      if (!fn) return;

      ctx.save();

      // Настройка стиля
      if (layer.style === 'ghost') {
        ctx.strokeStyle = this.colors.ghost;
        ctx.lineWidth = 1.75;
        ctx.setLineDash([5, 4]);
      } else if (layer.style === 'secondary') {
        ctx.strokeStyle = this.colors.secondary;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      } else {
        // active / primary
        ctx.strokeStyle = layer.color || this.colors.primary;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      }

      ctx.beginPath();

      // Шаг сэмплирования по пикселям экрана (1px для максимальной гладкости)
      const pixelStep = 1;
      let inPath = false;
      let prevScreenY = null;
      let prevMathY = null;

      const jumpThreshold = this.height * 1.5; // порог разрыва (асимптоты)

      for (let px = 0; px <= this.width; px += pixelStep) {
        const [mathX] = this.screenToMath(px, 0);
        let mathY;

        try {
          mathY = fn(mathX, layer.params);
        } catch (e) {
          mathY = NaN;
        }

        // Проверка области определения
        if (isNaN(mathY) || !isFinite(mathY)) {
          if (inPath) {
            ctx.stroke();
            ctx.beginPath();
            inPath = false;
          }
          prevScreenY = null;
          prevMathY = null;
          continue;
        }

        const [, screenY] = this.mathToScreen(mathX, mathY);

        // Проверка разрыва непрерывности (смена знака при огромном скачке)
        let isDiscontinuous = false;
        if (prevScreenY !== null && prevMathY !== null) {
          const dy = Math.abs(screenY - prevScreenY);
          // Разрыв происходит, когда значение скачет через бесконечность
          if (dy > jumpThreshold && (prevMathY * mathY < 0 || Math.abs(mathY) > 50)) {
            isDiscontinuous = true;
          }
        }

        if (isDiscontinuous) {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px, screenY);
          inPath = true;
        } else {
          if (!inPath) {
            ctx.moveTo(px, screenY);
            inPath = true;
          } else {
            ctx.lineTo(px, screenY);
          }
        }

        prevScreenY = screenY;
        prevMathY = mathY;
      }

      if (inPath) {
        ctx.stroke();
      }

      ctx.restore();
    }

    /**
     * Отрисовка характерных опорных точек
     */
    drawKeyPoints() {
      const ctx = this.ctx;
      this.layers.forEach(layer => {
        if (!layer.keyPoints || !layer.keyPoints.length) return;

        const isGhost = layer.style === 'ghost';
        const ptColor = isGhost ? this.colors.ghost : (layer.color || this.colors.primary);

        layer.keyPoints.forEach(pt => {
          if (isNaN(pt.x) || isNaN(pt.y) || !isFinite(pt.x) || !isFinite(pt.y)) return;

          const [sx, sy] = this.mathToScreen(pt.x, pt.y);
          if (sx < -20 || sx > this.width + 20 || sy < -20 || sy > this.height + 20) return;

          ctx.save();
          // Внешний контур
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = ptColor;
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          ctx.arc(sx, sy, isGhost ? 4 : 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Подпись точки
          if (!isGhost && pt.label) {
            ctx.font = 'bold 11px "Fira Code", monospace';
            const label = pt.label;
            const textWidth = ctx.measureText(label).width;

            // Плашка под текст
            const tagX = sx + 8;
            const tagY = sy - 10;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tagX - 3, tagY - 11, textWidth + 6, 15, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1E293B';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(label, tagX, tagY);
          }

          ctx.restore();
        });
      });
    }

    /**
     * Отрисовка перекрестия инспектора и координат
     */
    drawCrosshair() {
      const ctx = this.ctx;
      const x = this.cursorMathX;
      const y = this.cursorMathY;
      const [sx, sy] = this.mathToScreen(x, y);

      ctx.save();
      ctx.strokeStyle = this.colors.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Вертикальная и горизонтальная направляющие
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, this.height);
      ctx.moveTo(0, sy);
      ctx.lineTo(this.width, sy);
      ctx.stroke();

      // Точка под курсором
      ctx.fillStyle = this.colors.primary;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Плашка текущих координат
      const coordText = `(${Number(x.toFixed(2)).toString().replace('.', ',')}; ${Number(y.toFixed(2)).toString().replace('.', ',')})`;
      ctx.font = '11px "Fira Code", monospace';
      const textWidth = ctx.measureText(coordText).width;

      const badgeX = Math.min(this.width - textWidth - 16, Math.max(8, sx + 10));
      const badgeY = Math.min(this.height - 10, Math.max(20, sy - 10));

      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY - 13, textWidth + 10, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(coordText, badgeX + 5, badgeY - 4);

      ctx.restore();
    }
  }

  return CartesianCanvas;
}));
