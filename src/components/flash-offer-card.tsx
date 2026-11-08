import { AppText } from "@/components/app-text";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { radius, space } from "@/theme";
import { useEffect, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

const ORANGE = "#F26A1B";
const LIME = "#E4F222";

// The native driver has no web counterpart; looping on the JS driver keeps the browser quiet.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

/**
 * The flash-sale promo card: a pulsing badge, a gently bobbing food duo, and a shine
 * that sweeps across the card every few seconds. All looping transforms stop when the
 * user asks the system for reduced motion.
 */
export function FlashOfferCard({ width }: { width: number }) {
  const reducedMotion = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0));
  const [bob] = useState(() => new Animated.Value(0));
  const [shine] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(0);
      bob.setValue(0);
      shine.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.delay(320),
      ]),
    );

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );

    // One slow pass of light, then a pause long enough to feel like a highlight rather than a strobe.
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(shine, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(shine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.delay(900),
      ]),
    );

    pulseLoop.start();
    bobLoop.start();
    shineLoop.start();

    return () => {
      pulseLoop.stop();
      bobLoop.stop();
      shineLoop.stop();
    };
  }, [reducedMotion, pulse, bob, shine]);

  const badgeScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });
  const badgeRotate = pulse.interpolate({ inputRange: [0, 1], outputRange: ["-12deg", "-6deg"] });
  const chipScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const foodLift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const foodTilt = bob.interpolate({ inputRange: [0, 1], outputRange: ["-5deg", "-1deg"] });
  const shineX = shine.interpolate({ inputRange: [0, 1], outputRange: [-100, width + 100] });
  const shineOpacity = shine.interpolate({
    inputRange: [0, 0.12, 0.88, 1],
    outputRange: [0, 0.85, 0.85, 0],
  });

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.food}>
        <Animated.View
          style={[styles.foodInner, { transform: [{ translateY: foodLift }, { rotate: foodTilt }] }]}>
          <AppText style={styles.emojiTop}>🍕 🍔</AppText>
          <AppText style={styles.emojiBottom}>🍟 🥤</AppText>
        </Animated.View>
        <Animated.View
          style={[styles.badge, { transform: [{ rotate: badgeRotate }, { scale: badgeScale }] }]}>
          <AppText style={styles.badgeText}>🕒 FLASH SALE</AppText>
        </Animated.View>
      </View>

      <View style={styles.textBlock}>
        <AppText style={styles.text}>عروض</AppText>
        <AppText style={styles.text}>يوم الاثنين</AppText>
        <Animated.View style={[styles.chip, { transform: [{ scale: chipScale }] }]}>
          <AppText style={styles.chipText}>خصم</AppText>
        </Animated.View>
        <AppText style={styles.text}>حتى 50%</AppText>
        <AppText style={styles.note}>* تُطبَّق الشروط والأحكام</AppText>
      </View>

      {/* Decorative light pass, drawn above the card content. Three strips soften its edges
          without pulling in a gradient dependency. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shineSweep,
          { opacity: shineOpacity, transform: [{ translateX: shineX }, { rotate: "18deg" }] },
        ]}>
        <View style={[styles.shineStrip, styles.shineEdge]} />
        <View style={[styles.shineStrip, styles.shineCore]} />
        <View style={[styles.shineStrip, styles.shineEdge]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ORANGE,
    borderRadius: radius.lg,
    overflow: "hidden",
    minHeight: 170,
    flexDirection: "row",
    padding: space.md,
  },
  food: {
    flex: 1,
    backgroundColor: "#F3EDE3",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  foodInner: { alignItems: "center", justifyContent: "center" },
  emojiTop: { fontSize: 34, lineHeight: 46, transform: [{ rotate: "-6deg" }] },
  emojiBottom: { fontSize: 30, lineHeight: 42, transform: [{ rotate: "5deg" }], marginTop: -4 },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FF7A1F",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  textBlock: { width: 132, alignItems: "center", gap: 2, justifyContent: "center" },
  text: { color: "#fff", fontWeight: "900", fontSize: 20, lineHeight: 30, textAlign: "center" },
  chip: { backgroundColor: "#141414", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  chipText: { color: LIME, fontWeight: "900", fontSize: 18 },
  note: { color: "rgba(255,255,255,0.85)", fontSize: 9, marginTop: 4 },
  shineSweep: {
    position: "absolute",
    top: -40,
    bottom: -40,
    left: 0,
    width: 96,
    flexDirection: "row",
  },
  shineStrip: { flex: 1 },
  shineEdge: { backgroundColor: "rgba(255,255,255,0.10)" },
  shineCore: { flex: 2, backgroundColor: "rgba(255,255,255,0.24)" },
});
