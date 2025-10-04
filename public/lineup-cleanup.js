/* Robust UI cleanup for SPA: hides Field Size, Orientation, and Adjust Positions */
(function () {
  const byText = (root, re) => {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_ELEMENT);
    const out = [];
    while (walker.nextNode()) {
      const el = walker.currentNode;
      const t = (el.textContent || '').trim();
      if (re.test(t)) out.push(el);
    }
    return out;
  };

  const removeGroupContaining = (textRe) => {
    byText(document.body, textRe).forEach(el => {
      // climb to a sensible container
      let target = el.closest('div,section,header,fieldset') || el;
      // avoid nuking formation/team selectors accidentally
      if (/Formation/i.test(target.textContent)) return;
      try { target.remove(); } catch {}
    });
  };

  const removeButtonsByText = (textRe) => {
    document.querySelectorAll('button').forEach(btn => {
      const t = (btn.textContent || '').trim();
      if (textRe.test(t)) btn.remove();
    });
  };

  const clean = () => {
    // 1) Adjust Positions button
    removeButtonsByText(/^Adjust Positions/i);

    // 2) Field Size group
    removeGroupContaining(/^Field Size:/i);

    // 3) Orientation group
    removeGroupContaining(/^Orientation:/i);
  };

  // Run immediately…
  const kick = () => { try { clean(); } catch {} };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kick, { once: true });
  } else {
    kick();
  }

  // …and keep watching for React re-renders.
  const mo = new MutationObserver(() => kick());
  mo.observe(document.body, { childList: true, subtree: true });

  // Extra retries in case of heavy client hydration
  let tries = 0, max = 20;
  const timer = setInterval(() => {
    kick();
    if (++tries >= max) clearInterval(timer);
  }, 250);
})();