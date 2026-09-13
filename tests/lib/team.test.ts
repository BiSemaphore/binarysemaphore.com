import { describe, it, expect } from "vitest";
import type { TeamMember } from "@/lib/site";
import {
  formatEventDate,
  groupCertsByYear,
  groupEventsByYear,
  latestEvent,
  groupStints,
  memberBuilds,
  memberFacts,
  splitDegree,
} from "@/lib/team";

const base: TeamMember = { name: "A B", slug: "a-b", role: "Engineer" };

describe("memberFacts", () => {
  it("returns nothing for a sparse profile", () => {
    expect(memberFacts(base)).toEqual([]);
  });

  it("derives years, builds, companies and certifications from the data", () => {
    const member: TeamMember = {
      ...base,
      builds: ["inode", "learn", "not-a-project"],
      experience: [
        { role: "Senior", company: "X", period: "Apr 2024 - Oct 2025" },
        { role: "Junior", company: "X", period: "Apr 2023 - Apr 2024" },
        { role: "Intern", company: "Y", period: "2022" },
      ],
      certifications: [{ name: "C1" }],
    };
    expect(memberFacts(member, new Date("2026-09-13"))).toEqual([
      { value: "4+", label: "years shipping" },
      { value: "2", label: "studio builds" },
      { value: "2", label: "companies" },
      { value: "1", label: "certification" },
    ]);
  });
});

describe("memberBuilds", () => {
  it("skips slugs that do not resolve", () => {
    const names = memberBuilds({ ...base, builds: ["inode", "nope"] }).map((p) => p.name);
    expect(names).toEqual(["inode"]);
  });
});

describe("groupStints", () => {
  it("merges consecutive roles at the same company only", () => {
    const stints = groupStints([
      { role: "Dev", company: "X" },
      { role: "Senior", company: "Y" },
      { role: "Junior", company: "Y" },
      { role: "Intern", company: "X" },
    ]);
    expect(stints.map((s) => [s.company, s.roles.length])).toEqual([
      ["X", 1],
      ["Y", 2],
      ["X", 1],
    ]);
  });
});

describe("groupCertsByYear", () => {
  it("groups newest first, keeps order within a year, and puts undated last", () => {
    const groups = groupCertsByYear([
      { name: "A", year: "2022" },
      { name: "B" },
      { name: "C", year: "2025" },
      { name: "D", year: "2022" },
      { name: "E", year: "Mar 2025" },
    ]);
    expect(groups.map((g) => [g.year, g.certs.map((c) => c.name)])).toEqual([
      ["2025", ["C", "E"]],
      ["2022", ["A", "D"]],
      ["Undated", ["B"]],
    ]);
  });
});

describe("splitDegree", () => {
  it("splits a trailing abbreviation off the degree name", () => {
    expect(splitDegree("Master of Computer Applications (MCA)")).toEqual({
      short: "MCA",
      name: "Master of Computer Applications",
    });
    expect(splitDegree("BSc Physics")).toEqual({ short: null, name: "BSc Physics" });
  });
});

describe("events", () => {
  const events: TeamMember["events"] = [
    { name: "Meetups", kind: "meetup", date: "2023", until: "2026" },
    { name: "Lab", kind: "workshop", date: "2026-07-11" },
    { name: "Hack", kind: "hackathon", date: "2026-09-13" },
    { name: "Mixer", kind: "meetup", date: "2026-07" },
  ];

  it("groups by start year, newest first", () => {
    expect(groupEventsByYear(events).map((g) => [g.year, g.events.map((e) => e.name)])).toEqual([
      ["2026", ["Hack", "Lab", "Mixer"]],
      ["2023", ["Meetups"]],
    ]);
  });

  it("picks the latest event regardless of listed order", () => {
    expect(latestEvent({ ...base, events })?.name).toBe("Hack");
    expect(latestEvent(base)).toBeUndefined();
  });

  it("formats whatever precision the date has", () => {
    expect(formatEventDate({ date: "2026-09-03" })).toBe("3 Sep 2026");
    expect(formatEventDate({ date: "2026-07" })).toBe("Jul 2026");
    expect(formatEventDate({ date: "2023", until: "2026" })).toBe("2023 to 2026");
    expect(formatEventDate({ date: "2026", until: "2026" })).toBe("2026");
  });
});
