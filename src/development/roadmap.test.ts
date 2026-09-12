import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildChangelog } from "../../scripts/development-data";
import changes from "./changes.json";
import { filterChanges } from "./changelog";
import {
  baseline,
  filterRoadmap,
  phases,
  roadmap,
  roadmapMarkdown,
  statuses,
} from "./roadmap";

describe("public development record", () => {
  it("keeps GitHub and the site on one checklist with honest completion boundaries", () => {
    expect(readFileSync("docs/ROADMAP.md", "utf8")).toBe(roadmapMarkdown());
    expect(new Set(roadmap.map((item) => item.id)).size).toBe(roadmap.length);
    for (const item of roadmap) {
      expect(item.id).toMatch(/^[a-z][a-z0-9-]+$/);
      expect(statuses).toContain(item.status);
      expect(phases.some((phase) => phase.id === item.phase)).toBe(true);
      expect(item.current.length).toBeGreaterThan(30);
      expect(item.acceptance.length).toBeGreaterThan(30);
      expect(item.evidence.length).toBeGreaterThan(0);
      if (item.phase === "release" || item.phase === "later")
        expect(item.status).not.toBe("completed");
    }
  });

  it("binds every factual source to a real file at its advertised revision", () => {
    for (const item of roadmap) {
      for (const path of item.evidence) {
        if (item.sourceRef === "main")
          expect(existsSync(path), path).toBe(true);
        else
          expect(
            execFileSync(
              "git",
              ["cat-file", "-t", `${item.sourceRef ?? baseline}:${path}`],
              {
                encoding: "utf8",
              },
            ).trim(),
            path,
          ).toBe("blob");
      }
    }
  });

  it("combines status and text filters without mixing pending work into completed results", () => {
    expect(
      filterRoadmap("completed", "tavern").every(
        (item) => item.status === "completed",
      ),
    ).toBe(true);
    expect(filterRoadmap("pending", "TUTORIAL").map((item) => item.id)).toEqual(
      ["duel-tutorials"],
    );
    expect(filterRoadmap("all", "not-a-checkpoint")).toEqual([]);
    expect(filterRoadmap("all", " ")).toEqual(roadmap);
  });

  it("retains an exact contiguous committed history snapshot and never invents a change", () => {
    const actual = buildChangelog();
    const first = actual.findIndex((entry) => entry.sha === changes[0]?.sha);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(changes).toEqual(actual.slice(first));
    expect(filterChanges(changes, "SAVE").length).toBeGreaterThan(0);
    expect(filterChanges(changes, "no-such-change-123")).toEqual([]);
    expect(filterChanges(changes, changes[0].sha)).toEqual([changes[0]]);
  });
});
