import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { normalizePhone, toLatinDigits } from "@/convex/lib/phone";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormScreen } from "@/components/form-screen";
import { TextField } from "@/components/text-field";
import { errorMessage } from "@/lib/errors";

export default function ForgotPassword() {
  const { signIn } = useAuthActions();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError(null);
    setSubmitting(true);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e, fallback));
    } finally {
      setSubmitting(false);
    }
  }

  function requestCode() {
    const normalized = normalizePhone(phone);
    if (!normalized) return setError("رقم الجوال غير صحيح");
    void run(async () => {
      await signIn("password", { flow: "reset", phone: normalized });
      setSentTo(normalized);
    }, "لا يوجد حساب بهذا الرقم");
  }

  function resetPassword() {
    if (!sentTo) return;
    void run(
      () => signIn("password", { flow: "reset-verification", phone: sentTo, code, newPassword }),
      "الرمز غير صحيح أو منتهي الصلاحية، اطلب رمزًا جديدًا",
    );
  }

  if (sentTo === null) {
    return (
      <FormScreen footer={<Button label="إرسال الرمز" loading={submitting} onPress={requestCode} />}>
        <AppText tone="muted">أدخل رقم جوالك وسنرسل لك رمزًا مكوّنًا من 6 أرقام.</AppText>
        <TextField
          label="رقم الجوال"
          placeholder="01xxxxxxxxx"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {error ? <AppText tone="danger">{error}</AppText> : null}
      </FormScreen>
    );
  }

  return (
    <FormScreen
      footer={
        <>
          <Button label="تغيير كلمة المرور" loading={submitting} onPress={resetPassword} />
          <Button kind="secondary" label="تغيير الرقم" onPress={() => setSentTo(null)} />
        </>
      }>
      <AppText tone="muted">تم إرسال رمز إلى {sentTo}</AppText>
      <TextField
        label="الرمز"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        value={code}
        onChangeText={(text) => setCode(toLatinDigits(text).replace(/\D/g, "").slice(0, 6))}
      />
      <TextField
        label="كلمة المرور الجديدة (8 أحرف على الأقل)"
        secureTextEntry
        autoComplete="new-password"
        value={newPassword}
        onChangeText={setNewPassword}
      />
      {error ? <AppText tone="danger">{error}</AppText> : null}
    </FormScreen>
  );
}
