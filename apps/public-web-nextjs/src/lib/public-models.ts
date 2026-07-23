import {
  readPgNumber,
  readPgText,
  readPgTimestamp,
  readResourceId,
  resolvePublicAssetUrl,
  safeExternalUrl,
} from "@/lib/public-api";

export interface RawCabor {
  id?: unknown;
  name?: string;
  description?: Parameters<typeof readPgText>[0];
  icon_url?: Parameters<typeof readPgText>[0];
  kategori?: Parameters<typeof readPgText>[0];
  total_medali?: Parameters<typeof readPgNumber>[0];
  technical_delegate?: Parameters<typeof readPgText>[0];
  status?: Parameters<typeof readPgText>[0];
}

export interface CaborModel {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  totalMedals: number;
  technicalDelegate: string;
  status: string;
}

export function normalizeCabor(raw: RawCabor, index = 0): CaborModel {
  const name = raw.name?.trim() || "Cabang Olahraga PORPROV";
  return {
    id: readResourceId(raw.id, `cabor-${index}`),
    name,
    description: readPgText(raw.description) || `Informasi resmi ${name} pada PORPROV XV Jawa Barat 2026.`,
    iconUrl: resolvePublicAssetUrl(raw.icon_url),
    category: readPgText(raw.kategori) || "Pertandingan",
    totalMedals: readPgNumber(raw.total_medali),
    technicalDelegate: readPgText(raw.technical_delegate),
    status: readPgText(raw.status) || "Aktif",
  };
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

export interface RawCityGuide {
  id?: unknown;
  title?: string;
  category?: string;
  description?: Parameters<typeof readPgText>[0];
  address?: Parameters<typeof readPgText>[0];
  image_url?: Parameters<typeof readPgText>[0];
  latitude?: Parameters<typeof readPgNumber>[0];
  longitude?: Parameters<typeof readPgNumber>[0];
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

export function normalizeCityGuide(raw: RawCityGuide, index = 0): CityGuideModel {
  const latitude = readPgNumber(raw.latitude);
  const longitude = readPgNumber(raw.longitude);
  const hasCoordinates = hasPgNumber(raw.latitude) && hasPgNumber(raw.longitude);
  return {
    id: readResourceId(raw.id, `city-guide-${index}`),
    title: raw.title?.trim() || "Panduan Kota Depok",
    category: raw.category?.trim() || "Informasi",
    description: readPgText(raw.description),
    address: readPgText(raw.address),
    imageUrl: resolvePublicAssetUrl(raw.image_url),
    latitude,
    longitude,
    mapUrl: hasCoordinates ? `https://www.google.com/maps?q=${latitude},${longitude}` : "",
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
