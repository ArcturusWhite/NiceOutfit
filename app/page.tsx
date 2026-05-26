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
  Pencil,
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
type Formality = string;
type StyleTag = string;
type Texture = string;
type Fit = string;
type Vibe = string;

type WardrobeItem = {
  id: string;
  name: string;
  category: Category;
  subcategory: string;
  mainColor: string;
  secondaryColor: string;
  material: string;
  seasons: Season[];
  textures: Texture[];
  fit: Fit;
  vibes: Vibe[];
  formality: Formality;
  styleTags: StyleTag[];
  notes: string;
  imageId: string;
  createdAt: string;
  updatedAt?: string;
  legacyImage?: string;
};

type DraftItem = Omit<WardrobeItem, "id" | "createdAt" | "updatedAt" | "legacyImage"> & {
  imagePreview: string;
  pendingImageData: string;
};

type OutfitContext = {
  label: string;
  occasion: string;
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
  customTextures: Texture[];
  customFits: Fit[];
  customVibes: Vibe[];
  customFormalities: Formality[];
};

const STORAGE_KEY = "niceoutfit:data:v1";
const IMAGE_DB_NAME = "niceoutfit-images";
const IMAGE_STORE_NAME = "images";
const IMAGE_DB_VERSION = 1;

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
const defaultFormalities: Formality[] = ["casual", "smart casual", "work", "formal"];
const defaultStyleTags: StyleTag[] = ["minimalist", "elegant", "sporty", "classic", "romantic", "relaxed", "edgy", "streetwear", "elevated casual"];
const defaultTextures: Texture[] = ["matte", "smooth", "ribbed", "knit", "structured", "soft", "shiny", "flowy", "rugged", "lounge", "crisp"];
const defaultFits: Fit[] = ["slim", "regular", "relaxed", "oversized", "tailored", "wide-leg"];
const defaultVibes: Vibe[] = ["casual", "elevated casual", "sporty", "lounge", "elegant", "classic", "streetwear", "minimal"];
const colorFamilies = ["ivory", "cream", "beige", "camel", "gray", "black", "white", "navy", "denim", "rose", "brown", "olive", "burgundy"];

const emptyDraft: DraftItem = {
  name: "",
  category: "tops",
  subcategory: "",
  mainColor: "",
  secondaryColor: "",
  material: "",
  seasons: ["all-season"],
  textures: ["smooth"],
  fit: "regular",
  vibes: ["classic"],
  formality: "smart casual",
  styleTags: ["classic"],
  notes: "",
  imageId: "",
  imagePreview: "",
  pendingImageData: ""
};

const quickContexts: OutfitContext[] = [
  {
    label: "Work",
    occasion: "work",
    season: "all-season",
    styles: ["classic", "minimalist", "elegant"],
    formality: "work",
    colors: ["black", "navy", "gray", "ivory", "beige"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "belts", "jewelry"]
  },
  {
    label: "Casual",
    occasion: "casual day",
    styles: ["relaxed", "classic", "sporty"],
    formality: "casual",
    colors: ["denim", "white", "gray", "beige"],
    include: ["tops", "bottoms", "dresses", "shoes", "bags", "other accessories"]
  },
  {
    label: "Formal",
    occasion: "formal event",
    styles: ["elegant", "classic", "romantic"],
    formality: "formal",
    colors: ["black", "ivory", "navy", "burgundy"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "jewelry", "ties"]
  },
  {
    label: "Smart Casual",
    occasion: "smart casual plan",
    styles: ["minimalist", "classic", "elegant"],
    formality: "smart casual",
    colors: ["beige", "camel", "white", "gray", "black"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "belts", "jewelry"]
  },
  {
    label: "Travel",
    occasion: "travel day",
    styles: ["relaxed", "minimalist", "classic"],
    formality: "casual",
    colors: ["black", "gray", "beige", "denim"],
    include: ["tops", "bottoms", "outerwear", "shoes", "bags", "scarves"]
  },
  {
    label: "Dinner",
    occasion: "dinner",
    styles: ["elegant", "romantic", "classic"],
    formality: "smart casual",
    colors: ["black", "rose", "ivory", "burgundy"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "jewelry"]
  },
  {
    label: "Parisian Winter",
    occasion: "Paris in winter",
    season: "winter",
    styles: ["parisian", "elegant", "classic"],
    formality: "smart casual",
    colors: ["black", "ivory", "gray", "camel", "navy"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "scarves", "belts"]
  },
  {
    label: "Hot Weather",
    occasion: "hot weather",
    season: "summer",
    styles: ["relaxed", "minimalist", "classic"],
    formality: "casual",
    colors: ["white", "ivory", "beige", "rose"],
    include: ["tops", "bottoms", "dresses", "shoes", "bags", "jewelry"]
  },
  {
    label: "Rainy Day",
    occasion: "rainy day",
    styles: ["classic", "minimalist"],
    formality: "smart casual",
    colors: ["black", "gray", "navy", "olive"],
    include: ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "scarves"]
  },
  {
    label: "Weekend",
    occasion: "weekend",
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
const fallbackData: NiceOutfitData = {
  wardrobe: [],
  savedOutfits: [],
  customStyleTags: [],
  customTextures: [],
  customFits: [],
  customVibes: [],
  customFormalities: []
};
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

function normalizeOptionList(value: unknown, fallback: string[] = []) {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const selected = raw.map((entry) => normalize(entry)).filter(Boolean);
  return selected.length ? [...new Set(selected)] : fallback;
}

function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) db.createObjectStore(IMAGE_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function imageStoreAction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, mode);
    const request = action(transaction.objectStore(IMAGE_STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image data")));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const bytes = atob(base64 || "");
  const array = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) array[index] = bytes.charCodeAt(index);
  return new Blob([array], { type: mime });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = src;
  });
}

