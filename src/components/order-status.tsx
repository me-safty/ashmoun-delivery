import { StyleSheet, View } from "react-native";
import type { Doc } from "@/convex/_generated/dataModel";
import { statusLabels, type OrderStatus } from "@/convex/lib/orderStatus";
import { colors, radius, space } from "@/theme";
import { AppText } from "./app-text";

const pill = {
  created: { tone: "warning", background: colors.warningSoft },
  confirmed: { tone: "primary", background: colors.primarySoft },
  with_driver: { tone: "primary", background: colors.primarySoft },
  delivered: { tone: "success", background: colors.successSoft },
  returned: { tone: "danger", background: colors.dangerSoft },
  cancelled: { tone: "muted", background: colors.border },
} as const;

export function StatusPill({ status }: { status: OrderStatus }) {
  const { tone, background } = pill[status];
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <AppText variant="caption" tone={tone}>
        {statusLabels[status]}
      </AppText>
    </View>
  );
}

const flow: OrderStatus[] = ["created", "confirmed", "with_driver", "delivered"];

const timeFormat = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  hour: "numeric",
  minute: "2-digit",
});

export function OrderTimeline({ order }: { order: Pick<Doc<"orders">, "status" | "history"> }) {
  const reachedAt = new Map(order.history.map((h) => [h.status, h.at]));
  const ended = order.status === "returned" || order.status === "cancelled";
  const steps = ended ? [...flow.filter((s) => reachedAt.has(s)), order.status] : flow;

  return (
    <View style={styles.timeline}>
      {steps.map((status, index) => {
        const at = reachedAt.get(status);
        const done = at !== undefined;
        const current = status === order.status;
        const failed = current && ended;
        return (
          <View key={status} style={styles.step}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && styles.dotCurrent,
                  failed && styles.dotFailed,
                ]}
              />
              {index < steps.length - 1 ? <View style={[styles.line, done && styles.lineDone]} /> : null}
            </View>
            <View style={styles.stepBody}>
              <AppText variant={current ? "subtitle" : "body"} tone={done ? (failed ? "danger" : "ink") : "muted"}>
                {statusLabels[status]}
              </AppText>
              {at !== undefined ? (
                <AppText variant="caption" tone="muted">
                  {timeFormat.format(at)}
                </AppText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill, alignSelf: "flex-start" },
  timeline: { gap: 0 },
  step: { flexDirection: "row", gap: space.md, minHeight: 56 },
  rail: { alignItems: "center", width: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.faint, backgroundColor: colors.surface },
  dotDone: { borderColor: colors.primary, backgroundColor: colors.primary },
  dotCurrent: { width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: colors.primarySoft },
  dotFailed: { backgroundColor: colors.danger, borderColor: colors.dangerSoft },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: colors.primary },
  stepBody: { flex: 1, paddingBottom: space.md },
});
