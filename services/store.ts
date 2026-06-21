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
  const localRecord = memoryStore.get(id);
  if (localRecord) {
    return localRecord;
  }

  const decoded = decodeScanToken(id);
  if (decoded) {
    return decoded;
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
