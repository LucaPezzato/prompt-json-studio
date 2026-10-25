import { Injectable, signal } from '@angular/core';
import { isTauri, invoke } from '@tauri-apps/api/core';

export interface DesktopSaveResult {
  image_path: string;
  json_path: string;
  folder_path: string;
}

@Injectable({
  providedIn: 'root',
})
export class DesktopService {
  readonly isDesktopApp = signal<boolean>(false);
  readonly storagePath = signal<string>('~/Pictures/PromptStudio');

  constructor() {
    try {
      const runningInTauri = isTauri();
      this.isDesktopApp.set(runningInTauri);
      if (runningInTauri) {
        invoke<string>('get_storage_path')
          .then((path) => {
            if (path) this.storagePath.set(path);
          })
          .catch((e) => console.warn('Could not query storage path:', e));
      }
    } catch {
      this.isDesktopApp.set(false);
    }
  }

  async saveGeneration(
    subjectName: string,
    filenamePrefix: string,
    imageDataUrl: string,
    configJson: string
  ): Promise<DesktopSaveResult | null> {
    if (!this.isDesktopApp()) return null;
    try {
      return await invoke<DesktopSaveResult>('save_generation_to_disk', {
        subjectName,
        filenamePrefix,
        imageDataUrl,
        configJson,
      });
    } catch (e) {
      console.error('Error saving generation directly to disk in Tauri:', e);
      return null;
    }
  }

  async openFolder(subject?: string): Promise<void> {
    if (!this.isDesktopApp()) return;
    try {
      await invoke('open_storage_folder', { subject: subject || null });
    } catch (e) {
      console.error('Error opening storage folder:', e);
    }
  }
}
