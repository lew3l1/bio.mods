(() => {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  const hide = () => {
    requestAnimationFrame(() => loader.classList.add('is-hidden'));
  };

  window.addEventListener('load', hide, { once: true });
  window.addEventListener('pageshow', hide);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;

    event.preventDefault();
    loader.classList.remove('is-hidden');
    window.setTimeout(() => { window.location.href = url.href; }, 180);
  });
})();
