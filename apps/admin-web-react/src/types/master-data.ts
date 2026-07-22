export interface MediaAsset {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Cabor {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  kategori: string | null;
  total_medali: number | null;
  technical_delegate: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface NomorTanding {
  id: string;
  cabor_id: string;
  name: string;
  gender_category: string;
  match_type: string;
  created_at: string;
  updated_at: string;
}

export interface Kontingen {
  id: string;
  name: string;
  region_type: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  image_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  map_route_url: string | null;
  city_guide_ids: string[] | null;
  cabor_ids: string[] | null;
  capacity: number | null;
  facilities: string | null;
  readiness_status: string | null;
  contact_person: string | null;
  created_at: string;
  updated_at: string;
}

export type ParticipantType = 'individual' | 'team' | 'contingent';

export interface MatchParticipant {
  id?: string;
  participant_type: ParticipantType;
  kontingen_id: string;
  kontingen_name?: string;
  kontingen_logo_url?: string;
  athlete_name: string;
  team_name: string;
  slot: number;
  display_name?: string;
}

export interface MatchSchedule {
  id: string;
  nomor_tanding_id: string;
  venue_id: string;
  match_date: string;
  status: string;
  round: string;
  cabor_name?: string;
  nomor_tanding_name?: string;
  venue_name?: string;
  participants?: MatchParticipant[];
  created_at: string;
  updated_at: string;
}

export type DeletedEntityType = 'cabor' | 'nomor_tanding' | 'kontingen' | 'city_guide' | 'media' | 'venue' | 'match';

export interface DeletedRecord {
  entity_type: DeletedEntityType;
  id: string;
  display_name: string;
  deleted_at: string;
  deleted_by: string | null;
  delete_reason: string | null;
}
