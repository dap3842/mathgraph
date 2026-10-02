/**
 * canvas-engine.js
 * Высокопроизводительный движок рендеринга математических графиков на Canvas 2D.
 * Особенности:
 * - Поддержка High-DPI (Retina) дисплеев
 * - Адаптивная миллиметровка в светлом академическом стиле
 * - Умный выбор шага сетки (Nice Numbers 1, 2, 5) и тригонометрическая Pi-разметка
 * - Отображение значений в долях π (π/2, π, 3π/2 и т.д.) вместо десятичных дробей
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

  /**
   * Преобразует числовое значение в красивую форму дроби числа π,
   * если оно близко к стандартным углам тригонометрии
   */
  function formatPiValue(val, forcePi = false) {
    if (Math.abs(val) < 1e-4) return '0';

    const pi = Math.PI;
    const fractions = [
      { ratio: 1/6,  text: 'π/6' },
      { ratio: 1/4,  text: 'π/4' },
      { ratio: 1/3,  text: 'π/3' },
      { ratio: 1/2,  text: 'π/2' },
      { ratio: 2/3,  text: '2π/3' },
      { ratio: 3/4,  text: '3π/4' },
      { ratio: 5/6,  text: '5π/6' },
      { ratio: 1,    text: 'π' },
      { ratio: 7/6,  text: '7π/6' },
      { ratio: 5/4,  text: '5π/4' },
      { ratio: 4/3,  text: '4π/3' },
      { ratio: 3/2,  text: '3π/2' },
      { ratio: 5/3,  text: '5π/3' },
      { ratio: 7/4,  text: '7π/4' },
      { ratio: 11/6, text: '11π/6' },
      { ratio: 2,    text: '2π' },
      { ratio: 5/2,  text: '5π/2' },
      { ratio: 3,    text: '3π' },
      { ratio: 7/2,  text: '7π/2' },
      { ratio: 4,    text: '4π' }
    ];

    const sign = val < 0 ? '-' : '';
    const absVal = Math.abs(val);

    for (const f of fractions) {
      if (Math.abs(absVal - f.ratio * pi) < 0.08) {
        return sign + f.text;
      }
    }

    // Проверка целых кратных: 5π, 6π...
    const intK = Math.round(absVal / pi);
    if (Math.abs(absVal - intK * pi) < 0.08 && intK > 0) {
      return sign + (intK === 1 ? 'π' : `${intK}π`);
    }

    if (forcePi) {
      const ratio = val / pi;
      return `${Number(ratio.toFixed(2)).toString().replace('.', ',')}π`;
    }

    return (val < 0 ? '-' : '') + Number(absVal.toFixed(2)).toString().replace('.', ',');
  }

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
        isInvTrigMode: false,
        theme: 'light',
        defaultScale: 40,
        minScale: 8,
        maxScale: 350,
        originX: null,
        originY: null,
        originYRatio: 0.5
      }, options);

      // Визуальная палитра (Академическая миллиметровка)
      this.colors = {
        bg: '#F8FAFC',
        paperGridSub: '#EEF2F6',   // мелкая сетка
        paperGridMain: '#CBD5E1',  // основные линии
        axis: '#334155',           // оси
        axisText: '#475569',       // деления
        ghost: 'rgba(100, 116, 139, 0.45)', // исходная f(x)
        primary: '#2563EB',        // результат g(x)
        secondary: '#059669',
        asymptote: '#DC2626',      // асимптоты
        vector: '#EA580C',         // вектор сдвига
        anchor: '#1E293B',
        crosshair: 'rgba(37, 99, 235, 0.3)'
      };

      // Масштаб и центр координат
      this.scale = this.options.defaultScale;
      this.originYRatio = this.options.originYRatio ?? 0.5;
      this.originX = this.options.originX;
      this.originY = this.options.originY;

      // Слои функций
      this.layers = [];

      // Состояние жестов
      this.pointerCache = new Map();
      this.prevPinchDist = null;
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.cursorMathX = null;
      this.cursorMathY = null;
      this.onInspectorMove = null;

      // Вектор сдвига
      this.displacementVector = null;

      this.init();
    }

    init() {
      this.resize();
      this.canvas.style.touchAction = 'none';

      if (this.options.isInteractive) {
        this.bindEvents();
      }

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

      this.width = rect.width;
      this.height = rect.height;

      if (this.width === 0 || this.height === 0) return;

      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);

      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);

      if (this.originX === null) this.originX = this.width / 2;
      if (this.originY === null) this.originY = this.height * this.originYRatio;

      this.render();
    }

    setOriginYRatio(ratio, newScale = null) {
      this.originYRatio = ratio;
      if (this.height) {
        this.originY = this.height * ratio;
      }
      if (newScale) {
        this.scale = newScale;
      }
      this.render();
    }

    bindEvents() {
      const el = this.canvas;

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

        if (this.options.isTrigMode) {
          const pi = Math.PI;
          const trigTargets = [
            -4*pi, -7*pi/2, -3*pi, -5*pi/2, -2*pi, -7*pi/4, -5*pi/3, -3*pi/2, -4*pi/3, -5*pi/4, -pi,
            -5*pi/6, -3*pi/4, -2*pi/3, -pi/2, -pi/3, -pi/4, -pi/6, 0,
            pi/6, pi/4, pi/3, pi/2, 2*pi/3, 3*pi/4, 5*pi/6, pi,
            5*pi/4, 4*pi/3, 3*pi/2, 5*pi/3, 7*pi/4, 2*pi, 5*pi/2, 3*pi, 7*pi/2, 4*pi
          ];
          for (const target of trigTargets) {
            const [targetPx] = this.mathToScreen(target, 0);
            if (Math.abs(mouseX - targetPx) < 12) {
              this.cursorMathX = target;
              break;
            }
          }
        } else if (this.options.isInvTrigMode) {
          const pi = Math.PI;
          const trigTargets = [-pi, -3*pi/4, -2*pi/3, -pi/2, -pi/3, -pi/4, -pi/6, 0, pi/6, pi/4, pi/3, pi/2, 2*pi/3, 3*pi/4, pi];
          for (const target of trigTargets) {
            const [, targetPy] = this.mathToScreen(0, target);
            if (Math.abs(mouseY - targetPy) < 12) {
              this.cursorMathY = target;
              break;
            }
          }
        }

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

      // Двойной клик/тап: сброс масштаба
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

      this.originX = screenX - mathX * this.scale;
      this.originY = screenY + mathY * this.scale;
    }

    resetView() {
      this.scale = this.options.defaultScale;
      this.originX = this.width / 2;
      this.originY = this.height * (this.originYRatio ?? 0.5);
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

    setTrigMode(isTrig, isInvTrig = false) {
      this.options.isTrigMode = Boolean(isTrig);
      this.options.isInvTrigMode = Boolean(isInvTrig);
      this.render();
    }

    render() {
      if (!this.width || !this.height) return;
      const ctx = this.ctx;

      // 1. Фон
      ctx.fillStyle = this.colors.bg;
      ctx.fillRect(0, 0, this.width, this.height);

      // 2. Сетка
      if (this.options.showGrid) {
        this.drawGrid();
      }

      // 3. Оси
      if (this.options.showAxes) {
        this.drawAxes();
      }

      // 4. Асимптоты
      if (this.options.showAsymptotes) {
        this.drawAsymptotes();
      }

      // 5. Вектор сдвига
      if (this.displacementVector) {
        this.drawVector();
      }

      // 6. Слои графиков
      this.layers.forEach(layer => {
        this.drawFunctionLayer(layer);
      });

      // 7. Опорные точки
      if (this.options.showKeyPoints) {
        this.drawKeyPoints();
      }

      // 8. Перекрестие
      if (this.options.showCrosshair && this.cursorMathX !== null) {
        this.drawCrosshair();
      }
    }

    calculateGridStepX() {
      if (this.options.isTrigMode) {
        if (this.scale > 80) return Math.PI / 4;
        if (this.scale > 35) return Math.PI / 2;
        if (this.scale > 15) return Math.PI;
        return 2 * Math.PI;
      }

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

    calculateGridStepY() {
      if (this.options.isInvTrigMode) {
        if (this.scale > 80) return Math.PI / 4;
        if (this.scale > 35) return Math.PI / 2;
        return Math.PI;
      }

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

    drawGrid() {
      const ctx = this.ctx;
      const stepX = this.calculateGridStepX();
      const stepY = this.calculateGridStepY();
      const pixelStepX = stepX * this.scale;
      const pixelStepY = stepY * this.scale;

      const [minX, maxY] = this.screenToMath(0, 0);
      const [maxX, minY] = this.screenToMath(this.width, this.height);

      // Мелкая сетка
      ctx.beginPath();
      ctx.strokeStyle = this.colors.paperGridSub;
      ctx.lineWidth = 0.5;

      if (pixelStepX >= 40) {
        const subStepX = stepX / (this.options.isTrigMode ? 2 : 5);
        const startSubX = Math.floor(minX / subStepX) * subStepX;
        for (let x = startSubX; x <= maxX; x += subStepX) {
          const [sx] = this.mathToScreen(x, 0);
          ctx.moveTo(Math.round(sx) + 0.5, 0);
          ctx.lineTo(Math.round(sx) + 0.5, this.height);
        }
      }

      if (pixelStepY >= 40) {
        const subStepY = stepY / (this.options.isInvTrigMode ? 2 : 5);
        const startSubY = Math.floor(minY / subStepY) * subStepY;
        for (let y = startSubY; y <= maxY; y += subStepY) {
          const [, sy] = this.mathToScreen(0, y);
          ctx.moveTo(0, Math.round(sy) + 0.5);
          ctx.lineTo(this.width, Math.round(sy) + 0.5);
        }
      }
      ctx.stroke();

      // Основная сетка
      ctx.beginPath();
      ctx.strokeStyle = this.colors.paperGridMain;
      ctx.lineWidth = 1;

      const startX = Math.floor(minX / stepX) * stepX;
      for (let x = startX; x <= maxX; x += stepX) {
        const [sx] = this.mathToScreen(x, 0);
        ctx.moveTo(Math.round(sx) + 0.5, 0);
        ctx.lineTo(Math.round(sx) + 0.5, this.height);
      }

      const startY = Math.floor(minY / stepY) * stepY;
      for (let y = startY; y <= maxY; y += stepY) {
        const [, sy] = this.mathToScreen(0, y);
        ctx.moveTo(0, Math.round(sy) + 0.5);
        ctx.lineTo(this.width, Math.round(sy) + 0.5);
      }
      ctx.stroke();

      // Метки делений
      if (this.options.showLabels) {
        ctx.font = '11px "Fira Code", monospace, sans-serif';
        ctx.fillStyle = this.colors.axisText;

        const clampedAxisY = Math.max(16, Math.min(this.height - 6, this.originY));
        const clampedAxisX = Math.max(24, Math.min(this.width - 20, this.originX));

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let x = startX; x <= maxX; x += stepX) {
          if (Math.abs(x) < stepX * 0.01) continue;
          const [sx] = this.mathToScreen(x, 0);
          const label = this.formatAxisLabel(x, true);
          ctx.fillText(label, sx, clampedAxisY + 4);
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let y = startY; y <= maxY; y += stepY) {
          if (Math.abs(y) < stepY * 0.01) continue;
          const [, sy] = this.mathToScreen(0, y);
          const label = this.formatAxisLabel(y, false);
          ctx.fillText(label, clampedAxisX - 6, sy);
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('0', clampedAxisX - 4, clampedAxisY + 4);
      }
    }

    formatAxisLabel(val, isX) {
      if (this.options.isTrigMode && isX) {
        return formatPiValue(val);
      }
      if (this.options.isInvTrigMode && !isX) {
        return formatPiValue(val);
      }

      if (Math.abs(val) >= 10000 || (Math.abs(val) < 0.01 && val !== 0)) {
        return val.toExponential(1);
      }

      return Number(val.toFixed(2)).toString().replace('.', ',');
    }

    drawAxes() {
      const ctx = this.ctx;
      ctx.strokeStyle = this.colors.axis;
      ctx.lineWidth = 1.75;
      ctx.beginPath();

      const hasOx = this.originY >= 0 && this.originY <= this.height;
      if (hasOx) {
        const y = Math.round(this.originY) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);

        ctx.moveTo(this.width - 10, y - 4);
        ctx.lineTo(this.width, y);
        ctx.lineTo(this.width - 10, y + 4);
      }

      const hasOy = this.originX >= 0 && this.originX <= this.width;
      if (hasOy) {
        const x = Math.round(this.originX) + 0.5;
        ctx.moveTo(x, this.height);
        ctx.lineTo(x, 0);

        ctx.moveTo(x - 4, 10);
        ctx.lineTo(x, 0);
        ctx.lineTo(x + 4, 10);
      }
      ctx.stroke();

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
              this.drawAsymptoteBadge(asymp.label, this.width - 65, sy - 8);
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

    drawVector() {
      const v = this.displacementVector;
      if (!v) return;

      const [x1, y1] = this.mathToScreen(v.from[0], v.from[1]);
      const [x2, y2] = this.mathToScreen(v.to[0], v.to[1]);

      const dist = Math.hypot(x2 - x1, y2 - y1);
      if (dist < 4) return;

      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = this.colors.vector;
      ctx.fillStyle = this.colors.vector;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 9;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      if (v.label) {
        ctx.font = 'bold 11px "Fira Sans", sans-serif';
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 8;
        ctx.fillText(v.label, midX, midY);
      }
      ctx.restore();
    }

    drawFunctionLayer(layer) {
      const ctx = this.ctx;
      const fn = layer.fn;
      if (!fn) return;

      ctx.save();

      if (layer.style === 'ghost') {
        ctx.strokeStyle = this.colors.ghost;
        ctx.lineWidth = 1.75;
        ctx.setLineDash([5, 4]);
      } else if (layer.style === 'secondary') {
        ctx.strokeStyle = this.colors.secondary;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = layer.color || this.colors.primary;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      }

      ctx.beginPath();

      const pixelStep = 1;
      let inPath = false;
      let prevScreenY = null;
      let prevMathY = null;

      const jumpThreshold = this.height * 1.5;

      for (let px = 0; px <= this.width; px += pixelStep) {
        const [mathX] = this.screenToMath(px, 0);
        let mathY;

        try {
          mathY = fn(mathX, layer.params);
        } catch (e) {
          mathY = NaN;
        }

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

        let isDiscontinuous = false;
        if (prevScreenY !== null && prevMathY !== null) {
          const dy = Math.abs(screenY - prevScreenY);
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
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = ptColor;
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          ctx.arc(sx, sy, isGhost ? 4 : 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (!isGhost && pt.label) {
            ctx.font = 'bold 11px "Fira Code", monospace';
            const label = pt.label;
            const textWidth = ctx.measureText(label).width;

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

    drawCrosshair() {
      const ctx = this.ctx;
      const x = this.cursorMathX;
      const y = this.cursorMathY;
      const [sx, sy] = this.mathToScreen(x, y);

      ctx.save();
      ctx.strokeStyle = this.colors.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, this.height);
      ctx.moveTo(0, sy);
      ctx.lineTo(this.width, sy);
      ctx.stroke();

      ctx.fillStyle = this.colors.primary;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Форматируем координаты с учетом Pi
      const xFormatted = this.options.isTrigMode ? formatPiValue(x) : Number(x.toFixed(2)).toString().replace('.', ',');
      const yFormatted = this.options.isInvTrigMode ? formatPiValue(y) : Number(y.toFixed(2)).toString().replace('.', ',');
      const coordText = `(${xFormatted}; ${yFormatted})`;

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

  // Экспортируем функцию форматирования Pi для других модулей
  CartesianCanvas.formatPiValue = formatPiValue;

  return CartesianCanvas;
}));
