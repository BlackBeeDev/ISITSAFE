import { supabase } from "@/lib/supabase";
import type { ScanRecord } from "@/services/types";

const globalStore = globalThis as typeof globalThis & {
  isItSafeScans?: Map<string, ScanRecord>;
};

const memoryStore = globalStore.isItSafeScans ?? new Map<string, ScanRecord>();
globalStore.isItSafeScans = memoryStore;

export async function saveScan(record: ScanRecord) {
  memoryStore.set(record.id, record);

  if (!supabase) {
    return record;
  }

  const { error } = await supabase.from("scans").insert(record);
  if (error) {
    console.error("Supabase insert failed", error);
  }

  return record;
}

export async function findScan(id: string) {
  const localRecord = memoryStore.get(id);
  if (localRecord) {
    return localRecord;
  }

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as ScanRecord;
}
