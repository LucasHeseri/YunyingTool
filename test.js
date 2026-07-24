/**
 * test.js — Financial card template module (from Figma Page 2).
 * Depends on APP (common.js).
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before test.js');

  var M = APP.test = {};
  var SCALE = 2; // render at 2x for retina

  // ========================================================================
  // Default card data
  // ========================================================================
  var defaults = {
    brand: '苏宁', product: '任性贷', amount: '3,00,000',
    amountLabel: '最高额度 (元)', desc: '最长可借 48 期',
    tag1: '免押车', tag2: '最快当天放款', btnText: '去申请'
  };

  // ========================================================================
  // Render card to canvas
  // ========================================================================
  M.process = function () {
    var s = SCALE;
    var W = 328, H = 116;
    var c = document.createElement('canvas');
    c.width = W * s; c.height = H * s;
    var ctx = c.getContext('2d');
    ctx.scale(s, s);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 8); ctx.fill();

    // Read field values
    var vals = {};
    ['brand','product','amount','amountLabel','desc','tag1','tag2','btnText'].forEach(function(k) {
      var el = document.getElementById('test' + k.charAt(0).toUpperCase() + k.slice(1));
      if (k === 'amountLabel') el = document.getElementById('testAmountLabel');
      if (k === 'btnText') el = document.getElementById('testBtnText');
      vals[k] = el ? el.value : defaults[k];
    });

    // Icon (16×16) — uploaded image or default placeholder
    if (APP.state.uploadedImage) {
      ctx.save();
      ctx.beginPath(); ctx.roundRect(16, 16, 16, 16, 3); ctx.clip();
      ctx.drawImage(APP.state.uploadedImage, 16, 16, 16, 16);
      ctx.restore();
    } else {
      ctx.fillStyle = '#E8F5FF';
      ctx.beginPath(); ctx.roundRect(16, 16, 16, 16, 3); ctx.fill();
      ctx.beginPath(); ctx.arc(24, 24, 6, 0, Math.PI * 2); ctx.fillStyle = '#018FF9'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('¥', 24, 24); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }

    // Brand | Product name — dynamic left-aligned with 6px gap
    ctx.fillStyle = '#000000'; ctx.font = '12px "PingFang SC",sans-serif';
    ctx.fillText(vals.brand, 36, 27);
    var brandW = ctx.measureText(vals.brand).width;
    var dividerX = 36 + brandW + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(dividerX, 19, 1, 10);
    ctx.fillStyle = '#000000';
    ctx.fillText(vals.product, dividerX + 6, 27);

    // Main amount
    ctx.fillStyle = '#F34D4F'; ctx.font = 'bold 20px "PingFang SC",sans-serif';
    ctx.fillText(vals.amount, 10, 67);

    // Amount label
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = '12px "PingFang SC",sans-serif';
    ctx.fillText(vals.amountLabel, 11, 93);

    // Right description
    ctx.fillStyle = '#000000'; ctx.font = '14px "PingFang SC",sans-serif';
    ctx.fillText(vals.desc, 121, 65);

    // Outlined tag: 1px #ED6F21 border, transparent bg, orange text, h=14, 10px font
    function drawTag(x, y, text) {
      var pad = 5, tagH = 14, tagR = 4;
      var tw = ctx.measureText(text).width + pad * 2;
      // Border
      ctx.strokeStyle = '#ED6F21'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, tw, tagH, tagR); ctx.stroke();
      // Text (orange, vertically centered)
      ctx.fillStyle = '#ED6F21'; ctx.font = '10px "PingFang SC",sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + pad, y + tagH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }

    // Tag 1
    if (vals.tag1) drawTag(121, 79, vals.tag1);
    // Tag 2 (6px gap from tag 1)
    if (vals.tag2) {
      var tag1W = vals.tag1 ? ctx.measureText(vals.tag1).width + 10 : 0;
      var x2 = vals.tag1 ? 121 + tag1W + 6 : 121;
      drawTag(x2, 79, vals.tag2);
    }

    // HarmonyOS small button: 72×28, r=14, text centered
    var btnW = 72, btnH = 28, btnX = 244, btnY = 58;
    ctx.fillStyle = '#F34D4F'; ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 14); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '14px "PingFang SC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(vals.btnText, btnX + btnW / 2, btnY + btnH / 2 + 1);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';

    APP.state.processedDataUrl = c.toDataURL('image/png');

    // Preview
    var cv = APP.dom.previewCanvas, pctx = APP.ctx;
    cv.width = W * s; cv.height = H * s;
    cv.style.display = 'block';
    pctx.drawImage(c, 0, 0);
    var cw = APP.dom.previewCard.clientWidth - 32, ch = APP.dom.previewCard.clientHeight - 16;
    var ds = Math.min(cw / (W * s), ch / (H * s), 1);
    cv.style.width  = Math.round(W * s * ds) + 'px';
    cv.style.height = Math.round(H * s * ds) + 'px';
    APP.dom.downloadBtn.disabled = false;
    APP.dom.previewInfo.textContent = '328×116 卡片模板';
  };

  // ========================================================================
  // Events
  // ========================================================================
  M.bindEvents = function () {
    var ids = ['testBrand','testProduct','testAmount','testAmountLabel','testDesc','testTag1','testTag2','testBtnText'];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        if (APP.state.currentTab === 'test') M.process();
      });
    });
  };
})();
