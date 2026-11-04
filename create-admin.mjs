import { ConvexClient } from "convex/browser";

const convex = new ConvexClient("http://127.0.0.1:3210");
convex.setAdminKey(
  "anonymous-ashmoun-delivery|016e839318382cce68017d8e936663433e1c21d45eaebab0103df77e88f56650db34e0bd38",
);

const phone = "01012345678";
const password = "admin1234";
const name = "مدير";

try {
  const userId = await convex.mutation("bootstrap-admin:createBootstrapAdmin", {
    phone,
    password,
    name,
  });
  console.log("SUCCESS");
  console.log("Phone:", phone);
  console.log("Password:", password);
  console.log("User ID:", userId);
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}