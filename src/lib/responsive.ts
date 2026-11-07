import { Platform, useWindowDimensions } from "react-native";

export const PHONE_MAX = 480;
export const TABLET_MAX = 1024;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  return {
    width,
    height,
    isWeb,
    isNative: !isWeb,
    isPhone: width < PHONE_MAX,
    isTablet: width >= PHONE_MAX && width < TABLET_MAX,
    isDesktop: width >= TABLET_MAX,
    isWebPhone: isWeb && width < PHONE_MAX,
  };
}
