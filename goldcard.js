/**
 * goldcard.js — 金色卡片 template (328×472 SVG).
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

  function v(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function n(id) { var e = document.getElementById(id); return e ? parseInt(e.value, 10) || 0 : 0; }

  function drawPair(ctx, labelId, valueId, xId, yId, labelFont, valueFont) {
    var x = n(xId), y = n(yId);
    ctx.font = labelFont;
    ctx.fillText(v(labelId), x, y);
    ctx.font = valueFont;
    ctx.fillText(v(valueId), x, y + 19);
  }

  M.process = function () {
    if (!templateImg) return;
    var c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    var ctx = c.getContext('2d');
    ctx.scale(S, S);
    ctx.drawImage(templateImg, 0, 0, W, H);
    ctx.textBaseline = 'middle';

    // Title (top area, same as before)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 13px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcTitle'), n('gcTitleX'), n('gcTitleY'));

    // Top Right
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(v('gcTopRight'), n('gcTopRightX'), n('gcTopRightY'));
    ctx.textAlign = 'start';

    // === Middle info at y=72 (Pixso frame 1048_19, 296×88) ===
    var MY = 72;
    // Row 1: 乘机人 (left, 20px Medium) / 座位号 (right, 20px Medium)
    // Labels — 12px, 60% white, gap 4px above value
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText('乘机人', 16, MY + 8);
    ctx.textAlign = 'right';
    ctx.fillText('座位号', 312, MY + 8);
    ctx.textAlign = 'start';
    // Values — 20px Medium, 90% white
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 20px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcPassenger'), 16, MY + 32);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcSeat'), 312, MY + 32);
    ctx.textAlign = 'start';

    // Row 2 at y=55 within frame: 登机时间 (left) / 舱位等级 (center) / 登记序号 (right) — 16px Medium
    // Labels — 12px, 60% white
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText('登机时间', 16, MY + 60);
    ctx.textAlign = 'center';
    ctx.fillText('舱位等级', 164, MY + 60);
    ctx.textAlign = 'right';
    ctx.fillText('登记序号', 312, MY + 60);
    ctx.textAlign = 'start';
    // Values — 16px Medium, 90% white
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 16px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcBoardTime'), 16, MY + 80);
    ctx.textAlign = 'center';
    ctx.fillText(v('gcCabinClass'), 164, MY + 80);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcSeq'), 312, MY + 80);
    ctx.textAlign = 'start';

    // === Data fields A-E ===
    ctx.fillStyle = '#ffffff';
    drawPair(ctx, 'gcLabelA', 'gcValueA', 'gcAX', 'gcAY', '400 11px "HarmonyOS Sans SC",sans-serif', 'bold 18px "HarmonyOS Sans SC",sans-serif');
    drawPair(ctx, 'gcLabelB', 'gcValueB', 'gcBX', 'gcBY', '400 11px "HarmonyOS Sans SC",sans-serif', 'bold 18px "HarmonyOS Sans SC",sans-serif');
    drawPair(ctx, 'gcLabelC', 'gcValueC', 'gcCX', 'gcCY', '400 11px "HarmonyOS Sans SC",sans-serif', 'bold 16px "HarmonyOS Sans SC",sans-serif');
    drawPair(ctx, 'gcLabelD', 'gcValueD', 'gcDX', 'gcDY', '400 11px "HarmonyOS Sans SC",sans-serif', 'bold 16px "HarmonyOS Sans SC",sans-serif');
    drawPair(ctx, 'gcLabelE', 'gcValueE', 'gcEX', 'gcEY', '400 11px "HarmonyOS Sans SC",sans-serif', 'bold 16px "HarmonyOS Sans SC",sans-serif');

    APP.state.processedDataUrl = c.toDataURL('image/png');

    var cv = APP.dom.previewCanvas, pctx = APP.ctx;
    cv.width = W * S; cv.height = H * S;
    cv.style.display = 'block';
    pctx.drawImage(c, 0, 0);
    var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
    var ds = Math.min(cw / (W * S), ch / (H * S), 0.8);
    cv.style.width  = Math.round(W * S * ds) + 'px';
    cv.style.height = Math.round(H * S * ds) + 'px';
    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '328×472 金色卡片';
  };

  M.bindEvents = function () {
    var ids = ['gcTitle','gcTitleX','gcTitleY','gcTopRight','gcTopRightX','gcTopRightY',
      'gcPassenger','gcSeat','gcBoardTime','gcCabinClass','gcSeq',
      'gcLabelA','gcValueA','gcAX','gcAY','gcLabelB','gcValueB','gcBX','gcBY',
      'gcLabelC','gcValueC','gcCX','gcCY','gcLabelD','gcValueD','gcDX','gcDY',
      'gcLabelE','gcValueE','gcEX','gcEY'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        if (APP.state.currentTab === 'goldcard') M.process();
      });
    });
  };
})();
