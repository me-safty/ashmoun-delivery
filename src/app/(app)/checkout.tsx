import { useMutation, useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormScreen } from "@/components/form-screen";
import { PriceSummary } from "@/components/price-summary";
import { TextField } from "@/components/text-field";
import { useCart, useCartQuote } from "@/lib/cart";
import { errorMessage } from "@/lib/errors";
import { colors, radius, space } from "@/theme";

export default function Checkout() {
  const { shop, lines, clear } = useCart();
  const addresses = useQuery(api.addresses.mine);
  const place = useMutation(api.orders.place);
  const quote = useCartQuote();
  const priced = quote?.kind === "ok" ? quote : undefined;
  const [chosenId, setChosenId] = useState<Id<"addresses"> | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const address = addresses?.find((a) => a._id === chosenId) ?? addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  async function submit() {
    if (!shop || !address || placing) return;
    setError(null);
    setPlacing(true);
    try {
      const orderId = await place({
        shopId: shop.id,
        addressId: address._id,
        note,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, selections: l.selections })),
      });
      clear();
      router.dismissAll();
      router.replace({ pathname: "/order/[id]/success", params: { id: orderId } });
    } catch (e) {
      setError(errorMessage(e));
      setPlacing(false);
    }
  }

  return (
    <FormScreen
      footer={
        <Button label="تأكيد الطلب" loading={placing} disabled={!shop || !address || !priced} onPress={submit} />
      }>
      <Stack.Screen options={{ title: "إتمام الطلب" }} />
      <AppText variant="subtitle">التوصيل إلى</AppText>
      {addresses?.map((a) => {
        const selected = a._id === address?._id;
        return (
          <Pressable
            key={a._id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setChosenId(a._id)}
            style={[styles.option, selected && styles.optionOn]}>
            <AppText variant="subtitle">
              {a.label} · {a.zoneName}
            </AppText>
            <AppText variant="caption" tone="muted">
              {a.street}
              {a.landmark ? ` · ${a.landmark}` : ""}
            </AppText>
          </Pressable>
        );
      })}

      <AppText variant="subtitle">طريقة الدفع</AppText>
      <View style={[styles.option, styles.optionOn]}>
        <AppText variant="subtitle">💵 كاش عند الاستلام</AppText>
        <AppText variant="caption" tone="muted">
          ادفع للمندوب لما الطلب يوصلك.
        </AppText>
      </View>

      <TextField
        label="ملاحظات للمحل أو المندوب (اختياري)"
        placeholder="مثلاً: من غير بصل"
        value={note}
        onChangeText={setNote}
        maxLength={300}
        multiline
      />

      <PriceSummary subtotal={priced?.subtotal} deliveryFee={address?.deliveryFee} />
      {quote?.kind === "invalid" ? <AppText tone="danger">{quote.message}</AppText> : null}
      {error ? <AppText tone="danger">{error}</AppText> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  option: {
    gap: 2,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
