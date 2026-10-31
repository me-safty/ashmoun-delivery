import { StyleSheet, View } from "react-native";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatMinute, isOpenAt, todayRanges } from "@/convex/lib/hours";
import { colors, radius, space } from "@/theme";
import { AppText } from "./app-text";

export function shopState(shop: Pick<Doc<"shops">, "hours" | "paused">, now: number) {
  if (shop.paused) return "paused" as const;
  return isOpenAt(shop.hours, now) ? ("open" as const) : ("closed" as const);
}

const badge = {
  open: { label: "مفتوح", tone: "success", background: colors.successSoft },
  closed: { label: "مقفول", tone: "danger", background: colors.dangerSoft },
  paused: { label: "مقفول مؤقتاً", tone: "danger", background: colors.dangerSoft },
} as const;

export function ShopStatusBadge({ state }: { state: ReturnType<typeof shopState> }) {
  const { label, tone, background } = badge[state];
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <AppText variant="caption" tone={tone}>
        {label}
      </AppText>
    </View>
  );
}

export function todayHoursLabel(shop: Pick<Doc<"shops">, "hours">, now: number) {
  const ranges = todayRanges(shop.hours, now);
  if (ranges.length === 0) return "إجازة النهارده";
  if (ranges.some((r) => r.open === r.close)) return "مفتوح 24 ساعة";
  return ranges.map((r) => `${formatMinute(r.open)} - ${formatMinute(r.close)}`).join("، ");
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill, alignSelf: "flex-start" },
});
