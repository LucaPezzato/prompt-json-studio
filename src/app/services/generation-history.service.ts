import { Injectable, signal } from '@angular/core';
import { SavedGenerationItem } from '../models/prompt.model';

const DB_NAME = 'prompt_json_studio_generations_db_v1';
const STORE_NAME = 'generations';
const DB_VERSION = 1;

@Injectable({
  providedIn: 'root',
})
export class GenerationHistoryService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  readonly items = signal<SavedGenerationItem[]>([]);
  readonly loading = signal<boolean>(false);

  constructor() {
    this.init().then(() => this.loadAll());
  }

  private init(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('subjectName', 'subjectName', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('characterId', 'characterId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  async loadAll(): Promise<SavedGenerationItem[]> {
    this.loading.set(true);
    try {
      const db = await this.init();
      return new Promise<SavedGenerationItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list: SavedGenerationItem[] = req.result || [];
          list.sort((a, b) => b.timestamp - a.timestamp);
          this.items.set(list);
          this.loading.set(false);
          resolve(list);
        };

        req.onerror = () => {
          this.loading.set(false);
          reject(req.error);
        };
      });
    } catch (e) {
      console.warn('Failed to load generations from IndexedDB:', e);
      this.loading.set(false);
      return [];
    }
  }

  async addGeneration(item: SavedGenerationItem): Promise<void> {
    try {
      const db = await this.init();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(item);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      this.items.update((cur) => [item, ...cur.filter((x) => x.id !== item.id)]);
    } catch (e) {
      console.error('Failed to save generation to IndexedDB:', e);
    }
  }

  async deleteGeneration(id: string): Promise<void> {
    try {
      const db = await this.init();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      this.items.update((cur) => cur.filter((x) => x.id !== id));
    } catch (e) {
      console.error('Failed to delete generation from IndexedDB:', e);
    }
  }

  async deleteBySubject(subjectName: string): Promise<void> {
    try {
      const targets = this.items().filter((x) => x.subjectName === subjectName);
      for (const t of targets) {
        await this.deleteGeneration(t.id);
      }
    } catch (e) {
      console.error('Failed to delete subject generations:', e);
    }
  }

  async clearAll(): Promise<void> {
    try {
      const db = await this.init();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      this.items.set([]);
    } catch (e) {
      console.error('Failed to clear generations from IndexedDB:', e);
    }
  }

  downloadImage(item: SavedGenerationItem): void {
    const a = document.createElement('a');
    a.href = item.dataUrl;
    const cleanSub = (item.subjectName || 'scatto').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const dateStr = new Date(item.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `${cleanSub}_${dateStr}.png`;
    a.click();
  }

  exportConfigJson(item: SavedGenerationItem): void {
    const exportData = {
      meta: {
        exported_at: new Date().toISOString(),
        id: item.id,
        subject: item.subjectName,
        model: item.model,
        aspect_ratio: item.aspectRatio,
        prompt: item.prompt,
      },
      spec: item.specSnapshot,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanSub = (item.subjectName || 'config').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `${cleanSub}_config_${item.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
