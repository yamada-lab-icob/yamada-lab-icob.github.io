// Renders bibliography/papers.bib (Zotero → Better BibTeX export) into data for templates.
// You never edit this file for routine updates — just replace papers.bib.
import fs from "node:fs";
import path from "node:path";
import { parse } from "@retorquere/bibtex-parser";
import { load as yamlLoad } from "js-yaml";

const BIB = path.resolve("bibliography/papers.bib");
const LISTED = path.resolve("src/_data/listed_papers.yml"); // which papers to show + their type label
const PI_LAST = "Yamada";
const PI_FIRST = /^Toshimichi|^T\.?$/;

const fmtAuthor = (a) => {
  const initials = (a.firstName || "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((p) => p[0] + ".")
    .join(" ");
  const name = a.lastName ? `${a.lastName} ${initials}`.trim() : a.name || "";
  const isPI = a.lastName === PI_LAST && PI_FIRST.test(a.firstName || "");
  return { name, isPI };
};

export default function () {
  const { entries } = parse(fs.readFileSync(BIB, "utf8"), { sentenceCase: false });
  const listed = yamlLoad(fs.readFileSync(LISTED, "utf8")) || [];
  const byKey = new Map(entries.map((e) => [e.key, e]));
  for (const l of listed) if (!byKey.has(l.key)) console.warn(`[publications] "${l.key}" in listed_papers.yml is not in papers.bib`);
  const papers = listed
    .filter((l) => byKey.has(l.key))
    .map((l) => ({ e: byKey.get(l.key), kind: l.type || "" }))
    .map(({ e, kind }) => {
      const f = e.fields;
      const venue = f.journal || f.booktitle || f.publisher?.[0] || "";
      return {
        key: e.key,
        type: e.type,
        title: f.title,
        authors: (f.author || []).map(fmtAuthor),
        venue,
        year: Number(f.year) || 0,
        volume: f.volume,
        number: f.number,
        pages: f.pages,
        doi: f.doi,
        url: f.url || (f.doi ? `https://doi.org/${f.doi}` : ""),
        preprint: /biorxiv|medrxiv|arxiv|research square/i.test(venue) || e.type === "unpublished",
        kind,
        note: f.note,
      };
    })
    .sort((a, b) => b.year - a.year);

  const years = [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a);
  return {
    all: papers,
    byYear: years.map((year) => ({ year, papers: papers.filter((p) => p.year === year) })),
  };
}
