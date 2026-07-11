import { createClient } from "@supabase/supabase-js";

// Public anon/publishable key — safe to expose client-side.
// Access is governed by Row Level Security policies on the Supabase project.
// Dedicated Supabase project for WISE Analytics Projects — separate from DPMS.
const SUPABASE_URL = "https://foqhmxegxkhiujwmlcua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SdvYzXz2N-74KYYSii48kg_FuMeUHlp";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export type ProjectCategory =
  | "Construction Management"
  | "Water System Design and Operation"
  | "Local Development Planning"
  | "Municipal Intelligence";

export type ProjectStatus = "Planning" | "Ongoing" | "On Hold" | "Completed";

export interface WaProject {
  id: string;
  name: string;
  category: ProjectCategory;
  client: string | null;
  location: string | null;
  status: ProjectStatus;
  progress: number;
  start_date: string | null;
  target_end_date: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES: ProjectCategory[] = [
  "Construction Management",
  "Water System Design and Operation",
  "Local Development Planning",
  "Municipal Intelligence",
];

export const STATUSES: ProjectStatus[] = [
  "Planning",
  "Ongoing",
  "On Hold",
  "Completed",
];
