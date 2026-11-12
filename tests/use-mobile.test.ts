import { afterEach, expect, mock, test } from "bun:test";

let effect: (() => void | (() => void)) | undefined;
const updates: unknown[] = [];

mock.module("react", () => ({
  useState: (initial: unknown) => [initial, (value: unknown) => updates.push(value)],
  useEffect: (callback: () => void | (() => void)) => { effect = callback; },
}));

const { useIsMobile } = await import("../src/hooks/use-mobile");

afterEach(() => {
  updates.length = 0;
  effect = undefined;
  Reflect.deleteProperty(globalThis, "window");
});

test("mobile hook tracks the 768px boundary and removes its listener", () => {
  let onChange: (() => void) | undefined;
  const removeEventListener = mock(() => {});
  const matchMedia = mock(() => ({
    addEventListener: (_event: string, callback: () => void) => { onChange = callback; },
    removeEventListener,
  }));
  const browser = { innerWidth: 767, matchMedia };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });

  expect(useIsMobile()).toBe(false);
  if (!effect) throw new Error("Effect was not registered");
  const cleanup = effect();
  expect(matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  expect(updates).toEqual([true]);
  browser.innerWidth = 768;
  if (!onChange) throw new Error("Listener was not registered");
  onChange();
  expect(updates).toEqual([true, false]);
  if (typeof cleanup !== "function") throw new Error("Cleanup was not registered");
  cleanup();
  expect(removeEventListener).toHaveBeenCalledWith("change", onChange);
});