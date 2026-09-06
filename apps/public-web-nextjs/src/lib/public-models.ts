import {
  readPgNumber,
  readPgText,
  readPgTimestamp,
  readResourceId,
  resolvePublicAssetUrl,
  safeExternalUrl,
} from "@/lib/public-api";

export interface RawHeroContent {
  id?: unknown;
  title?: string;
  highlight_text?: Parameters<typeof readPgText>[0];
  description?: string;
  background_image_url?: Parameters<typeof readPgText>[0];
  is_active?: boolean;
}

export interface HeroContentModel {
  id: string;
  title: string;
  highlightText: string;
  description: string;
  backgroundImageUrl: string;
}

export const defaultHeroContent: HeroContentModel = {
  id: "hero-fallback",
  title: "Panggung Juara Jawa Barat.",
  highlightText: "Jawa Barat.",
  description: "Saksikan Pekan Olahraga Provinsi Jawa Barat ke XV 2026 dari Kota Depok.\nJadwal, Venue, LiveScore, dan perjalanan para Atlet dalam satu Portal Resmi.",
  backgroundImageUrl: "/assets/images/alun-alun.png",
};

export function normalizeHeroContent(raw: RawHeroContent): HeroContentModel {
  const storedImageURL = readPgText(raw.background_image_url);
  return {
    id: readResourceId(raw.id, defaultHeroContent.id),
    title: raw.title?.trim() || defaultHeroContent.title,
    highlightText: readPgText(raw.highlight_text),
    description: raw.description?.trim() || defaultHeroContent.description,
    // INFO: Asset seed milik Public Web tetap relative; Media Library dilayani API Gateway.
    backgroundImageUrl: storedImageURL.startsWith("/assets/")
      ? storedImageURL
      : resolvePublicAssetUrl(storedImageURL) || defaultHeroContent.backgroundImageUrl,
  };
}

export interface RawCabor {
  id?: unknown;
  slug?: string;
  name?: string;
  description?: Parameters<typeof readPgText>[0];
  icon_url?: Parameters<typeof readPgText>[0];
  hero_image_url?: Parameters<typeof readPgText>[0];
  kategori?: Parameters<typeof readPgText>[0];
  total_medali?: Parameters<typeof readPgNumber>[0];
  technical_delegate?: Parameters<typeof readPgText>[0];
  status?: Parameters<typeof readPgText>[0];
}

export interface CaborModel {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string;
  heroImageUrl: string;
  category: string;
  totalMedals: number;
  technicalDelegate: string;
  status: string;
}

export function normalizeCabor(raw: RawCabor, index = 0): CaborModel {
  const name = raw.name?.trim() || "Cabang Olahraga PORPROV";
  return {
    id: readResourceId(raw.id, `cabor-${index}`),
    slug: raw.slug?.trim() || "",
    name,
    description: readPgText(raw.description) || `Informasi resmi ${name} pada PORPROV XV Jawa Barat 2026.`,
    iconUrl: resolvePublicAssetUrl(raw.icon_url),
    heroImageUrl: resolvePublicAssetUrl(raw.hero_image_url),
    category: readPgText(raw.kategori) || "Pertandingan",
    totalMedals: readPgNumber(raw.total_medali),
    technicalDelegate: readPgText(raw.technical_delegate),
    status: readPgText(raw.status) || "Aktif",
  };
}

export function publicCaborPath(cabor: Pick<CaborModel, "id" | "slug">): string {
  return `/cabor/${encodeURIComponent(cabor.slug || cabor.id)}`;
}

export interface RawNomorTanding {
  id?: unknown;
  cabor_id?: unknown;
  name?: string;
  gender_category?: string;
  match_type?: string;
}

export interface NomorTandingModel {
  id: string;
  caborId: string;
  name: string;
  genderCategory: string;
  matchType: string;
}

export function normalizeNomorTanding(raw: RawNomorTanding, index = 0): NomorTandingModel {
  return {
    id: readResourceId(raw.id, `nomor-${index}`),
    caborId: readResourceId(raw.cabor_id, ""),
    name: raw.name?.trim() || "Nomor pertandingan",
    genderCategory: raw.gender_category?.trim() || "Terbuka",
    matchType: raw.match_type?.trim() || "Pertandingan",
  };
}

export interface RawVenueModel {
  id?: unknown;
  slug?: string;
  name?: string;
  image_url?: Parameters<typeof readPgText>[0];
  address?: Parameters<typeof readPgText>[0];
  latitude?: Parameters<typeof readPgNumber>[0];
  longitude?: Parameters<typeof readPgNumber>[0];
  map_route_url?: Parameters<typeof readPgText>[0];
  city_guide_ids?: unknown[] | null;
  cabor_ids?: unknown[] | null;
  capacity?: Parameters<typeof readPgNumber>[0];
  facilities?: Parameters<typeof readPgText>[0];
  readiness_status?: Parameters<typeof readPgText>[0];
}

