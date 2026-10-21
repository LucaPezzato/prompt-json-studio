import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection(), provideBrowserGlobalErrorListeners()],
}).catch((err) => console.error(err));
