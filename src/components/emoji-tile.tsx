import { StyleSheet, View } from "react-native";
import { radius } from "@/theme";
import { AppText } from "./app-text";

export function EmojiTile({ emoji, tint, size = 56 }: { emoji: string; tint: string; size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: tint }]}>
      <AppText style={{ fontSize: size * 0.5, lineHeight: size * 0.7 }}>{emoji}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
