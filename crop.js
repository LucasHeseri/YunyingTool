/**
 * crop.js — 裁切卡券 module (票券 / 卡片).
 * Depends on APP (common.js) and CROP_TEMPLATE global.
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before crop.js');

  var M = APP.crop = {};

  // ========================================================================
  // Config
  // ========================================================================
  var VIEW_W = 984, VIEW_H = 612;
  var templateImg = null;    // Subtract.svg for ticket
  var cardTemplate = null;   // generated canvas for card (rounded rect)
  var ready = false;

  // ========================================================================
  // State
  // ========================================================================
  M.state = { type: 'ticket' }; // 'ticket' | 'card'

  // ========================================================================
  // Load ticket template (Subtract.svg)
  // ========================================================================
  M.init = function (callback) {
    if (typeof CROP_TEMPLATE === 'undefined') { if (callback) callback(false); return; }
    var img = new Image();
    img.onload = function () {
      templateImg = img;
      generateCardTemplate();
      ready = true;
      if (callback) callback(true);
    };
    img.onerror = function () { if (callback) callback(false); };
    img.src = CROP_TEMPLATE;
  };

  // Generate card template: 984×612 rounded rect (96px radius), #F1F3F5 fill
  function generateCardTemplate() {
    var c = document.createElement('canvas'); c.width = VIEW_W; c.height = VIEW_H;
    var cx = c.getContext('2d');
    var r = 72;
    cx.beginPath();
    cx.moveTo(r, 0); cx.lineTo(VIEW_W - r, 0);
    cx.arcTo(VIEW_W, 0, VIEW_W, r, r);
    cx.lineTo(VIEW_W, VIEW_H - r);
    cx.arcTo(VIEW_W, VIEW_H, VIEW_W - r, VIEW_H, r);
    cx.lineTo(r, VIEW_H);
    cx.arcTo(0, VIEW_H, 0, VIEW_H - r, r);
    cx.lineTo(0, r);
    cx.arcTo(0, 0, r, 0, r);
    cx.closePath();
    cx.fillStyle = '#B3B3B3';
    cx.globalAlpha = 0.83;
    cx.fill();
    cx.globalAlpha = 1;
    cardTemplate = c;
  }

  function getTemplate() {
    return M.state.type === 'ticket' ? templateImg : cardTemplate;
  }

  M.isReady = function () { return ready; };

  // ========================================================================
  // Show placeholder
  // ========================================================================
  M.showPlaceholder = function () {
    var tmpl = getTemplate();
    if (!tmpl) return;
    var cv = APP.dom.previewCanvas, ctx = APP.ctx;
    cv.style.display = 'block';
    cv.width = VIEW_W; cv.height = VIEW_H;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.drawImage(tmpl, 0, 0, VIEW_W, VIEW_H);
    var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
    var s = Math.min(cw / VIEW_W, ch / VIEW_H, 1);
    cv.style.width  = Math.round(VIEW_W * s) + 'px';
    cv.style.height = Math.round(VIEW_H * s) + 'px';
    APP.dom.downloadBtn.disabled = true;
  };

  // ========================================================================
  // Processing
  // ========================================================================
  M.process = function () {
    var img = APP.state.uploadedImage;
    var tmpl = getTemplate();
    if (!img || !tmpl) return;

    var hOffset = parseInt(APP.dom.cropHOffset.value, 10);
    var vOffset = parseInt(APP.dom.cropVOffset.value, 10);
    var zoom = parseInt(APP.dom.cropZoom.value, 10) / 100;
    var scale = getExportScale();
    var outW = Math.round(VIEW_W * scale);
    var outH = Math.round(VIEW_H * scale);
    var imgW = img.naturalWidth, imgH = img.naturalHeight;

    var destW = Math.round(VIEW_W * zoom);
    var destH = Math.round(imgH * (destW / imgW));
    var baseDestH = Math.round(imgH * (VIEW_W / imgW));
    var destX = Math.round(-(destW - VIEW_W) / 2) + hOffset;
    var destY = Math.round(-(destH - baseDestH) / 2) + vOffset;

    var workC = document.createElement('canvas');
    workC.width = VIEW_W; workC.height = VIEW_H;
    var wCtx = workC.getContext('2d');

    // Clip to template shape
    wCtx.save();
    wCtx.drawImage(tmpl, 0, 0, VIEW_W, VIEW_H);
    wCtx.globalCompositeOperation = 'source-in';
    wCtx.drawImage(img, 0, 0, imgW, imgH, destX, destY, destW, destH);
    wCtx.restore();

    var cv = APP.dom.previewCanvas, ctx = APP.ctx;
    cv.width = outW; cv.height = outH;
    cv.style.display = 'block';
    if (scale < 1) {
      ctx.drawImage(workC, 0, 0, outW, outH);
    } else {
      ctx.drawImage(workC, 0, 0);
    }

    APP.state.processedDataUrl = cv.toDataURL('image/png');

    var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
    var ds = Math.min(cw / outW, ch / outH, 1);
    cv.style.width  = Math.round(outW * ds) + 'px';
    cv.style.height = Math.round(outH * ds) + 'px';

    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '原图 ' + imgW + '×' + imgH + ' → ' + outW + '×' + outH;
    updateSizeEstimate();
  };

  function updateSizeEstimate() {
    var el = document.getElementById('cropSizeEst');
    var dataUrl = APP.state.processedDataUrl;
    if (!dataUrl) { el.textContent = '—'; return; }
    var bytes = atob(dataUrl.split(',')[1]).length;
    if (bytes >= 1024 * 1024) {
      el.textContent = '≈ ' + (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      el.textContent = '≈ ' + Math.round(bytes / 1024) + ' KB';
    }
  }

  function getExportScale() {
    var radio = document.querySelector('input[name="cropSize"]:checked');
    if (radio && radio.value === '1x') return 1/3;
    return 1;
  }

  // ========================================================================
  // Events
  // ========================================================================
  M.bindEvents = function () {
    // Crop chips (票券 / 卡片)
    var chipsNav = document.getElementById('cropChipsNav');
    chipsNav.addEventListener('click', function (e) {
      var btn = e.target.closest('.chips-nav__btn');
      if (!btn) return;
      var type = btn.dataset.crop;
      if (type === M.state.type) return;
      M.state.type = type;
      chipsNav.querySelectorAll('.chips-nav__btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (APP.state.uploadedImage && APP.state.currentTab === 'crop') M.process();
      else M.showPlaceholder();
    });

    APP.dom.cropZoom.addEventListener('input', function () {
      APP.dom.cropZoomVal.textContent = this.value + '%';
      if (APP.state.uploadedImage && APP.state.currentTab === 'crop') M.process();
    });
    APP.dom.cropHOffset.addEventListener('input', function () {
      APP.dom.cropHOffsetVal.textContent = this.value + 'px';
      if (APP.state.uploadedImage && APP.state.currentTab === 'crop') M.process();
    });
    APP.dom.cropVOffset.addEventListener('input', function () {
      APP.dom.cropVOffsetVal.textContent = this.value + 'px';
      if (APP.state.uploadedImage && APP.state.currentTab === 'crop') M.process();
    });
    var radios = document.querySelectorAll('input[name="cropSize"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', function () {
        if (APP.state.uploadedImage && APP.state.currentTab === 'crop') M.process();
      });
    }
  };
})();
