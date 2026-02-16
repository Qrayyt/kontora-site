export const LS_KEY = "kontora.catalog.override.v2";

const defaultCatalog = { currency: "₽", items: [] };

const firebaseConfig = {
  apiKey: window.KONTORA_FIREBASE_API_KEY || "",
  authDomain: window.KONTORA_FIREBASE_AUTH_DOMAIN || "",
  projectId: window.KONTORA_FIREBASE_PROJECT_ID || "",
};

const hasFirebaseCreds = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

async function loadFromFirebase() {
  if (!hasFirebaseCreds || !window.firebase?.firestore) return null;
  try {
    const db = firebase.firestore();
    const snap = await db.collection("site").doc("catalog").get();
    if (!snap.exists) return null;
    const data = snap.data();
    return data && Array.isArray(data.items) ? data : null;
  } catch {
    return null;
  }
}

async function saveToFirebase(catalog) {
  if (!hasFirebaseCreds || !window.firebase?.firestore) return false;
  try {
    const db = firebase.firestore();
    await db.collection("site").doc("catalog").set(catalog, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export function getFirebaseStatus() {
  return hasFirebaseCreds;
}

export async function loadCatalog() {
  const base = await fetch("/catalog.json", { cache: "no-store" }).then(r => r.json()).catch(() => defaultCatalog);
  const cloud = await loadFromFirebase();
  if (cloud) return cloud;

  const localRaw = localStorage.getItem(LS_KEY);
  if (!localRaw) return base;

  try {
    const parsed = JSON.parse(localRaw);
    return parsed && Array.isArray(parsed.items) ? parsed : base;
  } catch {
    return base;
  }
}

export async function saveCatalog(catalog) {
  localStorage.setItem(LS_KEY, JSON.stringify(catalog, null, 2));
  return saveToFirebase(catalog);
}

export function clearLocalOverride() {
  localStorage.removeItem(LS_KEY);
}
