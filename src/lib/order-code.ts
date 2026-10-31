// Wrapped in a left-to-right isolate so "#8HB3A1" doesn't render as "8HB3A1#" inside Arabic text.
export function orderCode(orderId: string) {
  return `\u2066#${orderId.slice(-6).toUpperCase()}\u2069`;
}
