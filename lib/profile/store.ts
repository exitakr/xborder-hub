"use client";

import { useCallback, useEffect, useState } from "react";

/* ──────────────── Types ──────────────── */

export type CareerStep = {
  id: string;
  country: string;
  company: string;
  industry: string;
  role: string;
  salary: string;
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  achievements: string;
  current: boolean;
};

export type Profile = {
  name: string;
  age: string;
  fromCountry: string;
  fromCity: string;
  country: string;
  city: string;
  tenure: string;
  bio: string;
  industry: string;
  role: string;
  visa: string;
  salary: string;
  techSkills: string[];
  businessSkills: string[];
  goalCountry: string;
  goalIndustry: string;
  goalRole: string;
  goalSalary: string;
  ccAvailable: boolean;
  ccTopics: string;
  career: CareerStep[];
};

// v2: key bump evicts the old demo identity ("YT さん") that v1 shipped
// as DEFAULT_PROFILE — real members start from a blank slate now.
const KEY = "xbh.profile.v2";

export const DEFAULT_PROFILE: Profile = {
  name: "",
  age: "",
  fromCountry: "",
  fromCity: "",
  country: "",
  city: "",
  tenure: "",
  bio: "",
  industry: "",
  role: "",
  visa: "",
  salary: "",
  techSkills: [],
  businessSkills: [],
  goalCountry: "",
  goalIndustry: "",
  goalRole: "",
  goalSalary: "",
  ccAvailable: true,
  ccTopics: "",
  career: [],
};

/* ──────────────── Store (localStorage + subscribers) ──────────────── */

const listeners = new Set<() => void>();
let cached: Profile | null = null;

function read(): Profile {
  if (cached) return cached;
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Profile>;
      cached = { ...DEFAULT_PROFILE, ...parsed };
      return cached;
    }
  } catch {
    // fall through to default
  }
  cached = DEFAULT_PROFILE;
  return cached;
}

function write(next: Profile) {
  cached = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // localStorage might be unavailable / full; in-memory cache still works
    }
  }
  for (const l of listeners) l();
}

/* ──────────────── React hook ──────────────── */

/**
 * Subscribes a component to the profile store. The initial render uses
 * DEFAULT_PROFILE (server + first client paint) and switches to the stored
 * value after mount, so SSR markup is stable.
 */
export function useProfile() {
  const [profile, setLocal] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    // Hydrate from localStorage after mount.
    setLocal(read());
    const onChange = () => setLocal(read());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const setProfile = useCallback(
    (updater: Profile | ((p: Profile) => Profile)) => {
      const next =
        typeof updater === "function"
          ? (updater as (p: Profile) => Profile)(read())
          : updater;
      write(next);
    },
    [],
  );

  return [profile, setProfile] as const;
}

/* ──────────────── Avatar helpers ──────────────── */

/**
 * Pull a 1–3 letter monogram out of a name, working for Japanese ("YT さん",
 * "山田 太郎"), western ("Taro Yamada"), and mixed strings.
 */
export function initials(name: string, count = 3): string {
  const cleaned = name.replace(/(さん|くん|さま|様)\s*$/, "").trim();
  if (!cleaned) return "—";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && /^[A-Za-z]/.test(words[0]!)) {
    // Western-style: take first letter of each word, up to `count`.
    return words
      .slice(0, count)
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase();
  }
  if (/^[A-Za-z]+$/.test(cleaned)) {
    return cleaned.substring(0, count).toUpperCase();
  }
  // Japanese / mixed — return up to `count` characters (handles surrogate pairs).
  return Array.from(cleaned).slice(0, count).join("");
}

/* ──────────────── Date helpers ──────────────── */

export function formatPeriod(step: CareerStep): string {
  const fromY = step.startYear?.trim();
  const fromM = step.startMonth?.trim();
  const toY = step.endYear?.trim();
  const toM = step.endMonth?.trim();
  const from = fromY ? `${fromY}${fromM ? "/" + fromM : ""}` : "";
  const to = step.current
    ? "現在"
    : toY
      ? `${toY}${toM ? "/" + toM : ""}`
      : "";
  if (!from && !to) return "—";
  return [from, to].filter(Boolean).join(" - ");
}

export const YEAR_OPTIONS: string[] = Array.from({ length: 41 }, (_, i) =>
  String(2026 - i),
);
export const MONTH_OPTIONS: string[] = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

/**
 * Companies surfaced under <datalist> in the career step form. Free text is
 * still allowed — these are just typing hints.
 */
export const COMPANY_SUGGESTIONS: string[] = [
  "Sony",
  "Sony Asia Pacific",
  "Toyota",
  "Honda",
  "Panasonic",
  "Nintendo",
  "NEC",
  "Hitachi",
  "Mitsubishi Corporation",
  "Mitsui",
  "Sumitomo Corporation",
  "Itochu",
  "Marubeni",
  "Rakuten",
  "Mercari",
  "LINE",
  "DeNA",
  "CyberAgent",
  "Recruit",
  "Smart News",
  "GREE",
  "Sansan",
  "freee",
  "MoneyForward",
  "Shopee",
  "Sea Group",
  "Grab",
  "Gojek",
  "GoTo",
  "Lazada",
  "Tokopedia",
  "TikTok",
  "ByteDance",
  "Google",
  "Meta",
  "Amazon",
  "Microsoft",
  "Apple",
  "Netflix",
  "NVIDIA",
  "Salesforce",
  "Workday",
  "Stripe",
  "Datadog",
  "Snowflake",
  "Databricks",
  "McKinsey",
  "BCG",
  "Bain",
  "Deloitte",
  "Accenture",
  "PwC",
  "EY",
  "KPMG",
  "Goldman Sachs",
  "Morgan Stanley",
  "JPMorgan",
  "UBS",
  "HSBC",
  "Citi",
  "Nomura",
  "Daiwa",
  "SMBC",
  "Mizuho",
  "MUFG",
  "P&G",
  "Unilever",
  "Nestle",
  "Kao",
  "Shiseido",
  "L'Oreal",
  "Takeda",
  "Astellas",
  "Eisai",
  "Pfizer",
];
