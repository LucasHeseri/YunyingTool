/**
 * test.js — Financial card template module (from Figma Page 2).
 * Depends on APP (common.js).
 */
(function () {
  'use strict';
  if (!window.APP) throw new Error('common.js must load before test.js');

  var M = APP.test = {};

  function getScale() {
    var el = document.querySelector('input[name="testScale"]:checked');
    return el ? parseInt(el.value, 10) : 2;
  }

  // ========================================================================
  // Default card data
  // ========================================================================
  var defaults = {
    brand: '苏宁', product: '任性贷', amount: '3,00,000',
    amountLabel: '最高额度 (元)', desc: '最长可借 48 期',
    tag1: '标签第一', tag2: '最快当天放款', btnText: '去申请'
  };

  // ========================================================================
  // Render card to canvas
  // ========================================================================
  M.process = function () {
    var s = getScale();
    var W = 328, H = 116;
    var c = document.createElement('canvas');
    c.width = W * s; c.height = H * s;
    var ctx = c.getContext('2d');
    ctx.scale(s, s);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 20); ctx.fill();

    // Read field values
    var vals = {};
    ['brand','product','amount','amountLabel','desc','tag1','tag2','btnText'].forEach(function(k) {
      var el = document.getElementById('test' + k.charAt(0).toUpperCase() + k.slice(1));
      if (k === 'amountLabel') el = document.getElementById('testAmountLabel');
      if (k === 'btnText') el = document.getElementById('testBtnText');
      vals[k] = el ? el.value : defaults[k];
    });

    // Icon — 16×16 circle, uploaded image or default placeholder
    if (APP.state.uploadedImage) {
      ctx.save();
      ctx.beginPath(); ctx.arc(24, 24, 8, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(APP.state.uploadedImage, 16, 16, 16, 16);
      ctx.restore();
    } else {
      ctx.fillStyle = '#E8F5FF';
      ctx.beginPath(); ctx.arc(24, 24, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#018FF9'; ctx.font = '400 10px "HarmonyOS Sans SC",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('¥', 24, 24); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }

    // Brand | Product name — dynamic left-aligned with 6px gap
    ctx.fillStyle = '#000000'; ctx.font = '12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(vals.brand, 36, 27);
    var brandW = ctx.measureText(vals.brand).width;
    var dividerX = 36 + brandW + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(dividerX, 19, 1, 10);
    ctx.fillStyle = '#000000';
    ctx.fillText(vals.product, dividerX + 6, 27);

    // Right description — original position
    ctx.fillStyle = '#000000'; ctx.font = '500 14px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(vals.desc, 101, 65);

    // Main amount — bottom-aligned with description
    ctx.fillStyle = '#F34D4F'; ctx.font = '500 20px "HarmonyOS Sans SC",sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText(vals.amount, 10, 68);
    ctx.textBaseline = 'alphabetic';

    // Amount label
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = '12px "HarmonyOS Sans SC",sans-serif';
    ctx.fillText(vals.amountLabel, 11, 93);

    // Tag per Figma: returns width for proper gap calculation
    function drawTag(x, y, text) {
      var padH = 4, tagH = 18, tagR = 4;
      ctx.font = '400 10px "HarmonyOS Sans SC",sans-serif';
      var textW = ctx.measureText(text).width;
      var tw = textW + padH * 2;
      // 10% opacity orange bg, no border
      ctx.fillStyle = 'rgba(237,111,33,0.1)'; ctx.beginPath(); ctx.roundRect(x, y, tw, tagH, tagR); ctx.fill();
      // Orange text, centered
      ctx.fillStyle = '#ED6F21';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x + tw / 2, y + tagH / 2 + 1);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      return tw;
    }

    // Tags grouped from left, 4px gap
    var tagX = 101, GAP = 4;
    if (vals.tag1) { tagX += drawTag(tagX, 79, vals.tag1) + GAP; }
    if (vals.tag2) { drawTag(tagX, 79, vals.tag2); }

    // CTA button — solid fill, regular weight white text
    var btnW = 72, btnH = 28, btnX = 244, btnY = 44, btnR = 14; // vertically centered (116/2 - 28/2)
    ctx.fillStyle = '#F34D4F'; ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, btnR); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '400 14px "HarmonyOS Sans SC",sans-serif';
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
    APP.dom.previewInfo.textContent = '328×116 @' + s + 'x';
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
    // Scale radios
    document.querySelectorAll('input[name="testScale"]').forEach(function(r) {
      r.addEventListener('change', function () {
        if (APP.state.currentTab === 'test') M.process();
      });
    });
  };
})();
