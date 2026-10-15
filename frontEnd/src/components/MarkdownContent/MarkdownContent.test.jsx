import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarkdownContent from "./MarkdownContent.jsx";

// Render the component to plain HTML so we can check the output.
const render = (markdown) =>
  renderToStaticMarkup(<MarkdownContent>{markdown}</MarkdownContent>);

describe("MarkdownContent", () => {
  describe("inline formatting", () => {
    it("should render bold, italic and inline code", () => {
      const html = render("Use **bold**, *italic* and `npm start`");
      expect(html).toContain("<strong>bold</strong>");
      expect(html).toContain("<em>italic</em>");
      expect(html).toContain("<code>npm start</code>");
    });
  });

  describe("links", () => {
    it("should render a normal https link", () => {
      const html = render("[Docs](https://react.dev)");
      expect(html).toContain('href="https://react.dev"');
      expect(html).toContain(">Docs</a>");
    });

    it("should never create a javascript: link, so XSS is blocked", () => {
      const html = render("[click me](javascript:alert(1))");
      expect(html).not.toContain("<a");
      expect(html).not.toContain('href="javascript');
    });
  });

  describe("headings", () => {
    it('should render "#" to "####" as h3 to h6, below the page title', () => {
      const html = render("# One\n## Two\n### Three\n#### Four");
      expect(html).toContain("<h3>One</h3>");
      expect(html).toContain("<h4>Two</h4>");
      expect(html).toContain("<h5>Three</h5>");
      expect(html).toContain("<h6>Four</h6>");
    });

    it("should start a new block when a heading follows a paragraph", () => {
      expect(render("Intro sentence\n## My heading\nMore text")).toBe(
        "<p>Intro sentence</p><h4>My heading</h4><p>More text</p>",
      );
    });

    it("should apply formatting inside a heading", () => {
      expect(render("## Use **bold**")).toBe(
        "<h4>Use <strong>bold</strong></h4>",
      );
    });

    it('should keep "#hashtag" without a space as normal text', () => {
      expect(render("#hashtag")).toBe("<p>#hashtag</p>");
    });
  });

  describe("blocks", () => {
    it("should render bullet and numbered lists", () => {
      expect(render("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
      expect(render("1. first\n2. second")).toContain("<ol");
      expect(render("1. first\n2. second")).toContain("<li>first</li>");
    });

    it("should render a code block without formatting what is inside it", () => {
      const html = render("```\n# not a heading\n**not bold**\n```");
      expect(html).toContain("<pre><code>");
      expect(html).toContain("# not a heading");
      expect(html).not.toContain("<h3>");
      expect(html).not.toContain("<strong>");
    });

    it("should render a quote", () => {
      expect(render("> quoted")).toContain("<blockquote");
    });
  });

  describe("safety", () => {
    it("should show raw HTML as text instead of running it", () => {
      const html = render('<img src=x onerror="alert(1)">');
      expect(html).not.toContain("<img");
      expect(html).toContain("&lt;img");
    });

    it("should render nothing for empty input", () => {
      expect(render("")).toBe("");
    });
  });
});
