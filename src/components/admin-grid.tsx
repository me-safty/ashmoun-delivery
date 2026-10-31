import { Children, type ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { space } from "@/theme";

export function useAdminColumns() {
  const { width } = useWindowDimensions();
  return width >= 1100 ? 3 : width >= 720 ? 2 : 1;
}

export function useWideAdmin() {
  return useWindowDimensions().width >= 900;
}

// Centers admin content and caps its width on large monitors.
export const adminPage = { width: "100%", maxWidth: 1200, alignSelf: "center" } as const;

export function AdminGrid({ children }: { children: ReactNode }) {
  const columns = useAdminColumns();
  return (
    <View style={styles.grid}>
      {Children.map(children, (child) => (
        <View style={[styles.cell, { width: `${100 / columns}%` }]}>{child}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -space.xs },
  cell: { paddingHorizontal: space.xs, paddingBottom: space.md },
});
