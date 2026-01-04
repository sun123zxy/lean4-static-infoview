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

2. **Frontend** - Modular HTML/CSS/JS interface (in `frontend/` directory)
   - **index.html**: Split-panel layout (code view | info panel) with file picker and display toggles
   - **css/style.css**: VS Code-inspired dark theme with marker styles, exponential opacity for nested terms, and toggle controls
   - **js/main.js**: Entry point and initialization
   - **js/state.js**: State management (currentMarker, exportedGoals, exportedTerms, displayGoals)
   - **js/dataLoader.js**: HTML file loading, meta information parsing, toggle controls, and marker visibility
   - **js/codeDisplay.js**: Direct HTML injection without syntax highlighting
   - **js/navigation.js**: Goal marker click handling, term marker hover handling, keyboard navigation
   - **js/infoPanel.js**: Info panel rendering with goal syntax highlighting and term type display
   - **js/resize.js**: Drag-to-resize functionality for info panel

3. **lakefile.toml** - Build configuration

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
- **No Syntax Highlighting**: Direct HTML injection for performance and simplicity
- **ES6 Modules**: Clean imports/exports with separate concerns
- **Meta Information Parsing**: Extracts `data-export-goals` and `data-export-terms` from hidden span
- **Display Toggles**: Bottom-right UI controls showing what information is available
  - Goals toggle: Functional - can show/hide goal markers if exported
  - Terms toggle: Informational only - indicates if terms are available
- **CSS Custom Properties**: Dynamic opacity calculation for nested term highlighting
- **Event Handling**: 
  - `mouseover` for term hover (fires when coming from child elements)
  - `mouseleave` to restore goal state display
  - `click` with `stopPropagation()` for goal markers
- **Keyboard Navigation**: Line-aware movement using `offsetTop` with tolerance

