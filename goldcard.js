/**
 * goldcard.js — 金色卡片 template (328×472 SVG).
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before goldcard.js');

  var M = APP.goldcard = {};
  var W = 328, H = 472, S = 2;
  var templateImg = null, airplaneImg = null, ready = false;

  M.init = function (cb) {
    if (typeof GOLDCARD_TEMPLATE === 'undefined') { if (cb) cb(false); return; }
    var loaded = 0, total = 2;
    function checkDone() {
      if (loaded >= total) {
        ready = true;
        if (APP.state.currentTab === 'goldcard') M.process();
        if (cb) cb(true);
      }
    }
    var timg = new Image();
    timg.onload = function () { templateImg = timg; loaded++; checkDone(); };
    timg.onerror = function () { loaded++; checkDone(); };
    timg.src = GOLDCARD_TEMPLATE;

    var aimg = new Image();
    aimg.onload = function () { airplaneImg = aimg; loaded++; checkDone(); };
    aimg.onerror = function () { loaded++; checkDone(); };
    aimg.src = typeof AIRPLANE_ICON !== 'undefined' ? AIRPLANE_ICON : '';
  };
  M.isReady = function () { return ready; };

  function v(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function n(id) { var e = document.getElementById(id); return e ? parseInt(e.value, 10) || 0 : 0; }

  M.process = function () {
    if (!templateImg) return;
    var c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    var ctx = c.getContext('2d');
    ctx.scale(S, S);
    ctx.drawImage(templateImg, 0, 0, W, H);
    ctx.textBaseline = 'middle';

    // Title (top area)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 13px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcTitle'), n('gcTitleX'), n('gcTitleY'));

    // Gate info (top-right: 登机口 label + value, right-aligned, fixed gap)
    var gateX = n('gcGateX'), gateY = n('gcGateY'), gateVal = v('gcGate');
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.textAlign = 'right';
    // Draw value first at right edge
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(gateVal, gateX, gateY);
    // Draw "登机口" label to the left with fixed 4px gap
    var valW = ctx.measureText(gateVal).width;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('登机口', gateX - valW - 4, gateY);
    ctx.textAlign = 'start';

    // === Flight info at y=72 (Pixso layout, 296px wide) ===
    var FY = 72;
    // Row 1: Departure airport (left) / Arrival airport (right) — 12px, 60% white
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcDepAirport'), 16, FY + 12);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcArrAirport'), 312, FY + 12);
    ctx.textAlign = 'start';

    // Row 2: Departure time (left) / Arrival time (right) — 36px Bold, white, 96px gap
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.font = '400 36px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcDepTime'), 16, FY + 42);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcArrTime'), 312, FY + 42);
    ctx.textAlign = 'start';

    // Row 3: Date (left) / Flight No (center) / Date (right) — 12px
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcDateL'), 16, FY + 64);
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.textAlign = 'center';
    ctx.fillText(v('gcFlightNo'), 164, FY + 64);
    ctx.textAlign = 'start';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'right';
    ctx.fillText(v('gcDateR'), 312, FY + 64);
    ctx.textAlign = 'start';

    // Airplane + dots icon at y=99, centered (74×25, Pixso frame 821_5608)
    if (airplaneImg) {
      ctx.drawImage(airplaneImg, 127, 99, 74, 25);
    }

    // === Passenger info at y=170 (Pixso frame 1048_19, 296×88) ===
    var PY = 174;
    // Row 1: 乘机人 (left, 20px Medium) / 座位号 (right, 20px Medium)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText('乘机人', 16, PY + 8);
    ctx.textAlign = 'right';
    ctx.fillText('座位号', 312, PY + 8);
    ctx.textAlign = 'start';
    // Values — 20px Medium, 90% white
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 20px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcPassenger'), 16, PY + 32);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcSeat'), 312, PY + 32);
    ctx.textAlign = 'start';

    // Row 2: 登机时间 (left) / 舱位等级 (center) / 登记序号 (right) — 16px Medium
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText('登机时间', 16, PY + 60);
    ctx.textAlign = 'center';
    ctx.fillText('舱位等级', 164, PY + 60);
    ctx.textAlign = 'right';
    ctx.fillText('登记序号', 312, PY + 60);
    ctx.textAlign = 'start';
    // Values — 16px Medium, 90% white
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 16px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcBoardTime'), 16, PY + 80);
    ctx.textAlign = 'center';
    ctx.fillText(v('gcCabinClass'), 164, PY + 80);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcSeq'), 312, PY + 80);
    ctx.textAlign = 'start';

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
    var ids = ['gcTitle','gcTitleX','gcTitleY','gcGate','gcGateX','gcGateY',
      'gcDepAirport','gcArrAirport','gcDepTime','gcArrTime','gcDateL','gcFlightNo','gcDateR',
      'gcPassenger','gcSeat','gcBoardTime','gcCabinClass','gcSeq'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        if (APP.state.currentTab === 'goldcard') M.process();
      });
    });
  };
})();
