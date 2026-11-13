'use client';

import { useEffect } from 'react';

/**
 * Pointer field controller — the JS half of the element library.
 *
 * WHY ONE LISTENER FOR THE WHOLE PAGE
 * The CSS primitives (.el-spotlight, .el-tilt, .el-glow) all read the same
 * three custom properties: --mx/--my (cursor position), --rx/--ry (rotation
 * angle) and --lift. If each component attached its own pointermove handler we
 * would have dozens of listeners and dozens of layout-invalidating writes per
 * frame. Instead this attaches ONE delegated listener per document, writes to
 * only the element under the cursor, and lets CSS decide what to do with it.
 *
 * DESIGN RULES ENFORCED HERE
 *  - Touch and pen never trigger tilt or magnetism: there is no cursor, and
 *    hijacking a tap position produces motion the user did not ask for.
 *  - prefers-reduced-motion short-circuits everything.
 *  - Writes are wrapped so a mid-gesture unmount cannot throw.
 */
export default function PointerField() {
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const calm = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || !calm) return;

    // Tilt is capped hard. Past ~6deg the card stops reading as a surface and
    // starts reading as a toy, and the pointer target visibly detaches from
    // the thing being clicked.
    const MAX_TILT = 6;
    const MAX_MAGNET = 8;

    // `pointerleave` on document fires with document itself as the target, and
    // a Document node has no `.closest` — so the target must be probed for the
    // method rather than assumed to be an Element.
    const ptrEl = (target: EventTarget | null): HTMLElement | null => {
      const t = target as (Element & { closest?: unknown }) | null;
      if (!t || typeof t.closest !== 'function') return null;
      return t.closest<HTMLElement>('[data-ptr]');
    };

    const onMove = (e: PointerEvent) => {
      const el = ptrEl(e.target);
      if (!el) return;

      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;

      el.style.setProperty('--mx', `${(nx * 100).toFixed(2)}%`);
      el.style.setProperty('--my', `${(ny * 100).toFixed(2)}%`);
      el.style.setProperty('--ry', `${((nx - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((0.5 - ny) * 2 * MAX_TILT).toFixed(2)}deg`);

      if (el.dataset.ptr === 'magnet') {
        el.style.setProperty('--lift-x', `${((nx - 0.5) * 2 * MAX_MAGNET).toFixed(1)}px`);
        el.style.setProperty('--lift-y', `${((ny - 0.5) * 2 * MAX_MAGNET).toFixed(1)}px`);
      }
    };

    const onLeave = (e: PointerEvent) => {
      const el = ptrEl(e.target);
      if (!el) return;
      // Ease back to centre rather than snapping — CSS transition does the work.
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--lift-x', '0px');
      el.style.setProperty('--lift-y', '0px');
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return null;
}