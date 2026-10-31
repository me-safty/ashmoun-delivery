import { Children, type ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { space } from "@/theme";

export const ADMIN_MAX_WIDTH = 1200;

export const adminPage = { width: "100%", maxWidth: ADMIN_MAX_WIDTH, alignSelf: "center" } as const;

export function useAdminColumns() {
  const { width } = useWindowDimensions();
  return width >= 1100 ? 3 : width >= 720 ? 2 : 1;
}

// Cards inside a cell should set flexGrow: 1 so a row's cards share the tallest height.
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
  grid: { flexDirection: "row", flexWrap: "wrap", margin: -space.md / 2 },
  cell: { padding: space.md / 2 },
});
