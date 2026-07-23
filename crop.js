/**
 * crop.js — 裁切卡片 module.
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
  var templateImg = null;
  var ready = false;

  // ========================================================================
  // Load template SVG
  // ========================================================================
  M.init = function (callback) {
    if (typeof CROP_TEMPLATE === 'undefined') {
      if (callback) callback(false);
      return;
    }
    var img = new Image();
    img.onload = function () { templateImg = img; ready = true; if (callback) callback(true); };
    img.onerror = function () { if (callback) callback(false); };
    img.src = CROP_TEMPLATE;
  };

  M.isReady = function () { return ready; };

  // ========================================================================
  // Show placeholder before upload
  // ========================================================================
  M.showPlaceholder = function () {
    if (!templateImg) return;
    var cv = APP.dom.previewCanvas, ctx = APP.ctx;
    cv.style.display = 'block';
    cv.width = VIEW_W; cv.height = VIEW_H;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.drawImage(templateImg, 0, 0, VIEW_W, VIEW_H);
    var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
    var s = Math.min(cw / VIEW_W, ch / VIEW_H, 1);
    cv.style.width  = Math.round(VIEW_W * s) + 'px';
    cv.style.height = Math.round(VIEW_H * s) + 'px';
    APP.dom.downloadBtn.disabled = true;
  };

  // ========================================================================
  // Processing — width-first, top-aligned, vertical offset, export size
  // ========================================================================
  M.process = function () {
    var img = APP.state.uploadedImage;
    if (!img || !templateImg) return;

    var offset = parseInt(APP.dom.cropOffset.value, 10);
    var scale = getExportScale();
    var outW = Math.round(VIEW_W * scale);
    var outH = Math.round(VIEW_H * scale);
    var imgW = img.naturalWidth, imgH = img.naturalHeight;

    // Scale image: width matches template width, height proportional
    var destH = Math.round(imgH * (VIEW_W / imgW));

    // Render at full resolution
    var workC = document.createElement('canvas');
    workC.width = VIEW_W; workC.height = VIEW_H;
    var wCtx = workC.getContext('2d');

    // Clip to template shape
    wCtx.save();
    wCtx.drawImage(templateImg, 0, 0, VIEW_W, VIEW_H);
    wCtx.globalCompositeOperation = 'source-in';
    wCtx.drawImage(img, 0, 0, imgW, imgH, 0, offset, VIEW_W, destH);
    wCtx.restore();

    // Preview canvas (always full res for display)
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
  };

  function getExportScale() {
    var radio = document.querySelector('input[name="cropSize"]:checked');
    if (radio && radio.value === '1x') return 1/3;
    return 1; // 3x default (984×612)
  }

  // ========================================================================
  // Events
  // ========================================================================
  M.bindEvents = function () {
    APP.dom.cropOffset.addEventListener('input', function () {
      APP.dom.cropOffsetVal.textContent = this.value + 'px';
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
