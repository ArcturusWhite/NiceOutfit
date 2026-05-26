"use client";

import {
  Archive,
  BriefcaseBusiness,
  Camera,
  Check,
  CloudRain,
  Download,
  Home,
  Luggage,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shirt,
  Sparkles,
  Trash2,
  Upload,
  Wand2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type NavView = "home" | "wardrobe" | "add" | "generate" | "saved";
type Category =
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "bags"
  | "scarves"
  | "ties"
  | "belts"
  | "jewelry"
  | "other accessories";
type Season = "spring" | "summer" | "fall" | "winter" | "all-season";
type Formality = "casual" | "smart casual" | "work" | "formal";
type StyleTag = string;
type WeatherTag = "hot" | "cold" | "rainy" | "windy" | "mild";
type Texture = "matte" | "smooth" | "ribbed" | "knit" | "structured" | "soft" | "shiny" | "flowy" | "rugged" | "lounge" | "crisp";
type Fit = "slim" | "regular" | "relaxed" | "oversized" | "tailored" | "wide-leg";
type Vibe = "casual" | "elevated casual" | "sporty" | "lounge" | "elegant" | "classic" | "streetwear" | "minimal";

type WardrobeItem = {
  id: string;
  name: string;
  category: Category;
  subcategory: string;
  mainColor: string;
  secondaryColor: string;
  material: string;
  seasons: Season[];
  texture: Texture;
  fit: Fit;
  vibe: Vibe;
  formality: Formality;
  styleTags: StyleTag[];
  weatherTags: WeatherTag[];
  notes: string;
  image: string;
  createdAt: string;
};

type OutfitContext = {
  label: string;
  occasion: string;
  weather: WeatherTag[];
  season?: Season;
  styles: StyleTag[];
  formality?: Formality;
  colors: string[];
  include: Category[];
};

type Outfit = {
  id: string;
  name: string;
  occasion: string;
  items: WardrobeItem[];
  score: number;
  reason: string;
  context: OutfitContext;
};

type SavedOutfit = Outfit & {
  savedAt: string;
};

type NiceOutfitData = {
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  customStyleTags: StyleTag[];
};

const STORAGE_KEY = "niceoutfit:data:v1";

const categories: Category[] = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "bags",
  "scarves",
  "ties",
  "belts",
  "jewelry",
  "other accessories"
];
const seasons: Season[] = ["spring", "summer", "fall", "winter", "all-season"];
const formalities: Formality[] = ["casual", "smart casual", "work", "formal"];
const defaultStyleTags: StyleTag[] = ["minimalist", "elegant", "sporty", "classic", "romantic", "relaxed", "edgy", "streetwear", "elevated casual"];
const weatherTags: WeatherTag[] = ["hot", "cold", "rainy", "windy", "mild"];
const textureOptions: Texture[] = ["matte", "smooth", "ribbed", "knit", "structured", "soft", "shiny", "flowy", "rugged", "lounge", "crisp"];
const fitOptions: Fit[] = ["slim", "regular", "relaxed", "oversized", "tailored", "wide-leg"];
const vibeOptions: Vibe[] = ["casual", "elevated casual", "sporty", "lounge", "elegant", "classic", "streetwear", "minimal"];
const colorFamilies = ["ivory", "cream", "beige", "camel", "gray", "black", "white", "navy", "denim", "rose", "brown", "olive", "burgundy"];

const emptyDraft: Omit<WardrobeItem, "id" | "createdAt"> = {
  name: "",
  category: "tops",
  subcategory: "",
  mainColor: "",
  secondaryColor: "",
  material: "",
  seasons: ["all-season"],
  texture: "smooth",
  fit: "regular",
  vibe: "classic",
  formality: "smart casual",
  styleTags: ["classic"],
  weatherTags: ["mild"],
  notes: "",
  image: ""
};

const quickContexts: OutfitContext[] = [
  {
    label: "Work",
    occasion: "work",
    weather: ["mild"],
    season: "all-season",
    styles: ["classic", "minimalist", "elegant"],
    formality: "work",
    colors: ["black", "navy", "gray", "ivory", "beige"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "belts", "jewelry"]
  },
  {
    label: "Casual",
    occasion: "casual day",
    weather: ["mild"],
    styles: ["relaxed", "classic", "sporty"],
    formality: "casual",
    colors: ["denim", "white", "gray", "beige"],
    include: ["tops", "bottoms", "dresses", "shoes", "bags", "other accessories"]
  },
  {
    label: "Formal",
    occasion: "formal event",
    weather: ["mild"],
    styles: ["elegant", "classic", "romantic"],
    formality: "formal",
    colors: ["black", "ivory", "navy", "burgundy"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "jewelry", "ties"]
  },
  {
    label: "Smart Casual",
    occasion: "smart casual plan",
    weather: ["mild"],
    styles: ["minimalist", "classic", "elegant"],
    formality: "smart casual",
    colors: ["beige", "camel", "white", "gray", "black"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "belts", "jewelry"]
  },
  {
    label: "Travel",
    occasion: "travel day",
    weather: ["mild", "windy"],
    styles: ["relaxed", "minimalist", "classic"],
    formality: "casual",
    colors: ["black", "gray", "beige", "denim"],
    include: ["tops", "bottoms", "outerwear", "shoes", "bags", "scarves"]
  },
  {
    label: "Dinner",
    occasion: "dinner",
    weather: ["mild"],
    styles: ["elegant", "romantic", "classic"],
    formality: "smart casual",
    colors: ["black", "rose", "ivory", "burgundy"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "jewelry"]
  },
  {
    label: "Parisian Winter",
    occasion: "Paris in winter",
    weather: ["cold", "windy"],
    season: "winter",
    styles: ["parisian", "elegant", "classic"],
    formality: "smart casual",
    colors: ["black", "ivory", "gray", "camel", "navy"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "scarves", "belts"]
  },
  {
    label: "Hot Weather",
    occasion: "hot weather",
    weather: ["hot"],
    season: "summer",
    styles: ["relaxed", "minimalist", "classic"],
    formality: "casual",
    colors: ["white", "ivory", "beige", "rose"],
    include: ["tops", "bottoms", "dresses", "shoes", "bags", "jewelry"]
  },
  {
    label: "Rainy Day",
    occasion: "rainy day",
    weather: ["rainy", "mild"],
    styles: ["classic", "minimalist"],
    formality: "smart casual",
    colors: ["black", "gray", "navy", "olive"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "scarves"]
  },
  {
    label: "Weekend",
    occasion: "weekend",
    weather: ["mild"],
    styles: ["relaxed", "sporty", "classic"],
    formality: "casual",
    colors: ["denim", "white", "beige", "olive"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "belts"]
  }
];

