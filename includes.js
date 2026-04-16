(() => {
  const placeholders = Array.from(document.querySelectorAll('[data-include]'));

  const loadPartial = async (placeholder) => {
    const name = placeholder.dataset.include;
    if (!name) return;

    try {
      const response = await fetch(`${name}.html`, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Failed to fetch ${name}.html (${response.status})`);
      const html = await response.text();
      const fragment = document.createRange().createContextualFragment(html);
      placeholder.replaceWith(fragment);
    } catch (error) {
      console.error(`Include failed for ${name}:`, error);
    }
  };

  const loaders = placeholders.map(loadPartial);

  window.partialsReady = Promise.all(loaders).then(() => {
    document.dispatchEvent(new Event('partials:ready'));
  });
})();
