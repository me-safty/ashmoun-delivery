import { AddressForm } from "@/components/address-form";
import { useSignOut } from "@/lib/push";
import { Button } from "@/components/button";

export default function WelcomeAddress() {
  const signOut = useSignOut();
  return (
    <AddressForm
      footerExtra={<Button kind="secondary" label="مش حسابك؟ تسجيل الخروج" onPress={() => void signOut()} />}
    />
  );
}
