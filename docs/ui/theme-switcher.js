/* ============================================================
   Blitar Mengaji — Theme Switcher (shared)
   Floating FAB di kanan-bawah. Mengganti data-theme pada SEMUA
   kontainer ber-atribut [data-theme] di halaman, lalu menyimpan
   pilihan di localStorage('bm-theme'). Self-injecting: cukup
   <script src="theme-switcher.js" defer></script>.
   ============================================================ */
(function () {
  const THEMES = [
    { k: 'teduh',     n: 'Teduh',     c: ['#0E6E55', '#C9A227'] },
    { k: 'modern',    n: 'Modern',    c: ['#0F766E', '#F59E0B'] },
    { k: 'earthy',    n: 'Earthy',    c: ['#14532D', '#B45309'] },
    { k: 'elegan',    n: 'Elegan',    c: ['#1E3A5F', '#C9A227'] },
    { k: 'minimalis', n: 'Minimalis', c: ['#111827', '#10B981'] },
    { k: 'samudra',   n: 'Samudra',   c: ['#2563EB', '#06B6D4'] },
    { k: 'klasik',    n: 'Klasik',    c: ['#7B2D24', '#B8860B'] },
    { k: 'senja',     n: 'Senja 🌙',  c: ['#34D399', '#FBBF24'] },
  ];
  const KEY = 'bm-theme';
  let current = localStorage.getItem(KEY) || 'teduh';

  function applyTheme(k) {
    current = k;
    document.querySelectorAll('[data-theme]').forEach((el) => {
      // jangan ubah panel switcher sendiri
      if (el.closest('#bm-theme-fab')) return;
      el.setAttribute('data-theme', k);
    });
    localStorage.setItem(KEY, k);
    document.querySelectorAll('#bm-theme-panel .bm-opt').forEach((b) => {
      b.classList.toggle('bm-active', b.dataset.k === k);
    });
    const cur = document.getElementById('bm-current');
    if (cur) cur.textContent = (THEMES.find((t) => t.k === k) || {}).n || k;
  }

  function build() {
    applyTheme(current); // set state awal pada elemen yang sudah ada

    const wrap = document.createElement('div');
    wrap.id = 'bm-theme-fab';
    wrap.innerHTML = `
      <style>
        #bm-theme-fab{position:fixed;right:18px;bottom:18px;z-index:9999;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
        #bm-theme-btn{display:flex;align-items:center;gap:8px;background:#0f172a;color:#fff;border:none;cursor:pointer;
          border-radius:999px;padding:11px 16px;font-weight:700;font-size:13px;box-shadow:0 10px 30px rgba(15,23,42,.3)}
        #bm-theme-btn:hover{background:#1e293b}
        #bm-theme-panel{position:absolute;right:0;bottom:56px;width:230px;background:#fff;border:1px solid #e5e7eb;
          border-radius:16px;box-shadow:0 18px 40px rgba(15,23,42,.22);padding:12px;display:none}
        #bm-theme-panel.open{display:block}
        #bm-theme-panel h4{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin:2px 4px 8px;font-weight:800}
        .bm-opt{display:flex;align-items:center;gap:10px;width:100%;border:1.5px solid transparent;background:#f8fafc;cursor:pointer;
          border-radius:10px;padding:8px 10px;margin-bottom:6px;font-weight:600;font-size:13px;color:#1f2a37;text-align:left}
        .bm-opt:hover{background:#eef2f7}
        .bm-opt.bm-active{border-color:#0f172a;background:#fff}
        .bm-sw{display:flex;flex-shrink:0}
        .bm-sw span{width:16px;height:16px;border-radius:999px;border:2px solid #fff;box-shadow:0 0 0 1px #e5e7eb}
        .bm-sw span:nth-child(2){margin-left:-7px}
        #bm-theme-panel .bm-foot{font-size:10px;color:#94a3b8;text-align:center;margin-top:4px}
      </style>
      <div id="bm-theme-panel">
        <h4>Pilih Tema</h4>
        <div id="bm-opts"></div>
        <div class="bm-foot">Tersimpan otomatis · contoh personalisasi user</div>
      </div>
      <button id="bm-theme-btn" title="Ganti tema">🎨 <span id="bm-current">Teduh</span></button>
    `;
    document.body.appendChild(wrap);

    const opts = wrap.querySelector('#bm-opts');
    THEMES.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'bm-opt';
      b.dataset.k = t.k;
      b.innerHTML = `<span class="bm-sw"><span style="background:${t.c[0]}"></span><span style="background:${t.c[1]}"></span></span>${t.n}`;
      b.addEventListener('click', () => applyTheme(t.k));
      opts.appendChild(b);
    });

    const panel = wrap.querySelector('#bm-theme-panel');
    wrap.querySelector('#bm-theme-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) panel.classList.remove('open');
    });

    applyTheme(current); // sinkronkan label & highlight
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
