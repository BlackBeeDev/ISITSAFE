import { findScan } from "@/services/store";

export async function getScanResult(id: string) {
  return findScan(id);
}
