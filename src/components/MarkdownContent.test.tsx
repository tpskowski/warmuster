import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarkdownContent from "./MarkdownContent";

describe("MarkdownContent", () => {
  it("renders supported Markdown blocks and links", () => {
    render(
      <MarkdownContent
        source={"## Release\n\n- First item\n- Second item\n\nVisit [Example](https://example.com/)."}
      />,
    );

    expect(screen.getByRole("heading", { name: "Release" })).toBeInTheDocument();
    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Example" })).toHaveAttribute(
      "href",
      "https://example.com/",
    );
  });
});
