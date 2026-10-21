(() => {
  const REPO = 'chatmdgus/kuruma-downloads';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lang = 'ko';
  const releases = {};   // 태그 → 릴리스 정보 (불러오기 전에는 없음)

  // ---------- 언어 ----------
  const t = (k) => (window.I18N[lang] || {})[k] ?? (window.I18N.ko[k] ?? k);

  function applyLang(next, animate) {
    const swap = () => {
      lang = next;
      document.documentElement.lang = next;
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const v = t(el.dataset.i18n);
        if (v.includes('<')) el.innerHTML = v; else el.textContent = v;
      });
      document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === next)));
      paintReleases();
      try { localStorage.setItem('lang', next); } catch { /* 저장 못 해도 괜찮음 */ }
    };
    if (!animate || reduced) { swap(); return; }
    document.body.classList.add('swapping');
    setTimeout(() => { swap(); document.body.classList.remove('swapping'); }, 220);
  }

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => b.dataset.lang !== lang && applyLang(b.dataset.lang, true)));

  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch { /* 무시 */ }
  const guess = (navigator.language || '').startsWith('ja') ? 'ja' : 'ko';
  applyLang(saved === 'ja' || saved === 'ko' ? saved : guess, false);

  // ---------- 스크롤하면 떠오르기 ----------
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  const nav = document.querySelector('.nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });

  // ---------- 릴리스 정보 (버전, 크기, 날짜) ----------
  function fmtSize(b) { return b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`; }
  function paintReleases() {
    document.querySelectorAll('.dl-meta').forEach((meta) => {
      const r = releases[meta.dataset.release];
      const btn = meta.parentElement.querySelector('.dl');
      if (r === undefined) return;
      if (!r) {
        meta.querySelector('.ver').textContent = t('soon');
        meta.querySelector('.size').textContent = '';
        btn.classList.add('off');
        return;
      }
      const asset = r.assets.find((a) => a.name === meta.dataset.asset) || r.assets[0];
      const ver = (r.body || '').match(/v\d+(\.\d+)+/);
      meta.querySelector('.ver').textContent = ver ? ver[0] : r.name;
      const date = new Date(asset?.updated_at || r.published_at).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
      meta.querySelector('.size').textContent = asset ? `${fmtSize(asset.size)} · ${date}` : date;
      btn.classList.toggle('off', !asset);
    });
  }
  document.querySelectorAll('.dl-meta').forEach(async (meta) => {
    const tag = meta.dataset.release;
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`);
      releases[tag] = res.ok ? await res.json() : null;
    } catch {
      releases[tag] = null;
    }
    paintReleases();
  });

  // 다운로드 버튼: 누르면 톡 튀는 효과
  document.querySelectorAll('.dl').forEach((b) => b.addEventListener('click', () => {
    if (reduced) return;
    b.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,1.4,.4,1)' });
  }));

  // ---------- 히어로 미리보기: 실제 오버레이처럼 움직임 ----------
  const people = [
    { id: 'a', name: 'チャ', color: '#f1c40f' },
    { id: 'b', name: '유키', color: '#5dade2' },
    { id: 'c', name: 'ハル', color: '#eb984e' },
    { id: 'd', name: '소라', color: '#bb8fce' },
    { id: 'e', name: '민준', color: null },
  ];
  const lines = {
    ko: ['보스 2페이즈 들어감', '오늘 몇 시에 모임?', 'ㅋㅋㅋ 방금 뭐임', '나 곧 들어감', '이거 봐봐'],
    ja: ['ボス第2フェーズ入った', '今日何時に集まる？', 'ちょっと休憩するね', 'すぐ入るよ', 'これ見て'],
  };
  const avColor = (p) => p.color || '#9aa0bf';
  const vlist = document.querySelector('#demo-voice .vlist');
  const chat = document.getElementById('demo-chat');
  const rows = new Map();
  const micOff = '<svg class="muteic" viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3.5 3.5l17 17" stroke="#0c0e14" stroke-width="5" stroke-linecap="round"/><path d="M3.5 3.5l17 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

  function avatar(p) {
    const el = document.createElement('span');
    el.className = 'av';
    el.style.background = avColor(p);
    el.textContent = p.name.slice(0, 1);
    return el;
  }

  function voiceRow(p, state) {
    const row = document.createElement('div');
    row.className = 'vrow plate enter';
    const nm = document.createElement('span');
    nm.textContent = p.name;
    if (p.color) nm.style.color = p.color;
    row.append(avatar(p), nm);
    if (state.live) { const l = document.createElement('span'); l.className = 'live'; l.textContent = 'LIVE'; row.append(l); }
    if (state.mute) row.insertAdjacentHTML('beforeend', micOff);
    row.addEventListener('animationend', () => row.classList.remove('enter'), { once: true });
    return row;
  }

  // 이름 순으로 들어오고 나가기
  const order = new Intl.Collator(['ko', 'ja'], { sensitivity: 'base' });
  let present = new Set(['a', 'b', 'c']);
  const states = { a: {}, b: { live: true }, c: { mute: true }, d: {}, e: {} };
  function renderVoice() {
    const live = (p) => (states[p.id].live ? 0 : 1);
    const list = people.filter((p) => present.has(p.id)).sort((x, y) => live(x) - live(y) || order.compare(x.name, y.name));
    for (const [id, row] of rows) {
      if (present.has(id)) continue;
      rows.delete(id);
      row.classList.add('leaving');
      row.addEventListener('animationend', () => row.remove(), { once: true });
    }
    let prev = null;
    for (const p of list) {
      let row = rows.get(p.id);
      if (!row) { row = voiceRow(p, states[p.id]); rows.set(p.id, row); }
      const want = prev ? prev.nextSibling : vlist.firstChild;
      if (want !== row) vlist.insertBefore(row, want);
      prev = row;
    }
  }

  function addChat() {
    const p = people[Math.floor(Math.random() * people.length)];
    const pool = lines[lang] || lines.ko;
    const msg = document.createElement('div');
    msg.className = 'msg plate';
    const span = document.createElement('span');
    const b = document.createElement('b');
    b.textContent = p.name;
    if (p.color) b.style.color = p.color;
    span.append(b, document.createTextNode(pool[Math.floor(Math.random() * pool.length)]));
    msg.append(avatar(p), span);
    chat.append(msg);
    while (chat.children.length > 4) chat.firstChild.remove();
    setTimeout(() => { msg.classList.add('gone'); setTimeout(() => msg.remove(), 500); }, 6500);
  }

  renderVoice();
  addChat();
  if (!reduced) {
    setTimeout(addChat, 900);
    setInterval(addChat, 2600);
    setInterval(() => {
      // 한 명씩 들어왔다 나갔다
      const out = people.filter((p) => p.id !== 'a' && !present.has(p.id));
      const inn = [...present].filter((id) => id !== 'a');
      if (out.length && (Math.random() < 0.55 || inn.length < 2)) present.add(out[Math.floor(Math.random() * out.length)].id);
      else if (inn.length) present.delete(inn[Math.floor(Math.random() * inn.length)]);
      renderVoice();
    }, 3200);
  }
})();
