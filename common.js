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
    removeBgBtn:   $('removeBgBtn'),
    restoreBgBtn:  $('restoreBgBtn')
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

        // Exit eyedropper if active, then proceed normally
        if (s.removeBgEnabled) APP.exitBgRemoval();
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
    APP.exitBgRemoval();
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
    if (s.removeBgEnabled) APP.exitBgRemoval();
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
  // Background Removal — preview canvas eyedropper + drag tolerance + red overlay
  // ========================================================================
  var _bgData = null;        // { w, h, origImageData, canvas, ctx, seedPX, seedPY }
  var _bgDragStartX = 0, _bgDragStartY = 0;
  var _bgDragging = false;
  var _bgTolerance = 5;
  var _bgPrevCanvas = null;  // offscreen canvas for preview compositing
  var _bgRenderPending = false;

  // "去背景" button → enter eyedropper on preview canvas
  APP.enterBgRemoval = function () {
    var s = APP.state;
    if (!s.originalUploadDataUrl) { APP.showToast('请先上传图片'); return; }
    s.removeBgEnabled = true;
    APP.dom.removeBgBtn.style.display = 'none';
    APP.dom.restoreBgBtn.style.display = '';
    APP.showToast('在预览图上按住并拖动来调整范围');

    // Show original image on preview canvas, keeping current display size
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      APP.dom.previewCanvas.width = w;
      APP.dom.previewCanvas.height = h;
      APP.dom.previewCanvas.style.display = 'block';
      APP.dom.bgToggleBtn.style.display = 'none';
      APP.ctx.drawImage(img, 0, 0);
      // Keep current canvas display size — don't shrink it
      var cw = APP.dom.previewCard.clientWidth - 32;
      var ch = APP.dom.previewCard.clientHeight - 32;
      var s = Math.min(cw / w, ch / h, 2);
      APP.dom.previewCanvas.style.width  = Math.round(w * s) + 'px';
      APP.dom.previewCanvas.style.height = Math.round(h * s) + 'px';
      APP.dom.previewCanvas.style.cursor = 'crosshair';

      // Prepare offscreen data for flood-fill
      var oc = document.createElement('canvas'); oc.width = w; oc.height = h;
      var ocx = oc.getContext('2d');
      ocx.drawImage(img, 0, 0);
      _bgData = {
        w: w, h: h,
        origImageData: ocx.getImageData(0, 0, w, h),
        canvas: oc, ctx: ocx
      };
      _bgPrevCanvas = document.createElement('canvas'); _bgPrevCanvas.width = w; _bgPrevCanvas.height = h;
    };
    img.src = s.originalUploadDataUrl;
  };

  APP.exitBgRemoval = function () {
    APP.state.removeBgEnabled = false;
    _bgDragging = false;
    _bgData = null;
    APP.dom.previewCanvas.style.cursor = '';
    APP.dom.removeBgBtn.style.display = '';
    APP.dom.restoreBgBtn.style.display = 'none';
  };

  // mousedown on preview canvas
  APP.bgMousedown = function (e) {
    if (!APP.state.removeBgEnabled || !_bgData) return;
    e.preventDefault(); e.stopPropagation();
    _bgDragging = true;
    _bgDragStartX = e.clientX;
    _bgDragStartY = e.clientY;
    _bgTolerance = 5;

    // Get seed pixel from canvas coordinates
    var cv = APP.dom.previewCanvas;
    var cr = cv.getBoundingClientRect();
    var sx = _bgData.w / cr.width, sy = _bgData.h / cr.height;
    var px = Math.round((e.clientX - cr.left) * sx);
    var py = Math.round((e.clientY - cr.top) * sy);
    px = Math.max(0, Math.min(_bgData.w - 1, px));
    py = Math.max(0, Math.min(_bgData.h - 1, py));
    _bgData.seedPX = px; _bgData.seedPY = py;

    renderBgOverlay();
  };

  // mousemove: straight-line distance → tolerance (throttled via RAF)
  APP.bgMousemove = function (e) {
    if (!_bgDragging || !_bgData) return;
    e.preventDefault();
    var dx = e.clientX - _bgDragStartX;
    var dy = e.clientY - _bgDragStartY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    _bgTolerance = Math.min(100, Math.max(3, Math.round(3 + dist * 0.8)));
    if (!_bgRenderPending) {
      _bgRenderPending = true;
      requestAnimationFrame(function () {
        _bgRenderPending = false;
        renderBgOverlay();
      });
    }
  };

  // mouseup: finalize transparency
  APP.bgMouseup = function (e) {
    if (!_bgDragging || !_bgData) return;
    _bgDragging = false;

    // Apply final transparency to original image data
    var bd = _bgData, w = bd.w, h = bd.h;
    var idata = new ImageData(new Uint8ClampedArray(bd.origImageData.data), w, h);
    var d = idata.data;
    var mask = computeFloodMask(bd);

    for (var y = 0; y < h; y++)
      for (var x = 0; x < w; x++)
        if (mask[y * w + x]) d[(y * w + x) * 4 + 3] = 0;

    bd.ctx.putImageData(idata, 0, 0);
    var ni = new Image();
    ni.onload = function () {
      APP.state.uploadedImage = ni;
      APP.exitBgRemoval();
      APP._afterBgRemoval();
      APP.showToast('背景已移除（容差: ±' + _bgTolerance + '）');
    };
    ni.src = bd.canvas.toDataURL('image/png');
  };

  // Render: original image + red 20% overlay on flood-filled region
  function renderBgOverlay() {
    var bd = _bgData, w = bd.w, h = bd.h;
    var pcv = _bgPrevCanvas, pcx = pcv.getContext('2d');

    // Copy original image data to preview canvas
    pcx.putImageData(bd.origImageData, 0, 0);

    // Compute flood mask
    var mask = computeFloodMask(bd);

    // Draw red overlay on masked pixels
    var overlayData = pcx.getImageData(0, 0, w, h);
    var od = overlayData.data;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (mask[y * w + x]) {
          var idx = (y * w + x) * 4;
          od[idx]     = 255;   // R
          od[idx + 1] = 0;     // G
          od[idx + 2] = 0;     // B
          od[idx + 3] = Math.round(od[idx + 3] * 0.2 + 51); // 20% red blend
        }
      }
    }
    pcx.putImageData(overlayData, 0, 0);

    // Show on preview canvas
    var cv = APP.dom.previewCanvas;
    cv.width = w; cv.height = h;
    APP.ctx.drawImage(pcv, 0, 0);
  }

  // Compute flood-fill mask from seed with current tolerance (RGB Euclidean distance, 0-100 scale)
  function computeFloodMask(bd) {
    var w = bd.w, h = bd.h, d = bd.origImageData.data;
    var mask = new Uint8Array(w * h);
    var tol = _bgTolerance;
    var px = bd.seedPX, py = bd.seedPY;

    // Pre-read seed RGB
    var seedIdx = (py * w + px) * 4;
    var seedR = d[seedIdx], seedG = d[seedIdx + 1], seedB = d[seedIdx + 2];

    var MAX_PIXELS = 500000;
    var count = 0;
    var queue = [px, py];
    mask[py * w + px] = 1;

    // Normalization factor: max RGB distance √(255²+255²+255²) / 100 ≈ 4.4167
    var NORM = 4.4167;

    while (queue.length > 0 && count < MAX_PIXELS) {
      var y = queue.shift(), x = queue.shift();
      var nb = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
      for (var n = 0; n < 4; n++) {
        var nx = nb[n][0], ny = nb[n][1];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && !mask[ny * w + nx]) {
          var i = (ny * w + nx) * 4;
          var dr = d[i] - seedR, dg = d[i+1] - seedG, db = d[i+2] - seedB;
          var dist = Math.sqrt(dr*dr + dg*dg + db*db) / NORM;
          if (dist <= tol) {
            mask[ny * w + nx] = 1;
            queue.push(nx, ny);
            count++;
          }
        }
      }
    }
    return mask;
  }

  // "恢复原图" button
  APP.restoreOriginalImage = function () {
    var s = APP.state;
    APP.exitBgRemoval();
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
    // 去背景 button
    d.removeBgBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      APP.enterBgRemoval();
    });

    // 恢复原图 button
    d.restoreBgBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      APP.restoreOriginalImage();
    });

    // Eyedropper drag on preview canvas
    d.previewCanvas.addEventListener('mousedown', function (e) {
      APP.bgMousedown(e);
    });
    document.addEventListener('mousemove', function (e) {
      if (APP.state.removeBgEnabled && _bgDragging) APP.bgMousemove(e);
    });
    document.addEventListener('mouseup', function (e) {
      APP.bgMouseup(e);
    });
  };

})();
