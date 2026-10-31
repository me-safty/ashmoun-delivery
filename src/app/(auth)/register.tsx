import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { normalizePhone } from "@/convex/lib/phone";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormScreen } from "@/components/form-screen";
import { TextField } from "@/components/text-field";
import { errorMessage } from "@/lib/errors";

export default function Register() {
  const { signIn } = useAuthActions();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const normalized = normalizePhone(phone);
    if (name.trim().length < 2) return setError("اكتب اسمك");
    if (!normalized) return setError("رقم الموبايل غير صحيح");
    if (password.length < 8) return setError("كلمة المرور لازم تكون 8 حروف أو أرقام على الأقل");
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { flow: "signUp", name: name.trim(), phone: normalized, password });
    } catch (e) {
      setError(errorMessage(e, "الرقم ده مسجل قبل كده، جرب تسجيل الدخول"));
      setSubmitting(false);
    }
  }

  return (
    <FormScreen footer={<Button label="إنشاء الحساب" loading={submitting} onPress={submit} />}>
      <AppText tone="muted">سجل برقم موبايلك عشان المندوب يقدر يكلمك.</AppText>
      <TextField label="الاسم" autoComplete="name" value={name} onChangeText={setName} />
      <TextField
        label="رقم الموبايل"
        placeholder="01xxxxxxxxx"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
      />
      <TextField
        label="كلمة المرور (8 على الأقل)"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <AppText tone="danger">{error}</AppText> : null}
    </FormScreen>
  );
}
