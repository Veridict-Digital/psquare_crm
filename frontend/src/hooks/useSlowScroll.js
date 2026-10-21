import { useEffect } from 'react';

/** Approx. height of one dropdown option/row (px). */
const ITEM_HEIGHT = 28;
/** How many options to move per mouse-wheel notch. */
const ITEMS_PER_NOTCH = 2.5;
/** Only slow-scroll short panels (dropdown lists), not full page areas. */
const MAX_DROPDOWN_HEIGHT = 360;

function applySlowWheel(el, e) {
  const direction = Math.sign(e.deltaY) || Math.sign(e.deltaX);
  if (!direction) return false;

  e.preventDefault();
  e.stopPropagation();
  el.scrollTop += direction * ITEM_HEIGHT * ITEMS_PER_NOTCH;
  return true;
}

function isSlowScrollTarget(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.dataset.slowScroll === 'off') return false;
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return false;

  // Explicit opt-in
  if (el.hasAttribute('data-slow-scroll')) {
    return el.scrollHeight > el.clientHeight + 1;
  }

  // Native listbox <select size="N">
  if (el.tagName === 'SELECT' && Number(el.size) > 1) {
    return el.scrollHeight > el.clientHeight + 1;
  }

  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  const canScroll =
    (overflowY === 'auto' || overflowY === 'scroll') &&
    el.scrollHeight > el.clientHeight + 1;

  // Short scrollable panels ≈ dropdown option lists
  return canScroll && el.clientHeight > 0 && el.clientHeight <= MAX_DROPDOWN_HEIGHT;
}

/**
 * Global slow mouse-wheel for dropdown-style lists:
 * ~2–3 options per scroll notch instead of jumping many at once.
 *
 * Covers:
 * - [data-slow-scroll] panels
 * - short overflow scroll areas (assumption lists, compact menus)
 * - native <select size="N"> listboxes
 *
 * Note: OS-native single-line <select> popups cannot be controlled by the browser.
 */
export function useGlobalSlowScroll() {
  useEffect(() => {
    const onWheel = (e) => {
      let el = e.target;
      while (el && el !== document.body) {
        if (isSlowScrollTarget(el)) {
          applySlowWheel(el, e);
          return;
        }
        el = el.parentElement;
      }
    };

    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, []);
}
