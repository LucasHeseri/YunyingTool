/**
 * common.js — Shared state, DOM, utilities, upload, and tab switching.
 * All other modules depend on APP.* defined here.
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
    originalUploadDataUrl: null
  };

  // ========================================================================
  // Tab config
  // ========================================================================
  APP.TAB_CONFIG = {
    walletkit: { maxSize: 3 * 1024 * 1024, limits: '支持 PNG / JPG / WebP，大小不超过 3MB' },
    compress:  { maxSize: 3 * 1024 * 1024, limits: '支持 PNG / JPG / WebP，大小不超过 3MB' },
    circle:    { maxSize: 1 * 1024 * 1024, limits: '支持 PNG / JPG / WebP，大小不超过 1MB' }
  };
  var ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

  // ========================================================================
  // DOM references
  // ========================================================================
  var $ = function (id) { return document.getElementById(id); };
  APP.dom = {
    tabNav:       $('tabNav'),
    uploadZone:   $('uploadZone'),
    uploadThumb:  $('uploadThumb'),
    uploadLimits: $('uploadLimits'),
    uploadError:  $('uploadError'),
    fileInput:    $('fileInput'),
    resetBtn:     $('resetBtn'),
    downloadBtn:  $('downloadBtn'),
    previewCard:  $('previewCard'),
    previewCanvas: $('previewCanvas'),
    previewInfo:  $('previewInfo'),
    bgToggleBtn:  $('bgToggleBtn'),
    toast:        $('toast'),
    chipsNav:     $('chipsNav'),
    // Controls
    ctrlWalletkit: $('ctrlWalletkit'),
    ctrlCompress:  $('ctrlCompress'),
    ctrlCircle:    $('ctrlCircle'),
    cmpWidth:      $('cmpWidth'),
    cmpWidthVal:   $('cmpWidthVal'),
    logoChipsNav:    $('logoChipsNav'),
    logoBadgeCheck:  $('logoBadgeCheck'),
    logoGridBadgeGroup: $('logoGridBadgeGroup'),
    logoScale:      $('logoScale'),
    logoScaleVal:   $('logoScaleVal'),
    colorPicker:    $('colorPicker'),
    removeBgCheck:  $('removeBgCheck')
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
    s.toastTimer = setTimeout(function () {
      APP.dom.toast.classList.remove('show');
    }, 2000);
  };

  // ========================================================================
  // Validation
  // ========================================================================
  APP.validateFile = function (file) {
    if (!file) return false;
    if (!ALLOWED_TYPES.includes(file.type)) {
      APP.showError('仅支持 PNG / JPG / WebP 格式');
      return false;
    }
    var maxSize = APP.TAB_CONFIG[APP.state.currentTab].maxSize;
    if (file.size > maxSize) {
      APP.showError('图片大小超过 ' + (maxSize / 1024 / 1024).toFixed(0) + 'MB');
      return false;
    }
    return true;
  };

  APP.showError = function (msg) {
    APP.dom.uploadError.textContent = msg;
    setTimeout(function () { APP.dom.uploadError.textContent = ''; }, 3000);
  };

  // ========================================================================
  // File Handling — upload → call tab-specific process
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

        if (s.removeBgEnabled) {
          // Show eyedropper hint — wait for user to click background area
          APP.startEyedropper();
          return;
        }

        if (s.currentTab === 'walletkit') {
          if (APP.walletkit) APP.walletkit.afterUpload();
        } else if (s.currentTab === 'compress') {
          if (APP.compress) APP.compress.process();
        } else if (s.currentTab === 'circle') {
          if (APP.logo) APP.logo.process();
        }
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
    s.uploadedImage = null;
    s.processedDataUrl = null;
    s.originalUploadDataUrl = null;
    APP.stopEyedropper();
    APP.dom.uploadThumb.src = '';
    APP.dom.uploadZone.classList.remove('has-image');
    APP.dom.fileInput.value = '';
    APP.dom.uploadError.textContent = '';
    APP.dom.downloadBtn.disabled = true;
    APP.dom.previewInfo.textContent = '';
    APP.hidePreview();

    if (s.currentTab === 'walletkit') {
      APP.dom.previewCanvas.style.display = 'block';
      if (APP.walletkit && APP.walletkit.isReady()) APP.walletkit.drawPreview();
    }
  };

  // ========================================================================
  // Unified Preview (canvas-based)
  // ========================================================================
  APP.showPreview = function (opts) {
    APP.dom.previewCanvas.style.display = 'block';
    if (opts && opts.size) {
      APP.dom.bgToggleBtn.style.display = 'flex';
    } else {
      APP.dom.bgToggleBtn.style.display = 'none';
    }
    var img = new Image();
    img.onload = function () {
      var pw, ph;
      if (opts && opts.size) {
        pw = opts.size; ph = opts.size;
      } else {
        pw = img.naturalWidth; ph = img.naturalHeight;
      }
      APP.dom.previewCanvas.width = pw;
      APP.dom.previewCanvas.height = ph;
      APP.ctx.drawImage(img, 0, 0);
      if (opts && opts.guide === 'grid' && APP.logo) APP.logo.drawGuideOverlay();
      var cardW = APP.dom.previewCard.clientWidth - 32;
      var cardH = APP.dom.previewCard.clientHeight - 32;
      var maxS = (opts && opts.maxScale) ? opts.maxScale : 2;
      var s = Math.min(cardW / pw, cardH / ph, maxS);
      APP.dom.previewCanvas.style.width  = Math.round(pw * s) + 'px';
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
    if (s.uploadedImage && tab !== 'walletkit') {
      if (tab === 'compress' && APP.compress) APP.compress.process();
      else if (tab === 'circle' && APP.logo) APP.logo.process();
    }
  };

  // ========================================================================
  // Background Removal — eyedropper + flood-fill (HSL ±5 tolerance)
  // ========================================================================
  var _bgRemovalCanvas = null;       // cached canvas with image data
  var _bgRemovalImgData = null;
  var _bgRemovalW = 0, _bgRemovalH = 0;

  APP.startEyedropper = function () {
    var zone = APP.dom.uploadZone;
    zone.style.cursor = 'crosshair';
    zone.title = '点击图片上要移除的背景区域';
    APP.showToast('请点击图片上的背景区域');
  };

  APP.stopEyedropper = function () {
    APP.dom.uploadZone.style.cursor = '';
    APP.dom.uploadZone.title = '';
  };

  // Called when user clicks the upload thumbnail while in eyedropper mode
  APP.pickBgColor = function (clientX, clientY) {
    var s = APP.state;
    if (!s.removeBgEnabled || !s.originalUploadDataUrl) return;

    // Load image into canvas for pixel access
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (w < 10 || h < 10 || w * h > 4000000) { APP.stopEyedropper(); return; }

      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, w, h);

      // Calculate click position relative to thumbnail → image coordinates
      var thumb = APP.dom.uploadThumb;
      var rect = thumb.getBoundingClientRect();
      var scaleX = w / rect.width;
      var scaleY = h / rect.height;
      var px = Math.round((clientX - rect.left) * scaleX);
      var py = Math.round((clientY - rect.top) * scaleY);
      px = Math.max(0, Math.min(w - 1, px));
      py = Math.max(0, Math.min(h - 1, py));

      var idata = cx.getImageData(0, 0, w, h), d = idata.data;
      var idx = (py * w + px) * 4;
      var seedR = d[idx], seedG = d[idx + 1], seedB = d[idx + 2];
      var seedHSL = rgbToHsl(seedR, seedG, seedB);

      // Flood-fill: remove connected pixels within HSL ±5 tolerance
      var visited = new Uint8Array(w * h);
      var queue = [px, py];
      visited[py * w + px] = 1;

      while (queue.length > 0) {
        var y = queue.shift(), x = queue.shift();
        var i = (y * w + x) * 4;
        var hsl = rgbToHsl(d[i], d[i+1], d[i+2]);

        if (Math.abs(hsl[0] - seedHSL[0]) <= 5 &&
            Math.abs(hsl[1] - seedHSL[1]) <= 5 &&
            Math.abs(hsl[2] - seedHSL[2]) <= 5) {
          d[i + 3] = 0; // transparent

          // 4-connected neighbors
          var neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
          for (var n = 0; n < 4; n++) {
            var nx = neighbors[n][0], ny = neighbors[n][1];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[ny * w + nx]) {
              visited[ny * w + nx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      cx.putImageData(idata, 0, 0);
      var ni = new Image();
      ni.onload = function () {
        s.uploadedImage = ni;
        APP.stopEyedropper();
        APP._afterBgRemoval();
      };
      ni.src = c.toDataURL('image/png');
    };
    img.src = s.originalUploadDataUrl;
  };

  APP.restoreOriginalImage = function () {
    var s = APP.state;
    APP.stopEyedropper();
    var img = new Image();
    img.onload = function () { s.uploadedImage = img; APP._afterBgRemoval(); };
    img.src = s.originalUploadDataUrl;
  };

  APP._afterBgRemoval = function () {
    var s = APP.state;
    if (s.currentTab === 'walletkit') {
      if (APP.walletkit) { APP.walletkit.drawPreview(); APP.dom.downloadBtn.disabled = false; }
    } else if (s.currentTab === 'compress') {
      if (APP.compress) APP.compress.process();
    } else if (s.currentTab === 'circle') {
      if (APP.logo) APP.logo.process();
    }
  };

  // RGB → HSL (returns [h:0-360, s:0-100, l:0-100])
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  // ========================================================================
  // Utility: rounded rect path
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
  // Events — shared (upload, drag, paste, nav, download, reset)
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
        for (var i = 0; i < items.length; i++) {
          if (items[i].type.match(/^image\//)) { e.preventDefault(); APP.handleFile(items[i].getAsFile()); break; }
        }
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
      if (!APP.state.originalUploadDataUrl) return;
      if (APP.state.removeBgEnabled) {
        APP.startEyedropper();
      } else {
        APP.restoreOriginalImage();
      }
    });

    // Eyedropper: click on upload thumbnail to pick background color
    d.uploadZone.addEventListener('click', function (e) {
      if (!APP.state.removeBgEnabled || !APP.state.originalUploadDataUrl) return; // let normal upload click through
      if (!APP.state.uploadedImage) return; // no image loaded yet
      e.stopPropagation();
      APP.pickBgColor(e.clientX, e.clientY);
    }, true); // capture phase — runs before the normal upload click
  };

})();
