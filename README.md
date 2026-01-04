# Lean 4 Static InfoView

[The VSCode extension for Lean 4](https://github.com/leanprover/vscode-lean4) has a dynamic InfoView implementation. This project aims to provide a static alternative.

It does not require a backend or a running Lean server. Static files with embedded tactic state information is generated in advance, and then can be imported and viewed in a web browser frontend. This makes it lightweight and easy to deploy, particularly useful for sharing, presentation, and hosting Lean code on static websites like GitHub Pages.

It consists of a Lean program that generates HTML files with embedded tactic state markers, and an HTML/JS frontend that displays the code with interactive goal markers and syntax highlighting.

**Disclaimer:** This project is purely experimental, in early stages, mainly written by LLM assistants, and potentially of poor code quality. Use at your own risk.

Currently the following info types are extracted and displayed:

- tactic state information
- term type information

## Usage

### Generating static info HTML

Generate HTML files with embedded tactic and term information:

```bash
lake exe staticInfoView -g -t Examples/ineq.lean -o frontend/info.html
```

```default
Usage: staticInfoView [options] <lean-file>
Options:
  -g           Export only goal/tactic information
  -t           Export only term type information
  -o <file>    Specify output file (default: <input>.html)
Example: staticInfoView Examples/Basic.lean
         staticInfoView -g -t Examples/ineq.lean -o info.html
```

If you prefer not to work with Mathlib, you may test with `Examples/logic.lean` and remove the Mathlib dependency from `lakefile.toml`.

### View in the frontend

Open `frontend/index.html` in a web server. Use the file picker to load the generated HTML file.

The frontend will automatically detect what information is available in the file and display it in the bottom-right corner.

### Navigation and UI

#### Goal Markers
- **Click**: Click on any goal marker (blue gradient bar) to display the tactic state
- **Visual Feedback**: Markers turn yellow on hover and when active

#### Term Type Information
- **Hover**: Hover over any underlined term to see its type
- **Nested Terms**: Parent terms are highlighted with decreasing opacity

#### Keyboard Navigation
- **Arrow Left/Right** or **Page Up/Down**: Navigate to previous/next goal marker
- **Arrow Up/Down**: Jump to the leftmost marker on the previous/next line
- **Home/End**: Jump to first/last marker

#### Panel Management
- **Resize**: Drag the vertical divider between panels to adjust width
- **Info Panel**: Automatically updates to show tactic state or term type information

#### Display Indicators
- Bottom-right corner shows what information is available:
  - **Goals checkbox**: Toggleable - show/hide goal markers (enabled if goals were exported)
  - **Terms checkbox**: Informational only - indicates if term information is available

## TODO

- Support command messages
- Make the executable standalone