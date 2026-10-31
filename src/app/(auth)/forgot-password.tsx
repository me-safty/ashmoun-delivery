import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { normalizePhone } from "@/convex/lib/phone";
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
    if (!normalized) return setError("رقم الموبايل غير صحيح");
    void run(async () => {
      await signIn("password", { flow: "reset", phone: normalized });
      setSentTo(normalized);
    }, "مفيش حساب بالرقم ده");
  }

  function resetPassword() {
    if (!sentTo) return;
    if (newPassword.length < 8) return setError("كلمة المرور لازم تكون 8 حروف أو أرقام على الأقل");
    void run(
      () => signIn("password", { flow: "reset-verification", phone: sentTo, code: code.trim(), newPassword }),
      "الكود غلط أو انتهى، اطلب كود جديد",
    );
  }

  if (sentTo === null) {
    return (
      <FormScreen footer={<Button label="ابعت الكود" loading={submitting} onPress={requestCode} />}>
        <AppText tone="muted">اكتب رقم موبايلك وهنبعتلك كود من 6 أرقام.</AppText>
        <TextField
          label="رقم الموبايل"
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
          <Button label="غير كلمة المرور" loading={submitting} onPress={resetPassword} />
          <Button kind="secondary" label="غير الرقم" onPress={() => setSentTo(null)} />
        </>
      }>
      <AppText tone="muted">بعتنا كود على {sentTo}</AppText>
      <TextField
        label="الكود"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <TextField
        label="كلمة المرور الجديدة"
        secureTextEntry
        autoComplete="new-password"
        value={newPassword}
        onChangeText={setNewPassword}
      />
      {error ? <AppText tone="danger">{error}</AppText> : null}
    </FormScreen>
  );
}
