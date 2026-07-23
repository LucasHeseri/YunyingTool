/**
 * compress.js — 图片压缩 module.
 * Depends on APP (common.js).
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before compress.js');

  var M = APP.compress = {};

  // ========================================================================
  // Processing
  // ========================================================================
  M.process = function () {
    var img = APP.state.uploadedImage;
    if (!img) return;
    var srcW = img.naturalWidth, srcH = img.naturalHeight;
    var targetW = parseInt(APP.dom.cmpWidth.value, 10);
    var outW = targetW, outH = Math.round(srcH * (targetW / srcW));

    var c = document.createElement('canvas'); c.width = outW; c.height = outH;
    c.getContext('2d').drawImage(img, 0, 0, outW, outH);
    APP.state.processedDataUrl = c.toDataURL('image/png');

    APP.dom.previewCanvas.style.display = 'block';
    APP.showPreview();
    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '原图 ' + srcW + '×' + srcH + ' → ' + outW + '×' + outH;
    updateSizeEstimate(APP.state.processedDataUrl);
  };

  function updateSizeEstimate(dataUrl) {
    if (!dataUrl) { APP.dom.cmpSizeEst.textContent = '—'; return; }
    var bytes = atob(dataUrl.split(',')[1]).length;
    if (bytes >= 1024 * 1024) {
      APP.dom.cmpSizeEst.textContent = '≈ ' + (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      APP.dom.cmpSizeEst.textContent = '≈ ' + Math.round(bytes / 1024) + ' KB';
    }
  }

  // ========================================================================
  // Events
  // ========================================================================
  M.bindEvents = function () {
    APP.dom.cmpWidth.addEventListener('input', function () {
      APP.dom.cmpWidthVal.textContent = this.value + 'px';
      if (APP.state.uploadedImage && APP.state.currentTab === 'compress') M.process();
    });
  };
})();