const navItems = [
  { id: "home" as NavView, label: "Home", icon: Home },
  { id: "wardrobe" as NavView, label: "Wardrobe", icon: Shirt },
  { id: "add" as NavView, label: "Add Item", icon: Plus },
  { id: "generate" as NavView, label: "Generate", icon: Wand2 },
  { id: "saved" as NavView, label: "Saved", icon: Archive }
];

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const titleCase = (value: string) => value.replace(/\b\w/g, (letter) => letter.toUpperCase());
const overlaps = <T,>(a: T[], b: T[]) => a.some((item) => b.includes(item));
const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
const fallbackData: NiceOutfitData = { wardrobe: [], savedOutfits: [], customStyleTags: [] };
const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
};

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter((entry) => entry !== undefined && entry !== null) as T[]) : [];
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  const normalized = normalize(value);
  return options.includes(normalized as T) ? (normalized as T) : fallback;
}

function normalizeSeasons(value: unknown): Season[] {
  const raw = Array.isArray(value) ? value : value ? [value] : ["all-season"];
  const selected = raw
    .map((entry) => normalize(entry))
    .filter((entry): entry is Season => seasons.includes(entry as Season));
  return selected.length ? [...new Set(selected)] : ["all-season"];
}

function normalizeStyleList(value: unknown): StyleTag[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const selected = raw
    .map((entry) => normalize(entry))
    .filter(Boolean);
  return selected.length ? [...new Set(selected)] : ["classic"];
}

function normalizeWeatherList(value: unknown): WeatherTag[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const selected = raw
    .map((entry) => normalize(entry))
    .filter((entry): entry is WeatherTag => weatherTags.includes(entry as WeatherTag));
  return selected.length ? [...new Set(selected)] : ["mild"];
}

function normalizeContext(raw: unknown): OutfitContext {
  const source = raw && typeof raw === "object" ? (raw as Partial<OutfitContext>) : {};
  const weather = normalizeWeatherList(source.weather);
  const colors = safeArray<unknown>(source.colors).map((entry) => normalize(entry)).filter(Boolean);
  const include = safeArray<unknown>(source.include).filter((entry): entry is Category => categories.includes(entry as Category));
  return {
    label: safeString(source.label, "Custom"),
    occasion: safeString(source.occasion, "saved outfit"),
    weather,
    season: seasons.includes(normalize(source.season) as Season) ? (normalize(source.season) as Season) : undefined,
    styles: normalizeStyleList(source.styles),
    formality: formalities.includes(normalize(source.formality) as Formality) ? (normalize(source.formality) as Formality) : undefined,
    colors: colors.length ? colors : ["ivory", "beige", "black", "gray"],
    include: include.length ? include : categories
  };
}

function normalizeWardrobeItem(raw: unknown, index = 0): WardrobeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Partial<WardrobeItem> & { season?: Season; fabric?: string };
  return {
    id: safeString(source.id, `imported-${index}-${uid()}`),
    name: safeString(source.name, "Untitled item"),
    category: oneOf(source.category, categories, "other accessories"),
    subcategory: safeString(source.subcategory),
    mainColor: safeString(source.mainColor, "neutral"),
    secondaryColor: safeString(source.secondaryColor),
    material: safeString(source.material || source.fabric),
    seasons: normalizeSeasons(source.seasons || source.season),
    texture: oneOf(source.texture, textureOptions, "smooth"),
    fit: oneOf(source.fit, fitOptions, "regular"),
    vibe: oneOf(source.vibe, vibeOptions, "classic"),
    formality: oneOf(source.formality, formalities, "smart casual"),
    styleTags: normalizeStyleList(source.styleTags),
    weatherTags: normalizeWeatherList(source.weatherTags),
    notes: safeString(source.notes),
    image: safeString(source.image),
    createdAt: safeString(source.createdAt, new Date().toISOString())
  };
}

function normalizeSavedOutfit(raw: unknown, index = 0): SavedOutfit | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Partial<SavedOutfit>;
  const items = safeArray<unknown>(source.items)
    .map((item, itemIndex) => normalizeWardrobeItem(item, itemIndex))
    .filter((item): item is WardrobeItem => Boolean(item));
  return {
    id: safeString(source.id, `saved-${index}-${uid()}`),
    name: safeString(source.name, "Saved Outfit"),
    occasion: safeString(source.occasion, "saved outfit"),
    items,
    score: typeof source.score === "number" && Number.isFinite(source.score) ? source.score : 0,
    reason: safeString(source.reason, "Saved from a previous NiceOutfit version."),
    context: normalizeContext(source.context),
    savedAt: safeString(source.savedAt, new Date().toISOString())
  };
}

function readStoredData(): NiceOutfitData {
  if (typeof window === "undefined") return fallbackData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackData;
    const parsed = JSON.parse(raw) as Partial<NiceOutfitData>;
    const wardrobe = safeArray<unknown>(parsed.wardrobe)
      .map((item, index) => normalizeWardrobeItem(item, index))
      .filter((item): item is WardrobeItem => Boolean(item));
    const savedOutfits = safeArray<unknown>(parsed.savedOutfits)
      .map((outfit, index) => normalizeSavedOutfit(outfit, index))
      .filter((outfit): outfit is SavedOutfit => Boolean(outfit));
    const assignedTags = wardrobe.flatMap((item) => item.styleTags);
    const customStyleTags = safeArray<unknown>(parsed.customStyleTags)
      .map((entry) => normalize(entry))
      .filter((entry) => entry && !defaultStyleTags.includes(entry));
    return {
      wardrobe,
      savedOutfits,
      customStyleTags: [...new Set([...customStyleTags, ...assignedTags.filter((tag) => !defaultStyleTags.includes(tag) && tag !== "parisian")])]
    };
  } catch {
    return fallbackData;
  }
}

