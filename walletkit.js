/**
 * walletkit.js — WalletKit 机模 module.
 * Depends on APP (common.js) and CARD_ORIGINAL / TICKET_ORIGINAL globals.
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before walletkit.js');

  var M = APP.walletkit = {};

  // ========================================================================
  // State
  // ========================================================================
  M.state = { type: 'card' }; // 'card' | 'ticket'

  // ========================================================================
  // Config — matches the red rect in the SVGs
  // ========================================================================
  var CONFIG = {
    card:   { viewBoxW: 823, viewBoxH: 808, rect: { x: 94,  y: 159, w: 634, h: 400, rx: 48 }, fillMode: 'cover' },
    ticket: { viewBoxW: 687, viewBoxH: 802, rect: { x: 91,  y: 123, w: 519, h: 806, rx: 36 }, fillMode: 'width', fadeY1: 0.83, fadeY2: 1.0 }
  };

  var baseImgCache = {}; // { card: Image, ticket: Image }
  var ready = false;

  // ========================================================================
  // Load SVGs
  // ========================================================================
  M.init = function (callback) {
    var sources = {
      card:   typeof CARD_ORIGINAL   !== 'undefined' ? CARD_ORIGINAL   : null,
      ticket: typeof TICKET_ORIGINAL !== 'undefined' ? TICKET_ORIGINAL : null
    };
    var types = Object.keys(sources), remaining = types.length;

    types.forEach(function (type) {
      if (!sources[type]) { remaining--; checkDone(); return; }
      var img = new Image();
      img.onload  = function () { baseImgCache[type] = img; remaining--; checkDone(); };
      img.onerror = function () { remaining--; checkDone(); };
      img.src = sources[type];
    });

    function checkDone() {
      if (remaining <= 0) { ready = Object.keys(baseImgCache).length > 0; if (callback) callback(ready); }
    }
  };

  M.isReady = function () { return ready; };

  function getBaseImg() { return baseImgCache[M.state.type]; }

  // ========================================================================
  // Preview Drawing
  // ========================================================================
  M.drawPreview = function () {
    if (APP.state.currentTab !== 'walletkit') return;
    var cfg = CONFIG[M.state.type], baseImg = getBaseImg();
    if (!baseImg) return;

    var cw = cfg.viewBoxW, ch = cfg.viewBoxH;
    var canvas = APP.dom.previewCanvas, ctx = APP.ctx;
    canvas.width = cw; canvas.height = ch;

    // Fit canvas to card area
    var cardW = APP.dom.previewCard.clientWidth - 32;
    var cardH = APP.dom.previewCard.clientHeight - 16;
    var scale = Math.min(cardW / cw, cardH / ch, 1);
    canvas.style.width  = Math.round(cw * scale) + 'px';
    canvas.style.height = Math.round(ch * scale) + 'px';

    ctx.drawImage(baseImg, 0, 0, cw, ch);

    if (APP.state.uploadedImage) {
      drawUserImageOnCard(cfg);
      APP.state.processedDataUrl = canvas.toDataURL('image/png');
    } else {
      drawGuideOverlay(cfg);
    }
  };

  function drawUserImageOnCard(cfg) {
    var r = cfg.rect, ctx = APP.ctx;
    ctx.save();
    APP.drawRoundRect(ctx, r.x, r.y, r.w, r.h, r.rx);
    ctx.clip();

    var imgW = APP.state.uploadedImage.naturalWidth, imgH = APP.state.uploadedImage.naturalHeight;
    var sx, sy, sw, sh;

    if (cfg.fillMode === 'width') {
      // Ticket: image width = card area width, top-aligned, crop excess bottom
      sw = imgW;
      sh = Math.round(r.h * imgW / r.w);
      sx = 0; sy = 0;
    } else {
      // Card: cover (match larger dimension)
      var rectRatio = r.w / r.h, imgRatio = imgW / imgH;
      if (imgRatio > rectRatio) { sh = imgH; sw = Math.round(imgH * rectRatio); sx = Math.round((imgW - sw) / 2); sy = 0; }
      else { sw = imgW; sh = Math.round(imgW / rectRatio); sx = 0; sy = Math.round((imgH - sh) / 2); }
    }

    ctx.drawImage(APP.state.uploadedImage, sx, sy, sw, sh, r.x, r.y, r.w, r.h);

    // Apply fade-to-transparent at bottom for ticket template
    if (cfg.fadeY1) {
      var fy1 = r.y + r.h * cfg.fadeY1;
      var fy2 = r.y + r.h * cfg.fadeY2;
      ctx.globalCompositeOperation = 'destination-out';
      var fg = ctx.createLinearGradient(r.x, fy1, r.x, fy2);
      fg.addColorStop(0, 'rgba(0,0,0,0)');
      fg.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = fg;
      ctx.fillRect(r.x, fy1, r.w, fy2 - fy1);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }

  function drawGuideOverlay(cfg) {
    var r = cfg.rect, cw = cfg.viewBoxW, ch = cfg.viewBoxH, ctx = APP.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.beginPath(); ctx.rect(0, 0, cw, ch);
    APP.drawRoundRect(ctx, r.x, r.y, r.w, r.h, r.rx); ctx.fill('evenodd'); ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#0a59f7'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 4]);
    APP.drawRoundRect(ctx, r.x, r.y, r.w, r.h, r.rx); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    ctx.save();
    ctx.fillStyle = '#fff';
    var fs = Math.max(16, Math.round(r.w / 22));
    ctx.font = 'bold ' + fs + 'px "PingFang SC","HarmonyOS Sans SC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📤 上传图片替换此处', r.x + r.w / 2, r.y + r.h / 2 - fs * 0.7);
    ctx.font = Math.round(fs * 0.55) + 'px "PingFang SC","HarmonyOS Sans SC",sans-serif';
    ctx.fillText('点击左侧区域上传图片', r.x + r.w / 2, r.y + r.h / 2 + fs * 0.7);
    ctx.restore();
  }

  M.afterUpload = function () {
    M.drawPreview();
    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '原图 ' + APP.state.uploadedImage.naturalWidth + '×' + APP.state.uploadedImage.naturalHeight +
      ' → ' + CONFIG[M.state.type].viewBoxW + '×' + CONFIG[M.state.type].viewBoxH;
  };

  // ========================================================================
  // Events
  // ========================================================================
  M.bindEvents = function () {
    APP.dom.chipsNav.addEventListener('click', function (e) {
      var btn = e.target.closest('.chips-nav__btn');
      if (!btn) return;
      var type = btn.dataset.mockup;
      if (type === M.state.type) return;
      M.state.type = type;
      APP.dom.chipsNav.querySelectorAll('.chips-nav__btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      APP.state.processedDataUrl = null;
      APP.dom.downloadBtn.disabled = !!APP.state.uploadedImage;
      M.drawPreview();
    });
  };
})();
