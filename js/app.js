(() => {
  const reveal = document.querySelectorAll('[data-reveal]');
  reveal.forEach((el) => el.classList.add('reveal'));
  if (!('IntersectionObserver' in window)) {
    reveal.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveal.forEach((el) => observer.observe(el));
})();
