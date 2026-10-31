import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { normalizePhone } from "@/convex/lib/phone";
import { AppText } from "@/components/app-text";
import { Brand } from "@/components/brand";
import { Button } from "@/components/button";
import { FormScreen } from "@/components/form-screen";
import { TextField } from "@/components/text-field";
import { errorMessage } from "@/lib/errors";
import { space } from "@/theme";

export default function Login() {
  const { signIn } = useAuthActions();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;
    const normalized = normalizePhone(phone);
    if (!normalized) return setError("رقم الموبايل غير صحيح");
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { flow: "signIn", phone: normalized, password });
    } catch (e) {
      setError(errorMessage(e, "رقم الموبايل أو كلمة المرور غلط"));
      setSubmitting(false);
    }
  }

  return (
    <FormScreen
      footer={<Button label="تسجيل الدخول" loading={submitting} onPress={submit} />}>
      <Brand />
      <View style={styles.form}>
        <AppText variant="title">أهلاً بيك تاني</AppText>
        <TextField
          label="رقم الموبايل"
          placeholder="01xxxxxxxxx"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={setPhone}
        />
        <TextField
          label="كلمة المرور"
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />
        {error ? <AppText tone="danger">{error}</AppText> : null}
        <View style={styles.links}>
          <Link href="/forgot-password" style={styles.link}>
            <AppText variant="caption" tone="primaryInk">
              نسيت كلمة المرور؟
            </AppText>
          </Link>
          <Link href="/register" style={styles.link}>
            <AppText variant="caption" tone="primaryInk">
              معندكش حساب؟ سجل دلوقتي
            </AppText>
          </Link>
        </View>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  links: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
  link: { paddingVertical: space.md },
});
