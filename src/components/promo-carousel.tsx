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

type SlideOptions = {
  animate?: boolean;
  // Set when the drag already placed the incoming card under the finger.
  keepIncoming?: boolean;
};

/**
 * Promo carousel that shows one card at a time. Cards always travel to the right: the card on
 * screen leaves through the right edge and the next one arrives from the left, so the promo
 * block keeps moving without the user having to touch it.
 *
 * Autoplay stops when the system asks for reduced motion; swiping and the dots still work.
 */
export function PromoCarousel({ width, children }: { width: number; children: ReactNode }) {
  const cards = useMemo(() => Children.toArray(children), [children]);
  const count = cards.length;
  // A card waits one gap away, so the one leaving and the one arriving never overlap.
  const travel = width + space.sm;
  const reducedMotion = useReducedMotion();

  const [active, setActive] = useState(0);

  // One translateX per card: the visible card sits at 0, the rest are parked off-screen.
  const [positions] = useState(() =>
    cards.map((_, index) => new Animated.Value(index === 0 ? 0 : -travel)),
  );

  const activeRef = useRef(0);
  const busyRef = useRef(false);
  const pausedUntilRef = useRef(0);

  // A resize (rotation, browser window) invalidates the parked offsets: snap everything back.
  useEffect(() => {
    positions.forEach((position, index) => {
      position.stopAnimation();
      position.setValue(index === activeRef.current ? 0 : -travel);
    });
    busyRef.current = false;
  }, [positions, travel]);

  const slideTo = useCallback(
    (next: number, { animate = true, keepIncoming = false }: SlideOptions = {}) => {
      if (count < 2) return;
      const from = activeRef.current;
      const target = ((next % count) + count) % count;
      if (target === from || busyRef.current) return;

      busyRef.current = true;
      activeRef.current = target;
      setActive(target);

      // Forwards is the normal move (0 → 1 → 2 → 0); backwards mirrors it.
      const forward = target === (from + 1) % count;
      const outgoing = positions[from];
      const incoming = positions[target];

      // The incoming card always has to start on the side it enters from.
      if (!keepIncoming) incoming.setValue(forward ? -travel : travel);

      const parkOutgoing = () => {
        outgoing.setValue(-travel);
        busyRef.current = false;
      };

      if (!animate) {
        outgoing.setValue(forward ? travel : -travel);
        incoming.setValue(0);
        parkOutgoing();
        return;
      }

      Animated.parallel([
        Animated.timing(outgoing, {
          toValue: forward ? travel : -travel,
          duration: SLIDE_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(incoming, {
          toValue: 0,
          duration: SLIDE_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start(parkOutgoing);
    },
    [count, positions, travel],
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
      const neighbour = (from + direction + count) % count;
      const committed = Math.abs(dx) > travel * SWIPE_RATIO || Math.abs(vx) > 0.35;

      if (committed) {
        slideTo(from + direction, { keepIncoming: true });
        return;
      }

      if (neighbour === from) return;
      Animated.parallel([
        Animated.spring(positions[from], {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          mass: 0.7,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(positions[neighbour], {
          toValue: -direction * travel,
          damping: 18,
          stiffness: 180,
          mass: 0.7,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
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
        const direction = gesture.dx >= 0 ? 1 : -1;
        const neighbour = (from + direction + count) % count;
        if (neighbour === from) return;

        positions[from].setValue(gesture.dx);
        positions[neighbour].setValue(gesture.dx - direction * travel);
      },
      onPanResponderRelease: (_, gesture) => endDrag(gesture.dx, gesture.vx),
      onPanResponderTerminate: (_, gesture) => endDrag(gesture.dx, gesture.vx),
    });

    setPanHandlers(responder.panHandlers);
  }, [count, positions, slideTo, travel]);

  const selectPage = useCallback(
    (index: number) => {
      pausedUntilRef.current = Date.now() + SWIPE_PAUSE_MS;
      slideTo(index, { animate: !reducedMotion });
    },
    [reducedMotion, slideTo],
  );

  return (
    <View style={{ width }}>
      <View style={[styles.track, { width }]} {...panHandlers}>
        {cards.map((card, index) => (
          <Animated.View
            key={index}
            style={[
              index === 0 ? null : styles.stacked,
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
  // Clipping the track is what lets a card leave the screen instead of sliding over the page.
  track: { overflow: "hidden" },
  stacked: { position: "absolute", top: 0, left: 0 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: space.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D9D9D9" },
  dotActive: { backgroundColor: "#141414" },
});
