import { describe, it, expect } from "vitest";
import {
  APP_SUBDOMAINS,
  appBasePath,
  hasProductSubdomain,
  isTrustedHost,
  parseHost,
  productSubdomainUrl,
  slugToSub,
  subToSlug,
} from "./subdomains";

describe("parseHost", () => {
  it("treats the apex and www as no subdomain (production)", () => {
    expect(parseHost("binarysemaphore.com")).toMatchObject({
      sub: null,
      isProd: true,
    });
    expect(parseHost("www.binarysemaphore.com")).toMatchObject({
      sub: null,
      isProd: true,
    });
  });

  it("extracts a production subdomain", () => {
    expect(parseHost("inode.binarysemaphore.com")).toMatchObject({
      sub: "inode",
      isProd: true,
    });
    expect(parseHost("resume.binarysemaphore.com")).toMatchObject({
      sub: "resume",
      isProd: true,
    });
  });

  it("supports localhost subdomains for dev (not production)", () => {
    expect(parseHost("resume.localhost:3000")).toMatchObject({
      root: "localhost",
      sub: "resume",
      isProd: false,
    });
    expect(parseHost("localhost:3000")).toMatchObject({
      sub: null,
      isProd: false,
    });
  });

  it("leaves unknown hosts (e.g. vercel previews) untouched", () => {
    expect(parseHost("something.vercel.app")).toEqual({
      root: null,
      sub: null,
      isProd: false,
    });
  });

  it("is case-insensitive and strips the port", () => {
    expect(parseHost("RESUME.BinarySemaphore.com:443")).toMatchObject({
      sub: "resume",
      isProd: true,
    });
  });
});

describe("subdomain registries", () => {
  it("maps inode showcase both ways", () => {
    expect(subToSlug.get("inode")).toBe("inode");
    expect(slugToSub.get("inode")).toBe("inode");
    expect(productSubdomainUrl("inode")).toBe("https://inode.binarysemaphore.com");
  });

  it("maps the resume app subdomain to its base path", () => {
    expect(APP_SUBDOMAINS.get("resume")).toBe("/resume");
    expect(appBasePath("resume")).toBe("/resume");
    expect(appBasePath("inode")).toBeNull();
    expect(appBasePath(null)).toBeNull();
  });

  it("keeps app and showcase subdomains disjoint", () => {
    for (const appSub of APP_SUBDOMAINS.keys()) {
      expect(subToSlug.has(appSub)).toBe(false);
    }
  });

  it("detects whether a slug has a product subdomain", () => {
    expect(hasProductSubdomain("inode")).toBe(true);
    expect(hasProductSubdomain("notchify")).toBe(false);
    expect(hasProductSubdomain(undefined)).toBe(false);
  });

  it("trusts only our own hosts (for the PDF route)", () => {
    expect(isTrustedHost("binarysemaphore.com")).toBe(true);
    expect(isTrustedHost("resume.binarysemaphore.com")).toBe(true);
    expect(isTrustedHost("resume.localhost:3000")).toBe(true);
    expect(isTrustedHost("evil.com")).toBe(false);
    expect(isTrustedHost("binarysemaphore.com.evil.com")).toBe(false);
    expect(isTrustedHost(null)).toBe(false);
  });
});