function parseSituation(input: string): OutfitContext {
  const text = normalize(input);
  const base: OutfitContext = {
    label: input.trim() || "Custom",
    occasion: "custom plan",
    weather: ["mild"],
    styles: ["classic"],
    colors: ["ivory", "beige", "black", "gray"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "jewelry", "scarves", "belts", "ties"]
  };

  if (text.includes("paris")) {
    base.styles = ["parisian", "elegant", "classic"];
    base.colors = ["black", "ivory", "gray", "camel", "navy"];
    base.occasion = "Paris plan";
    base.include = [...new Set([...base.include, "scarves" as Category, "outerwear" as Category])];
  }
  if (text.includes("winter") || text.includes("cold")) {
    base.season = "winter";
    base.weather = ["cold", "windy"];
    base.include = [...new Set([...base.include, "outerwear" as Category, "scarves" as Category])];
  }
  if (text.includes("summer") || text.includes("hot") || text.includes("beach")) {
    base.season = "summer";
    base.weather = ["hot"];
    base.styles = [...new Set([...base.styles, "relaxed" as StyleTag, "minimalist" as StyleTag])];
    base.colors = ["white", "ivory", "beige", "rose"];
  }
  if (text.includes("rain")) {
    base.weather = ["rainy", "mild"];
    base.include = [...new Set([...base.include, "outerwear" as Category])];
  }
  if (text.includes("wind")) base.weather = [...new Set([...base.weather, "windy" as WeatherTag])];
  if (text.includes("work") || text.includes("office")) {
    base.formality = "work";
    base.occasion = "work";
    base.styles = [...new Set([...base.styles, "minimalist" as StyleTag, "classic" as StyleTag])];
  }
  if (text.includes("formal") || text.includes("wedding") || text.includes("gala")) {
    base.formality = "formal";
    base.occasion = "formal event";
    base.styles = [...new Set([...base.styles, "elegant" as StyleTag])];
  }
  if (text.includes("casual")) base.formality = "casual";
  if (text.includes("smart")) base.formality = "smart casual";
  if (text.includes("dinner") || text.includes("date")) {
    base.occasion = "dinner";
    base.formality = base.formality ?? "smart casual";
    base.styles = [...new Set([...base.styles, "elegant" as StyleTag, "romantic" as StyleTag])];
    base.colors = [...new Set(["black", "rose", "ivory", "burgundy", ...base.colors])];
  }
  if (text.includes("travel") || text.includes("flight")) {
    base.occasion = "travel";
    base.formality = "casual";
    base.styles = [...new Set([...base.styles, "relaxed" as StyleTag])];
    base.include = [...new Set([...base.include, "bags" as Category])];
  }
  if (text.includes("weekend")) {
    base.occasion = "weekend";
    base.formality = "casual";
    base.styles = [...new Set([...base.styles, "relaxed" as StyleTag])];
  }

  defaultStyleTags.forEach((tag) => {
    if (text.includes(tag)) base.styles = [...new Set([...base.styles, tag])];
  });

  return base;
}

function colorScore(item: WardrobeItem, context: OutfitContext) {
  const itemColors = [item.mainColor, item.secondaryColor].map(normalize).filter(Boolean);
  if (itemColors.some((color) => context.colors.some((target) => color.includes(target) || target.includes(color)))) return 18;
  if (itemColors.some((color) => ["black", "white", "ivory", "cream", "beige", "gray", "navy"].includes(color))) return 12;
  return 6;
}

function materialHarmonyScore(items: WardrobeItem[]) {
  const safeItems = Array.isArray(items) ? items : [];
  const materials = safeItems.map((item) => normalize(item.material));
  const has = (term: string) => materials.some((material) => material.includes(term));
  let score = 0;
  if (has("cotton") && has("linen")) score += 8;
  if (has("cotton") && has("knit")) score += 7;
  if (has("wool") && has("leather")) score += 8;
  if (has("denim") && has("cotton")) score += 7;
  if (has("linen") && has("cotton")) score += 6;
  if ((has("wool") || has("heavy")) && safeItems.some((item) => normalizeWeatherList(item.weatherTags).includes("hot"))) score -= 10;
  if (has("synthetic") || has("polyester")) {
    if (safeItems.some((item) => item.vibe === "elegant" && item.formality === "formal")) score -= 6;
  }
  return score;
}

function textureHarmonyScore(items: WardrobeItem[]) {
  const safeItems = Array.isArray(items) ? items : [];
  const textures = safeItems.map((item) => item.texture);
  const has = (texture: Texture) => textures.includes(texture);
  let score = 0;
  if (has("knit") && (has("soft") || safeItems.some((item) => item.fit === "relaxed"))) score += 8;
  if (has("structured") && safeItems.some((item) => item.fit === "tailored")) score += 9;
  if (has("crisp") && (has("smooth") || has("structured"))) score += 7;
  if (has("flowy") && safeItems.some((item) => item.vibe === "elegant" || normalizeStyleList(item.styleTags).includes("romantic"))) score += 7;
  if (has("lounge") && has("shiny")) score -= 10;
  if (has("rugged") && has("flowy") && !safeItems.some((item) => item.vibe === "streetwear" || normalizeStyleList(item.styleTags).includes("edgy"))) score -= 7;
  return score;
}