export interface VenueModel {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  address: string;
  latitude: number;
  longitude: number;
  mapRouteUrl: string;
  cityGuideIds: string[];
  caborIds: string[];
  capacity: number;
  facilities: string;
  readinessStatus: string;
}

export function normalizeVenueModel(raw: RawVenueModel, index = 0): VenueModel {
  const name = raw.name?.trim() || "Venue PORPROV";
  return {
    id: readResourceId(raw.id, `venue-${index}`),
    slug: raw.slug?.trim() || "",
    name,
    imageUrl: resolvePublicAssetUrl(raw.image_url),
    address: readPgText(raw.address),
    latitude: readPgNumber(raw.latitude),
    longitude: readPgNumber(raw.longitude),
    mapRouteUrl: safeExternalUrl(raw.map_route_url),
    cityGuideIds: Array.isArray(raw.city_guide_ids) ? raw.city_guide_ids.map((id, itemIndex) => readResourceId(id, `city-guide-${itemIndex}`)) : [],
    caborIds: Array.isArray(raw.cabor_ids) ? raw.cabor_ids.map((id, itemIndex) => readResourceId(id, `cabor-${itemIndex}`)) : [],
    capacity: readPgNumber(raw.capacity),
    facilities: readPgText(raw.facilities),
    readinessStatus: readPgText(raw.readiness_status) || "Persiapan",
  };
}

export function publicVenuePath(venue: Pick<VenueModel, "id" | "slug">): string {
  return `/venue/${encodeURIComponent(venue.slug || venue.id)}`;
}

export interface RawCityGuide {
  id?: unknown;
  title?: string;
  category?: string;
  description?: Parameters<typeof readPgText>[0];
  address?: Parameters<typeof readPgText>[0];
  image_url?: Parameters<typeof readPgText>[0];
  latitude?: Parameters<typeof readPgNumber>[0];
  longitude?: Parameters<typeof readPgNumber>[0];
  map_route_url?: Parameters<typeof readPgText>[0];
  contact_phone?: Parameters<typeof readPgText>[0];
  whatsapp?: Parameters<typeof readPgText>[0];
  email?: Parameters<typeof readPgText>[0];
  website_url?: Parameters<typeof readPgText>[0];
  instagram_url?: Parameters<typeof readPgText>[0];
  facebook_url?: Parameters<typeof readPgText>[0];
  tiktok_url?: Parameters<typeof readPgText>[0];
  service_types?: unknown;
  service_area?: Parameters<typeof readPgText>[0];
  operating_hours?: Parameters<typeof readPgText>[0];
  price_range?: Parameters<typeof readPgText>[0];
  fleet_types?: unknown;
  fleet_count?: Parameters<typeof readPgNumber>[0];
}

export interface CityGuideModel {
  id: string;
  title: string;
  category: string;
  description: string;
  address: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  contactPhone: string;
  whatsapp: string;
  email: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  serviceTypes: string[];
  serviceArea: string;
  operatingHours: string;
  priceRange: string;
  fleetTypes: string[];
  fleetCount: number;
}

function hasPgNumber(value: Parameters<typeof readPgNumber>[0]): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "object") {
    const record = value as { Valid?: boolean; valid?: boolean };
    return (record.Valid ?? record.valid ?? true) !== false;
  }
  return true;
}

const googleMapsHosts = new Set([
  "google.com",
  "google.co.id",
  "goo.gl",
  "maps.app.goo.gl",
  "maps.google.co.id",
  "maps.google.com",
  "www.google.co.id",
  "www.google.com",
]);

function safeGoogleMapsRouteURL(value: Parameters<typeof readPgText>[0]): string {
  const candidate = readPgText(value).trim();
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    const standardMapsPath = parsed.pathname === "/maps" || parsed.pathname.startsWith("/maps/");
    return parsed.protocol === "https:"
      && !parsed.username
      && !parsed.password
      && !parsed.port
      && googleMapsHosts.has(host)
      && ((host === "maps.app.goo.gl" && parsed.pathname.length > 1)
        || host === "maps.google.com"
        || host === "maps.google.co.id"
        || standardMapsPath)
      ? candidate
      : "";
  } catch {
    return "";
  }
}

