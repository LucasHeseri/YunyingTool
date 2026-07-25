/**
 * goldcard.js — 金色卡片 template (328×472 SVG).
 * Depends on APP (common.js).
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before goldcard.js');

  var M = APP.goldcard = {};
  var W = 328, H = 472, S = 2; // render at 2x

  var templateImg = null, ready = false;

  // ========================================================================
  // Load SVG template
  // ========================================================================
  M.init = function (cb) {
    if (typeof GOLDCARD_TEMPLATE === 'undefined') { if (cb) cb(false); return; }
    var img = new Image();
    img.onload = function () {
      templateImg = img; ready = true;
      if (APP.state.currentTab === 'goldcard') M.process();
      if (cb) cb(true);
    };
    img.onerror = function () { if (cb) cb(false); };
    img.src = GOLDCARD_TEMPLATE;
  };

  M.isReady = function () { return ready; };

  // ========================================================================
  // Get field values
  // ========================================================================
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }

  // ========================================================================
  // Render
  // ========================================================================
  M.process = function () {
    if (!templateImg) return;
    var c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    var ctx = c.getContext('2d');
    ctx.scale(S, S);

    // 1. Draw SVG template
    ctx.drawImage(templateImg, 0, 0, W, H);

    // 2. Overlay editable text fields
    ctx.textBaseline = 'middle';
    ctx.font = '400 13px "HarmonyOS Sans SC",sans-serif';

    // Top title area (72,34 → 190,46) — white 90% opacity
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 13px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcTitle'), 72, 40);

    // Top-right value
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val('gcTopRight'), 300, 40);
    ctx.textAlign = 'start';

    // Row 1 left (x=16,y=180,w=144,h=42)
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 11px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcLabelA'), 24, 195);
    ctx.font = 'bold 18px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcValueA'), 24, 214);

    // Row 1 right (x=168,y=180,w=144,h=42)
    ctx.font = '400 11px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcLabelB'), 176, 195);
    ctx.font = 'bold 18px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcValueB'), 176, 214);

    // Row 2 three columns (y=235, h=33, w=94 each)
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 11px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcFieldC'), 24, 251);
    ctx.fillText(val('gcFieldD'), 125, 251);
    ctx.fillText(val('gcFieldE'), 226, 251);

    APP.state.processedDataUrl = c.toDataURL('image/png');

    // Preview
    var cv = APP.dom.previewCanvas, pctx = APP.ctx;
    cv.width = W * S; cv.height = H * S;
    cv.style.display = 'block';
    pctx.drawImage(c, 0, 0);
    var cw = APP.dom.previewCard.clientWidth - 32;
    var ch = APP.dom.previewCard.clientHeight - 16;
    var ds = Math.min(cw / (W * S), ch / (H * S), 0.8);
    cv.style.width  = Math.round(W * S * ds) + 'px';
    cv.style.height = Math.round(H * S * ds) + 'px';
    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '328×472 金色卡片';
  };

  // ========================================================================
  // Events
  // ========================================================================
  M.bindEvents = function () {
    var ids = ['gcTitle','gcTopRight','gcLabelA','gcValueA','gcLabelB','gcValueB','gcFieldC','gcFieldD','gcFieldE'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        if (APP.state.currentTab === 'goldcard') M.process();
      });
    });
  };
})();
