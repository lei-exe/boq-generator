# BOQ Generator

`boq-generator-main` is a browser-based Bill of Quantities generator built with HTML, Bootstrap 5, and modular vanilla JavaScript. It is designed as a static front-end tool for creating BOQs, managing category-based line items, saving drafts locally, and exporting results to Excel or PDF.

## Current Architecture

The project keeps a simple modular structure:

- `index.html` defines the application layout and loads third-party CDN dependencies plus the app scripts.
- `css/styles.css` contains both the existing global UI styles and scoped enhancements for the BOQ builder section.
- `js/core.js` contains the main BOQ interaction logic, category/item rendering, totals, notifications, and custom local data management.
- `js/draft.js` handles saving, loading, previewing, and deleting drafts with `localStorage`.
- `js/pricelist.js` contains the construction pricelist dataset and the logic for browsing and injecting pricelist items into the BOQ.
- `js/export-excel.js` and `js/export-pdf.js` provide export workflows.
- `js/utils.js` contains shared number parsing and formatting helpers.

## Features

- Create and edit project-level BOQ information
- Add dynamic categories and line items
- Auto-calculate quantity, rate, amount, subtotal, markup, and grand total
- Save and reload drafts locally in the browser
- Use a built-in construction pricelist
- Export to Excel
- Export to PDF
- Responsive/mobile usability improvements

## Categories & Items UI

The Categories & Items section was incrementally improved without rewriting the project:

- Added a scoped builder section wrapper
- Added a category composer panel for clearer category creation
- Added an empty state when no categories exist
- Added category count and per-category item/total summary badges
- Kept the original add/remove/category/item workflows intact
- Reused existing functions instead of replacing the architecture wholesale

The main logic for this area now centers on helper-driven rendering and UI state updates inside [js/core.js](/C:/Users/LEIXNIEL/Desktop/Projects/boq-generator-main/js/core.js).

## Project Structure

```text
boq-generator-main/
|-- index.html
|-- README.md
|-- all-codes.txt
|-- css/
|   `-- styles.css
`-- js/
    |-- core.js
    |-- draft.js
    |-- export-excel.js
    |-- export-pdf.js
    |-- pricelist.js
    `-- utils.js
```

## File Overview

- `index.html`: main UI structure, script loading, and BOQ form layout
- `css/styles.css`: global app styles plus scoped BOQ builder styles
- `js/core.js`: category/item rendering, totals, notifications, dropdown updates, and interaction state
- `js/draft.js`: draft persistence and preview/load/delete flows
- `js/pricelist.js`: pricelist dataset, modal rendering, filtering, and add-to-BOQ actions
- `js/export-excel.js`: Excel export generation
- `js/export-pdf.js`: PDF export generation
- `js/utils.js`: shared number helpers
- `all-codes.txt`: full consolidated source snapshot of the project files

## How To Run

1. Open [index.html](/C:/Users/LEIXNIEL/Desktop/Projects/boq-generator-main/index.html) in a browser.
2. Enter project details.
3. Add categories and line items manually or via the pricelist.
4. Adjust markup as needed.
5. Save drafts locally or export the BOQ.

## Dependencies

The project currently loads these libraries from CDNs:

- Bootstrap 5
- Bootstrap Icons
- ExcelJS
- FileSaver.js
- SheetJS (`xlsx`)
- jsPDF
- jsPDF AutoTable

## Notes

- This is a static front-end project and does not require a backend.
- Drafts are browser-specific because they use `localStorage`.
- The codebase is functional but still contains some older duplicated patterns and mobile-specific patches that can be cleaned up in future incremental batches.
- The current refactor direction is incremental improvement, not full rewrite.
