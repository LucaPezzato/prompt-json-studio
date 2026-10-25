<div align="center">

# 🎨 Prompt JSON Studio

**Visual Structured JSON Prompt Generator & Multi-Model Compiler for AI Image Generation**

[![Angular 21](https://img.shields.io/badge/Angular-21.2-dd0031.svg?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![Zoneless Signals](https://img.shields.io/badge/Architecture-100%25_Zoneless_Signals-bd93f9.svg?style=for-the-badge)](https://angular.dev/guide/signals)
[![Theme: Dracula](https://img.shields.io/badge/Theme-Dracula-f1fa8c.svg?style=for-the-badge)](https://draculatheme.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-8be9fd.svg?style=for-the-badge)](LICENSE)

<br/>

*Designed for **GPT-4o (DALL-E 3)**, **Gemini / Imagen 3 (Nano Banana)**, **FLUX.1 / FLUX.2**, **Midjourney v6/v7**, and **Stable Diffusion XL (SDXL)**.*

</div>

---

## ✨ Features

- 🧩 **100% Signal-Based Architecture in Angular 21**:
  - Full modern Angular reactive primitives: `signal()`, `computed()`, `effect()`, `input()`, `output()`, `model()`.
  - **Zoneless change detection** (`provideZonelessChangeDetection()`): ultra-lightweight, zero Zone.js overhead, instantaneous UI responsiveness.
- 🎯 **Eliminates "Concept Bleeding" via Hierarchical JSON**:
  - Organizes prompt specifications into isolated blocks: **Subject**, **Scene**, **Camera & Optics**, **Lighting & Palette**, **Composition**, **Style & Rendering**, **Text-in-Image Typography**, and **Technical Parameters**.
- 🛠️ **Fully Extensible (Aggiungi elementi personalizzati)**:
  - Add your own custom elements to any preset category and persist them in `localStorage`.
  - Add arbitrary custom JSON properties or custom blocks at the root or inside any section.
- ⚡ **Multi-Engine Live Compiler**:
  - **Structured JSON**: Clean JSON representation ready to paste into GPT-4o, Gemini Imagen 3, FLUX, ComfyUI, or API pipelines.
  - **FLUX.1 / FLUX.2**: Natural hierarchical prompt formatted for T5 encoders.
  - **Midjourney v6 / v7**: Tokenized prompt with native CLI flags (`--ar`, `--s`, `--c`, `--seed`, `--no`, `--style raw`).
  - **GPT-4o / Gemini**: Narrative instruction brief with embedded JSON schema.
  - **Stable Diffusion XL (SDXL)**: Positive prompt with tag weights + negative prompt.
- 🎨 **Dracula Design & Interactive Palette Builder**:
  - Interactive HEX color picker, pre-packaged cinematic palettes, and live JSON syntax highlighter with color swatches.
- 📚 **Template Library & Presets**:
  - Curated studio templates (*Cyberpunk Noir Portrait*, *Luxury Product Studio*, *Isometric 3D Cozy Diorama*, *Dark Fantasy Concept Art*).
  - Save, export, and import your own presets in the browser.
- ✨ **"Magic Expand" AI Assistant**:
  - Type a 5-word concept (e.g. *"gatto astronauta su Marte al tramonto"*) and expand it automatically into all structured JSON fields.
  - Works **offline** with a smart heuristic analyzer, or connects to **Google Gemini**, **OpenAI**, **OpenRouter**, or **Local Ollama** (`http://localhost:11434`) using your own client-side API key.
- 👤 **Dedicated Character Studio (AI Influencer & Consistency)**:
  - Generate multi-angle Character Reference Sheets (front, 3/4 profile, profile, candid action).
  - Ground characters with explicit physical traits (heterochromia, age, hair, body contours, styling).
  - Bind characters into any photographic scene while enforcing exact appearance consistency.
- 🖥️ **Native Desktop App (Tauri v2 + Rust)** & Local Storage:
  - Runs natively on Linux (Hyprland / Wayland / X11) or as a Web App.
  - **Auto-Archiving directly to disk**: every generation automatically saves both the high-res `.png` and the complete `.json` prompt snapshot into `~/Pictures/PromptStudio/<Soggetto>/`.
  - **Archivio Scatti & Gallery**: filter by subject, search prompts, restore previous setups (`↺ Ripristina Setup`), or open the local folder directly via `xdg-open`.
  - Native Linux `.desktop` launcher and icon included.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/LucaPezzato/prompt-json-studio.git
cd prompt-json-studio

# Install dependencies
npm install

# Start development server
npm start
```

Visit `http://localhost:4200` in your browser.

### 🖥️ Desktop App (Linux / Tauri v2)

```bash
# Run as native desktop application
npm run desktop

# Or launch directly from the application launcher / terminal:
prompt-json-studio
```
When running as desktop app, generations are saved automatically to `~/Pictures/PromptStudio/<Soggetto>/<timestamp>_<modello>.png` with accompanying `.json` configuration files.

---

## 🌐 Deploy to GitHub Pages (pezzato.dev)

A GitHub Actions workflow is included at `.github/workflows/deploy.yml`.

To deploy to GitHub Pages:
1. In your GitHub repository settings, go to **Pages** -> **Source** and select **GitHub Actions**.
2. If using a custom domain (e.g. `pezzato.dev` or `prompt.pezzato.dev`), enter it in the Custom Domain field.
3. Every push to `main` builds and deploys the app automatically.

To build manually:
```bash
npm run build:gh-pages
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE).
