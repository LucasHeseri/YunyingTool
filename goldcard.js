/**
 * goldcard.js — 金色卡片 template (328×472 SVG).
 * Depends on APP (common.js) and GOLDCARD_TEMPLATE global.
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before goldcard.js');

  var M = APP.goldcard = {};
  var W = 328, H = 472, S = 2;

  var templateImg = null, ready = false;

  M.init = function (cb) {
    if (typeof GOLDCARD_TEMPLATE === 'undefined') { if (cb) cb(false); return; }
    var img = new Image();
    img.onload = function () { templateImg = img; ready = true; if (APP.state.currentTab === 'goldcard') M.process(); if (cb) cb(true); };
    img.onerror = function () { if (cb) cb(false); };
    img.src = GOLDCARD_TEMPLATE;
  };

  M.isReady = function () { return ready; };

  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function num(id) { var e = document.getElementById(id); return e ? parseInt(e.value, 10) || 0 : 0; }

  M.process = function () {
    if (!templateImg) return;
    var c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    var ctx = c.getContext('2d');
    ctx.scale(S, S);

    ctx.drawImage(templateImg, 0, 0, W, H);
    ctx.textBaseline = 'middle';

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 13px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcTitle'), num('gcTitleX'), num('gcTitleY'));

    // Top Right
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val('gcTopRight'), num('gcTopRightX'), num('gcTopRightY'));
    ctx.textAlign = 'start';

    // Field A label
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 11px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcLabelA'), num('gcLabelAX'), num('gcLabelAY'));
    // Field A value
    ctx.font = 'bold 18px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcValueA'), num('gcValueAX'), num('gcValueAY'));

    // Field B label
    ctx.font = '400 11px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcLabelB'), num('gcLabelBX'), num('gcLabelBY'));
    // Field B value
    ctx.font = 'bold 18px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcValueB'), num('gcValueBX'), num('gcValueBY'));

    // Fields C, D, E
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 11px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(val('gcFieldC'), num('gcFieldCX'), num('gcFieldCY'));
    ctx.fillText(val('gcFieldD'), num('gcFieldDX'), num('gcFieldDY'));
    ctx.fillText(val('gcFieldE'), num('gcFieldEX'), num('gcFieldEY'));

    APP.state.processedDataUrl = c.toDataURL('image/png');

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

  M.bindEvents = function () {
    var ids = [
      'gcTitle','gcTitleX','gcTitleY',
      'gcTopRight','gcTopRightX','gcTopRightY',
      'gcLabelA','gcValueA','gcLabelAX','gcLabelAY','gcValueAX','gcValueAY',
      'gcLabelB','gcValueB','gcLabelBX','gcLabelBY','gcValueBX','gcValueBY',
      'gcFieldC','gcFieldCX','gcFieldCY',
      'gcFieldD','gcFieldDX','gcFieldDY',
      'gcFieldE','gcFieldEX','gcFieldEY'
    ];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        if (APP.state.currentTab === 'goldcard') M.process();
      });
    });
  };
})();
