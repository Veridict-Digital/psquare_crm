import { useEffect } from 'react';
import { sortAllSelects, sortSelectElement } from '../utils/alphabetical';

/**
 * Globally keep every native <select> alphabetically ordered.
 * Opt out per control with: data-no-alpha-sort
 */
export function useAlphabeticalSelects() {
  useEffect(() => {
    let scheduled = null;

    const run = () => {
      scheduled = null;
      sortAllSelects(document);
    };

    const schedule = () => {
      if (scheduled != null) return;
      scheduled = window.requestAnimationFrame(run);
    };

    // Initial pass (after first paint)
    schedule();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;
        if (mutation.target?.tagName === 'SELECT') {
          sortSelectElement(mutation.target);
          continue;
        }
        // New selects mounted or option lists replaced by React
        schedule();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also re-sort when focus opens a select (covers late option injection)
    const onFocusIn = (e) => {
      if (e.target?.tagName === 'SELECT') {
        sortSelectElement(e.target);
      }
    };
    document.addEventListener('focusin', onFocusIn, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', onFocusIn, true);
      if (scheduled != null) window.cancelAnimationFrame(scheduled);
    };
  }, []);
}

export default useAlphabeticalSelects;
