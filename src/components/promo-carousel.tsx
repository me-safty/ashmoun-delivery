import { useReducedMotion } from "@/lib/use-reduced-motion";
import { space } from "@/theme";
import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

// The native driver has no web counterpart; looping on the JS driver keeps the browser quiet.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// How long a card rests on screen, how long one swap takes, and how long a swipe pauses autoplay.
const AUTOPLAY_MS = 4200;
const SLIDE_MS = 520;
const SWIPE_PAUSE_MS = 6000;
// Fraction of the card the finger has to travel before a drag counts as a swipe.
const SWIPE_RATIO = 0.22;
// The sliver of the previous and next card that stays visible past each edge, and the gap
// the cards keep between them once parked side by side.
const PEEK = 16;
const GAP = space.sm;

type SlideOptions = {
  animate?: boolean;
};

/**
 * Promo carousel that shows one card at a time with a sliver of the previous and next cards
 * peeking in from both edges. Cards always travel to the right: the card on screen leaves
 * through the right edge and the next one arrives from the left, so the promo block keeps
 * moving without the user having to touch it.
 *
 * Autoplay stops when the system asks for reduced motion; swiping and the dots still work.
 */
export function PromoCarousel({ width, children }: { width: number; children: ReactNode }) {
  const cards = useMemo(() => Children.toArray(children), [children]);
  const count = cards.length;
  // Cards travel one full card plus the gap, and the track is wider than a card so the
  // neighbours can rest in the gutters with just their edge showing.
  const travel = width + GAP;
  const pad = count > 1 ? PEEK + GAP : 0;
  const trackWidth = width + pad * 2;
  const reducedMotion = useReducedMotion();

  const [active, setActive] = useState(0);

  // Signed loop distance from the active card: 0 is on screen, +1 is the card peeking on the
  // right (the previous one), -1 the one peeking on the left (the next one).
  const distanceFor = useCallback(
    (index: number, from: number) => {
      const forward = (index - from + count) % count;
      return forward <= count / 2 ? -forward : count - forward;
    },
    [count],
  );

  // One translateX per card: the visible card sits at 0, the rest in their peek/off-screen slots.
  const [positions] = useState(() =>
    cards.map((_, index) => new Animated.Value(distanceFor(index, 0) * travel)),
  );

  const activeRef = useRef(0);
  const busyRef = useRef(false);
  const pausedUntilRef = useRef(0);

  // A resize (rotation, browser window) invalidates the parked offsets: snap everything back.
  useEffect(() => {
    positions.forEach((position, index) => {
      position.stopAnimation();
      position.setValue(distanceFor(index, activeRef.current) * travel);
    });
    busyRef.current = false;
  }, [distanceFor, positions, travel]);

  const slideTo = useCallback(
    (next: number, { animate = true }: SlideOptions = {}) => {
      if (count < 2) return;
      const from = activeRef.current;
      const target = ((next % count) + count) % count;
      if (target === from || busyRef.current) return;

      busyRef.current = true;
      activeRef.current = target;
      setActive(target);

      const moves: Animated.CompositeAnimation[] = [];

      positions.forEach((position, index) => {
        const before = distanceFor(index, from);
        const after = distanceFor(index, target);
        const to = after * travel;

        // A card that is neither the active one nor one of its neighbours sits off screen,
        // so wrapping it straight to the other side of the loop is invisible.
        if (!animate || Math.abs(after - before) > 1) {
          position.setValue(to);
          return;
        }

        if (after === before) return;

        moves.push(
          Animated.timing(position, {
            toValue: to,
            duration: SLIDE_MS,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        );
      });

      if (moves.length === 0) {
        busyRef.current = false;
        return;
      }

      Animated.parallel(moves).start(() => {
        busyRef.current = false;
      });
    },
    [count, distanceFor, positions, travel],
  );

  useEffect(() => {
    if (reducedMotion || count < 2) return;

    const id = setInterval(() => {
      if (Date.now() < pausedUntilRef.current) return;
      slideTo(activeRef.current + 1);
    }, AUTOPLAY_MS);

    return () => clearInterval(id);
  }, [count, reducedMotion, slideTo]);

  // Dragging follows the finger; letting go either completes the swap or springs back.
  // The responder is built in an effect so no ref or clock is touched while rendering.
  const [panHandlers, setPanHandlers] = useState<
    Partial<ReturnType<typeof PanResponder.create>["panHandlers"]>
  >({});

  useEffect(() => {
    const endDrag = (dx: number, vx: number) => {
      const from = activeRef.current;
      const direction = dx >= 0 ? 1 : -1;
      const committed = Math.abs(dx) > travel * SWIPE_RATIO || Math.abs(vx) > 0.35;

      if (committed && count > 1) {
        slideTo(from + direction);
        return;
      }

      // Not far enough: every card springs back to its own slot.
      Animated.parallel(
        positions.map((position, index) =>
          Animated.spring(position, {
            toValue: distanceFor(index, from) * travel,
            damping: 18,
            stiffness: 180,
            mass: 0.7,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ),
      ).start();
    };

    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        !busyRef.current &&
        count > 1 &&
        Math.abs(gesture.dx) > 6 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
      onPanResponderGrant: () => {
        pausedUntilRef.current = Date.now() + SWIPE_PAUSE_MS;
      },
      onPanResponderMove: (_, gesture) => {
        const from = activeRef.current;
        if (count < 2) return;

        // The whole row follows the finger, so both peeks stay glued to their cards.
        positions.forEach((position, index) => {
          position.setValue(distanceFor(index, from) * travel + gesture.dx);
        });
      },
      onPanResponderRelease: (_, gesture) => endDrag(gesture.dx, gesture.vx),
      onPanResponderTerminate: (_, gesture) => endDrag(gesture.dx, gesture.vx),
    });

    setPanHandlers(responder.panHandlers);
  }, [count, distanceFor, positions, slideTo, travel]);

  const selectPage = useCallback(
    (index: number) => {
      pausedUntilRef.current = Date.now() + SWIPE_PAUSE_MS;
      slideTo(index, { animate: !reducedMotion });
    },
    [reducedMotion, slideTo],
  );

  return (
    <View style={{ width: trackWidth }}>
      <View style={[styles.track, { width: trackWidth }]} {...panHandlers}>
        {cards.map((card, index) => (
          <Animated.View
            key={index}
            style={[
              // The first card stays in flow so the track takes its height; the rest are
              // stacked at the same spot and moved purely with translateX.
              index === 0
                ? { marginHorizontal: pad }
                : [styles.stacked, { left: pad }],
              { width, transform: [{ translateX: positions[index] }] },
            ]}>
            {card}
          </Animated.View>
        ))}
      </View>

      <View style={styles.dots}>
        {cards.map((_, index) => (
          <Pressable
            key={index}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`العرض رقم ${index + 1}`}
            accessibilityState={{ selected: index === active }}
            onPress={() => selectPage(index)}>
            <View style={[styles.dot, index === active && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Clipping the track is what lets a card leave the screen instead of sliding over the page,
  // and what trims the neighbours down to the peeking sliver.
  track: { overflow: "hidden" },
  stacked: { position: "absolute", top: 0 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: space.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D9D9D9" },
  dotActive: { backgroundColor: "#141414" },
});
