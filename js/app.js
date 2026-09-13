(() => {
  const reveal = document.querySelectorAll('[data-reveal]');
  reveal.forEach((el) => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveal.forEach((el) => observer.observe(el));
  } else reveal.forEach((el) => el.classList.add('is-visible'));

  const header = document.querySelector('[data-site-header]');
  const topButton = document.querySelector('[data-back-to-top]');
  const syncScrollUI = () => {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('is-scrolled', y > 45);
    if (topButton) topButton.classList.toggle('is-visible', y > Math.max(360, window.innerHeight * 0.55));
  };
  window.addEventListener('scroll', syncScrollUI, { passive: true });
  window.addEventListener('resize', syncScrollUI, { passive: true });
  syncScrollUI();
  if (topButton) topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const nodes = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!nodes.length) return;
  let px = 0, py = 0, cx = 0, cy = 0;
  window.addEventListener('pointermove', (e) => {
    px = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    py = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { px = 0; py = 0; }, { passive: true });
  const render = () => {
    cx += (px - cx) * 0.075;
    cy += (py - cy) * 0.075;
    const scroll = Math.min(window.scrollY, window.innerHeight) * -0.035;
    nodes.forEach((node) => {
      const d = Number(node.dataset.parallax || 0.15);
      const x = (cx * d * 22).toFixed(2) + 'px';
      const y = (cy * d * 14 + scroll * d).toFixed(2) + 'px';
      node.style.transform = 'translate3d(' + x + ',' + y + ',0)';
    });
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
})();
