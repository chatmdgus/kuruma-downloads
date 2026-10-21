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
      if (meta.dataset.static !== undefined) {   // 사이트에 직접 올린 파일: 버전·크기는 HTML에 적어둔 값
        const date = new Date(meta.dataset.date).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
        meta.querySelector('.ver').textContent = meta.dataset.version;
        meta.querySelector('.size').textContent = `${fmtSize(Number(meta.dataset.bytes))} · ${date}`;
        return;
      }
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
  document.querySelectorAll('.dl-meta[data-release]').forEach(async (meta) => {
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
  const chat = document.getElementById('demo-chat');
  const media = document.getElementById('demo-media');

  function avatar(p) {
    const el = document.createElement('span');
    el.className = 'av';
    el.style.background = avColor(p);
    el.textContent = p.name.slice(0, 1);
    return el;
  }

  // 사진 미리보기: 풍경 그림을 그려서 채팅 옆에 튀어나왔다 사라지게
  const scenes = [['#ff9a8b', '#ff6a88', '#5b3a7a'], ['#89f7fe', '#66a6ff', '#2c3e7a'], ['#fddb92', '#d1fdff', '#3a6b5a'], ['#c3a6ff', '#7f7fd5', '#2d2a5a']];
  function photo() {
    const [a, b, c] = scenes[Math.floor(Math.random() * scenes.length)];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><circle cx="240" cy="62" r="26" fill="#fff" opacity=".85"/><path d="M0 150 70 95 130 140 190 85 260 135 320 105V200H0z" fill="${c}"/></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function addPhoto() {
    const img = document.createElement('img');
    img.className = 'shot';
    img.alt = '';
    img.src = photo();
    media.append(img);
    while (media.children.length > 2) media.firstChild.remove();
    setTimeout(() => { img.classList.add('gone'); setTimeout(() => img.remove(), 500); }, 6000);
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

  addChat();
  addPhoto();
  if (!reduced) {
    setTimeout(addChat, 900);
    setInterval(addChat, 2600);
    setInterval(addPhoto, 4300);
  }
})();
