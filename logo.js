/**
 * logo.js — logo处理 module (宫格图 / 圆形logo).
 * Depends on APP (common.js).
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before logo.js');

  var M = APP.logo = {};
  var LOGO_SIZE = 160;

  // ========================================================================
  // State
  // ========================================================================
  M.state = {
    type: 'grid',     // 'grid' | 'circlelogo'
    bgColor: '',      // background color for grid mode (empty = transparent)
    bgIsDark: false   // preview background toggle
  };

  // ========================================================================
  // Processing
  // ========================================================================
  M.process = function () {
    if (M.state.type === 'grid') M.processGrid();
    else M.processCircle();
  };

  // ---- 宫格图: 160×160, 圆角32px ----
  M.processGrid = function () {
    var img = APP.state.uploadedImage;
    var srcW = img.naturalWidth, srcH = img.naturalHeight;
    var size = LOGO_SIZE, radius = 32;

    var userScale = parseInt(APP.dom.logoScale.value, 10) / 100;
    var shortSide = Math.min(srcW, srcH);
    var s = (size / shortSide) * userScale;
    var sw = Math.round(srcW * s), sh = Math.round(srcH * s);

    var c = document.createElement('canvas'); c.width = size; c.height = size;
    var cx = c.getContext('2d');

    // Rounded rect clip
    cx.save();
    APP.drawRoundRect(cx, 0, 0, size, size, radius);
    cx.clip();

    // Fill background inside rounded rect
    if (M.state.bgColor) { cx.fillStyle = M.state.bgColor; cx.fillRect(0, 0, size, size); }

    // Center scaled image
    cx.drawImage(img, Math.round((size - sw) / 2), Math.round((size - sh) / 2), sw, sh);
    cx.restore();

    // Notification badge (above clip)
    if (APP.dom.logoBadgeCheck.checked) {
      var badgeR = 12, badgeCX = size - badgeR, badgeCY = badgeR;
      cx.beginPath(); cx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2); cx.fillStyle = '#E84026'; cx.fill();
    }

    APP.state.processedDataUrl = c.toDataURL('image/png');
    APP.showPreview({size: LOGO_SIZE, guide: M.state.type});
    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '原图 ' + srcW + '×' + srcH + ' → ' + size + '×' + size + ' 宫格图' + (APP.dom.logoBadgeCheck.checked ? ' (含消息提醒)' : '');
  };

  // ---- 圆形logo: 160×160 ----
  M.processCircle = function () {
    var img = APP.state.uploadedImage;
    var srcW = img.naturalWidth, srcH = img.naturalHeight;
    var size = LOGO_SIZE, radius = size / 2;

    var userScale = parseInt(APP.dom.logoScale.value, 10) / 100;
    var shortSide = Math.min(srcW, srcH);
    var s = (size / shortSide) * userScale;
    var sw = Math.round(srcW * s), sh = Math.round(srcH * s);

    var c = document.createElement('canvas'); c.width = size; c.height = size;
    var cx = c.getContext('2d');

    // Circle clip — bg color fills inside the circle
    cx.save();
    cx.beginPath(); cx.arc(radius, radius, radius, 0, Math.PI * 2); cx.closePath(); cx.clip();
    if (M.state.bgColor) { cx.fillStyle = M.state.bgColor; cx.fillRect(0, 0, size, size); }
    cx.drawImage(img, Math.round((size - sw) / 2), Math.round((size - sh) / 2), sw, sh);
    cx.restore();

    APP.state.processedDataUrl = c.toDataURL('image/png');
    APP.showPreview({size: LOGO_SIZE, guide: M.state.type});
    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '原图 ' + srcW + '×' + srcH + ' → ' + size + '×' + size + ' 圆形logo';
  };

  // ========================================================================
  // Preview guide overlay (宫格图 center 96×96 dashed)
  // ========================================================================
  M.drawGuideOverlay = function () {
    var gs = 96, gx = (LOGO_SIZE - gs) / 2, gy = (LOGO_SIZE - gs) / 2, gr = 12;
    var ctx = APP.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]);
    APP.drawRoundRect(ctx, gx, gy, gs, gs, gr); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  };

  // ========================================================================
  // Placeholder (before upload) — 160×160 filled rounded rect + guide
  // ========================================================================
  M.showPlaceholder = function () {
    var size = LOGO_SIZE;
    var cv = APP.dom.previewCanvas, ctx = APP.ctx;
    cv.style.display = 'block';
    cv.width = size; cv.height = size;

    if (M.state.type === 'grid') {
      // Fill rounded rect with #F1F3F5
      ctx.save();
      APP.drawRoundRect(ctx, 0, 0, size, size, 32);
      ctx.clip();
      ctx.fillStyle = '#F1F3F5'; ctx.fill();
      ctx.restore();
      // Center 96×96 guide outline
      M.drawGuideOverlay();
    } else {
      // Fill circle with #F1F3F5
      ctx.save();
      ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#F1F3F5'; ctx.fill();
      ctx.restore();
    }

    // Scale
    var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
    var s = Math.min(cw / size, ch / size, 2);
    cv.style.width  = Math.round(size * s) + 'px';
    cv.style.height = Math.round(size * s) + 'px';
    APP.dom.downloadBtn.disabled = true;
  };

  // ========================================================================
  // Events
  // ========================================================================
  M.bindEvents = function () {
    // Logo chips (宫格图 / 圆形logo)
    APP.dom.logoChipsNav.addEventListener('click', function (e) {
      var btn = e.target.closest('.chips-nav__btn');
      if (!btn) return;
      var type = btn.dataset.logo;
      if (type === M.state.type) return;
      M.state.type = type;
      APP.dom.logoChipsNav.querySelectorAll('.chips-nav__btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      APP.dom.logoGridBadgeGroup.style.display = (type === 'grid') ? '' : 'none';
      if (APP.state.currentTab === 'circle') {
        if (APP.state.uploadedImage) M.process(); else M.showPlaceholder();
      }
    });

    // Scale slider
    APP.dom.logoScale.addEventListener('input', function () {
      APP.dom.logoScaleVal.textContent = this.value + '%';
      if (APP.state.uploadedImage && APP.state.currentTab === 'circle') M.process();
    });

    // Color picker
    APP.dom.colorPicker.addEventListener('click', function (e) {
      var dot = e.target.closest('.color-dot');
      if (!dot) return;
      APP.dom.colorPicker.querySelectorAll('.color-dot').forEach(function (d) { d.classList.remove('active'); });
      dot.classList.add('active');
      M.state.bgColor = dot.dataset.color;
      if (APP.state.uploadedImage && APP.state.currentTab === 'circle') M.process();
    });

    // Badge checkbox
    // Badge checkbox — only for 宫格图
    APP.dom.logoBadgeCheck.addEventListener('change', function () {
      if (APP.state.uploadedImage && APP.state.currentTab === 'circle' && M.state.type === 'grid') M.processGrid();
    });

    // Background toggle (preview)
    APP.dom.bgToggleBtn.addEventListener('click', function () {
      M.state.bgIsDark = !M.state.bgIsDark;
      if (M.state.bgIsDark) {
        APP.dom.previewCard.style.background = '#1a1a1a';
        APP.dom.bgToggleBtn.classList.add('dark');
      } else {
        APP.dom.previewCard.style.background = '#ffffff';
        APP.dom.bgToggleBtn.classList.remove('dark');
      }
    });
  };
})();
