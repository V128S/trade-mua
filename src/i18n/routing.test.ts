import { describe, it, expect } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("has uk as default locale", () => {
    expect(routing.defaultLocale).toBe("uk");
  });
  it("supports uk and ru", () => {
    expect(routing.locales).toEqual(["uk", "ru"]);
  });
  it("uses as-needed prefix so default locale has no prefix", () => {
    expect(routing.localePrefix).toBe("as-needed");
  });
});
