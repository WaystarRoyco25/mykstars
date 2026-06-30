"use client";

import { useCallback, useRef, useState } from "react";

// Fire once when the element first scrolls within `rootMargin` of the viewport.
// Returns a ref CALLBACK (not a ref object) on purpose: the observed node swaps
// (the link-out facade <a> is replaced by the embed <div> on activation), and only
// a ref callback re-attaches across that swap. The callback form is also Strict-Mode
// double-mount safe, since React runs the previous node's cleanup before the next
// node's callback, so the observer is never leaked or duplicated.
export function useInView<T extends Element>(
  rootMargin = "300px",
): [(node: T | null) => void, boolean] {
  const [inView, setInView] = useState(false);
  // A ref (not state) so the "already fired" latch survives the element swap and
  // any Strict-Mode remount without resetting.
  const fired = useRef(false);

  const ref = useCallback(
    (node: T | null) => {
      if (fired.current || node == null) return;
      // SSR / very old browsers: degrade to "always in view" so the embed still
      // mounts rather than staying a permanent facade.
      if (typeof IntersectionObserver === "undefined") {
        fired.current = true;
        setInView(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            fired.current = true;
            setInView(true);
            observer.disconnect();
          }
        },
        { rootMargin },
      );
      observer.observe(node);
      // React 19 ref-callback cleanup: disconnect when the node unmounts/swaps.
      return () => observer.disconnect();
    },
    [rootMargin],
  );

  return [ref, inView];
}
