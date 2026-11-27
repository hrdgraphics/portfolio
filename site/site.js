{
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* split headings marked .lines into masked lines (one span per <br>-separated line) */
document.querySelectorAll('.lines').forEach(el => {
  let parts = el.innerHTML.split(/<br\s*\/?>/i);
  /* on phones, let section headings flow naturally instead of keeping desktop line breaks */
  if (innerWidth < 600 && el.tagName !== 'H1') parts = [parts.join(' ')];
  el.innerHTML = parts.map((p, i) => '<span class="ln"><span style="transition-delay:' + (i * 0.09 + (+el.dataset.delay || 0)) + 's">' + p + '</span></span>').join('');
});

/* reveal on view */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.dataset.count !== undefined) countUp(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.lines,.up,.clip,.rule,[data-count]').forEach(el => io.observe(el));

/* number counters: data-count="110" data-pre="+" data-suf="%" */
function countUp(el) {
  const to = +el.dataset.count, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
  if (reduce || !to) { el.textContent = pre + to + suf; return; }
  const t0 = performance.now(), d = 1600;
  const step = n => { const t = Math.min(1, (n - t0) / d), v = Math.round(to * (1 - Math.pow(1 - t, 4))); el.textContent = pre + v + suf; if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* smooth scroll */
let lenis = null;
if (!reduce && window.Lenis) { try { lenis = new Lenis({ lerp: 0.09, smoothWheel: true }); } catch (e) { lenis = null; } }
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); if (id.length < 2) return; const t = document.querySelector(id); if (!t) return;
  e.preventDefault(); lenis ? lenis.scrollTo(t, { offset: -80 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* nav: solid after hero, hides on scroll down, returns on scroll up */
const nav = document.querySelector('.nav'); let lastY = 0;
function navTick(y) { if (!nav) return; nav.classList.toggle('solid', y > 40); nav.classList.toggle('hide', y > 500 && y > lastY + 2); if (y < lastY - 2) nav.classList.remove('hide'); lastY = y; }

/* parallax: .par[data-speed] moves its img or video; [data-float] moves the element */
const pars = [...document.querySelectorAll('.par img, .par video'), ...document.querySelectorAll('[data-float]')];
function parTick() {
  if (reduce) return; const vh = innerHeight;
  for (const el of pars) {
    const box = (el.tagName === 'IMG' || el.tagName === 'VIDEO' ? el.parentElement : el).getBoundingClientRect();
    if (box.bottom < -200 || box.top > vh + 200) continue;
    const c = (box.top + box.height / 2 - vh / 2) / vh;
    const sp = +(el.dataset.float || el.parentElement.dataset.speed || 0.12);
    el.style.transform = 'translate3d(0,' + (-c * sp * 100).toFixed(2) + 'px,0)';
  }
}

/* page specific scroll hooks */
const hooks = window.__scrollHooks = window.__scrollHooks || [];
function frame() { const y = scrollY; navTick(y); parTick(); hooks.forEach(f => f(y)); }
if (lenis) { lenis.on('scroll', frame); const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
else addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true });
addEventListener('resize', frame); frame();

/* custom cursor */
if (fine && !reduce) {
  const c = document.createElement('div'); c.className = 'cur'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<span></span>'; document.body.appendChild(c);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); });
  (function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => {
    const v = e.target.closest('[data-cursor]'), l = e.target.closest('a,button');
    c.className = 'cur on' + (v ? ' view' : l ? ' link' : '');
    c.firstChild.textContent = v ? v.dataset.cursor : '';
  });
}

/* ambient glow follows the pointer a little */
const glows = [...document.querySelectorAll('[data-glow]')];
if (fine && !reduce && glows.length) addEventListener('mousemove', e => { const dx = (e.clientX / innerWidth - .5) * 60, dy = (e.clientY / innerHeight - .5) * 40; glows.forEach(g => g.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'); });

/* magnetic buttons */
if (fine && !reduce) document.querySelectorAll('.btn,[data-magnet]').forEach(b => {
  b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--x', ((e.clientX - r.left - r.width / 2) * 0.25) + 'px'); b.style.setProperty('--y', ((e.clientY - r.top - r.height / 2) * 0.35) + 'px'); });
  b.addEventListener('mouseleave', () => { b.style.setProperty('--x', '0px'); b.style.setProperty('--y', '0px'); });
});

/* toast for work still in progress */
const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); let tt;
document.querySelectorAll('[data-soon]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); toast.textContent = 'The ' + a.dataset.soon + ' case study is next in line. Lifetime Repositioning shows the full template.';
  toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 3600);
}));
}

document.querySelectorAll('.film').forEach(f => { const v = f.querySelector('video'), b = f.querySelector('.fplay');
  b.addEventListener('click', () => { f.classList.add('on'); v.controls = true; v.play(); v.focus && v.focus(); });
  v.addEventListener('ended', () => { f.classList.remove('on'); v.controls = false; v.load(); }); });

if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelectorAll('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
