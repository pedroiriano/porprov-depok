import type { CityGuideModel } from "@/lib/public-models";

export type NearbyCategoryKey =
  | "tempat-menginap"
  | "pusat-perbelanjaan"
  | "wisata-kuliner"
  | "coffee-shop"
  | "rumah-sakit"
  | "lainnya";

export interface NearbyCityGuide extends CityGuideModel {
  distanceKm?: number;
  nearbyCategoryKey: NearbyCategoryKey;
  nearbyCategoryLabel: string;
}

interface NearbyCategoryDefinition {
  key: NearbyCategoryKey;
  label: string;
  matches: (normalizedCategory: string) => boolean;
}

const normalizeCategory = (category: string) => category
  .trim()
  .toLocaleLowerCase("id-ID")
  .replace(/[_-]+/g, " ")
  .replace(/\s+/g, " ");

const primaryCategoryMatchers = {
  "tempat-menginap": (category: string) => category === "tempat menginap" || category.includes("hotel") || category.includes("penginapan"),
  "pusat-perbelanjaan": (category: string) => category === "pusat perbelanjaan" || category.includes("mal") || category.includes("mall"),
  "wisata-kuliner": (category: string) => category === "wisata kuliner" || category === "kuliner",
  "coffee-shop": (category: string) => category === "coffee shop" || category.includes("kedai kopi") || category === "kafe",
  "rumah-sakit": (category: string) => category === "rumah sakit" || category.includes("hospital"),
} satisfies Record<Exclude<NearbyCategoryKey, "lainnya">, (category: string) => boolean>;

const isPrimaryCategory = (category: string) => Object.values(primaryCategoryMatchers)
  .some((matches) => matches(category));

export const nearbyCategoryDefinitions: NearbyCategoryDefinition[] = [
  { key: "tempat-menginap", label: "Tempat Menginap", matches: primaryCategoryMatchers["tempat-menginap"] },
  { key: "pusat-perbelanjaan", label: "Pusat Perbelanjaan", matches: primaryCategoryMatchers["pusat-perbelanjaan"] },
  { key: "wisata-kuliner", label: "Wisata Kuliner", matches: primaryCategoryMatchers["wisata-kuliner"] },
  { key: "coffee-shop", label: "Coffee Shop", matches: primaryCategoryMatchers["coffee-shop"] },
  { key: "rumah-sakit", label: "Rumah Sakit", matches: primaryCategoryMatchers["rumah-sakit"] },
  { key: "lainnya", label: "Lainnya", matches: (category) => !isPrimaryCategory(category) },
];

const hasCoordinates = (latitude: number, longitude: number) => Number.isFinite(latitude)
  && Number.isFinite(longitude)
  && !(latitude === 0 && longitude === 0);

// INFO: Haversine memberikan jarak garis lurus yang konsisten untuk pemeringkatan lokasi.
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lon2 - lon1);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function selectNearestCityGuidesByCategory(
  guides: CityGuideModel[],
  venueLatitude: number,
  venueLongitude: number,
  linkedGuideIds: string[] = [],
): NearbyCityGuide[] {
  const venueHasCoordinates = hasCoordinates(venueLatitude, venueLongitude);
  const linkedIds = new Set(linkedGuideIds);

  const rankedGuides = guides
    .filter((guide) => !venueHasCoordinates || hasCoordinates(guide.latitude, guide.longitude))
    .map((guide) => ({
      ...guide,
      distanceKm: venueHasCoordinates
        ? getDistanceKm(venueLatitude, venueLongitude, guide.latitude, guide.longitude)
        : undefined,
    }))
    .sort((first, second) => {
      if (venueHasCoordinates) {
        const distanceComparison = (first.distanceKm ?? Number.POSITIVE_INFINITY)
          - (second.distanceKm ?? Number.POSITIVE_INFINITY);
        if (distanceComparison !== 0) return distanceComparison;
      } else {
        const linkedComparison = Number(linkedIds.has(second.id)) - Number(linkedIds.has(first.id));
        if (linkedComparison !== 0) return linkedComparison;
      }
      return first.title.localeCompare(second.title, "id-ID");
    });

  return nearbyCategoryDefinitions.flatMap((definition) => {
    const selected = rankedGuides.find((guide) => definition.matches(normalizeCategory(guide.category)));
    return selected ? [{
      ...selected,
      nearbyCategoryKey: definition.key,
      nearbyCategoryLabel: definition.label,
    }] : [];
  });
}
