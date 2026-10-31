import { router, Stack } from "expo-router";
import { AddressForm } from "@/components/address-form";

export default function NewAddress() {
  return (
    <>
      <Stack.Screen options={{ title: "عنوان جديد" }} />
      <AddressForm onSaved={() => router.back()} />
    </>
  );
}
