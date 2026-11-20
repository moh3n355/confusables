(function() {
  "use strict";

  var note = document.getElementById('loadNote');
  if (!window.CONFUSABLES_DATA) {
    note.innerHTML = '⚠️ <b>data.js</b> not found. Please ensure it is in the same folder.';
    note.classList.add('err');
    return;
  }

  var DATA = window.CONFUSABLES_DATA;
  var currentSortCol = null;
  var currentSortAsc = true;
  var $ = function(s){ return document.querySelector(s); };
  var toastEl = $('#toast');
  
  function toast(msg){
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function(){ toastEl.classList.remove('show'); }, 1400);
  }
  
  function copyText(txt, btn){
    function done(){
      if(btn){ btn.classList.add('done'); btn._o = btn._o || btn.textContent;
        btn.textContent = '✓ copied';
        setTimeout(function(){ btn.classList.remove('done'); if(btn._o) btn.textContent = btn._o; }, 1200);
      }
      toast('Copied to clipboard');
    }
    function fallback(){
      var ta = document.createElement('textarea');
      ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); }catch(e){}
      ta.remove();
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(done).catch(function(){ fallback(); done(); });
    } else { fallback(); done(); }
  }
  
  function cpToChar(hex){ return String.fromCodePoint(parseInt(hex,16)); }
  function cpString(hexStr){ return hexStr.split(/\s+/).map(cpToChar).join(''); }
  function utf8Enc(str){
    var bytes = new TextEncoder().encode(str), out = [];
    for(var i=0;i<bytes.length;i++) out.push('%' + bytes[i].toString(16).toUpperCase().padStart(2,'0'));
    return out.join('');
  }
  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function classifyRisk(hex){
    var n = parseInt(hex.split(/\s+/)[0], 16);
    if((n >= 0xFF00 && n <= 0xFFEF) || (n >= 0xFE10 && n <= 0xFE6F) ||
       (n >= 0x2000 && n <= 0x206F) || (n >= 0x2E00 && n <= 0x2E7F) ||
       (n >= 0x3000 && n <= 0x303F) || (n >= 0xFB00 && n <= 0xFB4F)) return 'high';
    if((n >= 0x0370 && n <= 0x03FF) || (n >= 0x0400 && n <= 0x04FF) ||
       (n >= 0x0530 && n <= 0x058F) || (n >= 0x0590 && n <= 0x05FF) ||
       (n >= 0x0600 && n <= 0x06FF) || (n >= 0x0750 && n <= 0x077F) ||
       (n >= 0x0900 && n <= 0x0DFF) || (n >= 0x0E00 && n <= 0x0E7F) ||
       (n >= 0x0E80 && n <= 0x0EFF) || (n >= 0x10A0 && n <= 0x10FF) ||
       (n >= 0x1200 && n <= 0x137F) || (n >= 0x1780 && n <= 0x17FF) ||
       (n >= 0x1E00 && n <= 0x1EFF)) return 'medium';
    return 'low';
  }

  function isPractical(hex){
    var n = parseInt(hex.split(/\s+/)[0], 16);
    if(n >= 0xFF00 && n <= 0xFFEF) return true;
    if(n >= 0xFE10 && n <= 0xFE6F) return true;
    if(n >= 0x2000 && n <= 0x206F) return true;
    if(n >= 0x2E00 && n <= 0x2E7F) return true;
    if(n >= 0x3000 && n <= 0x303F) return true;
    if(n === 0x30FB) return true;
    if(n >= 0x0300 && n <= 0x036F) return true;
    if(n >= 0x1AB0 && n <= 0x1AFF) return true;
    if(n >= 0x1DC0 && n <= 0x1DFF) return true;
    if(n >= 0x20D0 && n <= 0x20FF) return true;
    if(n >= 0x0370 && n <= 0x03FF) return true;
    if(n >= 0x0400 && n <= 0x04FF) return true;
    if(n >= 0x0530 && n <= 0x058F) return true;
    if(n >= 0x0590 && n <= 0x05FF) return true;
    if(n >= 0x0600 && n <= 0x06FF) return true;
    if(n >= 0x0750 && n <= 0x077F) return true;
    if(n >= 0x08A0 && n <= 0x08FF) return true;
    if(n >= 0xFB50 && n <= 0xFDFF) return true;
    if(n >= 0xFE70 && n <= 0xFEFF) return true;
    if(n >= 0x2190 && n <= 0x21FF) return true;
    if(n >= 0x2200 && n <= 0x22FF) return true;
    if(n >= 0x2500 && n <= 0x257F) return true;
    if(n >= 0x25A0 && n <= 0x25FF) return true;
    if(n >= 0x2600 && n <= 0x26FF) return true;
    if(n >= 0x2700 && n <= 0x27BF) return true;
    if(n === 0x1D16D) return true;
    return false;
  }

  function buildRow(r){
    var srcHex = r[0], tgtHex = r[1], cat = r[2], srcName = r[3], tgtName = r[4];
    var srcChar = cpString(srcHex), tgtChar = cpString(tgtHex);
    var primaryHex = srcHex.split(/\s+/)[0];
    var dec = parseInt(primaryHex,16);
    var utf8 = utf8Enc(srcChar);
    var htmlEnt = dec < 128 ? ('&#' + dec + ';') : ('&#x' + primaryHex.toUpperCase() + ';');
    var risk = classifyRisk(srcHex);
    var practical = isPractical(srcHex) ? '1' : '0';

    var tr = document.createElement('tr');
    tr.dataset.hex = srcHex;
    tr.dataset.dec = String(dec);
    tr.dataset.url = utf8;
    tr.dataset.risk = risk;
    tr.dataset.practical = practical;
    tr.dataset.search = [srcHex,tgtHex,cat,srcName,tgtName,srcChar,tgtChar,dec,utf8,htmlEnt,risk]
      .join(' ').toLowerCase();

    tr.innerHTML =
      '<td class="glyph-cell"><span class="g">' + esc(srcChar) + '</span></td>' +
      '<td class="arrow">→</td>' +
      '<td class="name-cell">' + esc(srcName || '—') +
        '<span class="target-name">→ ' + esc(tgtName || tgtChar || '—') + '</span></td>' +
      '<td class="meta"><div><span class="badge hex">U+' + srcHex + '</span></div>' +
        '<div><span class="badge dec">' + dec + '</span></div></td>' +
      '<td class="meta">' + utf8 + '</td>' +
      '<td class="meta"><div>' + htmlEnt + '</div>' +
        '<div style="color:#7fb8ff">' + utf8 + '</div></td>' +
      '<td><span class="badge risk ' + risk + '">' + risk + '</span></td>' +
      '<td><span class="badge cat">' + esc(cat || '—') + '</span></td>' +
      '<td><button class="copy" data-copy="' + esc(utf8) + '">URL</button>' +
        '<button class="copy" data-copy="' + esc('U+' + srcHex) + '" style="margin-top:4px">HEX</button></td>';
    return tr;
  }

  var practicalMode = false;
  function applyFilter(){
    var q = $('#search').value.trim().toLowerCase();
    var cat = $('#catFilter').value;
    var rows = document.querySelectorAll('#tbody tr');
    var visible = 0;
    for(var i=0;i<rows.length;i++){
      var tr = rows[i];
      var ok = (!q || tr.dataset.search.indexOf(q) >= 0) &&
               (!cat || tr.dataset.search.indexOf(cat.toLowerCase()) >= 0) &&
               (!practicalMode || tr.dataset.practical === '1');
      tr.style.display = ok ? '' : 'none';
      if(ok) visible++;
    }
    $('#count').textContent = visible + ' / ' + DATA.length + ' rows';
  }

  function sortData(col) {
    if (currentSortCol === col) {
      currentSortAsc = !currentSortAsc;
    } else {
      currentSortCol = col;
      currentSortAsc = true;
    }

    document.querySelectorAll('.sortable .sort-icon').forEach(function(icon) {
      icon.textContent = '↕';
    });
    var activeIcon = document.querySelector('.sortable[data-sort="' + col + '"] .sort-icon');
    if (activeIcon) activeIcon.textContent = currentSortAsc ? '↑' : '↓';

    var tb = $('#tbody');
    var rows = Array.from(tb.querySelectorAll('tr'));

    rows.sort(function(a, b) {
      var valA, valB;
      if (col === 'risk') {
        var map = { 'high': 3, 'medium': 2, 'low': 1 };
        valA = map[a.dataset.risk] || 0;
        valB = map[b.dataset.risk] || 0;
        return currentSortAsc ? valA - valB : valB - valA;
      } else if (col === 'cat') {
        valA = a.querySelector('.badge.cat').textContent;
        valB = b.querySelector('.badge.cat').textContent;
        return currentSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    });

    tb.innerHTML = '';
    var frag = document.createDocumentFragment();
    rows.forEach(function(tr) { frag.appendChild(tr); });
    tb.appendChild(frag);
    
    applyFilter();
  }

  function renderAll(){
    var tb = $('#tbody'); tb.innerHTML = '';
    var frag = document.createDocumentFragment();
    for(var i=0;i<DATA.length;i++) frag.appendChild(buildRow(DATA[i]));
    tb.appendChild(frag);

    var cats = {}; DATA.forEach(function(r){ if(r[4]) cats[r[4]] = 1; });
    var sel = $('#catFilter');
    sel.innerHTML = '<option value="">All targets</option>' +
      Object.keys(cats).sort().map(function(c){
        return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
      }).join('');

    note.innerHTML = '✅ Loaded <b>' + DATA.length + '</b> mappings. Use <b>⚡ Practical</b> to filter noise.';
    
    if(currentSortCol) {
      sortData(currentSortCol); 
    } else {
      applyFilter();
    }
  }

  document.querySelectorAll('.tab').forEach(function(t){
    t.onclick = function(){
      document.querySelectorAll('.tab').forEach(function(x){ x.classList.remove('active'); });
      t.classList.add('active');
      ['table','conv'].forEach(function(n){
        $('#tab-' + n).classList.toggle('hidden', n !== t.dataset.tab);
      });
    };
  });

  $('#search').addEventListener('input', applyFilter);
  $('#catFilter').addEventListener('change', applyFilter);

  document.querySelectorAll('.chip').forEach(function(c){
    c.onclick = function(){
      var isPractical = c.dataset.q === '__PRACTICAL__';
      if(isPractical){
        practicalMode = c.classList.toggle('on');
      } else {
        var wasOn = c.classList.contains('on');
        document.querySelectorAll('.chip').forEach(function(x){
          if(x !== c && x.dataset.q !== '__PRACTICAL__') x.classList.remove('on');
        });
        if(wasOn){ c.classList.remove('on'); $('#search').value = ''; }
        else { c.classList.add('on'); $('#search').value = c.dataset.q; }
      }
      applyFilter();
    };
  });

  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-copy]');
    if(b){ copyText(b.dataset.copy, b); }
  });

  document.querySelectorAll('.th-copy').forEach(function(btn){
    btn.onclick = function(){
      var col = btn.dataset.col;
      var all = document.querySelectorAll('#tbody tr');
      var lines = [];
      for(var i=0;i<all.length;i++){
        var tr = all[i];
        if(tr.style.display === 'none') continue;
        if(col === 'hex')      lines.push('U+' + tr.dataset.hex.split(/\s+/)[0]);
        else if(col === 'dec') lines.push(tr.dataset.dec);
        else                   lines.push(tr.dataset.url);
      }
      copyText(lines.join('\n'), btn);
    };
  });

  document.querySelectorAll('.sortable').forEach(function(th) {
    th.onclick = function() {
      sortData(th.dataset.sort);
    };
  });

  function renderInfo(container, str, bigEl){
    if(!str){ container.innerHTML=''; if(bigEl) bigEl.textContent='—'; return; }
    if(bigEl) bigEl.textContent = str;
    var chars = Array.from(str);
    var html = '';
    for(var i=0;i<chars.length;i++){
      var ch = chars[i];
      var cp = ch.codePointAt(0);
      var hex = cp.toString(16).toUpperCase().padStart(4,'0');
      var u = utf8Enc(ch);
      var h = cp < 128 ? ('&#' + cp + ';') : ('&#x' + hex + ';');
      html +=
        '<div class="out-row"><span class="k">Char</span><span class="v">' + esc(ch) + '</span></div>' +
        '<div class="out-row"><span class="k">Hex</span><span class="v">U+' + hex + '</span></div>' +
        '<div class="out-row"><span class="k">Dec</span><span class="v">' + cp + '</span></div>' +
        '<div class="out-row"><span class="k">UTF-8 / URL</span><span class="v">' + u + '</span></div>' +
        '<div class="out-row"><span class="k">HTML</span><span class="v">' + h + '</span></div>';
    }
    container.innerHTML = html;
  }

  $('#c2uInput').addEventListener('input', function(e){
    renderInfo($('#c2uOut'), e.target.value, $('#c2uGlyph'));
  });
  $('#u2cInput').addEventListener('input', function(e){
    var v = e.target.value.trim();
    if(!v){ $('#u2cOut').innerHTML=''; $('#u2cGlyph').textContent='—'; return; }
    v = v.replace(/^U\+/i, '');
    var n;
    if(/^[0-9a-f]+$/i.test(v)) n = parseInt(v,16);
    else if(/^\d+$/.test(v)) n = parseInt(v,10);
    else { $('#u2cGlyph').textContent='?'; return; }
    if(isNaN(n) || n > 0x10FFFF){ $('#u2cGlyph').textContent='?'; return; }
    renderInfo($('#u2cOut'), String.fromCodePoint(n), $('#u2cGlyph'));
  });

  var currentDir = 'text2uni';
  document.querySelectorAll('#strDirToggle button').forEach(function(b){
    b.onclick = function(){
      currentDir = b.dataset.dir;
      document.querySelectorAll('#strDirToggle button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      $('#strText2Uni').classList.toggle('hidden', currentDir !== 'text2uni');
      $('#strUni2Text').classList.toggle('hidden', currentDir !== 'uni2text');
    };
  });

  $('#strInput').addEventListener('input', function(e){
    var s = e.target.value;
    if(!s){ $('#strOut').innerHTML=''; return; }
    var cps = Array.from(s).map(function(c){
      return 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0');
    });
    $('#strOut').innerHTML =
      '<div class="out-row"><span class="k">Codepoints (hex)</span><span class="v">' + cps.join(' ') + '</span></div>' +
      '<div class="out-row"><span class="k">Codepoints (dec)</span><span class="v">' +
        Array.from(s).map(function(c){ return c.codePointAt(0); }).join(' ') + '</span></div>' +
      '<div class="out-row"><span class="k">UTF-8 / URL</span><span class="v">' + utf8Enc(s) + '</span></div>' +
      '<div class="out-row"><span class="k">HTML entities</span><span class="v">' +
        Array.from(s).map(function(c){ return '&#' + c.codePointAt(0) + ';'; }).join('') + '</span></div>';
  });

  $('#uniInput').addEventListener('input', function(e){
    var raw = e.target.value.trim();
    if(!raw){ $('#uniOut').innerHTML=''; return; }
    var tokens = raw.split(/[\s,;+]+/).filter(function(t){ return t; });
    var result = '', bad = [];
    for(var i=0;i<tokens.length;i++){
      var t = tokens[i];
      var clean = t.replace(/^U\+/i, '').replace(/^0x/i, '');
      var n;
      if(/^[0-9a-f]+$/i.test(clean)) n = parseInt(clean,16);
      else if(/^\d+$/.test(clean)) n = parseInt(clean,10);
      else { bad.push(t); continue; }
      if(isNaN(n) || n > 0x10FFFF){ bad.push(t); continue; }
      result += String.fromCodePoint(n);
    }
    var infoHtml =
      '<div class="out-row"><span class="k">Result</span><span class="v">' +
        esc(result || '(empty)') + '</span></div>' +
      '<div class="out-row"><span class="k">Length</span><span class="v">' +
        Array.from(result).length + ' chars</span></div>';
    if(bad.length){
      infoHtml += '<div class="out-row"><span class="k">Ignored tokens</span><span class="v" style="color:#f5c56b">' +
        esc(bad.join(' ')) + '</span></div>';
    }
    $('#uniOut').innerHTML = infoHtml;
  });

  renderAll();
})();