#### Info Panel Display
- **Goal State**: Syntax-highlighted with colored hypotheses, turnstile, and targets
- **Term Info**: Simple inline format - "term: ... type: ..."
- **Color Scheme**: VS Code dark theme colors
  - Hypotheses: cyan (#9cdcfe)
  - Turnstile: purple (#c586c0)
  - Types: teal (#4ec9b0)
  - Instance hypotheses: dimmed (#858585)

#### Resizable Interface
- Draggable vertical divider between code and info panels
- Min-width constraints to prevent collapse
- Smooth transitions on hover/resize

#### Export Metadata and Display Controls
- **Meta Span**: Hidden `<span class="meta-info">` at beginning of HTML
  - `data-export-goals`: Boolean indicating if goals were exported
  - `data-export-terms`: Boolean indicating if terms were exported
- **Toggle UI**: Bottom-right corner display indicators
  - Goals: Toggleable checkbox (enabled if goals exported, disabled otherwise)
  - Terms: Read-only checkbox (always disabled, shows availability)
- **State Management**: Tracks both exported and display state separately
  - `exportedGoals`/`exportedTerms`: What's in the file (from meta info)
  - `displayGoals`: User preference for showing/hiding goals
- **Visibility Control**: `updateMarkerVisibility()` shows/hides goal markers based on toggle state

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

### Implementation Challenges Resolved

1. **Nested Span Ordering**: Event-based generation ensures proper close tag ordering
2. **Duplicate TermInfo**: Deduplication by (start, end) position pairs
3. **Parent Highlighting**: CSS `:hover` applies to parents; JavaScript sets opacity factors
4. **Marker Visibility**: z-index layering prevents term markers from obscuring goal markers
5. **Hover Propagation**: `stopPropagation()` ensures only innermost term is selected
6. **Opacity Calculation**: CSS `calc()` with custom properties enables dynamic nested highlighting

### Planned Enhancement: Command Message Markers

#### Implementation Plan for CommandInfo Support

**User Requirements:**
- Informational toggle only (like terms, not functional like goals)
- Hover-only interaction (no click events)
- Export all three marker types by default
- Must handle nesting carefully to avoid conflicts with term markers

#### Backend Changes (Main.lean)

1. **Add `exportCommands` to ExportOptions**
   ```lean
   structure ExportOptions where
     exportGoals : Bool := true
     exportTerms : Bool := true
     exportCommands : Bool := true  -- NEW
   ```

2. **Update `collectInfoFromTrees` to handle CommandInfo**
   - Add conditional branch for `.ofCommandInfo info`
   - Extract command syntax and any associated messages
   - Generate `<span class="command-marker" data-message="{msg}"></span>` at command positions
   - **Nesting consideration**: Commands occur at statement/declaration level, typically before any term markers
   - Commands should NOT use event-based generation (they don't nest with terms)
   - Insert command markers as simple inline spans at the start position of the command

3. **Update meta information span**
   - Add `data-export-commands='true/false'` attribute
   - Example: `<span class="meta-info" data-export-goals='true' data-export-terms='true' data-export-commands='true'>`

4. **Add command-line flag `-c`**
   - Update `main` function argument parsing
   - `-c`: Export only commands
   - Can be combined: `-g -c` (goals and commands only)
   - Default: All three types exported

#### Frontend Changes

1. **state.js**
   ```javascript
   // Add to global state
   exportedCommands: false,  // Whether commands are in the file
   // Note: No displayCommands - toggle is informational only
   ```

2. **dataLoader.js**
   - Update `parseMetaInfo()`:
     ```javascript
     state.exportedCommands = metaSpan.dataset.exportCommands === 'true';
     ```
   - Update `updateToggleControls()`:
     ```javascript
     // Commands toggle: always disabled (informational)
     commandsToggle.checked = state.exportedCommands;
     commandsToggle.disabled = true;
     commandsToggle.parentElement.style.opacity = state.exportedCommands ? '1' : '0.5';
     ```
   - No changes needed to `updateMarkerVisibility()` (informational toggle doesn't control visibility)

3. **navigation.js**
   - Add hover handler for command markers:
     ```javascript
     // Listen on code container for command-marker hover
     document.querySelector('.code-display').addEventListener('mouseover', (e) => {
       const marker = e.target.closest('.command-marker');
       if (marker && !e.target.closest('.term-marker')) {
         // Only trigger if not inside a term marker (precedence)
         const message = marker.dataset.message;
         showCommandInfo(message);
         highlightCommandMarker(marker);
       }
     });
     ```
   - **Interaction priority**: If hover is on both command and term markers, term takes precedence
   - Use `stopPropagation()` if needed to prevent event bubbling conflicts

4. **infoPanel.js**
   - Add 'command' type handling:
     ```javascript
     function renderInfo(marker) {
       const type = marker.classList.contains('goal-marker') ? 'goal' :
                    marker.classList.contains('term-marker') ? 'term' : 'command';
       
       if (type === 'command') {
         const message = marker.dataset.message;
         infoPanel.innerHTML = `<div class="command-info">${escapeHtml(message)}</div>`;
       }
       // ... existing goal and term handling
     }
     ```

5. **style.css**
   - Add command marker styles:
     ```css
     .command-marker {
       /* Purple/magenta theme to distinguish from goals (blue) and terms (cyan) */
       border-bottom: 1px dotted #c586c0;  /* VS Code purple */
       cursor: help;
       z-index: 1;  /* Same as goals, below terms */
     }
     
     .command-marker:hover {
       background-color: rgba(197, 134, 192, 0.1);  /* Light purple highlight */
       border-bottom-color: #d7ba7d;  /* Gold on hover */
     }
     
     .command-marker.active {
       background-color: rgba(197, 134, 192, 0.2);
       border-bottom-width: 2px;
     }
     
     .command-info {
       color: #c586c0;  /* Purple text */
       font-family: 'Consolas', 'Monaco', monospace;
       white-space: pre-wrap;
     }
     ```

6. **index.html**
   - Add third checkbox to toggles container:
     ```html
     <div class="display-toggles">
       <label><input type="checkbox" id="toggle-goals"> Goals</label>
       <label><input type="checkbox" id="toggle-terms" disabled> Terms</label>
       <label><input type="checkbox" id="toggle-commands" disabled> Commands</label>
     </div>
     ```

#### Key Technical Considerations

1. **Nesting and Z-Index**
   - Commands: z-index 1 (same as goals, below terms)
   - Terms: z-index 2 (on top)
   - Commands typically occur at top-level declarations, unlikely to overlap with terms
   - If overlap occurs, term markers should be visually dominant

2. **Hover Interaction Precedence**
   - When mouse is over overlapping markers: term > command > goal
   - Use `e.target.closest('.term-marker')` to check if inside a term marker
   - Prevent command hover if already inside a term marker

3. **Event Generation for Commands**
   - Commands should use simple inline span insertion (like goals)
   - Do NOT use event-based generation (commands don't nest)
   - Insert at command start position only

4. **CommandInfo Extraction**
   - Access via `.ofCommandInfo info`
   - Relevant fields:
     - `info.stx`: Full command syntax
     - May need to extract any elaboration messages
     - Position from `info.stx.getPos?` and `info.stx.getTailPos?`

5. **Default Export Behavior**
   - All three types exported by default (no flags = export all)
   - `-g` alone: goals only
   - `-t` alone: terms only
   - `-c` alone: commands only
   - Combinations allowed: `-g -t`, `-g -c`, `-t -c`, `-g -t -c`

#### Testing Plan

1. Test command marker generation on various Lean files
2. Verify hover works correctly (command messages displayed)
3. Test interaction with term markers (precedence correct)
4. Verify toggle displays correct state (informational only)
5. Test command-line flags: default, `-c`, `-g -c`, etc.
6. Check z-index layering with overlapping markers
7. Verify meta information span includes all three attributes

### Potential Enhancements

#### Available InfoTree Node Types Not Yet Implemented

1. **CompletionInfo** (`ofCompletionInfo`)
   - Autocompletion suggestions at specific positions
   - Available identifiers in scope at each location
   - **Use case**: Show what was available in scope at any point

2. **FieldInfo** (`ofFieldInfo`)
   - Structure field information
   - Field names and types when accessing structures
   - **Use case**: Enhanced hover showing structure field details

3. **UserWidgetInfo** (`ofUserWidgetInfo`)
   - Custom widgets defined by users
   - **Use case**: Render custom proof state displays if present

4. **CustomInfo** (`ofCustomInfo`)
   - Extension point for custom information

#### Unused TacticInfo Fields

Currently only using `TacticInfo.goalsBefore`. Additional available fields:

- **`goalsAfter`**: Goals remaining after tactic execution
  - **Use case**: Show proof state diff - highlight what changed after each tactic
  - **Display**: Side-by-side before/after, or highlight added/removed hypotheses

- **`stx`**: Full syntax tree of the tactic
  - **Use case**: Enhanced syntax information, better error context

- **`elaborator`**: Which elaborator processed this tactic
  - **Use case**: Debugging, understanding how tactics are processed