function vibeHarmonyScore(items: WardrobeItem[], context: OutfitContext) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeContext = normalizeContext(context);
  const vibes = safeItems.map((item) => item.vibe);
  let score = 0;
  if (vibes.some((vibe) => safeContext.styles.includes(vibe))) score += 8;
  if (vibes.every((vibe) => ["classic", "minimal", "elegant", "elevated casual"].includes(vibe))) score += 6;
  if (vibes.every((vibe) => ["casual", "elevated casual", "classic", "minimal", "lounge"].includes(vibe))) score += 5;
  if (vibes.includes("lounge") && safeItems.some((item) => item.formality === "formal" || item.fit === "tailored")) score -= 10;
  if (vibes.includes("sporty") && vibes.includes("elegant") && safeContext.formality === "formal") score -= 8;
  return score;
}

function itemFitScore(item: WardrobeItem, context: OutfitContext) {
  const safeItem = normalizeWardrobeItem(item) ?? normalizeWardrobeItem({}, 0);
  const safeContext = normalizeContext(context);
  if (!safeItem) return 0;
  let score = 0;
  score += colorScore(safeItem, safeContext);
  if (safeContext.season && (safeItem.seasons.includes(safeContext.season) || safeItem.seasons.includes("all-season"))) score += 18;
  if (!safeContext.season || safeItem.seasons.includes("all-season")) score += 7;
  if (safeContext.formality && safeItem.formality === safeContext.formality) score += 18;
  if (safeContext.formality === "smart casual" && ["casual", "work"].includes(safeItem.formality)) score += 8;
  if (!safeContext.formality) score += 8;
  if (overlaps(safeItem.weatherTags, safeContext.weather)) score += 18;
  if (overlaps(safeItem.styleTags, safeContext.styles)) score += 18;
  if (safeContext.styles.includes(safeItem.vibe)) score += 10;
  if (safeItem.texture === "structured" && ["work", "formal"].includes(safeContext.formality ?? "")) score += 6;
  if (safeItem.texture === "lounge" && ["work", "formal"].includes(safeContext.formality ?? "")) score -= 8;
  if (safeContext.weather.includes("hot") && ["knit", "rugged", "structured"].includes(safeItem.texture)) score -= 6;
  if (safeContext.weather.includes("cold") && ["knit", "soft", "structured"].includes(safeItem.texture)) score += 6;
  if (safeContext.include.includes(safeItem.category)) score += 8;
  return score;
}

function buildOutfitReason(outfit: WardrobeItem[], context: OutfitContext, score: number) {
  const safeOutfit = safeArray<unknown>(outfit)
    .map((item, index) => normalizeWardrobeItem(item, index))
    .filter((item): item is WardrobeItem => Boolean(item));
  const safeContext = normalizeContext(context);
  const names = safeOutfit.map((item) => item.name).join(", ");
  const style = safeContext.styles.slice(0, 2).join(" and ");
  const weather = safeContext.weather.join(", ");
  const materials = [...new Set(safeOutfit.map((item) => normalize(item.material)).filter(Boolean))].slice(0, 2);
  const textures = [...new Set(safeOutfit.map((item) => item.texture).filter(Boolean))].slice(0, 2);
  const vibes = [...new Set(safeOutfit.map((item) => item.vibe).filter(Boolean))].slice(0, 2);
  const textureLine = textures.length ? ` Texture-wise, ${textures.join(" and ")} pieces support a ${vibes.join(" and ") || style || "balanced"} vibe.` : "";
  const materialLine = materials.length ? ` ${materials.join(" and ")} materials help the outfit feel coherent.` : "";
  return `${names || "These pieces"} balance ${style || "classic"} styling with ${weather || "mild"} conditions.${textureLine}${materialLine} The ${score}% score reflects color, season, weather, formality, texture, vibe, and completeness.`;
}

function generateOutfits(wardrobe: WardrobeItem[], context: OutfitContext, limit = 4): Outfit[] {
  const safeWardrobe = safeArray<unknown>(wardrobe)
    .map((item, index) => normalizeWardrobeItem(item, index))
    .filter((item): item is WardrobeItem => Boolean(item));
  const safeContext = normalizeContext(context);
  if (!safeWardrobe.length) return [];

  const byCategory = (category: Category) =>
    safeWardrobe
      .filter((item) => item.category === category)
      .sort((a, b) => itemFitScore(b, safeContext) - itemFitScore(a, safeContext));

  const groups = {
    tops: byCategory("tops"),
    bottoms: byCategory("bottoms"),
    dresses: byCategory("dresses"),
    outerwear: byCategory("outerwear"),
    shoes: byCategory("shoes"),
    bags: byCategory("bags"),
    scarves: byCategory("scarves"),
    ties: byCategory("ties"),
    belts: byCategory("belts"),
    jewelry: byCategory("jewelry"),
    other: byCategory("other accessories")
  };

  const accessoryPool = [...groups.scarves, ...groups.ties, ...groups.belts, ...groups.jewelry, ...groups.bags, ...groups.other].sort(
    (a, b) => itemFitScore(b, safeContext) - itemFitScore(a, safeContext)
  );

  const combinations: WardrobeItem[][] = [];
  const seeds = Math.max(limit, 4);
  for (let i = 0; i < seeds; i += 1) {
    const outfit: WardrobeItem[] = [];
    const useDress = groups.dresses[i % Math.max(groups.dresses.length, 1)] && (!groups.tops.length || i % 3 === 0);
    const dress = groups.dresses[i % Math.max(groups.dresses.length, 1)];
    const top = groups.tops[i % Math.max(groups.tops.length, 1)];
    const bottom = groups.bottoms[(i + 1) % Math.max(groups.bottoms.length, 1)];

    if (useDress && dress) outfit.push(dress);
    if (!useDress && top) outfit.push(top);
    if (!useDress && bottom) outfit.push(bottom);

    const needsOuterwear = safeContext.weather.includes("cold") || safeContext.weather.includes("rainy") || safeContext.season === "winter";
    const outerwear = groups.outerwear[i % Math.max(groups.outerwear.length, 1)];
    if (outerwear && (needsOuterwear || itemFitScore(outerwear, safeContext) > 60)) outfit.push(outerwear);

    const shoes = groups.shoes[i % Math.max(groups.shoes.length, 1)];
    if (shoes) outfit.push(shoes);

    const bag = groups.bags[i % Math.max(groups.bags.length, 1)];
    if (bag && (safeContext.include.includes("bags") || safeContext.occasion.includes("travel") || i % 2 === 0)) outfit.push(bag);

    const accessory = accessoryPool[(i + 1) % Math.max(accessoryPool.length, 1)];
    if (accessory && !outfit.some((item) => item.id === accessory.id)) outfit.push(accessory);

    const unique = outfit.filter((item, index, arr) => arr.findIndex((match) => match.id === item.id) === index);
    if (unique.length) combinations.push(unique);
  }

  const scored = combinations.map((items, index) => {
    const itemAverage = items.reduce((sum, item) => sum + itemFitScore(item, safeContext), 0) / items.length;
    const hasBase = items.some((item) => item.category === "dresses") || (items.some((item) => item.category === "tops") && items.some((item) => item.category === "bottoms"));
    const hasShoes = items.some((item) => item.category === "shoes");
    const hasLayer = items.some((item) => item.category === "outerwear");
    const hasAccessory = items.some((item) => !["tops", "bottoms", "dresses", "outerwear", "shoes"].includes(item.category));
    const completeness = (hasBase ? 18 : 4) + (hasShoes ? 12 : 0) + (hasAccessory ? 8 : 0) + (hasLayer ? 6 : 0);
    const harmony = materialHarmonyScore(items) + textureHarmonyScore(items) + vibeHarmonyScore(items, safeContext);
    const score = Math.max(1, Math.min(99, Math.round(itemAverage * 0.64 + completeness + harmony)));
    return {
      id: uid(),
      name: `${safeContext.label} Look ${index + 1}`,
      occasion: safeContext.occasion,
      items,
      score,
      reason: buildOutfitReason(items, safeContext, score),
      context: safeContext
    };
  });

  const deduped = scored.filter((outfit, index, arr) => {
    const signature = outfit.items.map((item) => item.id).sort().join("-");
    return arr.findIndex((match) => match.items.map((item) => item.id).sort().join("-") === signature) === index;
  });

  return deduped.sort((a, b) => b.score - a.score).slice(0, limit);
}

