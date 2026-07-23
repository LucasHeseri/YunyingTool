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
    // Fill background with #F1F3F5 for the card area
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    // Draw template with semi-transparent gray
    ctx.drawImage(templateImg, 0, 0, VIEW_W, VIEW_H);
    // Scale to fit
    var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
    var s = Math.min(cw / VIEW_W, ch / VIEW_H, 1);
    cv.style.width  = Math.round(VIEW_W * s) + 'px';
    cv.style.height = Math.round(VIEW_H * s) + 'px';
    APP.dom.downloadBtn.disabled = true;
  };

  // ========================================================================
  // Processing — composite user image into template shape
  // ========================================================================
  M.process = function () {
    var img = APP.state.uploadedImage;
    if (!img || !templateImg) return;

    var cv = APP.dom.previewCanvas, ctx = APP.ctx;
    cv.width = VIEW_W; cv.height = VIEW_H;
    cv.style.display = 'block';

    // Draw user image, clipped to template shape
    ctx.save();
    // Use template as clip path
    ctx.drawImage(templateImg, 0, 0, VIEW_W, VIEW_H);
    ctx.globalCompositeOperation = 'source-in';
    // Scale user image to cover template area (object-fit: cover)
    var imgW = img.naturalWidth, imgH = img.naturalHeight;
    var imgRatio = imgW / imgH, viewRatio = VIEW_W / VIEW_H;
    var sx, sy, sw, sh;
    if (imgRatio > viewRatio) { sh = imgH; sw = imgH * viewRatio; sx = (imgW - sw) / 2; sy = 0; }
    else { sw = imgW; sh = imgW / viewRatio; sx = 0; sy = (imgH - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, VIEW_W, VIEW_H);
    ctx.restore();

    // Draw template outline on top for the border effect
    ctx.drawImage(templateImg, 0, 0, VIEW_W, VIEW_H);

    APP.state.processedDataUrl = cv.toDataURL('image/png');

    // Scale display
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
  };
})();
