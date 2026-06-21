import { supabase } from "@/lib/supabase";
import type { ForwardedEmailRecord, ScanRecord } from "@/services/types";

const globalStore = globalThis as typeof globalThis & {
  isItSafeScans?: Map<string, ScanRecord>;
  isItSafeForwardedEmails?: Map<string, ForwardedEmailRecord>;
};

const memoryStore = globalStore.isItSafeScans ?? new Map<string, ScanRecord>();
globalStore.isItSafeScans = memoryStore;
const forwardedEmailStore =
  globalStore.isItSafeForwardedEmails ?? new Map<string, ForwardedEmailRecord>();
globalStore.isItSafeForwardedEmails = forwardedEmailStore;

export async function saveScan(record: ScanRecord) {
  memoryStore.set(record.id, record);

  if (!supabase) {
    return record;
  }

  const { error } = await supabase.from("scans").insert(record);
  if (error) {
    if (isMissingVideoColumn(error.message)) {
      const { video: _video, ...recordWithoutVideo } = record;
      const retry = await supabase.from("scans").insert(recordWithoutVideo);
      if (retry.error) {
        console.error("Supabase insert failed", retry.error);
      }
    } else {
      console.error("Supabase insert failed", error);
    }
  }

  return record;
}

function isMissingVideoColumn(message: string) {
  return /video|schema cache|column/i.test(message);
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

export async function saveForwardedEmail(record: ForwardedEmailRecord) {
  forwardedEmailStore.set(record.id, record);

  if (!supabase) {
    return record;
  }

  const { error } = await supabase.from("forwarded_emails").insert(record);
  if (error) {
    console.error("Supabase forwarded email insert failed", error);
  }

  return record;
}
