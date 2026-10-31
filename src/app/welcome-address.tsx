import { useAuthActions } from "@convex-dev/auth/react";
import { AddressForm } from "@/components/address-form";
import { Button } from "@/components/button";

export default function WelcomeAddress() {
  const { signOut } = useAuthActions();
  return (
    <AddressForm
      footerExtra={<Button kind="secondary" label="مش حسابك؟ تسجيل الخروج" onPress={() => void signOut()} />}
    />
  );
}
