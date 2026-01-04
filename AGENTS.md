## Implementation Summary

### Components Implemented

1. **Main.lean** - Lean program for extracting info trees and generating HTML
   - `ExportOptions`: Structure controlling what information to export (goals, terms, or both)
   - `formatGoal`: Formats goals with proper variable names using `withLCtx` for correct pretty-printing
   - `collectInfoFromTrees`: Traverses InfoTree nodes to extract tactic states and/or term types based on options
   - `processFile`: Main pipeline that parses, elaborates, and generates HTML with inline markers
   - `main`: Command-line argument parsing supporting `-g` (goals only), `-t` (terms only), and `-o` (output file)
   - Uses event-based HTML generation to handle nested term spans correctly
   - Outputs meta information span: `<span class="meta-info" data-export-goals='...' data-export-terms='...'>`
   - Outputs goal markers: `<span class="goal-marker" data-goal="{goal}"></span>`
   - Outputs nested term markers: `<span class="term-marker" data-type="{type}">...</span>`

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

### Key Technical Details

#### HTML Generation (Main.lean)
- **Command-Line Options**: Supports `-g` (goals only), `-t` (terms only), `-o` (output file)
- **Export Options**: `ExportOptions` structure controls what information to include in output
- **Meta Information**: Hidden span at beginning of HTML with `data-export-goals` and `data-export-terms` attributes
- **Conditional Processing**: InfoTree traversal conditionally processes TacticInfo and TermInfo based on options
- **Event-Based Generation**: Uses start/end events to properly order nested term span tags
  - Start events: `(position, "start", marker_html)`
  - End events: `(position, "end", start_position)`
  - Events at same position: ends processed before starts for correct nesting
- **Deduplication**: Filters duplicate TermInfo nodes with identical position ranges
- **Range Validation**: Ignores zero-length or invalid ranges
- **HTML Escaping**: Escapes special characters in code to ensure valid markup
- **UTF-8 Handling**: Uses `String.next()` for proper multi-byte character advancement
- **Pretty Printing**: Uses `withLCtx` with proper local context to show actual variable names

#### Goal Markers
- Inline `<span>` elements with `data-goal` attribute containing tactic state
- Visual indicator with left border gradient (blue default, yellow on hover/active)
- Click to display tactic state in info panel
- z-index: 1 (beneath term markers)

#### Term Markers
- Nested `<span>` elements with `data-type` attribute containing type information
- Dotted cyan underline in default state
- Hover to display term text and type in info panel
- Exponential opacity decay for parent terms (50% per level)
- Dynamic opacity via CSS custom property `--opacity-factor`
- z-index: 2 (above goal markers)

#### Frontend Architecture
- **Syntax Highlighting**: DOM tree walker + highlight.js with [highlightjs-lean](https://github.com/leanprover-community/highlightjs-lean/)
- **Display Toggles**: Goals (functional), Terms (informational)
- **Event Handling**: `mouseover` for terms, `click` for goals, `stopPropagation()` for nesting
- **Keyboard Navigation**: Arrow keys with line-aware movement

#### Info Panel
- **Goal State**: Colored hypotheses (cyan), turnstile (purple), types (teal)
- **Term Info**: "term: ... type: ..." format

#### Export Metadata
- Meta span with `data-export-goals` and `data-export-terms` attributes
- Toggle UI reflects exported content availability

### HTML Format

Generated HTML contains plain text with inline markers:

```html
-- [EXR]
<span class="term-marker" data-type='∀ (a b : ℚ), a ≤ b → b ≤ a → a = b'>example</span> (<span class="term-marker" data-type='a ≤ b'>hab</span> : <span class="term-marker" data-type='ℚ'><span class="term-marker" data-type='Prop'>a</span> ≤ <span class="term-marker" data-type='ℚ'>b</span></span>) (<span class="term-marker" data-type='b ≤ a'>hba</span> : <span class="term-marker" data-type='ℚ'><span class="term-marker" data-type='Prop'>b</span> ≤ <span class="term-marker" data-type='ℚ'>a</span></span>) : <span class="term-marker" data-type='Prop'><span class="term-marker" data-type='ℚ'>a</span> = <span class="term-marker" data-type='ℚ'>b</span></span> := <span class="goal-marker" data-goal='Goals: 1

Goal 1:
a : ℚ
b : ℚ
c : ℚ
d : ℚ
hab : a ≤ b
hba : b ≤ a
⊢ a = b'></span>by
  <span class="goal-marker" data-goal='Goals: 1

Goal 1:
a : ℚ
b : ℚ
c : ℚ
d : ℚ
hab : a ≤ b
hba : b ≤ a
⊢ a = b'></span>apply <span class="term-marker" data-type='∀ {α : Type} [inst : PartialOrder α] {a b : α}, a ≤ b → b ≤ a → a = b'>le_antisymm</span>
  <span class="goal-marker" data-goal='Goals: 2

Goal 1:
a : ℚ
b : ℚ
c : ℚ
d : ℚ
hab : a ≤ b
hba : b ≤ a
⊢ a ≤ b
---

Goal 2:
a : ℚ
b : ℚ
c : ℚ
d : ℚ
hab : a ≤ b
hba : b ≤ a
⊢ b ≤ a'></span>· <span class="goal-marker" data-goal='Goals: 1

Goal 1:
a : ℚ
b : ℚ
c : ℚ
d : ℚ
hab : a ≤ b
hba : b ≤ a
⊢ a ≤ b'></span>exact <span class="term-marker" data-type='a ≤ b'>hab</span>
  <span class="goal-marker" data-goal='Goals: 1

Goal 1:
a : ℚ
b : ℚ
c : ℚ
d : ℚ
hab : a ≤ b
hba : b ≤ a
⊢ b ≤ a'></span>· <span class="goal-marker" data-goal='Goals: 1

Goal 1:
a : ℚ
b : ℚ
c : ℚ
d : ℚ
hab : a ≤ b
hba : b ≤ a
⊢ b ≤ a'></span>exact <span class="term-marker" data-type='b ≤ a'>hba</span>
```

### Planned Enhancement: Command Message Markers

**Requirements:** Informational toggle (like terms), hover-only, export by default

**Backend (Main.lean):**
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

### Future Enhancements

**InfoTree types not yet used:** CompletionInfo, FieldInfo, UserWidgetInfo, CustomInfo
**TacticInfo fields not yet used:** `goalsAfter` (show diff), `stx`, `elaborator`
