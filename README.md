# Lean 4 Static InfoView

Disclaimer: This project is purely experimental, mainly written by LLM assistants, and may be of poor code quality. Use at your own risk. Currently only tactic state information is extracted and displayed.

[The VSCode extension for Lean 4](https://github.com/leanprover/vscode-lean4) has a dynamic InfoView implementation. This project aims to provide a static alternative. It does not require a backend or a running Lean server, making it particularly useful for posting Lean code on static websites (e.g., blogs) for educational purposes.

It consists of a Lean program that generates HTML files with embedded tactic state markers, and an HTML/JS frontend that displays the code with interactive goal markers.

## Usage

### Generating static info HTML

```bash
lake build
lake exe staticInfoView Examples/Basic.lean -o info.html
```

### View in the frontend

Open `frontend/index.html` in a web browser. Use the file picker to load the generated HTML file.

### Navigation

- **Mouse**: Click on any goal marker (▸) to see the tactic state
- **Arrow Left/Right**: Navigate to previous/next marker
- **Arrow Up/Down**: Jump to the leftmost marker on the previous/next line
- **Page Up/Down**: Same as Arrow Left/Right
- **Home/End**: Jump to first/last marker
