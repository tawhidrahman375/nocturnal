import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Starts false (most permissive default while the async check resolves) rather than
// undefined — a screen's first paint should never crash on a missing boolean, and a
// one-frame flash of a slide-in before this resolves true is preferable to every caller
// having to handle a tri-state value.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
