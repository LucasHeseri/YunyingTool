/**
 * goldcard.js — 金色卡片 template (328×472 SVG).
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before goldcard.js');

  var M = APP.goldcard = {};
  var W = 328, H = 472, S = 2;
  var templateImg = null, airplaneImg = null, avatarImg = null, ready = false;
  M.bgColor = '#B97600';  // card background color
  M.avatarScale = 0;      // -20 ~ +20 %

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

  M.setAvatar = function (dataUrl) {
    var img = new Image();
    img.onload = function () { avatarImg = img; M.process(); };
    img.src = dataUrl;
  };

  function v(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function n(id) { var e = document.getElementById(id); return e ? parseInt(e.value, 10) || 0 : 0; }

  M.process = function () {
    if (!templateImg) return;
    var c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    var ctx = c.getContext('2d');
    ctx.scale(S, S);

    // Fill entire card background with selected color (rounded rect)
    var bg = M.bgColor || '#B97600';
    ctx.fillStyle = bg;
    APP.drawRoundRect(ctx, 0, 0, W, H, 24);
    ctx.fill();

    ctx.drawImage(templateImg, 0, 0, W, H);
    ctx.textBaseline = 'middle';

    // Cover text/graphics in title and gate areas with card bg color
    ctx.fillStyle = bg;
    ctx.fillRect(56, 14, 200, 44);   // title text area
    ctx.fillRect(240, 14, 64, 44);   // gate text area (x:240-304, stays clear of right corner)

    // Avatar — white circle placeholder at (24,24), 32×32, radius 16
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(40, 40, 16, 0, Math.PI * 2);
    ctx.fill();
    if (avatarImg) {
      var as = 1 + (M.avatarScale || 0) / 100;  // 0.8 ~ 1.2
      var dSize = 32 * as;
      var dX = 24 + (32 - dSize) / 2;
      var dY = 24 + (32 - dSize) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(40, 40, 16, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, dX, dY, dSize, dSize);
      ctx.restore();
    }

    // Title (top-left, 32px from top, 8px gap from avatar) — 16px
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 16px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcTitle'), n('gcTitleX'), n('gcTitleY'));

    // Gate info (top-right: 登机口 label + value, right-aligned)
    var gateX = n('gcGateX'), gateY = n('gcGateY'), gateVal = v('gcGate');
    ctx.font = '400 14px "HarmonyOS Sans SC",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(gateVal, gateX, gateY);
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

    // === Passenger info at y=174 (Pixso frame 1048_19, 296×88) ===
    var PY = 174;
    // Row 1: label + value (left, 20px) / label + value (right, 20px)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcPassengerLabel'), 16, PY + 8);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcSeatLabel'), 312, PY + 8);
    ctx.textAlign = 'start';
    // Values — 20px Medium, 90% white
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 20px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcPassenger'), 16, PY + 32);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcSeat'), 312, PY + 32);
    ctx.textAlign = 'start';

    // Row 2: label+value (left) / label+value (center) / label+value (right) — 16px
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcBoardTimeLabel'), 16, PY + 60);
    ctx.textAlign = 'center';
    ctx.fillText(v('gcCabinClassLabel'), 164, PY + 60);
    ctx.textAlign = 'right';
    ctx.fillText(v('gcSeqLabel'), 312, PY + 60);
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
    var ids = [
      'gcTitle','gcTitleX','gcTitleY','gcGate','gcGateX','gcGateY',
      'gcDepAirport','gcArrAirport','gcDepTime','gcArrTime','gcDateL','gcFlightNo','gcDateR',
      'gcPassengerLabel','gcPassenger','gcSeatLabel','gcSeat',
      'gcBoardTimeLabel','gcBoardTime','gcCabinClassLabel','gcCabinClass','gcSeqLabel','gcSeq'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        if (APP.state.currentTab === 'goldcard') M.process();
      });
    });

    // Avatar scale slider
    var scaleSlider = document.getElementById('gcAvatarScale');
    var scaleVal = document.getElementById('gcAvatarScaleVal');
    if (scaleSlider) {
      scaleSlider.addEventListener('input', function () {
        M.avatarScale = parseInt(scaleSlider.value, 10) || 0;
        if (scaleVal) scaleVal.textContent = M.avatarScale + '%';
        if (APP.state.currentTab === 'goldcard') M.process();
      });
    }

    // Card background color picker — HarmonyOS colors
    var picker = document.getElementById('gcColorPicker');
    if (picker) {
      var colors = [
        { color: '#B97600', label: '金' },
        { color: '#0A59F7', label: '蓝' },
        { color: '#E84026', label: '红' },
        { color: '#ED6F21', label: '橙' },
        { color: '#64BB5C', label: '绿' },
        { color: '#1A1A1A', label: '黑' },
        { color: '#FFFFFF', label: '白' },
        { color: '#F1F3F5', label: '灰' }
      ];
      picker.innerHTML = '';
      colors.forEach(function (c) {
        var dot = document.createElement('span');
        var isWhite = c.color === '#FFFFFF';
        dot.style.cssText = 'width:24px;height:24px;border-radius:50%;cursor:pointer;background:' + c.color +
          ';border:2px solid ' + (isWhite ? 'var(--border)' : 'transparent') +
          ';box-shadow:' + (isWhite ? 'none' : '0 1px 3px rgba(0,0,0,0.15)') +
          (M.bgColor === c.color ? ';outline:2px solid var(--brand);outline-offset:2px' : '');
        dot.title = c.label;
        dot.addEventListener('click', function () {
          M.bgColor = c.color;
          picker.querySelectorAll('span').forEach(function (d) { d.style.outline = ''; });
          dot.style.outline = '2px solid var(--brand)'; dot.style.outlineOffset = '2px';
          if (APP.state.currentTab === 'goldcard') M.process();
        });
        picker.appendChild(dot);
      });
    }

    // Avatar upload
    var avatarInput = document.getElementById('gcAvatarInput');
    var avatarBtn = document.getElementById('gcAvatarBtn');
    var avatarName = document.getElementById('gcAvatarName');
    if (avatarBtn && avatarInput) {
      avatarBtn.addEventListener('click', function () { avatarInput.click(); });
      avatarInput.addEventListener('change', function () {
        if (avatarInput.files && avatarInput.files[0]) {
          var file = avatarInput.files[0];
          if (!['image/png','image/jpeg','image/webp'].includes(file.type)) { APP.showToast('仅支持 PNG / JPG / WebP'); return; }
          if (file.size > 512 * 1024) { APP.showToast('头像不超过 512KB'); return; }
          var reader = new FileReader();
          reader.onload = function (e) {
            M.setAvatar(e.target.result);
            if (avatarName) avatarName.textContent = file.name;
          };
          reader.readAsDataURL(file);
          avatarInput.value = '';
        }
      });
    }
  };
})();
