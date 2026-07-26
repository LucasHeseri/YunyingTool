/**
 * goldcard.js — 金色卡片 template (328×472 SVG).
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before goldcard.js');

  var M = APP.goldcard = {};
  var W = 328, H = 472, S = 2;
  var templateImg = null, airplaneImg = null, qrImg = null, avatarImg = null;
  var ticketTopImg = null, ticketBtmImg = null, ticketMidImg = null;
  var ready = false;
  M.mode = 'boarding';    // 'boarding' | 'ticket'
  M.bgColor = '#B97600';  // card background color
  M.avatarScale = 0;      // -20 ~ +20 %

  // === Per-mode field data (独立存储) ===
  var FIELD_IDS = [
    'gcTitle','gcGateLabel','gcGate',
    'gcDepAirport','gcArrAirport','gcFlightNo',
    'gcDepTime','gcArrTime','gcDateL','gcDateR','gcTicketTitle',
    'gcPassengerLabel','gcPassenger','gcSeatLabel','gcSeat',
    'gcBoardTimeLabel','gcBoardTime','gcCabinClassLabel','gcCabinClass','gcSeqLabel','gcSeq'
  ];
  M.fields = {
    boarding: {},
    ticket: {}
  };

  // Save current input values into mode's data store
  M.saveFields = function () {
    var data = M.fields[M.mode] || {};
    FIELD_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) data[id] = el.value;
    });
  };

  // Load mode's data into input elements
  M.loadFields = function () {
    var data = M.fields[M.mode] || {};
    FIELD_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && data[id] !== undefined) el.value = data[id];
    });
  };

  M.init = function (cb) {
    if (typeof GOLDCARD_TEMPLATE === 'undefined') { if (cb) cb(false); return; }
    var total = 6, loaded = 0;
    function checkDone() {
      if (loaded >= total) {
        ready = true;
        if (APP.state.currentTab === 'goldcard') M.process();
        if (cb) cb(true);
      }
    }
    function loadImg(src) {
      var img = new Image();
      img.onload = function () { loaded++; checkDone(); };
      img.onerror = function () { loaded++; checkDone(); };
      img.src = src;
      return img;
    }
    templateImg = loadImg(GOLDCARD_TEMPLATE);
    airplaneImg = loadImg(typeof AIRPLANE_ICON !== 'undefined' ? AIRPLANE_ICON : '');
    qrImg = loadImg(typeof QRCODE_IMAGE !== 'undefined' ? QRCODE_IMAGE : '');
    ticketTopImg = loadImg(typeof TICKET_TOP !== 'undefined' ? TICKET_TOP : '');
    ticketBtmImg = loadImg(typeof TICKET_BOTTOM !== 'undefined' ? TICKET_BOTTOM : '');
    ticketMidImg = loadImg(typeof TICKET_MID !== 'undefined' ? TICKET_MID : '');
  };
  M.isReady = function () { return ready; };

  M.setAvatar = function (dataUrl) {
    var img = new Image();
    img.onload = function () { avatarImg = img; M.process(); };
    img.src = dataUrl;
  };

  function v(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function n(id) { var e = document.getElementById(id); return e ? parseInt(e.value, 10) || 0 : 0; }

  // Draw multiline text: splits by \n, draws each line with lineHeight spacing
  function drawML(ctx, text, x, y, lineHeight) {
    var lines = (text || '').split('\n');
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
  }

  M.process = function () {
    if (!templateImg) return;
    var c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    var ctx = c.getContext('2d');
    ctx.scale(S, S);

    var bg = M.bgColor || '#B97600';

    if (M.mode === 'ticket') {
      // === 门票: 三层 SVG 叠加 ===
      // Clip to card shape (rounded rect with 24px radius)
      ctx.save();
      APP.drawRoundRect(ctx, 0, 0, W, H, 24);
      ctx.clip();

      // Layer 1: #F1F3F5 placeholder (middle image area, 238px)
      ctx.fillStyle = '#F1F3F5';
      ctx.fillRect(0, 0, W, H);
      if (ticketMidImg) ctx.drawImage(ticketMidImg, 0, 0, W, 238);

      // Layer 2: Top gradient mask (55px, placed at top)
      if (ticketTopImg) ctx.drawImage(ticketTopImg, 0, 0, W, 55);

      // Layer 3: Bottom gradient mask (264px, placed at bottom)
      if (ticketBtmImg) ctx.drawImage(ticketBtmImg, 0, H - 264, W, 264);

      ctx.restore();
    } else {
      // === 登机牌: fill SVG shape with selected bg color ===
      ctx.drawImage(templateImg, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.textBaseline = 'middle';

    // === Shared top info: 标题 + 登机口 (y=40) ===
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 16px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(v('gcTitle'), 64, 40);

    var gateX = 312, gateY = 40, gateVal = v('gcGate');
    ctx.font = '400 16px "HarmonyOS Sans SC",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(gateVal, gateX, gateY);
    var valW = ctx.measureText(gateVal).width;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(v('gcGateLabel'), gateX - valW - 4, gateY);
    ctx.textAlign = 'start';

    // Shared avatar — white circle placeholder at (24,24), 32×32, radius 16
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(40, 40, 16, 0, Math.PI * 2);
    ctx.fill();
    if (avatarImg) {
      var as = 1 + (M.avatarScale || 0) / 100;
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

    if (M.mode === 'ticket') {
      // === 门票 content (y=224) ===
      // Title — 24px Bold, white, centered
      var TY = 224;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.font = '700 24px "HarmonyOS Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v('gcTicketTitle'), 164, TY);
      ctx.textAlign = 'start';

      // Row 1: 座位 (left) / 时间 (right)
      var ty1 = TY + 34; // 16px gap below title
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
      ctx.fillText(v('gcPassengerLabel'), 16, ty1);
      ctx.textAlign = 'right';
      ctx.fillText(v('gcSeatLabel'), 312, ty1);
      ctx.textAlign = 'start';
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.font = '400 16px "HarmonyOS Sans SC",sans-serif';
      drawML(ctx, v('gcPassenger'), 16, ty1 + 16, 20);
      ctx.textAlign = 'right';
      drawML(ctx, v('gcSeat'), 312, ty1 + 16, 20);
      ctx.textAlign = 'start';

      // Row 2: 地点 (left) / 票价 (right)
      var ty2 = ty1 + 40; // row (~30px) + 10px gap
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '400 12px "HarmonyOS Sans SC",sans-serif';
      ctx.fillText(v('gcCabinClassLabel'), 16, ty2);
      ctx.textAlign = 'right';
      ctx.fillText(v('gcSeqLabel'), 312, ty2);
      ctx.textAlign = 'start';
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.font = '400 16px "HarmonyOS Sans SC",sans-serif';
      drawML(ctx, v('gcCabinClass'), 16, ty2 + 16, 20);
      ctx.textAlign = 'right';
      drawML(ctx, v('gcSeq'), 312, ty2 + 16, 20);
      ctx.textAlign = 'start';

    } else {
      // === 登机牌 content ===
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
    ctx.font = '700 36px "HarmonyOS Sans SC",sans-serif';
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
    // Values — 20px Medium, 90% white, multiline
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 20px "HarmonyOS Sans SC",sans-serif';
    drawML(ctx, v('gcPassenger'), 16, PY + 32, 24);
    ctx.textAlign = 'right';
    drawML(ctx, v('gcSeat'), 312, PY + 32, 24);
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
    // Values — 16px Medium, 90% white, multiline
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 16px "HarmonyOS Sans SC",sans-serif';
    drawML(ctx, v('gcBoardTime'), 16, PY + 80, 20);
    ctx.textAlign = 'center';
    drawML(ctx, v('gcCabinClass'), 164, PY + 80, 20);
    ctx.textAlign = 'right';
    drawML(ctx, v('gcSeq'), 312, PY + 80, 20);
    ctx.textAlign = 'start';
    } // end boarding content

    // QR code — centered at bottom (88×88, y=354)
    if (qrImg) {
      ctx.drawImage(qrImg, 120, 364, 88, 88);
    }

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
    APP.dom.previewInfo.textContent = '328×472 ' + (M.mode === 'ticket' ? '门票' : '登机牌');
  };

  M.bindEvents = function () {
    // Chips: 登机牌 / 门票
    var chipsNav = document.getElementById('gcChipsNav');
    if (chipsNav) {
      chipsNav.addEventListener('click', function (e) {
        var btn = e.target.closest('.chips-nav__btn');
        if (!btn) return;
        chipsNav.querySelectorAll('.chips-nav__btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        M.saveFields();
        M.mode = btn.dataset.gcmode || 'boarding';
        M.loadFields();
        if (APP.state.currentTab === 'goldcard') M.process();
      });
    }

    var ids = [
      'gcTitle','gcGateLabel','gcGate',
      'gcDepAirport','gcArrAirport','gcFlightNo','gcTicketTitle',
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

    // Card background color picker — HarmonyOS colors + custom in one row
    var picker = document.getElementById('gcColorPicker');
    if (picker) {
      var colors = [
        { color: '#B97600', label: '金' },
        { color: '#0A59F7', label: '蓝' },
        { color: '#E84026', label: '红' },
        { color: '#ED6F21', label: '橙' },
        { color: '#64BB5C', label: '绿' }
      ];
      picker.innerHTML = '';
      picker.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;';

      var nativePicker = document.createElement('input');
      nativePicker.type = 'color';
      nativePicker.value = M.bgColor;
      nativePicker.style.cssText = 'width:0;height:0;padding:0;border:none;position:absolute;opacity:0;pointer-events:none;';
      picker.appendChild(nativePicker);

      var allDots = [];

      function highlightDot(active) {
        allDots.forEach(function (d) { d.style.outline = ''; });
        if (active) { active.style.outline = '2px solid var(--brand)'; active.style.outlineOffset = '2px'; }
      }

      function setColor(color) {
        M.bgColor = color;
        nativePicker.value = color;
        hexInput.value = color;
        if (APP.state.currentTab === 'goldcard') M.process();
      }

      // Preset color dots
      colors.forEach(function (c) {
        var dot = document.createElement('span');
        var isWhite = c.color === '#FFFFFF';
        dot.style.cssText = 'width:24px;height:24px;border-radius:50%;cursor:pointer;flex-shrink:0;background:' + c.color +
          ';border:2px solid ' + (isWhite ? 'var(--border)' : 'transparent') +
          ';box-shadow:' + (isWhite ? 'none' : '0 1px 3px rgba(0,0,0,0.15)') +
          (M.bgColor === c.color && !colors.some(function(x){return false}) ? ';outline:2px solid var(--brand);outline-offset:2px' : '');
        dot.title = c.label;
        dot.addEventListener('click', function () {
          setColor(c.color);
          highlightDot(dot);
        });
        allDots.push(dot);
        picker.appendChild(dot);
      });

      // Custom color circle (opens native picker)
      var customDot = document.createElement('span');
      customDot.style.cssText = 'width:24px;height:24px;border-radius:50%;cursor:pointer;flex-shrink:0;' +
        'background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);' +
        'border:2px solid var(--border);';
      customDot.title = '自定义颜色';
      customDot.addEventListener('click', function () { nativePicker.click(); });
      allDots.push(customDot);
      picker.appendChild(customDot);

      // Hex input in same row
      var hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.value = M.bgColor;
      hexInput.placeholder = '#000000';
      hexInput.style.cssText = 'width:70px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px;font-family:monospace;flex-shrink:0;';

      nativePicker.addEventListener('input', function () {
        setColor(nativePicker.value);
        highlightDot(null);
      });
      hexInput.addEventListener('change', function () {
        var val = hexInput.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val)) { setColor(val); highlightDot(null); }
      });

      picker.appendChild(hexInput);
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

    // Capture initial defaults for boarding mode
    M.saveFields();

    // Set ticket mode defaults (different field mappings)
    M.fields.ticket = {
      gcTitle: 'XX商户', gcGateLabel: '登机口', gcGate: '08',
      gcDepAirport: '', gcArrAirport: '', gcFlightNo: '',
      gcDepTime: '', gcArrTime: '', gcDateL: '', gcDateR: '',
      gcTicketTitle: '标题标题',
      gcPassengerLabel: '座位', gcPassenger: '1号厅4排5号',
      gcSeatLabel: '时间', gcSeat: '2025/11/29 19:30',
      gcCabinClassLabel: '地点', gcCabinClass: '深圳坂小华电影城',
      gcSeqLabel: '票价', gcSeq: '35.00元',
      gcBoardTimeLabel: '', gcBoardTime: ''
    };
  };
})();
