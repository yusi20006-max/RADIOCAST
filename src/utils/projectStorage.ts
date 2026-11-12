import type { PodcastEpisode } from '../types/podcast';

const DB_NAME = 'radiocast-projects';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

function openProjectDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('بازکردن فضای ذخیره پروژه‌ها ناموفق بود.'));
  });
}

export async function loadProjects(): Promise<PodcastEpisode[]> {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      db.close();
      resolve((request.result as PodcastEpisode[]).sort((a, b) => (b.lastUpdatedAt || b.createdAt) - (a.lastUpdatedAt || a.createdAt)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('خواندن پروژه‌ها ناموفق بود.'));
    };
  });
}

export async function saveProject(project: PodcastEpisode): Promise<void> {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ ...project, lastUpdatedAt: Date.now() });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('ذخیره خودکار پروژه ناموفق بود.')); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('ذخیره پروژه لغو شد.')); };
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(projectId);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('حذف پروژه ناموفق بود.')); };
  });
}
