import { load as yamlLoad } from "js-yaml";

export default function (eleventyConfig) {
  // YAML data files (_data/*.yml)
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yamlLoad(contents));

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  // Custom domain (yamada-lab.org) is set in repo Settings → Pages; no CNAME file needed with the Actions source.
  eleventyConfig.addWatchTarget("bibliography/");

  // News: newest first
  eleventyConfig.addCollection("news", (api) =>
    api.getFilteredByGlob("src/news/*.md").sort((a, b) => b.date - a.date)
  );

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  eleventyConfig.addFilter("monthYear", (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`);
  eleventyConfig.addFilter("isoDate", (d) => d.toISOString().slice(0, 10));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("current", (members) => (members || []).filter((m) => !m.alumni));
  eleventyConfig.addFilter("alumni", (members) => (members || []).filter((m) => m.alumni));
  eleventyConfig.addFilter("initials", (name = "") => {
    const w = name.split(/\s+/).filter((x) => /^[A-Za-z]/.test(x));
    return ((w[0]?.[0] || "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
  });
  const LINK_LABELS = { orcid: "ORCID", scholar: "Google Scholar", google_scholar: "Google Scholar", github: "GitHub", website: "Website" };
  eleventyConfig.addFilter("linkLabel", (k) => LINK_LABELS[k] || k);

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