async function compressImageData(dataUrl: string): Promise<Blob> {
  try {
    const image = await loadImageElement(dataUrl);
    const scale = Math.min(1, 800 / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return dataUrlToBlob(dataUrl);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
    return blob || dataUrlToBlob(dataUrl);
  } catch {
    return dataUrlToBlob(dataUrl);
  }
}

async function saveItemImage(dataUrl: string, imageId = uid()): Promise<string> {
  if (!dataUrl) return "";
  try {
    const blob = await compressImageData(dataUrl);
    await imageStoreAction(imageId ? "readwrite" : "readonly", (store) => store.put(blob, imageId));
    return imageId;
  } catch {
    return "";
  }
}

async function loadItemImage(imageId: string): Promise<string> {
  if (!imageId) return "";
  try {
    const result = await imageStoreAction<Blob | undefined>("readonly", (store) => store.get(imageId));
    return result instanceof Blob ? await blobToDataUrl(result) : "";
  } catch {
    return "";
  }
}

async function deleteItemImage(imageId: string) {
  if (!imageId) return;
  try {
    await imageStoreAction<undefined>("readwrite", (store) => store.delete(imageId) as IDBRequest<undefined>);
  } catch {
    undefined;
  }
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

function normalizeContext(raw: unknown): OutfitContext {
  const source = raw && typeof raw === "object" ? (raw as Partial<OutfitContext>) : {};
  const colors = safeArray<unknown>(source.colors).map((entry) => normalize(entry)).filter(Boolean);
  const include = safeArray<unknown>(source.include).filter((entry): entry is Category => categories.includes(entry as Category));
  return {
    label: safeString(source.label, "Custom"),
    occasion: safeString(source.occasion, "saved outfit"),
    season: seasons.includes(normalize(source.season) as Season) ? (normalize(source.season) as Season) : undefined,
    styles: normalizeStyleList(source.styles),
    formality: normalize(source.formality) || undefined,
    colors: colors.length ? colors : ["ivory", "beige", "black", "gray"],
    include: include.length ? include : categories
  };
}

function normalizeWardrobeItem(raw: unknown, index = 0): WardrobeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Partial<WardrobeItem> & { season?: Season; fabric?: string; texture?: string; vibe?: string; image?: string };
  return {
    id: safeString(source.id, `imported-${index}-${uid()}`),
    name: safeString(source.name, "Untitled item"),
    category: oneOf(source.category, categories, "other accessories"),
    subcategory: safeString(source.subcategory),
    mainColor: safeString(source.mainColor, "neutral"),
    secondaryColor: safeString(source.secondaryColor),
    material: safeString(source.material || source.fabric),
    seasons: normalizeSeasons(source.seasons || source.season),
    textures: normalizeOptionList(source.textures || source.texture, ["smooth"]),
    fit: normalize(source.fit) || "regular",
    vibes: normalizeOptionList(source.vibes || source.vibe, ["classic"]),
    formality: normalize(source.formality) || "smart casual",
    styleTags: normalizeStyleList(source.styleTags),
    notes: safeString(source.notes),
    imageId: safeString(source.imageId),
    legacyImage: safeString(source.legacyImage || source.image),
    createdAt: safeString(source.createdAt, new Date().toISOString()),
    updatedAt: safeString(source.updatedAt)
  };
}

function stripVolatileItemFields(item: WardrobeItem): WardrobeItem {
  const { legacyImage, image, imagePreview, pendingImageData, ...persistable } = item as WardrobeItem & {
    image?: string;
    imagePreview?: string;
    pendingImageData?: string;
  };
  return persistable;
}

function stripVolatileOutfitFields<T extends Outfit>(outfit: T): T {
  return {
    ...outfit,
    items: safeArray<unknown>(outfit.items)
      .map((item, index) => normalizeWardrobeItem(item, index))
      .filter((item): item is WardrobeItem => Boolean(item))
      .map(stripVolatileItemFields)
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
    const assignedTextures = wardrobe.flatMap((item) => item.textures);
    const assignedFits = wardrobe.map((item) => item.fit);
    const assignedVibes = wardrobe.flatMap((item) => item.vibes);
    const assignedFormalities = wardrobe.map((item) => item.formality);
    const customStyleTags = safeArray<unknown>(parsed.customStyleTags)
      .map((entry) => normalize(entry))
      .filter((entry) => entry && !defaultStyleTags.includes(entry));
    const customTextures = normalizeOptionList(parsed.customTextures).filter((entry) => !defaultTextures.includes(entry));
    const customFits = normalizeOptionList(parsed.customFits).filter((entry) => !defaultFits.includes(entry));
    const customVibes = normalizeOptionList(parsed.customVibes).filter((entry) => !defaultVibes.includes(entry));
    const customFormalities = normalizeOptionList(parsed.customFormalities).filter((entry) => !defaultFormalities.includes(entry));
    return {
      wardrobe,
      savedOutfits,
      customStyleTags: [...new Set([...customStyleTags, ...assignedTags.filter((tag) => !defaultStyleTags.includes(tag) && tag !== "parisian")])],
      customTextures: [...new Set([...customTextures, ...assignedTextures.filter((item) => !defaultTextures.includes(item))])],
      customFits: [...new Set([...customFits, ...assignedFits.filter((item) => !defaultFits.includes(item))])],
      customVibes: [...new Set([...customVibes, ...assignedVibes.filter((item) => !defaultVibes.includes(item))])],
      customFormalities: [...new Set([...customFormalities, ...assignedFormalities.filter((item) => !defaultFormalities.includes(item))])]
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
    base.include = [...new Set([...base.include, "outerwear" as Category, "scarves" as Category])];
  }
  if (text.includes("summer") || text.includes("hot") || text.includes("beach")) {
    base.season = "summer";
    base.styles = [...new Set([...base.styles, "relaxed" as StyleTag, "minimalist" as StyleTag])];
    base.colors = ["white", "ivory", "beige", "rose"];
  }
  if (text.includes("rain")) {
    base.include = [...new Set([...base.include, "outerwear" as Category])];
  }
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
  if ((has("wool") || has("heavy")) && safeItems.some((item) => item.seasons.includes("summer"))) score -= 6;
  if (has("synthetic") || has("polyester")) {
    if (safeItems.some((item) => item.vibes.includes("elegant") && item.formality === "formal")) score -= 6;
  }
  return score;
}

function textureHarmonyScore(items: WardrobeItem[]) {
  const safeItems = Array.isArray(items) ? items : [];
  const textures = safeItems.flatMap((item) => item.textures);
  const has = (texture: Texture) => textures.includes(texture);
  let score = 0;
  if (has("knit") && (has("soft") || safeItems.some((item) => item.fit === "relaxed"))) score += 8;
  if (has("structured") && safeItems.some((item) => item.fit === "tailored")) score += 9;
  if (has("crisp") && (has("smooth") || has("structured"))) score += 7;
  if (has("flowy") && safeItems.some((item) => item.vibes.includes("elegant") || normalizeStyleList(item.styleTags).includes("romantic"))) score += 7;
  if (has("lounge") && has("shiny")) score -= 10;
  if (has("rugged") && has("flowy") && !safeItems.some((item) => item.vibes.includes("streetwear") || normalizeStyleList(item.styleTags).includes("edgy"))) score -= 7;
  return score;
}

function vibeHarmonyScore(items: WardrobeItem[], context: OutfitContext) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeContext = normalizeContext(context);
  const vibes = safeItems.flatMap((item) => item.vibes);
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
  if (overlaps(safeItem.styleTags, safeContext.styles)) score += 18;
  if (overlaps(safeItem.vibes, safeContext.styles)) score += 10;
  if (safeItem.textures.includes("structured") && ["work", "formal"].includes(safeContext.formality ?? "")) score += 6;
  if (safeItem.textures.includes("lounge") && ["work", "formal"].includes(safeContext.formality ?? "")) score -= 8;
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
  const materials = [...new Set(safeOutfit.map((item) => normalize(item.material)).filter(Boolean))].slice(0, 2);
  const textures = [...new Set(safeOutfit.flatMap((item) => item.textures).filter(Boolean))].slice(0, 2);
  const vibes = [...new Set(safeOutfit.flatMap((item) => item.vibes).filter(Boolean))].slice(0, 2);
  const textureLine = textures.length ? ` Texture-wise, ${textures.join(" and ")} pieces support a ${vibes.join(" and ") || style || "balanced"} vibe.` : "";
  const materialLine = materials.length ? ` ${materials.join(" and ")} materials help the outfit feel coherent.` : "";
  return `${names || "These pieces"} balance ${style || "classic"} styling with your selected season and formality.${textureLine}${materialLine} The ${score}% score reflects color, season, formality, texture, vibe, material, fit, and completeness.`;
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

    const needsOuterwear = safeContext.season === "winter" || safeContext.occasion.includes("rain");
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [generated, setGenerated] = useState<Outfit[]>([]);
  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");
  const [customStyleTags, setCustomStyleTags] = useState<StyleTag[]>([]);
  const [customTextures, setCustomTextures] = useState<Texture[]>([]);
  const [customFits, setCustomFits] = useState<Fit[]>([]);
  const [customVibes, setCustomVibes] = useState<Vibe[]>([]);
  const [customFormalities, setCustomFormalities] = useState<Formality[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [imageStorageReady, setImageStorageReady] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = readStoredData();
    setWardrobe(stored.wardrobe);
    setSavedOutfits(stored.savedOutfits);
    setCustomStyleTags(stored.customStyleTags);
    setCustomTextures(stored.customTextures);
    setCustomFits(stored.customFits);
    setCustomVibes(stored.customVibes);
    setCustomFormalities(stored.customFormalities);
    setHydrated(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setImageStorageReady(false);
    let cancelled = false;
    const migrateAndLoadImages = async () => {
      const nextItems: WardrobeItem[] = [];
      const nextSavedOutfits: SavedOutfit[] = [];
      const nextImages: Record<string, string> = {};
      let changed = false;
      for (const item of wardrobe) {
        let nextItem = item;
        if (!nextItem.imageId && nextItem.legacyImage) {
          const imageId = await saveItemImage(nextItem.legacyImage);
          if (imageId) {
            nextItem = { ...nextItem, imageId, legacyImage: "" };
            changed = true;
          }
        }
        if (nextItem.imageId) {
          const image = await loadItemImage(nextItem.imageId);
          if (image) nextImages[nextItem.imageId] = image;
        }
        nextItems.push(nextItem);
      }
      for (const outfit of savedOutfits) {
        const outfitItems: WardrobeItem[] = [];
        for (const item of safeArray<unknown>(outfit.items).map((entry, index) => normalizeWardrobeItem(entry, index)).filter((entry): entry is WardrobeItem => Boolean(entry))) {
          let nextItem = item;
          if (!nextItem.imageId && nextItem.legacyImage) {
            const imageId = await saveItemImage(nextItem.legacyImage);
            if (imageId) {
              nextItem = { ...nextItem, imageId, legacyImage: "" };
              changed = true;
            }
          }
          if (nextItem.imageId && !nextImages[nextItem.imageId]) {
            const image = await loadItemImage(nextItem.imageId);
            if (image) nextImages[nextItem.imageId] = image;
          }
          outfitItems.push(nextItem);
        }
        nextSavedOutfits.push({ ...outfit, items: outfitItems });
      }
      if (cancelled) return;
      setImageMap(nextImages);
      if (changed) setWardrobe(nextItems);
      if (changed) setSavedOutfits(nextSavedOutfits.map(stripVolatileOutfitFields));
      setImageStorageReady(true);
    };
    migrateAndLoadImages();
    return () => {
      cancelled = true;
    };
  }, [wardrobe, savedOutfits, hydrated]);

  useEffect(() => {
    if (!hydrated || !imageStorageReady) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          wardrobe: wardrobe.map(stripVolatileItemFields),
          savedOutfits: savedOutfits.map(stripVolatileOutfitFields),
          customStyleTags,
          customTextures,
          customFits,
          customVibes,
          customFormalities
        })
      );
    } catch {
      undefined;
    }
  }, [wardrobe, savedOutfits, customStyleTags, customTextures, customFits, customVibes, customFormalities, hydrated, imageStorageReady]);

  const filteredWardrobe = useMemo(
    () => (activeFilter === "all" ? wardrobe : wardrobe.filter((item) => item.category === activeFilter)),
    [activeFilter, wardrobe]
  );

  const featured = useMemo(() => generateOutfits(wardrobe, quickContexts[0], 1)[0], [wardrobe]);
  const selectableStyleTags = useMemo(() => [...new Set([...defaultStyleTags, ...customStyleTags])], [customStyleTags]);
  const selectableTextures = useMemo(() => [...new Set([...defaultTextures, ...customTextures])], [customTextures]);
  const selectableFits = useMemo(() => [...new Set([...defaultFits, ...customFits])], [customFits]);
  const selectableVibes = useMemo(() => [...new Set([...defaultVibes, ...customVibes])], [customVibes]);
  const selectableFormalities = useMemo(() => [...new Set([...defaultFormalities, ...customFormalities])], [customFormalities]);

  const updateDraft = (field: keyof DraftItem, value: string | string[]) => {
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
      reader.onload = async () => {
        if (typeof reader.result !== "string") return;
        setDraft((current) => ({ ...current, imagePreview: reader.result, pendingImageData: reader.result }));
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

  const saveItem = async () => {
    if ((!draft.imagePreview && !draft.imageId) || !draft.name.trim()) return;
    const existing = editingItemId ? wardrobe.find((item) => item.id === editingItemId) : undefined;
    let imageId = draft.imageId || existing?.imageId || "";
    if (draft.pendingImageData) {
      const replacementId = await saveItemImage(draft.pendingImageData, imageId || uid());
      if (replacementId) imageId = replacementId;
      if (!replacementId) {
        alert("NiceOutfit could not save that image on this device. Please try another photo.");
        return;
      }
    }
    const item: WardrobeItem = {
      ...draft,
      id: editingItemId || uid(),
      name: draft.name.trim(),
      subcategory: draft.subcategory.trim(),
      mainColor: draft.mainColor.trim() || "neutral",
      material: draft.material.trim(),
      seasons: draft.seasons.length ? draft.seasons : ["all-season"],
      textures: draft.textures.length ? draft.textures : ["smooth"],
      fit: draft.fit,
      vibes: draft.vibes.length ? draft.vibes : ["classic"],
      imageId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: editingItemId ? new Date().toISOString() : undefined
    };
    const persistable = stripVolatileItemFields(item);
    setWardrobe((items) => (editingItemId ? items.map((entry) => (entry.id === editingItemId ? persistable : entry)) : [persistable, ...items]));
    setDraft(emptyDraft);
    setEditingItemId(null);
    setStep(1);
    setView("wardrobe");
  };

  const runRecommendation = (context: OutfitContext) => {
    setGenerated(generateOutfits(wardrobe, context));
    setView("generate");
  };

  const saveOutfit = (outfit: Outfit) => {
    if (savedOutfits.some((saved) => saved.id === outfit.id)) return;
    setSavedOutfits((items) => [stripVolatileOutfitFields({ ...outfit, savedAt: new Date().toISOString() }), ...items]);
  };

  const startEditItem = (item: WardrobeItem) => {
    const safeItem = normalizeWardrobeItem(item);
    if (!safeItem) return;
    setEditingItemId(safeItem.id);
    setDraft({
      name: safeItem.name,
      category: safeItem.category,
      subcategory: safeItem.subcategory,
      mainColor: safeItem.mainColor,
      secondaryColor: safeItem.secondaryColor,
      material: safeItem.material,
      seasons: safeItem.seasons,
      textures: safeItem.textures,
      fit: safeItem.fit,
      vibes: safeItem.vibes,
      formality: safeItem.formality,
      styleTags: safeItem.styleTags,
      notes: safeItem.notes,
      imageId: safeItem.imageId,
      imagePreview: imageMap[safeItem.imageId] || "",
      pendingImageData: ""
    });
    setStep(2);
    setView("add");
  };

  const startAddItem = () => {
    setEditingItemId(null);
    setDraft(emptyDraft);
    setStep(1);
    setView("add");
  };

  const deleteWardrobeItem = async (item: WardrobeItem) => {
    const imageId = item.imageId;
    setWardrobe((items) => items.filter((entry) => entry.id !== item.id));
    if (imageId) {
      await deleteItemImage(imageId);
      setImageMap((images) => {
        const next = { ...images };
        delete next[imageId];
        return next;
      });
    }
  };

  const exportBackup = async () => {
    const images: Record<string, string> = {};
    const exportItems = [
      ...wardrobe,
      ...savedOutfits.flatMap((outfit) => safeArray<unknown>(outfit.items).map((item, index) => normalizeWardrobeItem(item, index)).filter((item): item is WardrobeItem => Boolean(item)))
    ];
    for (const item of exportItems) {
      if (!item.imageId || images[item.imageId]) continue;
      images[item.imageId] = imageMap[item.imageId] || (await loadItemImage(item.imageId));
    }
    const blob = new Blob(
      [
        JSON.stringify(
          {
            wardrobe: wardrobe.map(stripVolatileItemFields),
            savedOutfits: savedOutfits.map(stripVolatileOutfitFields),
            customStyleTags,
            customTextures,
            customFits,
            customVibes,
            customFormalities,
            images
          },
          null,
          2
        )
      ],
      { type: "application/json" }
    );
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
      reader.onload = async () => {
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
            .filter((entry) => entry && !defaultStyleTags.includes(entry)),
          customTextures: normalizeOptionList((raw as Partial<NiceOutfitData>)?.customTextures).filter((entry) => !defaultTextures.includes(entry)),
          customFits: normalizeOptionList((raw as Partial<NiceOutfitData>)?.customFits).filter((entry) => !defaultFits.includes(entry)),
          customVibes: normalizeOptionList((raw as Partial<NiceOutfitData>)?.customVibes).filter((entry) => !defaultVibes.includes(entry)),
          customFormalities: normalizeOptionList((raw as Partial<NiceOutfitData>)?.customFormalities).filter((entry) => !defaultFormalities.includes(entry))
        };
        const importedImages = raw && typeof raw === "object" ? ((raw as { images?: Record<string, string> }).images || {}) : {};
        const restoredImages: Record<string, string> = {};
        const importItems = [...data.wardrobe, ...data.savedOutfits.flatMap((outfit) => outfit.items)];
        for (const item of importItems) {
          const imageData = (item.imageId && importedImages[item.imageId]) || item.legacyImage || "";
          if (!imageData) continue;
          const imageId = item.imageId || uid();
          const savedImageId = await saveItemImage(imageData, imageId);
          if (savedImageId) {
            item.imageId = savedImageId;
            item.legacyImage = "";
            restoredImages[savedImageId] = await loadItemImage(savedImageId);
          }
        }
        const assignedTags = data.wardrobe.flatMap((item) => item.styleTags).filter((tag) => !defaultStyleTags.includes(tag) && tag !== "parisian");
        const assignedTextures = data.wardrobe.flatMap((item) => item.textures).filter((tag) => !defaultTextures.includes(tag));
        const assignedFits = data.wardrobe.map((item) => item.fit).filter((tag) => !defaultFits.includes(tag));
        const assignedVibes = data.wardrobe.flatMap((item) => item.vibes).filter((tag) => !defaultVibes.includes(tag));
        const assignedFormalities = data.wardrobe.map((item) => item.formality).filter((tag) => !defaultFormalities.includes(tag));
        setWardrobe(data.wardrobe.map(stripVolatileItemFields));
        setSavedOutfits(data.savedOutfits.map(stripVolatileOutfitFields));
        setImageMap(restoredImages);
        setCustomStyleTags([...new Set([...data.customStyleTags, ...assignedTags])]);
        setCustomTextures([...new Set([...data.customTextures, ...assignedTextures])]);
        setCustomFits([...new Set([...data.customFits, ...assignedFits])]);
        setCustomVibes([...new Set([...data.customVibes, ...assignedVibes])]);
        setCustomFormalities([...new Set([...data.customFormalities, ...assignedFormalities])]);
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
    wardrobe.forEach((item) => {
      if (item.imageId) deleteItemImage(item.imageId);
    });
    setWardrobe([]);
    setSavedOutfits([]);
    setCustomStyleTags([]);
    setCustomTextures([]);
    setCustomFits([]);
    setCustomVibes([]);
    setCustomFormalities([]);
    setGenerated([]);
    setImageMap({});
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
              <ActionButton icon={Plus} label="Add Item" onClick={startAddItem} />
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
                <OutfitCard outfit={featured} imageMap={imageMap} onSave={saveOutfit} saved={savedOutfits.some((item) => item.id === featured.id)} />
              ) : (
                <EmptyState title="Build your first outfit" body="Add a few pieces, then NiceOutfit can suggest looks from what you already own." action="Add an item" onClick={startAddItem} />
              )}
            </section>

            <section>
              <h2 className="mb-3 font-serif text-3xl font-semibold">Recent Wardrobe</h2>
              {wardrobe.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {wardrobe.slice(0, 4).map((item) => (
                    <ItemCard key={item.id} item={item} imageSrc={imageMap[item.imageId]} />
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
                  <ItemCard key={item.id} item={item} imageSrc={imageMap[item.imageId]} onEdit={() => startEditItem(item)} onDelete={() => deleteWardrobeItem(item)} />
                ))}
              </div>
            ) : (
              <EmptyState title="No pieces here yet" body="Upload clothing and accessories to create a clean, searchable catalog." action="Add item" onClick={startAddItem} />
            )}
          </div>
        )}

        {view === "add" && (
          <div className="space-y-5">
            <PageTitle eyebrow={`Step ${step} of 4`} title={editingItemId ? "Edit Item" : "Add Item"} />
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <section className="rounded-[1.5rem] bg-porcelain p-4 shadow-soft">
                <CatalogPreview image={draft.imagePreview} name={draft.name || "New wardrobe item"} />
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
                </div>
                <TagPicker label="Seasons" values={seasons} selected={draft.seasons} onChange={(values) => updateDraft("seasons", values.length ? values : ["all-season"])} />
                <CustomOptionPicker
                  label="Texture / Finish"
                  values={selectableTextures}
                  selected={draft.textures}
                  multiple
                  onChange={(values) => updateDraft("textures", values.length ? values : ["smooth"])}
                  onAdd={(value) => setCustomTextures((items) => [...new Set([...items, value])])}
                />
                <CustomOptionPicker
                  label="Fit / Shape"
                  values={selectableFits}
                  selected={[draft.fit]}
                  onChange={(values) => updateDraft("fit", values[0] || "regular")}
                  onAdd={(value) => setCustomFits((items) => [...new Set([...items, value])])}
                />
                <CustomOptionPicker
                  label="Vibe"
                  values={selectableVibes}
                  selected={draft.vibes}
                  multiple
                  onChange={(values) => updateDraft("vibes", values.length ? values : ["classic"])}
                  onAdd={(value) => setCustomVibes((items) => [...new Set([...items, value])])}
                />
                <CustomOptionPicker
                  label="Formality"
                  values={selectableFormalities}
                  selected={[draft.formality]}
                  onChange={(values) => updateDraft("formality", values[0] || "smart casual")}
                  onAdd={(value) => setCustomFormalities((items) => [...new Set([...items, value])])}
                />
                <StyleTagManager
                  values={selectableStyleTags}
                  customValues={customStyleTags}
                  selected={draft.styleTags}
                  onChange={(values) => updateDraft("styleTags", values)}
                  onAdd={(tag) => setCustomStyleTags((tags) => [...new Set([...tags, tag])])}
                  onDelete={(tag) => setCustomStyleTags((tags) => tags.filter((entry) => entry !== tag))}
                />
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
                  disabled={(!draft.imagePreview && !draft.imageId) || !draft.name.trim()}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-rose px-5 py-3 font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:bg-taupe"
                >
                  <Check size={18} />
                  {editingItemId ? "Save Changes" : "Save Item"}
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
                  <OutfitCard key={outfit.id} outfit={outfit} imageMap={imageMap} onSave={saveOutfit} saved={savedOutfits.some((item) => item.id === outfit.id)} />
                ))
              ) : (
                <EmptyState title="Ready when your wardrobe is" body="Choose a quick idea or describe the plan. NiceOutfit will infer formality, season, and style from local rules." action="Try Work" onClick={() => runRecommendation(quickContexts[0])} />
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
                    imageMap={imageMap}
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
              onClick={() => (id === "add" ? startAddItem() : setView(id))}
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

function ItemCard({ item, imageSrc, onDelete, onEdit }: { item: WardrobeItem; imageSrc?: string; onDelete?: () => void; onEdit?: () => void }) {
  const safeItem = normalizeWardrobeItem(item) ?? normalizeWardrobeItem({}, 0);
  if (!safeItem) return null;
  return (
    <article className="rounded-[1.35rem] bg-white p-3 shadow-soft">
      <CatalogPreview image={imageSrc || safeItem.legacyImage} name={safeItem.name || "Wardrobe item"} />
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">{safeItem.name}</h3>
            <p className="text-sm text-ink/55">{titleCase(safeItem.category)}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {onEdit && (
              <button onClick={onEdit} className="grid size-8 place-items-center rounded-full bg-ivory text-ink/60" aria-label={`Edit ${safeItem.name}`}>
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="grid size-8 place-items-center rounded-full bg-ivory text-ink/60" aria-label={`Delete ${safeItem.name}`}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {[safeItem.mainColor, safeItem.formality, safeItem.seasons.join(" + "), safeItem.textures.join(" + "), safeItem.vibes.join(" + ")].filter(Boolean).map((tag) => (
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
  imageMap,
  onSave,
  saved,
  savedAt,
  onDelete,
  onRegenerate
}: {
  outfit: Outfit;
  imageMap?: Record<string, string>;
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
            <CatalogPreview image={imageMap?.[item.imageId] || item.legacyImage} name={item.name || "Outfit item"} />
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

function CustomOptionPicker({
  label,
  values,
  selected,
  multiple,
  onChange,
  onAdd
}: {
  label: string;
  values: string[];
  selected: string[];
  multiple?: boolean;
  onChange: (values: string[]) => void;
  onAdd: (value: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const toggle = (value: string) => {
    if (multiple) {
      onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
      return;
    }
    onChange([value]);
  };

  const addValue = () => {
    const cleanValue = normalize(newValue);
    if (!cleanValue) return;
    onAdd(cleanValue);
    onChange(multiple ? [...new Set([...selected, cleanValue])] : [cleanValue]);
    setNewValue("");
    setAdding(false);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/70">{label}</p>
        <button type="button" onClick={() => setAdding((value) => !value)} className="grid size-8 place-items-center rounded-full bg-ivory text-sm font-bold text-ink/70">
          +
        </button>
      </div>
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
      {adding && (
        <div className="mt-3 flex gap-2">
          <input
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder={`Add ${label.toLowerCase()}`}
            className="min-w-0 flex-1 rounded-full border border-black/10 bg-ivory/60 px-4 py-3 outline-none focus:border-rose"
          />
          <button type="button" onClick={addValue} className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ivory">
            Add
          </button>
        </div>
      )}
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
        { icon: BriefcaseBusiness, title: "Add useful tags", body: "Season, formality, texture, vibe, and style tags make recommendations sharper." },
        { icon: CloudRain, title: "Plan with seasons", body: "Spring, summer, fall, and winter selections help the local engine build practical outfits." },
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
