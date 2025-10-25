import { Buffer } from "buffer";

// Make Buffer available globally for browser compatibility
if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (window as any).process = { env: {} };
}