export function normalizeCityGuide(raw: RawCityGuide, index = 0): CityGuideModel {
  const latitude = readPgNumber(raw.latitude);
  const longitude = readPgNumber(raw.longitude);
  const hasCoordinates = hasPgNumber(raw.latitude) && hasPgNumber(raw.longitude);
  const configuredMapURL = safeGoogleMapsRouteURL(raw.map_route_url);
  return {
    id: readResourceId(raw.id, `city-guide-${index}`),
    title: raw.title?.trim() || "Panduan Kota Depok",
    category: raw.category?.trim() || "Informasi",
    description: readPgText(raw.description),
    address: readPgText(raw.address),
    imageUrl: resolvePublicAssetUrl(raw.image_url),
    latitude,
    longitude,
    mapUrl: configuredMapURL || (hasCoordinates ? `https://www.google.com/maps?q=${latitude},${longitude}+(${encodeURIComponent(raw.title?.trim() || "Panduan Kota Depok")})` : ""),
    contactPhone: readPgText(raw.contact_phone),
    whatsapp: readPgText(raw.whatsapp),
    email: readPgText(raw.email),
    websiteUrl: safeExternalUrl(raw.website_url),
    instagramUrl: safeExternalUrl(raw.instagram_url),
    facebookUrl: safeExternalUrl(raw.facebook_url),
    tiktokUrl: safeExternalUrl(raw.tiktok_url),
    serviceTypes: Array.isArray(raw.service_types) ? raw.service_types.filter((value): value is string => typeof value === "string" && value.trim().length > 0) : [],
    serviceArea: readPgText(raw.service_area),
    operatingHours: readPgText(raw.operating_hours),
    priceRange: readPgText(raw.price_range),
    fleetTypes: Array.isArray(raw.fleet_types) ? raw.fleet_types.filter((value): value is string => typeof value === "string" && value.trim().length > 0) : [],
    fleetCount: readPgNumber(raw.fleet_count),
  };
}

export interface EnrichedParticipant {
  id: string;
  participant_type: "individual" | "team" | "contingent";
  kontingen_id: string;
  kontingen_name: string;
  kontingen_logo_url: string;
  athlete_name: string;
  team_name: string;
  slot: number;
  display_name: string;
}

export interface RawEnrichedMatch {
  id?: unknown;
  nomor_tanding_id?: unknown;
  nomor_tanding_name?: string;
  cabor_id?: unknown;
  cabor_name?: string;
  cabor_icon_url?: string;
  gender_category?: string;
  match_type?: string;
  venue_id?: unknown;
  venue_name?: string;
  venue_address?: string;
  venue_map_route_url?: string;
  match_date?: Parameters<typeof readPgTimestamp>[0];
  status?: string;
  round?: string;
  participants?: EnrichedParticipant[] | null;
}

export interface EnrichedMatch {
  id: string;
  nomorTandingId: string;
  nomorTandingName: string;
  caborId: string;
  caborName: string;
  caborIconUrl: string;
  genderCategory: string;
  matchType: string;
  venueId: string;
  venueName: string;
  venueAddress: string;
  venueMapRouteUrl: string;
  matchDate: string;
  status: string;
  round: string;
  participants: EnrichedParticipant[];
}

export function normalizeEnrichedMatch(raw: RawEnrichedMatch, index = 0): EnrichedMatch {
  return {
    id: readResourceId(raw.id, `match-${index}`),
    nomorTandingId: readResourceId(raw.nomor_tanding_id, ""),
    nomorTandingName: raw.nomor_tanding_name?.trim() || "Nomor pertandingan",
    caborId: readResourceId(raw.cabor_id, ""),
    caborName: raw.cabor_name?.trim() || "Cabang olahraga",
    caborIconUrl: resolvePublicAssetUrl(raw.cabor_icon_url),
    genderCategory: raw.gender_category?.trim() || "Terbuka",
    matchType: raw.match_type?.trim() || "Pertandingan",
    venueId: readResourceId(raw.venue_id, ""),
    venueName: raw.venue_name?.trim() || "Venue menunggu konfirmasi",
    venueAddress: raw.venue_address?.trim() || "",
    venueMapRouteUrl: safeExternalUrl(raw.venue_map_route_url),
    matchDate: readPgTimestamp(raw.match_date),
    status: raw.status?.trim() || "Belum mulai",
    round: raw.round?.trim() || "Tahap pertandingan",
    participants: Array.isArray(raw.participants) ? raw.participants : [],
  };
}

export interface RawKontingen {
  id?: unknown;
  name?: string;
  logo_url?: Parameters<typeof readPgText>[0];
}

export interface KontingenModel {
  id: string;
  name: string;
  logoUrl: string;
}

export function normalizeKontingen(raw: RawKontingen, index = 0): KontingenModel {
  return {
    id: readResourceId(raw.id, `kontingen-${index}`),
    name: raw.name?.trim() || "Kontingen PORPROV",
    logoUrl: resolvePublicAssetUrl(raw.logo_url),
  };
}
