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

  it("renders bold, italic and code spans", () => {
    const { container } = render(
      <MarkdownContent source={"Now **hired** into *any* army via `**literal**`."} />,
    );

    expect(container.querySelector("strong")).toHaveTextContent("hired");
    expect(container.querySelector("em")).toHaveTextContent("any");
    expect(container.querySelector("code")).toHaveTextContent("**literal**");
    expect(container.querySelector("code strong")).toBeNull();
    expect(container.querySelector("p")).toHaveTextContent(
      "Now hired into any army via **literal**.",
    );
  });

  it("formats inside headings and list items", () => {
    const { container } = render(
      <MarkdownContent source={"## A **bold** release\n\n- An **important** item"} />,
    );

    expect(container.querySelector("h3 strong")).toHaveTextContent("bold");
    expect(container.querySelector("li strong")).toHaveTextContent("important");
  });

  it("nests other markup inside emphasis", () => {
    const { container } = render(
      <MarkdownContent source={"**Bold with a [link](https://example.com/) inside**"} />,
    );

    expect(container.querySelector("strong a")).toHaveAttribute("href", "https://example.com/");
  });

  it("nests bold text inside italic text", () => {
    const { container } = render(
      <MarkdownContent source={"*outer **inner** text*"} />,
    );

    expect(container.querySelector("em strong")).toHaveTextContent("inner");
  });

  it("leaves lone underscores and space-padded asterisks alone", () => {
    const { container } = render(
      <MarkdownContent source={"The unit_id field costs 2 * 3 points, or 4 * 5 upgraded."} />,
    );

    expect(container.querySelector("em")).toBeNull();
    expect(container.querySelector("p")).toHaveTextContent(
      "The unit_id field costs 2 * 3 points, or 4 * 5 upgraded.",
    );
  });
});
