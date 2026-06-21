import { supabase } from "@/lib/supabase";
import { decodeScanToken } from "@/services/token";
import type { ScanRecord } from "@/services/types";

const memoryStore = new Map<string, ScanRecord>();

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
  // Prefer sources that still have the screenshot - the token decode below
  // is a lossy fallback (it never carries the screenshot) used only when
  // nothing richer is available.
  const localRecord = memoryStore.get(id);
  if (localRecord) {
    return localRecord;
  }

  if (supabase) {
    const { data } = await supabase.from("scans").select("*").eq("id", id).single();
    if (data) {
      return data as ScanRecord;
    }
  }

  return decodeScanToken(id);
}
