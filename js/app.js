(() => {
  const reveal = document.querySelectorAll('[data-reveal]');
  reveal.forEach((el) => el.classList.add('reveal'));
  if (!('IntersectionObserver' in window)) {
    reveal.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveal.forEach((el) => observer.observe(el));
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const parallaxNodes = [...document.querySelectorAll('[data-parallax]')];
  if (!parallaxNodes.length) return;

  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;
  let ticking = false;

  const updatePointer = (event) => {
    pointerX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    pointerY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
  };

  const render = () => {
    ticking = false;
    currentX += (pointerX - currentX) * 0.075;
    currentY += (pointerY - currentY) * 0.075;
    const scrollOffset = Math.min(window.scrollY, window.innerHeight) * -0.055;

    parallaxNodes.forEach((node) => {
      const depth = Number(node.dataset.parallax || 0.15);
      const x = currentX * depth * 28;
      const y = currentY * depth * 18 + scrollOffset * depth;
      node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    });

    requestAnimationFrame(render);
  };

  window.addEventListener('pointermove', updatePointer, { passive: true });
  window.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; }, { passive: true });
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }, { passive: true });
  requestAnimationFrame(render);
})();
