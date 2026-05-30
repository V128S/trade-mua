import { describe, it, expect } from "vitest";
import { stripLocale, isProtectedPath } from "./auth-routing";

describe("stripLocale", () => {
  it("removes a leading /ru", () => {
    expect(stripLocale("/ru/admin")).toBe("/admin");
  });
  it("leaves non-prefixed paths unchanged", () => {
    expect(stripLocale("/admin")).toBe("/admin");
  });
  it("maps bare /ru to /", () => {
    expect(stripLocale("/ru")).toBe("/");
  });
});

describe("isProtectedPath", () => {
  it("protects dashboard, admin, checkout", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/admin/orders")).toBe(true);
    expect(isProtectedPath("/checkout")).toBe(true);
  });
  it("does not protect public paths", () => {
    expect(isProtectedPath("/products")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });
});
