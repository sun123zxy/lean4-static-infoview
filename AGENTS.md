# Implementation Summary

## Components

1. **StaticInfoView.lean** - Lean program for extracting info trees and generating HTML
   - `ExportOptions`: Structure controlling what information to export (goals, terms, or both)
   - `formatGoal`: Formats goals with proper variable names using `withLCtx` for correct pretty-printing
   - `collectInfoFromTrees`: Traverses InfoTree nodes to extract tactic states and/or term types based on options
   - `processFile`: Main pipeline that parses, elaborates, and generates HTML with inline markers
   - `main`: Command-line argument parsing supporting `-g` (goals only), `-t` (terms only), and `-o` (output file)

2. **Frontend** - Modular structure with decoupled InfoView functionality
   - **index.html**: Main HTML structure with toolbar, code display area, and keyboard hint
   - **css/style.css**: General UI styles (toolbar, file picker, main layout)
   - **css/infoview.css**: Standalone InfoView styles (panel, markers, goal colorization)
   - **js/main.js**: Entry point for main frontend initialization
   - **js/state.js**: Main frontend state (current file)
   - **js/dataLoader.js**: HTML file loading and injection
   - **js/infoview.js**: Standalone InfoView module (highlighting, navigation, panel rendering, event handlers)

## Technical Keypoints

### HTML Generation
- **Command-Line Options**: See `README.md`
- **Export Options**: `ExportOptions` structure controls what information to include in output
- **Output Structure**: `<span class="meta-info">...</span><pre><code class="infoview-lean">{marked-up content}</code></pre>`
- **Meta Information**: Hidden span before `<pre>` tag with `data-export-goals` and `data-export-terms` attributes (currently not parsed by frontend)
- **Event-Based Generation**: Uses start/end events to properly order nested term span tags
  - Events at same position: ends processed before starts for correct nesting
- **Deduplication**: Filters duplicate TermInfo nodes with identical position ranges
- **Range Validation**: Ignores zero-length or invalid ranges
- **HTML Escaping**: Escapes special characters in code to ensure valid markup
- **UTF-8 Handling**: All string positions and lengths are in bytes
- **Pretty Printing**: Uses `withLCtx` with proper local context to show actual variable names

#### Marker Format
```html
<span class="goal-marker" data-goal=""></span>
<span class="term-marker" data-type=""></span>
```

### Frontend Architecture

#### Standalone InfoView (infoview.js + infoview.css)
The InfoView is fully decoupled and reusable:
- **Global API**: `window.initInfoview()` - Call after injecting marked-up HTML into DOM
- **No dependencies**: Standalone JavaScript (no module system) and CSS
- **Auto-detection**: Finds `<code class="infoview-lean">` and initializes automatically

#### InfoView Features
- **Floating Panel**: Right-side panel created dynamically in JavaScript
- **Toggle Button**: Attached to right edge, keyboard shortcut 'I' to toggle
- **Resizable**: Drag left border to adjust width
- **Default Visible**: Shows by default, auto-expands when clicking markers
- **Smooth Animation**: Slide in/out transitions (0.3s ease)

#### Syntax Highlighting
- **Library**: highlight.js with [highlightjs-lean](https://github.com/leanprover-community/highlightjs-lean/)
- **Method**: DOM tree walker (`highlightTextNodes`) preserves marker spans
- **Integrated**: Part of `initInfoview()` initialization

#### Event Handling
- **Goal Markers**: Click to select and show info, auto-expands InfoView if hidden
- **Term Markers**: Hover with nested opacity (`mouseover`/`mouseleave`, `stopPropagation()`)
- **Keyboard Navigation**: Arrow keys (line-aware), PageUp/Down, Home/End
- **Keyboard Shortcut**: 'I' key to toggle InfoView (with input field detection)

### Main Frontend
- **File Loading**: Local file picker or default `output.html` via fetch
- **Simple Workflow**: Load HTML → Inject into DOM → Call `initInfoview()`
- **Minimal State**: Only tracks current filename
- **UI Elements**: Toolbar with file picker, GitHub link, keyboard hint ("Press I to toggle InfoView")

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