export default function NiceOutfitApp() {
  const [view, setView] = useState<NavView>("home");
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [generated, setGenerated] = useState<Outfit[]>([]);
  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");
  const [customStyleTags, setCustomStyleTags] = useState<StyleTag[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = readStoredData();
    setWardrobe(stored.wardrobe);
    setSavedOutfits(stored.savedOutfits);
    setCustomStyleTags(stored.customStyleTags);
    setHydrated(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wardrobe, savedOutfits, customStyleTags }));
    } catch {
      undefined;
    }
  }, [wardrobe, savedOutfits, customStyleTags, hydrated]);

  const filteredWardrobe = useMemo(
    () => (activeFilter === "all" ? wardrobe : wardrobe.filter((item) => item.category === activeFilter)),
    [activeFilter, wardrobe]
  );

  const featured = useMemo(() => generateOutfits(wardrobe, quickContexts[0], 1)[0], [wardrobe]);
  const selectableStyleTags = useMemo(() => [...new Set([...defaultStyleTags, ...customStyleTags])], [customStyleTags]);

  const updateDraft = (field: keyof typeof emptyDraft, value: string | string[]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      event.target.value = "";
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;
        setDraft((current) => ({ ...current, image: reader.result }));
        setStep(2);
      };
      reader.onerror = () => {
        alert("NiceOutfit could not read that image. Please try another photo.");
        event.target.value = "";
      };
      reader.readAsDataURL(file);
    } catch {
      alert("NiceOutfit could not open that image on this device.");
      event.target.value = "";
    }
  };

  const saveItem = () => {
    if (!draft.image || !draft.name.trim()) return;
    const item: WardrobeItem = {
      ...draft,
      id: uid(),
      name: draft.name.trim(),
      subcategory: draft.subcategory.trim(),
      mainColor: draft.mainColor.trim() || "neutral",
      material: draft.material.trim(),
      seasons: draft.seasons.length ? draft.seasons : ["all-season"],
      texture: draft.texture,
      fit: draft.fit,
      vibe: draft.vibe,
      createdAt: new Date().toISOString()
    };
    setWardrobe((items) => [item, ...items]);
    setDraft(emptyDraft);
    setStep(1);
    setView("wardrobe");
  };

  const runRecommendation = (context: OutfitContext) => {
    setGenerated(generateOutfits(wardrobe, context));
    setView("generate");
  };

  const saveOutfit = (outfit: Outfit) => {
    if (savedOutfits.some((saved) => saved.id === outfit.id)) return;
    setSavedOutfits((items) => [{ ...outfit, savedAt: new Date().toISOString() }, ...items]);
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ wardrobe, savedOutfits, customStyleTags }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `niceoutfit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = "";
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        const data = {
          wardrobe: safeArray<unknown>((raw as Partial<NiceOutfitData>)?.wardrobe)
            .map((item, index) => normalizeWardrobeItem(item, index))
            .filter((item): item is WardrobeItem => Boolean(item)),
          savedOutfits: safeArray<unknown>((raw as Partial<NiceOutfitData>)?.savedOutfits)
            .map((outfit, index) => normalizeSavedOutfit(outfit, index))
            .filter((outfit): outfit is SavedOutfit => Boolean(outfit)),
          customStyleTags: safeArray<unknown>((raw as Partial<NiceOutfitData>)?.customStyleTags)
            .map((entry) => normalize(entry))
            .filter((entry) => entry && !defaultStyleTags.includes(entry))
        };
        const assignedTags = data.wardrobe.flatMap((item) => item.styleTags).filter((tag) => !defaultStyleTags.includes(tag) && tag !== "parisian");
        setWardrobe(data.wardrobe);
        setSavedOutfits(data.savedOutfits);
        setCustomStyleTags([...new Set([...data.customStyleTags, ...assignedTags])]);
      } catch {
        alert("This does not look like a NiceOutfit backup.");
      }
      };
      reader.onerror = () => {
        alert("NiceOutfit could not read that backup file.");
        event.target.value = "";
      };
      reader.readAsText(file);
      event.target.value = "";
    } catch {
      alert("NiceOutfit could not open that backup file.");
      event.target.value = "";
    }
  };

  const resetData = () => {
    if (!confirm("Reset all NiceOutfit data on this device?")) return;
    setWardrobe([]);
    setSavedOutfits([]);
    setCustomStyleTags([]);
    setGenerated([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      undefined;
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col pb-28 text-ink">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-ivory/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-3" onClick={() => setView("home")} aria-label="Go home">
            <span className="grid size-11 place-items-center rounded-full bg-ink text-ivory shadow-soft">
              <Shirt size={21} />
            </span>
            <span>
              <span className="block font-serif text-3xl font-semibold leading-7">NiceOutfit</span>
              <span className="block text-xs uppercase tracking-[0.22em] text-ink/50">Digital Wardrobe</span>
            </span>
          </button>
          <button
            onClick={() => setView("generate")}
            className="grid size-11 place-items-center rounded-full bg-rose text-white shadow-soft"
            aria-label="Generate outfit"
          >
            <Sparkles size={20} />
          </button>
        </div>
      </header>

      <section className="flex-1 px-5 py-6">
        {view === "home" && (
          <div className="space-y-6">
            <section className="rounded-[2rem] bg-porcelain p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-rose">Good style starts here</p>
              <h1 className="mt-3 font-serif text-5xl font-semibold leading-none">Hello, your closet is ready.</h1>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Stat label="Wardrobe items" value={wardrobe.length} />
                <Stat label="Saved outfits" value={savedOutfits.length} />
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
              <ActionButton icon={Plus} label="Add Item" onClick={() => setView("add")} />
              <ActionButton icon={Wand2} label="Generate" onClick={() => setView("generate")} />
              <ActionButton icon={Download} label="Backup" onClick={exportBackup} />
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-3xl font-semibold">Featured Recommendation</h2>
                <button className="text-sm font-semibold text-rose" onClick={() => runRecommendation(quickContexts[0])}>
                  Refresh
                </button>
              </div>
              {featured ? (
                <OutfitCard outfit={featured} onSave={saveOutfit} saved={savedOutfits.some((item) => item.id === featured.id)} />
              ) : (
                <EmptyState title="Build your first outfit" body="Add a few pieces, then NiceOutfit can suggest looks from what you already own." action="Add an item" onClick={() => setView("add")} />
              )}
            </section>

            <section>
              <h2 className="mb-3 font-serif text-3xl font-semibold">Recent Wardrobe</h2>
              {wardrobe.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {wardrobe.slice(0, 4).map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <OnboardingTips />
              )}
            </section>
          </div>
        )}

        {view === "wardrobe" && (
          <div className="space-y-5">
            <PageTitle eyebrow="Closet" title="Wardrobe" />
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(["all", ...categories] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    activeFilter === category ? "bg-ink text-ivory" : "bg-white text-ink shadow-sm"
                  }`}
                >
                  {titleCase(category)}
                </button>
              ))}
            </div>
            {filteredWardrobe.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {filteredWardrobe.map((item) => (
                  <ItemCard key={item.id} item={item} onDelete={() => setWardrobe((items) => items.filter((entry) => entry.id !== item.id))} />
                ))}
              </div>
            ) : (
              <EmptyState title="No pieces here yet" body="Upload clothing and accessories to create a clean, searchable catalog." action="Add item" onClick={() => setView("add")} />
            )}
          </div>
        )}

        {view === "add" && (
          <div className="space-y-5">
            <PageTitle eyebrow={`Step ${step} of 4`} title="Add Item" />
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <section className="rounded-[1.5rem] bg-porcelain p-4 shadow-soft">
                <CatalogPreview image={draft.image} name={draft.name || "New wardrobe item"} />
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 font-semibold text-ivory">
                  <Camera size={18} />
                  Upload or Take Photo
                  <input className="sr-only" type="file" accept="image/*" onChange={handleImage} />
                </label>
                <p className="mt-3 text-center text-sm text-ink/55">Photos are kept on this device and styled into a consistent catalog card.</p>
              </section>

              <section className="rounded-[1.5rem] bg-white p-5 shadow-soft">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" value={draft.name} onChange={(value) => updateDraft("name", value)} placeholder="Ivory silk blouse" />
                  <SelectField label="Category" value={draft.category} options={categories} onChange={(value) => updateDraft("category", value as Category)} />
                  <Field label="Subcategory" value={draft.subcategory} onChange={(value) => updateDraft("subcategory", value)} placeholder="button-down, loafers" />
                  <Field label="Main color" value={draft.mainColor} onChange={(value) => updateDraft("mainColor", value)} placeholder="black, camel, rose" datalist={colorFamilies} />
                  <Field label="Secondary color" value={draft.secondaryColor} onChange={(value) => updateDraft("secondaryColor", value)} placeholder="optional" datalist={colorFamilies} />
                  <Field label="Fabric / material" value={draft.material} onChange={(value) => updateDraft("material", value)} placeholder="cotton, wool, leather" />
                  <SelectField label="Texture / Finish" value={draft.texture} options={textureOptions} onChange={(value) => updateDraft("texture", value as Texture)} />
                  <SelectField label="Fit / Shape" value={draft.fit} options={fitOptions} onChange={(value) => updateDraft("fit", value as Fit)} />
                  <SelectField label="Vibe" value={draft.vibe} options={vibeOptions} onChange={(value) => updateDraft("vibe", value as Vibe)} />
                  <SelectField label="Formality" value={draft.formality} options={formalities} onChange={(value) => updateDraft("formality", value as Formality)} />
                </div>
                <TagPicker label="Seasons" values={seasons} selected={draft.seasons} onChange={(values) => updateDraft("seasons", values.length ? values : ["all-season"])} />
                <StyleTagManager
                  values={selectableStyleTags}
                  customValues={customStyleTags}
                  selected={draft.styleTags}
                  onChange={(values) => updateDraft("styleTags", values)}
                  onAdd={(tag) => setCustomStyleTags((tags) => [...new Set([...tags, tag])])}
                  onDelete={(tag) => setCustomStyleTags((tags) => tags.filter((entry) => entry !== tag))}
                />
                <TagPicker label="Weather tags" values={weatherTags} selected={draft.weatherTags} onChange={(values) => updateDraft("weatherTags", values)} />
                <label className="mt-4 block text-sm font-semibold text-ink/70">
                  Notes
                  <textarea
                    value={draft.notes}
                    onChange={(event) => updateDraft("notes", event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-ivory/60 px-4 py-3 outline-none focus:border-rose"
                    placeholder="Fit, styling ideas, care notes"
                  />
                </label>
                <button
                  onClick={saveItem}
                  disabled={!draft.image || !draft.name.trim()}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-rose px-5 py-3 font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:bg-taupe"
                >
                  <Check size={18} />
                  Save Item
                </button>
              </section>
            </div>
          </div>
        )}

        {view === "generate" && (
          <div className="space-y-5">
            <PageTitle eyebrow="Stylist" title="Generate Outfit" />
            <section className="rounded-[1.5rem] bg-porcelain p-5 shadow-soft">
              <h2 className="font-serif text-3xl font-semibold">Quick Recommendations</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {quickContexts.map((context) => (
                  <button
                    key={context.label}
                    onClick={() => runRecommendation(context)}
                    className="rounded-2xl bg-white px-3 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    {context.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] bg-white p-5 shadow-soft">
              <label className="block text-sm font-semibold text-ink/70">Describe your situation...</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="I'm going to Paris in winter"
                  className="min-w-0 flex-1 rounded-full border border-black/10 bg-ivory/70 px-4 py-3 outline-none focus:border-rose"
                />
                <button
                  onClick={() => runRecommendation(parseSituation(query))}
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-ivory"
                  aria-label="Generate custom outfit"
                >
                  <Search size={19} />
                </button>
              </div>
            </section>

            <section className="space-y-4">
              {generated.length ? (
                generated.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} onSave={saveOutfit} saved={savedOutfits.some((item) => item.id === outfit.id)} />
                ))
              ) : (
                <EmptyState title="Ready when your wardrobe is" body="Choose a quick idea or describe the plan. NiceOutfit will infer weather, formality, season, and style from local rules." action="Try Work" onClick={() => runRecommendation(quickContexts[0])} />
              )}
            </section>
          </div>
        )}

        {view === "saved" && (
          <div className="space-y-5">
            <PageTitle eyebrow="Archive" title="Saved Outfits" />
            <section className="grid gap-3 sm:grid-cols-3">
              <ActionButton icon={Upload} label="Import JSON" onClick={() => importRef.current?.click()} />
              <ActionButton icon={Download} label="Export JSON" onClick={exportBackup} />
              <ActionButton icon={Trash2} label="Reset Data" onClick={resetData} />
              <input ref={importRef} className="hidden" type="file" accept="application/json" onChange={importBackup} />
            </section>
            {savedOutfits.length ? (
              <div className="space-y-4">
                {savedOutfits.map((outfit) => (
                  <OutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    saved
                    savedAt={outfit.savedAt}
                    onDelete={() => setSavedOutfits((items) => items.filter((item) => item.id !== outfit.id))}
                    onRegenerate={() => runRecommendation(outfit.context)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No saved outfits yet" body="Generated outfits stay temporary until you choose Save Outfit." action="Generate" onClick={() => setView("generate")} />
            )}
          </div>
        )}
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-6xl border-t border-black/5 bg-porcelain/95 px-2 pb-3 pt-2 shadow-[0_-12px_35px_rgba(32,29,27,0.08)] backdrop-blur">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold ${
                view === id ? "bg-ink text-ivory" : "text-ink/60"
              }`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function PageTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.24em] text-rose">{eyebrow}</p>
      <h1 className="font-serif text-5xl font-semibold leading-tight">{title}</h1>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="font-serif text-4xl font-semibold">{value}</p>
      <p className="text-sm text-ink/55">{label}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 font-semibold shadow-soft">
      <Icon size={18} />
      {label}
    </button>
  );
}

function CatalogPreview({ image, name }: { image?: string; name: string }) {
  const hasImage = typeof image === "string" && image.length > 0;
  return (
    <div className="catalog-image aspect-square overflow-hidden rounded-[1.25rem] p-5 shadow-inner">
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="h-full w-full object-contain drop-shadow-[0_20px_28px_rgba(32,29,27,0.14)]" />
      ) : (
        <div className="grid h-full place-items-center rounded-2xl border border-dashed border-taupe/70 text-center text-ink/45">
          <div>
            <Camera className="mx-auto mb-3" size={34} />
            <p className="font-semibold">Photo preview</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, onDelete }: { item: WardrobeItem; onDelete?: () => void }) {
  const safeItem = normalizeWardrobeItem(item) ?? normalizeWardrobeItem({}, 0);
  if (!safeItem) return null;
  return (
    <article className="rounded-[1.35rem] bg-white p-3 shadow-soft">
      <CatalogPreview image={safeItem.image} name={safeItem.name || "Wardrobe item"} />
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">{safeItem.name}</h3>
            <p className="text-sm text-ink/55">{titleCase(safeItem.category)}</p>
          </div>
          {onDelete && (
            <button onClick={onDelete} className="grid size-8 shrink-0 place-items-center rounded-full bg-ivory text-ink/60" aria-label={`Delete ${safeItem.name}`}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {[safeItem.mainColor, safeItem.formality, safeItem.seasons.join(" + "), safeItem.texture, safeItem.vibe].filter(Boolean).map((tag) => (
            <span key={tag} className="rounded-full bg-ivory px-2 py-1 text-[11px] font-semibold text-ink/60">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function OutfitCard({
  outfit,
  onSave,
  saved,
  savedAt,
  onDelete,
  onRegenerate
}: {
  outfit: Outfit;
  onSave?: (outfit: Outfit) => void;
  saved?: boolean;
  savedAt?: string;
  onDelete?: () => void;
  onRegenerate?: () => void;
}) {
  const safeItems = safeArray<unknown>(outfit.items)
    .map((item, index) => normalizeWardrobeItem(item, index))
    .filter((item): item is WardrobeItem => Boolean(item));
  const savedDate = formatDate(savedAt);
  return (
    <article className="rounded-[1.5rem] bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-rose">{outfit.occasion || "outfit"}</p>
          <h3 className="font-serif text-3xl font-semibold">{outfit.name || "Outfit"}</h3>
          {savedDate && <p className="text-sm text-ink/50">Saved {savedDate}</p>}
        </div>
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-ivory text-center">
          <span className="font-serif text-2xl font-semibold">{Number.isFinite(outfit.score) ? outfit.score : 0}</span>
          <span className="-mt-5 text-[10px] font-bold uppercase text-ink/45">score</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {safeItems.map((item) => (
          <div key={item.id}>
            <CatalogPreview image={item.image} name={item.name || "Outfit item"} />
            <p className="mt-1 truncate text-xs font-semibold">{item.name}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-ink/65">{outfit.reason}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {onSave && (
          <button
            onClick={() => onSave(outfit)}
            disabled={saved}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ivory disabled:bg-taupe"
          >
            <Save size={16} />
            {saved ? "Saved" : "Save Outfit"}
          </button>
        )}
        {onRegenerate && (
          <button onClick={onRegenerate} className="flex items-center gap-2 rounded-full bg-ivory px-4 py-2 text-sm font-semibold">
            <RefreshCw size={16} />
            Similar
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="flex items-center gap-2 rounded-full bg-ivory px-4 py-2 text-sm font-semibold text-rose">
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  datalist
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  datalist?: string[];
}) {
  const listId = datalist ? `${label.toLowerCase().replace(/\s/g, "-")}-list` : undefined;
  return (
    <label className="block text-sm font-semibold text-ink/70">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={listId}
        className="mt-2 w-full rounded-full border border-black/10 bg-ivory/60 px-4 py-3 outline-none focus:border-rose"
      />
      {datalist && (
        <datalist id={listId}>
          {datalist.map((entry) => (
            <option key={entry} value={entry} />
          ))}
        </datalist>
      )}
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-ink/70">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-full border border-black/10 bg-ivory/60 px-4 py-3 outline-none focus:border-rose">
        {options.map((option) => (
          <option key={option} value={option}>
            {titleCase(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TagPicker<T extends string>({
  label,
  values,
  selected,
  onChange
}: {
  label: string;
  values: T[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  };

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-ink/70">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => toggle(value)}
            className={`rounded-full px-3 py-2 text-sm font-semibold ${selected.includes(value) ? "bg-ink text-ivory" : "bg-ivory text-ink/65"}`}
          >
            {titleCase(value)}
          </button>
        ))}
      </div>
    </div>
  );
}

function StyleTagManager({
  values,
  customValues,
  selected,
  onChange,
  onAdd,
  onDelete
}: {
  values: StyleTag[];
  customValues: StyleTag[];
  selected: StyleTag[];
  onChange: (values: StyleTag[]) => void;
  onAdd: (value: StyleTag) => void;
  onDelete: (value: StyleTag) => void;
}) {
  const [newTag, setNewTag] = useState("");
  const cleanTag = normalize(newTag);

  const addTag = () => {
    if (!cleanTag) return;
    if (!defaultStyleTags.includes(cleanTag)) onAdd(cleanTag);
    onChange([...new Set([...selected, cleanTag])]);
    setNewTag("");
  };

  return (
    <div className="mt-4">
      <TagPicker label="Style tags" values={values} selected={selected} onChange={onChange} />
      <div className="mt-3 flex gap-2">
        <input
          value={newTag}
          onChange={(event) => setNewTag(event.target.value)}
          placeholder="Add custom style"
          className="min-w-0 flex-1 rounded-full border border-black/10 bg-ivory/60 px-4 py-3 outline-none focus:border-rose"
        />
        <button type="button" onClick={addTag} className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ivory">
          Add
        </button>
      </div>
      {customValues.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {customValues.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-ivory px-3 py-2 text-sm font-semibold text-ink/65">
              {titleCase(tag)}
              <button
                type="button"
                onClick={() => onDelete(tag)}
                className="grid size-5 place-items-center rounded-full text-rose"
                aria-label={`Delete custom style ${tag}`}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body, action, onClick }: { title: string; body: string; action: string; onClick: () => void }) {
  return (
    <section className="rounded-[1.5rem] border border-dashed border-taupe/70 bg-porcelain p-8 text-center">
      <Sparkles className="mx-auto text-rose" size={32} />
      <h2 className="mt-3 font-serif text-3xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">{body}</p>
      <button onClick={onClick} className="mt-5 rounded-full bg-ink px-5 py-3 font-semibold text-ivory">
        {action}
      </button>
    </section>
  );
}

function OnboardingTips() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[
        { icon: Camera, title: "Photograph pieces", body: "Use a clean background when possible; NiceOutfit will frame every upload consistently." },
        { icon: BriefcaseBusiness, title: "Add useful tags", body: "Season, formality, weather, and style tags make recommendations sharper." },
        { icon: CloudRain, title: "Plan for weather", body: "Rain, cold, wind, and heat tags help the local engine build practical outfits." },
        { icon: Luggage, title: "Save your favorites", body: "Generated outfits remain temporary until you save them." }
      ].map(({ icon: Icon, title, body }) => (
        <article key={title} className="rounded-[1.5rem] bg-white p-5 shadow-soft">
          <Icon className="text-rose" size={24} />
          <h3 className="mt-3 font-serif text-2xl font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/60">{body}</p>
        </article>
      ))}
    </div>
  );
}
