import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandLogo } from "@/components/BrandLogo";
import { LoadingLogo } from "@/components/LoadingLogo";

describe("brand assets", () => {
  it("renders the real GestiOS wordmark on dark surfaces", () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandLogo, {
        href: "/dashboard",
        variant: "full",
        tone: "dashboard",
      }),
    );

    expect(html).toContain("gestios-logo-on-dark.png");
    expect(html).toContain('aria-label="GestiOS"');
  });

  it("renders the real icon in responsive mobile mode", () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandLogo, {
        variant: "responsive",
        tone: "dark",
      }),
    );

    expect(html).toContain("gestios-icon-on-dark.png");
    expect(html).toContain("gestios-logo-on-dark.png");
  });

  it("uses the branded icon while loading", () => {
    const html = renderToStaticMarkup(React.createElement(LoadingLogo));

    expect(html).toContain("gestios-icon-on-dark.png");
    expect(html).toContain("gestios-logo-on-dark.png");
  });
});
