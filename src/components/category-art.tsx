import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { AppText } from "@/components/app-text";

// Renders category art. Uses a detailed SVG for the restaurants category so it stays clear at small sizes.
export function CategoryArt({ emoji, size = 64 }: { emoji: string; size?: number }) {
  if (emoji === "🥪" || emoji === "🍔") {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <BurgerArt size={size} />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 64 64" style={StyleSheet.absoluteFill}>
        <Ellipse cx="32" cy="54" rx="23" ry="4.5" fill="#000" opacity={0.08} />
      </Svg>
      <AppText style={[styles.emoji, { fontSize: size * 0.62, lineHeight: size * 0.9 }]}>{emoji}</AppText>
    </View>
  );
}

function BurgerArt({ size }: { size: number }) {
  const w = size;
  const h = size;
  return (
    <Svg width={w} height={h} viewBox="0 0 64 64">
      <G>
        <Ellipse cx="32" cy="54" rx="23" ry="4.5" fill="#000" opacity={0.08} />
        <Path d="M13 40c0 5.5 8.5 10 19 10s19-4.5 19-10v-4H13v4z" fill="#E39A3B" />
        <Path d="M13 36h38v4H13z" fill="#D8892E" />
        <Rect x="14" y="33" width="36" height="6" rx="3" fill="#5A3417" />
        <Path d="M14 33h36c0 1.7-1.3 3-3 3H17c-1.7 0-3-1.3-3-3z" fill="#6B3E1D" />
        <Path d="M12 31.5c1.5-2.2 3.6 1.2 5.8-1 2.2 2.2 4.3-1.2 6.5 1 2.2-2.2 4.3 1.2 6.5-1 2.2 2.2 4.3-1.2 6.5 1 2.2-2.2 4.3 1.2 6.5-1 2.2 2.2 4.3-1.2 6.5 1v2.5H12v-2.5z" fill="#4CAF50" />
        <Path d="M12 31.5c1.5-2.2 3.6 1.2 5.8-1 2.2 2.2 4.3-1.2 6.5 1 2.2-2.2 4.3 1.2 6.5-1 2.2 2.2 4.3-1.2 6.5 1 2.2-2.2 4.3 1.2 6.5-1 2.2 2.2 4.3-1.2 6.5 1" fill="none" stroke="#3E8E41" strokeWidth="1.2" strokeLinejoin="round" />
        <Path d="M13 27.5h38l-1.5 4.5c-.5 1.4-1.8 2.4-3.3 2.4H17.8c-1.5 0-2.8-1-3.3-2.4L13 27.5z" fill="#FFD54A" />
        <Path d="M27 27.5h10l-1 5c-.2 1-1 1.7-2 1.7h-4c-1 0-1.8-.7-2-1.7l-1-5z" fill="#FFCA28" />
        <Rect x="15" y="24.5" width="34" height="4.5" rx="2.2" fill="#EF5350" />
        <Circle cx="23" cy="26.7" r="1.1" fill="#FF8A80" opacity={0.9} />
        <Circle cx="32" cy="26.7" r="1.1" fill="#FF8A80" opacity={0.9} />
        <Circle cx="41" cy="26.7" r="1.1" fill="#FF8A80" opacity={0.9} />
        <Path d="M13 24.5c0-8.3 8.5-15 19-15s19 6.7 19 15v1H13v-1z" fill="#F3B24A" />
        <Path d="M15 24.5c0-7 7.6-12.8 17-12.8s17 5.8 17 12.8" fill="#F7C15A" />
        <Ellipse cx="24" cy="17.5" rx="2.2" ry="1.2" fill="#FFF3D6" transform="rotate(-18 24 17.5)" />
        <Ellipse cx="32" cy="15.5" rx="2.2" ry="1.2" fill="#FFF3D6" />
        <Ellipse cx="40" cy="17.5" rx="2.2" ry="1.2" fill="#FFF3D6" transform="rotate(18 40 17.5)" />
        <Ellipse cx="27.5" cy="20.8" rx="2" ry="1.1" fill="#FFF3D6" transform="rotate(-8 27.5 20.8)" />
        <Ellipse cx="36.5" cy="20.8" rx="2" ry="1.1" fill="#FFF3D6" transform="rotate(8 36.5 20.8)" />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  emoji: { textAlign: "center" },
});
