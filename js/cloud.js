// Optional Google sign-in with progress sync through Firebase (Auth + Firestore).
// Local progress stays the source the app reads. Every sync is "pull, merge,
// push if something differs": after each change (debounced), when the tab
// becomes visible, when the network returns, and every minute while visible.
// A failed sync retries with backoff. The cloud document is gzip-compressed
// (Firestore documents are capped at 1 MiB). Without a config, or offline,
// everything keeps working from localStorage.

import { firebaseConfig } from './firebase-config.js';
import { progress } from './progress.js';

const HINT = 'gibernoot.signedin', OLD_HINT = 'dg2gr.signedin'; // set once the user signs in, so we restore the session on load
const hasHint = () => { try { return (localStorage.getItem(HINT) ?? localStorage.getItem(OLD_HINT)) === '1'; } catch { return false; } };
const setHint = on => { try { on ? localStorage.setItem(HINT, '1') : (localStorage.setItem(HINT, '0'), localStorage.removeItem(OLD_HINT)); } catch { /* ignore */ } };

export const cloudConfigured = !!firebaseConfig;

const status = { user: null, sync: 'idle', error: null, last: null, bytes: 0 }; // sync: idle | syncing | synced | error; last: ms of the last good sync
const subs = new Set();
const emit = () => subs.forEach(fn => fn({ ...status }));
export function onCloudChange(fn) { subs.add(fn); fn({ ...status }); return () => subs.delete(fn); }

let fb = null, auth = null, db = null, pushTimer = null, retryTimer = null, retries = 0, started = false, attached = false;
const SIZE_LIMIT = 900_000, POLL_MS = 60_000, STUB = '{"lessons":{},"cards":{}}'; // STUB: old app copies still parse `progress`

async function load() {
  if (fb) return fb;
  fb = await import('../vendor/firebase.js');
  const app = fb.initializeApp(firebaseConfig);
  auth = fb.getAuth(app);
  db = fb.getFirestore(app);
  return fb;
}

const ref = () => fb.doc(db, 'users', status.user.uid);

// gzip + base64 through the browser's CompressionStream (plain JSON where it is missing).
const toB64 = u8 => { let t = ''; for (let i = 0; i < u8.length; i += 0x8000) t += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(t); };
const fromB64 = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

async function encode(json) {
  if (typeof CompressionStream === 'function') {
    const z = toB64(await pipe(new TextEncoder().encode(json), new CompressionStream('gzip')));
    if (z.length > SIZE_LIMIT) throw new Error(`Progress is too large to sync (${Math.round(z.length / 1000)} kB, limit ~1000 kB)`);
    return { progress: STUB, z, updated: Date.now() };
  }
  if (json.length > SIZE_LIMIT) throw new Error(`Progress is too large to sync without compression (${Math.round(json.length / 1000)} kB); update your browser`);
  return { progress: json, updated: Date.now() };
}

async function decode(data) {
  if (data.z) return new TextDecoder().decode(await pipe(fromB64(data.z), new DecompressionStream('gzip')));
  return data.progress;
}

// Merge the cloud copy into the local state; returns the cloud text (null if there is no document).
async function pull() {
  const snap = await fb.getDoc(ref());
  if (!snap.exists()) return null;
  const text = await decode(snap.data());
  progress.mergeRemote(JSON.parse(text));
  return text;
}

async function push(remoteText = null) {
  if (!status.user) return;
  const json = JSON.stringify(progress.snapshot());
  if (json === remoteText) return; // the cloud already holds exactly this
  const doc = await encode(json);
  status.bytes = (doc.z ?? doc.progress).length;
  await fb.setDoc(ref(), doc);
}

async function run(fn) {
  clearTimeout(retryTimer);
  status.sync = 'syncing'; status.error = null; emit();
  try { await fn(); status.sync = 'synced'; status.last = Date.now(); retries = 0; }
  catch (err) {
    status.sync = 'error'; status.error = err.message; console.error(err);
    retryTimer = setTimeout(() => status.user && run(syncNow), Math.min(5000 * 3 ** retries++, 300000));
  }
  emit();
}

const syncNow = async () => push(await pull());
export const syncCloudNow = () => status.user && run(syncNow);

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => status.user && run(syncNow), 1500);
}

// Call once at startup. Loads Firebase only if the user signed in before.
export async function initCloud() {
  if (!cloudConfigured || started) return;
  started = true;
  if (!hasHint()) return;
  await attach();
}

async function attach() {
  if (attached) return;
  try {
    await load();
  } catch (err) { status.sync = 'error'; status.error = 'Could not load sign-in (offline?)'; emit(); return; }
  attached = true;
  fb.onAuthStateChanged(auth, user => {
    status.user = user ? { uid: user.uid, name: user.displayName, email: user.email, photo: user.photoURL } : null;
    setHint(!!user);
    emit();
    if (user) run(syncNow);
  });
  progress.onChange(schedulePush);
  const visible = () => document.visibilityState === 'visible';
  document.addEventListener('visibilitychange', () => { if (visible() && status.user) run(syncNow); });
  window.addEventListener('online', () => status.user && run(syncNow));
  setInterval(() => { if (visible() && status.user && status.sync !== 'syncing') run(syncNow); }, POLL_MS);
}

// Load Firebase ahead of the click: browsers only allow the sign-in popup if it
// opens right inside the tap, so nothing may be awaited before signInWithPopup.
export function preloadCloud() { if (cloudConfigured) { started = true; return attach(); } }

export async function signIn() {
  if (!attached) await attach(); // slow path only; may be blocked on phones
  setHint(true);
  try {
    await fb.signInWithPopup(auth, new fb.GoogleAuthProvider());
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
    if (err.code === 'auth/popup-blocked') throw new Error('The browser blocked the sign-in window. Allow pop-ups for this site and tap the button again.');
    throw err;
  }
}

// Push right away (used after a reset, so a reload cannot pull the old copy back).
export async function flushCloud() {
  clearTimeout(pushTimer);
  if (status.user) await run(push);
}

export async function signOutUser() {
  if (status.user) await run(push);
  await fb.signOut(auth);
}
