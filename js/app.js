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

  const home = document.querySelector('.home-page');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (home) {
    const style = document.createElement('style');
    style.textContent = `
      .home-page .reveal {
        --reveal-y: 18px;
        transform: translate3d(var(--parallax-x, 0px), calc(var(--parallax-y, 0px) + var(--reveal-y)), 0);
      }
      .home-page .reveal.is-visible { --reveal-y: 0px; }
      .home-page [data-parallax]:not(.scene-crystal):not(.scene-orbit):not(.scene-grid) {
        transform: translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0);
      }
      .home-page .scene-grid {
        transform: translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0) perspective(600px) rotateX(64deg) scale(1.18);
      }
      .home-page .scene-crystal { transform: translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0) rotate(15deg); }
      .home-page .scene-orbit { transform: translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0) rotate(-18deg); }
      .home-page .media-play { cursor: pointer; border: 0; font: inherit; }
      .home-page .hero-media-dock.is-playing { border-color: rgba(185, 201, 255, .36); box-shadow: 0 22px 70px rgba(95, 102, 175, .24), inset 0 0 36px rgba(185, 201, 255, .05); }
      .home-page .hero-media-dock.is-playing .media-thumb { animation: workflowPulse 1.8s ease-in-out infinite; }
      .home-page .hero-media-dock.is-playing .signal-bars i { animation: workflowBars 1.2s ease-in-out infinite alternate; }
      .home-page .hero-media-dock.is-playing .signal-bars i:nth-child(2) { animation-delay: .08s; }
      .home-page .hero-media-dock.is-playing .signal-bars i:nth-child(3) { animation-delay: .16s; }
      .home-page .hero-media-dock.is-playing .signal-bars i:nth-child(4) { animation-delay: .24s; }
      .home-page .hero-media-dock.is-playing .signal-bars i:nth-child(5) { animation-delay: .32s; }
      .home-page .hero-media-dock.is-playing .signal-bars i:nth-child(6) { animation-delay: .4s; }
      .home-page .hero-media-dock.is-playing .signal-bars i:nth-child(7) { animation-delay: .48s; }
      @keyframes workflowPulse { 50% { transform: scale(1.04); filter: brightness(1.18); } }
      @keyframes workflowBars { from { transform: scaleY(.55); opacity: .5; } to { transform: scaleY(1.12); opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .home-page .reveal { transform: none; }
        .home-page .scene-grid,.home-page .scene-crystal,.home-page .scene-orbit,.home-page .hero-floating-card,.home-page .hero-quote,.home-page .hero-media-dock { transform: none !important; }
        .home-page .hero-media-dock.is-playing .media-thumb,.home-page .hero-media-dock.is-playing .signal-bars i { animation: none; }
      }
    `;
    document.head.appendChild(style);
  }

  const mediaDock = document.querySelector('.hero-media-dock');
  const mediaButton = document.querySelector('.media-play');
  if (mediaDock && mediaButton) {
    mediaButton.setAttribute('type', 'button');
    mediaButton.setAttribute('aria-label', 'Переключить режим workflow');
    mediaButton.setAttribute('aria-pressed', 'false');

    const toggleMediaMode = () => {
      const playing = mediaDock.classList.toggle('is-playing');
      mediaButton.setAttribute('aria-pressed', String(playing));
      mediaButton.textContent = playing ? '❚❚' : '▶';
      const label = mediaDock.querySelector('.media-copy span');
      const title = mediaDock.querySelector('.media-copy strong');
      if (label) label.textContent = playing ? 'NOW / FOCUS MODE' : 'NOW / PORTFOLIO MODE';
      if (title) title.textContent = playing ? 'Workflow active' : 'Moderation workflow';
    };

    mediaButton.addEventListener('click', toggleMediaMode);
  }

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
      node.style.setProperty('--parallax-x', `${x.toFixed(2)}px`);
      node.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
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
