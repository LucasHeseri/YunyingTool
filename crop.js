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
  // Processing — image width-first, top-aligned, slider for vertical offset
  // ========================================================================
  M.process = function () {
    var img = APP.state.uploadedImage;
    if (!img || !templateImg) return;

    var offset = parseInt(APP.dom.cropOffset.value, 10);
    var imgW = img.naturalWidth, imgH = img.naturalHeight;

    var cv = APP.dom.previewCanvas, ctx = APP.ctx;
    cv.width = VIEW_W; cv.height = VIEW_H;
    cv.style.display = 'block';

    // Scale image: width matches template width
    var sw = imgW;
    var sh = Math.round(imgH * (VIEW_W / imgW));
    var sx = 0;
    var sy = offset; // slider controls vertical offset (default 0 = top-aligned)

    // Clip to template shape
    ctx.save();
    ctx.drawImage(templateImg, 0, 0, VIEW_W, VIEW_H);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, VIEW_W, Math.round(VIEW_H * (VIEW_W / imgW)));
    ctx.restore();

    APP.state.processedDataUrl = cv.toDataURL('image/png');

    var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
    var s = Math.min(cw / VIEW_W, ch / VIEW_H, 1);
    cv.style.width  = Math.round(VIEW_W * s) + 'px';
    cv.style.height = Math.round(VIEW_H * s) + 'px';

    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '原图 ' + imgW + '×' + imgH + ' → ' + VIEW_W + '×' + VIEW_H;
  };

  // ========================================================================
  // Events
  // ========================================================================
  M.bindEvents = function () {
    APP.dom.cropOffset.addEventListener('input', function () {
      APP.dom.cropOffsetVal.textContent = this.value + 'px';
      if (APP.state.uploadedImage && APP.state.currentTab === 'crop') M.process();
    });
  };
})();
