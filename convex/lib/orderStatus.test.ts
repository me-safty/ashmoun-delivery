import { expect, test } from "vitest";
import { canCustomerCancel, canTransition } from "./orderStatus";

test("orders move forward through the delivery flow only", () => {
  expect(canTransition("created", "confirmed")).toBe(true);
  expect(canTransition("confirmed", "with_driver")).toBe(true);
  expect(canTransition("with_driver", "delivered")).toBe(true);
  expect(canTransition("with_driver", "returned")).toBe(true);
  expect(canTransition("created", "delivered")).toBe(false);
  expect(canTransition("delivered", "returned")).toBe(false);
});

test("cancel is allowed before the driver has the order", () => {
  expect(canTransition("created", "cancelled")).toBe(true);
  expect(canTransition("confirmed", "cancelled")).toBe(true);
  expect(canTransition("with_driver", "cancelled")).toBe(false);
});

test("customers can cancel only while the order is still created", () => {
  expect(canCustomerCancel("created")).toBe(true);
  expect(canCustomerCancel("confirmed")).toBe(false);
});
