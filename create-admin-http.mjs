import { fetch } from "node:fetch";

const ADMIN_KEY =
  "anonymous-ashmoun-delivery|016e839318382cce68017d8e936663433e1c21d45eaebab0103df77e88f56650db34e0bd38";

const phone = "01012345678";
const password = "admin1234";
const name = "مدير";

const res = await fetch("http://127.0.0.1:3210/mutation", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADMIN_KEY}`,
  },
  body: JSON.stringify({
    functionArgs: [{ phone, password, name }],
    functionPath: "bootstrap-admin:createBootstrapAdmin",
  }),
});

const data = await res.json();
if (data.status === "success") {
  console.log("Admin account created successfully!");
  console.log("Phone:", phone);
  console.log("Password:", password);
  console.log("User ID:", data.value);
} else {
  console.error("Error:", data.errorMessage || JSON.stringify(data));
  process.exit(1);
}