/**
 * common.js — Shared state, DOM, utilities, upload, and tab switching.
 */
(function () {
  'use strict';
  var APP = window.APP = window.APP || {};

  // ========================================================================
  // State
  // ========================================================================
  APP.state = {
    currentTab: 'walletkit',
    uploadedImage: null,
    processedDataUrl: null,
    toastTimer: null,
    removeBgEnabled: false,
    bgTolerance: 55,
    originalUploadDataUrl: null
  };

  // ========================================================================
  // Tab config
  // ========================================================================
  APP.TAB_CONFIG = {
    walletkit: { maxSize: 3 * 1024 * 1024, limits: '支持 PNG / JPG / WebP，大小不超过 3MB' },
    compress:  { maxSize: 3 * 1024 * 1024, limits: '支持 PNG / JPG / WebP，大小不超过 3MB' },
    circle:    { maxSize: 1 * 1024 * 1024, limits: '支持 PNG / JPG / WebP，大小不超过 1MB' },
    crop:      { maxSize: 3 * 1024 * 1024, limits: '支持 PNG / JPG / WebP，大小不超过 3MB' },
    test:      { maxSize: 3 * 1024 * 1024, limits: '支持 PNG / JPG / WebP，大小不超过 3MB' }
  };
  var ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

  // ========================================================================
  // DOM references
  // ========================================================================
  var $ = function (id) { return document.getElementById(id); };
  APP.dom = {
    tabNav: $('tabNav'), uploadZone: $('uploadZone'), uploadThumb: $('uploadThumb'),
    uploadLimits: $('uploadLimits'), uploadError: $('uploadError'), fileInput: $('fileInput'),
    resetBtn: $('resetBtn'), downloadBtn: $('downloadBtn'), previewCard: $('previewCard'),
    previewCanvas: $('previewCanvas'), previewInfo: $('previewInfo'), bgToggleBtn: $('bgToggleBtn'),
    toast: $('toast'), chipsNav: $('chipsNav'),
    ctrlWalletkit: $('ctrlWalletkit'), ctrlCompress: $('ctrlCompress'), ctrlCircle: $('ctrlCircle'), ctrlCrop: $('ctrlCrop'), ctrlTest: $('ctrlTest'),
    cmpWidth: $('cmpWidth'), cmpWidthVal: $('cmpWidthVal'), cmpSizeEst: $('cmpSizeEst'),
    logoChipsNav: $('logoChipsNav'), logoBadgeCheck: $('logoBadgeCheck'),
    logoGridBadgeGroup: $('logoGridBadgeGroup'), logoScale: $('logoScale'), logoScaleVal: $('logoScaleVal'),
    colorPicker: $('colorPicker'), removeBgCheck: $('removeBgCheck'),
    cropZoom: $('cropZoom'), cropZoomVal: $('cropZoomVal'),
    cropHOffset: $('cropHOffset'), cropHOffsetVal: $('cropHOffsetVal'),
    cropVOffset: $('cropVOffset'), cropVOffsetVal: $('cropVOffsetVal'),
    removeBgSection: $('removeBgSection'),
    removeBgTolGroup: $('removeBgTolGroup'), tolMinus: $('tolMinus'),
    tolPlus: $('tolPlus'), tolValue: $('tolValue')
  };
  APP.ctx = APP.dom.previewCanvas.getContext('2d');

  // ========================================================================
  // Toast
  // ========================================================================
  APP.showToast = function (msg) {
    var s = APP.state;
    if (s.toastTimer) clearTimeout(s.toastTimer);
    APP.dom.toast.textContent = msg;
    APP.dom.toast.classList.add('show');
    s.toastTimer = setTimeout(function () { APP.dom.toast.classList.remove('show'); }, 2000);
  };

  // ========================================================================
  // Validation
  // ========================================================================
  APP.validateFile = function (file) {
    if (!file) return false;
    if (!ALLOWED_TYPES.includes(file.type)) { APP.showError('仅支持 PNG / JPG / WebP 格式'); return false; }
    var maxSize = APP.TAB_CONFIG[APP.state.currentTab].maxSize;
    if (file.size > maxSize) { APP.showError('图片大小超过 ' + (maxSize / 1024 / 1024).toFixed(0) + 'MB'); return false; }
    return true;
  };
  APP.showError = function (msg) {
    APP.dom.uploadError.textContent = msg;
    setTimeout(function () { APP.dom.uploadError.textContent = ''; }, 3000);
  };

  // ========================================================================
  // File Handling
  // ========================================================================
  APP.handleFile = function (file) {
    if (!APP.validateFile(file)) return;
    APP.dom.uploadError.textContent = '';
    var s = APP.state;
    var reader = new FileReader();
    reader.onload = function (e) {
      s.originalUploadDataUrl = e.target.result;
      var img = new Image();
      img.onload = function () {
        s.uploadedImage = img;
        APP.dom.uploadThumb.src = s.originalUploadDataUrl;
        APP.dom.uploadZone.classList.add('has-image');
        if (s.removeBgEnabled) { APP.removeBackground(); return; }
        if (s.currentTab === 'walletkit') { if (APP.walletkit) APP.walletkit.afterUpload(); }
        else if (s.currentTab === 'compress') { if (APP.compress) APP.compress.process(); }
        else if (s.currentTab === 'circle') { if (APP.logo) APP.logo.process(); }
        else if (s.currentTab === 'crop') { if (APP.crop) APP.crop.process(); }
      };
      img.onerror = function () { APP.showError('图片加载失败，请重试'); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ========================================================================
  // Download
  // ========================================================================
  APP.downloadImage = function () {
    var s = APP.state;
    if (!s.processedDataUrl) return;
    var prefix = s.currentTab === 'walletkit' ? 'walletkit_' + (APP.walletkit ? APP.walletkit.state.type : 'card') + '_' :
                 s.currentTab === 'compress' ? 'compressed_' : 'logo_' + (APP.logo ? APP.logo.state.type : 'grid') + '_';
    var a = document.createElement('a');
    a.download = prefix + Date.now() + '.png';
    a.href = s.processedDataUrl;
    a.click();
    APP.showToast('下载完成');
  };

  // ========================================================================
  // Reset
  // ========================================================================
  APP.resetAll = function () {
    var s = APP.state;
    s.uploadedImage = null; s.processedDataUrl = null; s.originalUploadDataUrl = null;
    APP.dom.uploadThumb.src = ''; APP.dom.uploadZone.classList.remove('has-image');
    APP.dom.fileInput.value = ''; APP.dom.uploadError.textContent = '';
    APP.dom.downloadBtn.disabled = true; APP.dom.previewInfo.textContent = '';
    APP.hidePreview();
    if (s.currentTab === 'walletkit') {
      APP.dom.previewCanvas.style.display = 'block';
      if (APP.walletkit && APP.walletkit.isReady()) APP.walletkit.drawPreview();
    }
    if (s.currentTab === 'circle' && APP.logo) APP.logo.showPlaceholder();
    if (s.currentTab === 'crop' && APP.crop) APP.crop.showPlaceholder();
  };

  // ========================================================================
  // Unified Preview
  // ========================================================================
  APP.showPreview = function (opts) {
    APP.dom.previewCanvas.style.display = 'block';
    APP.dom.bgToggleBtn.style.display = (opts && opts.size) ? 'flex' : 'none';
    var img = new Image();
    img.onload = function () {
      var pw, ph;
      if (opts && opts.size) { pw = opts.size; ph = opts.size; }
      else { pw = img.naturalWidth; ph = img.naturalHeight; }
      APP.dom.previewCanvas.width = pw; APP.dom.previewCanvas.height = ph;
      APP.ctx.drawImage(img, 0, 0);
      if (opts && opts.guide === 'grid' && APP.logo) APP.logo.drawGuideOverlay();
      var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
      var s = Math.min(cw / pw, ch / ph, (opts && opts.maxScale) ? opts.maxScale : 2);
      APP.dom.previewCanvas.style.width = Math.round(pw * s) + 'px';
      APP.dom.previewCanvas.style.height = Math.round(ph * s) + 'px';
    };
    img.src = APP.state.processedDataUrl;
  };
  APP.hidePreview = function () {
    APP.dom.previewCanvas.style.display = 'none';
    APP.dom.bgToggleBtn.style.display = 'none';
  };

  // ========================================================================
  // Tab Switching
  // ========================================================================
  APP.switchTab = function (tab) {
    var s = APP.state;
    s.currentTab = tab;
    var nav = APP.dom.tabNav;
    nav.querySelectorAll('.tab-nav__btn').forEach(function (b) { b.classList.remove('active'); });
    nav.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    APP.dom.ctrlWalletkit.style.display = (tab === 'walletkit') ? '' : 'none';
    APP.dom.ctrlCompress.style.display  = (tab === 'compress')  ? '' : 'none';
    APP.dom.ctrlCircle.style.display    = (tab === 'circle')    ? '' : 'none';
    APP.dom.ctrlCrop.style.display      = (tab === 'crop')      ? '' : 'none';
    APP.dom.ctrlTest.style.display      = (tab === 'test')      ? '' : 'none';
    // Only logo tab shows 去背景
    APP.dom.removeBgSection.style.display = (tab === 'circle') ? '' : 'none';
    if (tab !== 'circle' && s.removeBgEnabled) {
      s.removeBgEnabled = false;
      APP.dom.removeBgCheck.checked = false;
      APP.dom.removeBgTolGroup.style.display = 'none';
    }
    APP.dom.uploadLimits.textContent = APP.TAB_CONFIG[tab].limits;
    if (tab === 'walletkit') {
      APP.dom.previewCanvas.style.display = 'block';
      APP.dom.bgToggleBtn.style.display = 'none';
      APP.dom.previewCard.style.background = '';
      APP.hidePreview();
      if (APP.walletkit && APP.walletkit.isReady()) APP.walletkit.drawPreview();
    } else if (tab === 'compress') {
      APP.dom.previewCanvas.style.display = 'none';
      APP.dom.bgToggleBtn.style.display = 'none';
      APP.dom.previewCard.style.background = '';
    } else {
      APP.dom.previewCanvas.style.display = 'none';
    }
    APP.resetAll();
    if (tab === 'circle' && !s.uploadedImage && APP.logo) APP.logo.showPlaceholder();
    if (tab === 'crop' && !s.uploadedImage && APP.crop) APP.crop.showPlaceholder();
    if (tab === 'test' && APP.test) APP.test.process();
    if (s.uploadedImage && tab !== 'walletkit') {
      if (tab === 'compress' && APP.compress) APP.compress.process();
      else if (tab === 'circle' && APP.logo) APP.logo.process();
      else if (tab === 'crop' && APP.crop) APP.crop.process();
      else if (tab === 'test' && APP.test) APP.test.process();
    }
  };

  // ========================================================================
  // Background Removal — corner sampling + RGB tolerance
  // ========================================================================
  APP.removeBackground = function () {
    var s = APP.state;
    if (!s.originalUploadDataUrl) return;
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (w < 10 || h < 10 || w * h > 4000000) { s.uploadedImage = img; afterBg(); return; }
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, w, h);
      var idata = cx.getImageData(0, 0, w, h), d = idata.data;
      var corners = [getPx(d,w,0,0), getPx(d,w,w-1,0), getPx(d,w,0,h-1), getPx(d,w,w-1,h-1)];
      var bgR = Math.round((corners[0][0]+corners[1][0]+corners[2][0]+corners[3][0])/4);
      var bgG = Math.round((corners[0][1]+corners[1][1]+corners[2][1]+corners[3][1])/4);
      var bgB = Math.round((corners[0][2]+corners[1][2]+corners[2][2]+corners[3][2])/4);
      var tol = s.bgTolerance;
      for (var y = 0; y < h; y++)
        for (var x = 0; x < w; x++) {
          var idx = (y*w+x)*4;
          if (Math.abs(d[idx]-bgR)<tol && Math.abs(d[idx+1]-bgG)<tol && Math.abs(d[idx+2]-bgB)<tol) d[idx+3]=0;
        }
      cx.putImageData(idata, 0, 0);
      var ni = new Image();
      ni.onload = function () { s.uploadedImage = ni; afterBg(); };
      ni.src = c.toDataURL('image/png');
    };
    img.src = s.originalUploadDataUrl;
  };

  APP.restoreOriginalImage = function () {
    var s = APP.state;
    var img = new Image();
    img.onload = function () { s.uploadedImage = img; afterBg(); };
    img.src = s.originalUploadDataUrl;
  };

  function afterBg() {
    var s = APP.state;
    if (s.currentTab === 'walletkit') { if (APP.walletkit) { APP.walletkit.drawPreview(); APP.dom.downloadBtn.disabled = false; } }
    else if (s.currentTab === 'compress') { if (APP.compress) APP.compress.process(); }
    else if (s.currentTab === 'circle') { if (APP.logo) APP.logo.process(); }
    else if (s.currentTab === 'crop') { if (APP.crop) APP.crop.process(); }
  }

  function getPx(data, w, x, y) { var idx = (y*w+x)*4; return [data[idx], data[idx+1], data[idx+2]]; }

  // ========================================================================
  // Utility
  // ========================================================================
  APP.drawRoundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  };

  // ========================================================================
  // Events
  // ========================================================================
  APP.bindSharedEvents = function () {
    var d = APP.dom;
    d.uploadZone.addEventListener('click', function () { d.fileInput.click(); });
    d.fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) APP.handleFile(e.target.files[0]);
      d.fileInput.value = '';
    });
    d.uploadZone.addEventListener('dragover', function (e) { e.preventDefault(); e.stopPropagation(); d.uploadZone.classList.add('drag-over'); });
    d.uploadZone.addEventListener('dragleave', function (e) { e.preventDefault(); e.stopPropagation(); d.uploadZone.classList.remove('drag-over'); });
    d.uploadZone.addEventListener('drop', function (e) {
      e.preventDefault(); e.stopPropagation(); d.uploadZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) APP.handleFile(e.dataTransfer.files[0]);
    });
    document.addEventListener('dragover', function (e) { e.preventDefault(); });
    document.addEventListener('drop', function (e) { e.preventDefault(); });
    document.addEventListener('paste', function (e) {
      if (APP.state.currentTab === 'walletkit' || APP.state.currentTab === 'compress' || APP.state.currentTab === 'circle') {
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (var i = 0; i < items.length; i++)
          if (items[i].type.match(/^image\//)) { e.preventDefault(); APP.handleFile(items[i].getAsFile()); break; }
      }
    });
    d.uploadZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); d.fileInput.click(); }
    });
    d.resetBtn.addEventListener('click', function () { APP.resetAll(); });
    d.downloadBtn.addEventListener('click', function () { APP.downloadImage(); });
    d.tabNav.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab-nav__btn');
      if (btn) APP.switchTab(btn.dataset.tab);
    });
    d.removeBgCheck.addEventListener('change', function () {
      APP.state.removeBgEnabled = this.checked;
      d.removeBgTolGroup.style.display = this.checked ? 'flex' : 'none';
      if (!APP.state.originalUploadDataUrl) return;
      if (APP.state.removeBgEnabled) APP.removeBackground();
      else APP.restoreOriginalImage();
    });

    function updateTol(delta) {
      APP.state.bgTolerance = Math.max(5, Math.min(200, APP.state.bgTolerance + delta));
      d.tolValue.textContent = APP.state.bgTolerance;
      if (APP.state.removeBgEnabled && APP.state.originalUploadDataUrl) APP.removeBackground();
    }
    d.tolMinus.addEventListener('click', function () { updateTol(-5); });
    d.tolPlus.addEventListener('click', function () { updateTol(5); });
  };

})();
