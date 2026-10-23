# Tools ¯\\_(ツ)_/¯

[![Check ESLint](https://github.com/ducng99/tools/actions/workflows/lint.yml/badge.svg)](https://github.com/ducng99/tools/actions/workflows/lint.yml)
[![CodeQL](https://github.com/ducng99/tools/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/ducng99/tools/actions/workflows/github-code-scanning/codeql)

A Solid app containing various very-simple client-side tools. Created by me, or AI (but mostly me - just trust me bro 🙄)

No tracking, no cookies, no data send out. All processing is done in your browser. All tools can work offline (if all pages are loaded).

See all: <https://tools.ducng.dev>

_This is just a playground where I implement all the things I ~~'m learning~~ like ¯\\_(ツ)_/¯_

## Tools

### CSV to table

Paste or select a .csv file to dispaly it in a table 🤷‍♂️ with pagination and filtering

### CSV Swap Columns and rows

Does what it says 🤷‍♂️

### Password generator

A simple password generator using Crypto API (it's just a random number generator 🤷‍♂️).  
Different options are available including providing your own list of characters. Options are saved in your browser for next time use.

### Barcode Reader

Reads QR code/barcode from image or camera and output its content. Using ZXing library

### Barcode Writer

Create QR code/barcode image from text, URL, Wi-Fi,...

### HTML Email checker

Check if the provided HTML is compatible with major email clients.

All credits to [axllent/mailpit](https://github.com/axllent/mailpit/tree/develop/internal/htmlcheck)

### OCR

Extract text from a photo or screenshot, shown as plain text or as markdown (headings, tables, lists), with a copy button. Upload an image, drag and drop it, or paste it onto the page.

Recognition runs in a web worker using the [indra-ocr](https://huggingface.co/datalab-to/indra-ocr) models via ONNX Runtime Web. Models are downloaded on first use, with per-file progress. Optional features (the UI shows the extra download size for the model-based ones):

- Non-Latin scripts (CJK, Arabic/Hebrew, others)
- Language models to improve accuracy
- Math read as LaTeX
- Markdown tables built from the model's table heads
- Keeping page headers and footers in the markdown

### Translate

Translate text, or text inside an image, using [TranslateGemma](https://huggingface.co/onnx-community/translategemma-text-4b-it-ONNX). Output is streamed as it is generated. Supports a large list of languages including BCP-47 regional and script variants (e.g. `zh-Hans`, `pt-BR`, `sr-Latn`).

Two backends:

- **Remote**: any OpenAI-compatible chat completions API serving TranslateGemma (default `http://localhost:8000/v1`, e.g. a local llama.cpp or vLLM server). API base, model name and max tokens are configurable and saved in your browser. Your input is sent to the API you configure.
- **WebGPU**: runs the model entirely in your browser with Transformers.js. Needs a WebGPU capable browser and downloads the model on first use (with progress). Text input only.

Image input (remote backend only) accepts an uploaded file, a pasted image or an image URL. The server must be able to read data URLs for uploads.

### The \*Craft apps

WordCraft, GridCraft, DeckCraft, PdfCraft, PhotoCraft, LightCraft and FilmCraft are from [ArtCraft](https://getartcraft.com/apps): open-source, clean-room office and creative apps written in pure Rust, compiled to WebAssembly. They are vendored into this app (see `scripts/update-craft.ts`) and each one is embedded full-page in its own route. Files are opened and saved locally, nothing is uploaded. The WASM binaries are fetched at runtime from a public bucket, then run in your browser.

### WordCraft

A word processor in the style of Microsoft Word. Ribbon UI, styles, tables, track changes, references and mail merge. Reads and writes `.docx`.

### GridCraft

A spreadsheet in the style of Microsoft Excel, built for performance on large sheets.

### DeckCraft

A presentation designer in the style of Microsoft PowerPoint. Themes, layouts, shapes, pictures, tables, charts, transitions and animations. Opens and saves `.pptx`, and presents full screen. Still in early development.

### PdfCraft

A PDF workbench. Read, organize, combine, split and secure PDFs.

### PhotoCraft

An image editor in the style of Adobe Photoshop. Layers, masks, adjustment layers, layer styles, type, vectors, brushes and real PSD files. Early alpha.

### LightCraft

A non-destructive photo library and raw developer in the style of Adobe Lightroom. Edits are kept separate from your original photos.

### FilmCraft

A professional non-linear video editor with timeline editing, colour and sound tools.

## License

[MIT license](./LICENSE)
