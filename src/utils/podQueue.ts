/**
 * podQueue — Phase 17 (Task #81)
 *
 * Drivers complete a POD on their phone. The phone may or may not have
 * signal. We persist every POD into IndexedDB locally before attempting
 * to upload to Supabase, so:
 *
 *   • Reloading the page doesn't lose anything.
 *   • Going offline mid-shift doesn't lose anything.
 *   • Coming back online retries automatically.
 *
 * IndexedDB is preferred over localStorage because POD payloads carry a
 * base64 signature + photos and can run to a couple of megabytes — that
 * blows past the ~5MB localStorage cap on mobile Safari.
 *
 * We deliberately ship a hand-rolled tiny wrapper instead of pulling in
 * `idb` — keeping the dependency surface small matters for the PWA bundle
 * that drivers actually download.
 */

import { ProofOfDelivery } from '../types';

const DB_NAME = 'jomopak-pod-queue';
const DB_VERSION = 1;
const STORE = 'pods';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePodLocally(pod: ProofOfDelivery): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(pod);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadQueuedPods(): Promise<ProofOfDelivery[]> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as ProofOfDelivery[]);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removePodLocally(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

/** Best-effort GPS capture. Resolves with zeroed coords when permission is
 *  denied or the API is missing, rather than rejecting — the driver still
 *  needs to be able to submit the POD even without location services. */
export function captureGps(timeoutMs = 8000): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ lat: 0, lng: 0, accuracy: 0 });
      return;
    }
    const fallback = setTimeout(() => resolve({ lat: 0, lng: 0, accuracy: 0 }), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallback);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        clearTimeout(fallback);
        resolve({ lat: 0, lng: 0, accuracy: 0 });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}
