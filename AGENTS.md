# Implementation Summary

## Components

1. **StaticInfoView.lean** - Lean program for extracting info trees and generating HTML
   - `ExportOptions`: Structure controlling what information to export (goals, terms, or both)
   - `formatGoal`: Formats goals with proper variable names using `withLCtx` for correct pretty-printing
   - `collectInfoFromTrees`: Traverses InfoTree nodes to extract tactic states and/or term types based on options
   - `processFile`: Main pipeline that parses, elaborates, and generates HTML with inline markers
   - `main`: Command-line argument parsing supporting `-g` (goals only), `-t` (terms only), and `-o` (output file)

2. **Frontend** - Modular HTML/CSS/JS in `frontend/` directory
   - **index.html**: Split-panel layout with file picker and display toggles
   - **css/style.css**: VS Code dark theme with marker styles and nested term opacity
   - **js/main.js**: Entry point
   - **js/state.js**: State management
   - **js/dataLoader.js**: HTML loading, meta info parsing, toggle controls
   - **js/codeDisplay.js**: DOM tree walker for syntax highlighting
   - **js/navigation.js**: Marker interaction and keyboard navigation
   - **js/infoPanel.js**: Info panel rendering
   - **js/resize.js**: Resizable panels

## Technical Keypoints

### HTML Generation
- **Command-Line Options**: See `README.md`
- **Export Options**: `ExportOptions` structure controls what information to include in output
- **Meta Information**: Hidden span at beginning of HTML with `data-export-goals` and `data-export-terms` attributes
- **Event-Based Generation**: Uses start/end events to properly order nested term span tags.
  - Events at same position: ends processed before starts for correct nesting
- **Deduplication**: Filters duplicate TermInfo nodes with identical position ranges
- **Range Validation**: Ignores zero-length or invalid ranges
- **HTML Escaping**: Escapes special characters in code to ensure valid markup
- **UTF-8 Handling**: All string positions and lengths are in bytes.
- **Pretty Printing**: Uses `withLCtx` with proper local context to show actual variable names

#### Marker Format
```html
<span class="goal-marker" data-goal=""></span>
<span class="term-marker" data-type=""></span>
```

### Frontend
- **Syntax Highlighting**: Highlight each slice of code using highlight.js with [highlightjs-lean](https://github.com/leanprover-community/highlightjs-lean/)
- **Display Toggles**: Goals (functional), Terms (informational)
- **Event Handling**: `mouseover` for terms, `click` for goals, `stopPropagation()` for nesting
- **Keyboard Navigation**: Arrow keys with line-aware movement

#### Info Panel
- **Goal State**: Colored hypotheses (cyan), turnstile (purple), types (teal)
- **Term Info**: "Term: ... Type: ..." format

## Planned Enhancement: Command Message Markers

**Requirements:** Informational toggle (like terms), hover-only, export by default

**Parser:**
- Add `exportCommands` to `ExportOptions`
- Handle `.ofCommandInfo` in `collectInfoFromTrees`
- Generate `<span class="command-marker" data-message="{msg}">` at command positions
- Add `-c` flag, update meta span with `data-export-commands`

**Frontend:**
- Add `exportedCommands` to state.js
- Update dataLoader.js: parse meta, add toggle control
- Add hover handler in navigation.js (term > command > goal precedence)
- Add command rendering in infoPanel.js
- Style: purple/magenta theme, z-index 1

## Future Enhancements

**InfoTree types not yet used:** CompletionInfo, FieldInfo, UserWidgetInfo, CustomInfo
**TacticInfo fields not yet used:** `goalsAfter` (show diff), `stx`, `elaborator`
**Highlighting:** Current highlighting handling is fragmented.