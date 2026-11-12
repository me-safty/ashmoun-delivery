import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const IMAGES: Record<string, number> = {
  "الطعام": require("../../assets/images/icon-hamburger.png"),
  مطاعم: require("../../assets/images/icon-hamburger.png"),
  "🍔": require("../../assets/images/icon-hamburger.png"),
  "🥪": require("../../assets/images/icon-hamburger.png"),
  البقالة: require("../../assets/images/icon-shopping-cart.png"),
  بقالة: require("../../assets/images/icon-shopping-cart.png"),
  "🛍️": require("../../assets/images/icon-shopping-cart.png"),
  "🛒": require("../../assets/images/icon-shopping-cart.png"),
  الصيدليات: require("../../assets/images/icon-pill.png"),
  صيدليات: require("../../assets/images/icon-pill.png"),
  صيدلية: require("../../assets/images/icon-pill.png"),
  "💊": require("../../assets/images/icon-pill.png"),
  الورود: require("../../assets/images/icon-bouquet.png"),
  زهور: require("../../assets/images/icon-bouquet.png"),
  "💐": require("../../assets/images/icon-bouquet.png"),
};

export function CategoryArt({
  emoji,
  name,
  size = 64,
}: {
  emoji?: string;
  name?: string;
  size?: number;
}) {
  const source = (name && IMAGES[name]) || (emoji && IMAGES[emoji]);
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {source ? (
        <Image source={source} style={{ width: size, height: size }} contentFit="contain" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 16,
  },
});


