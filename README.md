# Lean 4 Static InfoView

Disclaimer: This project is purely experimental, mainly written by LLM assistants, and may be of poor code quality. Use at your own risk. Currently only tactic state information is extracted and displayed.

[The VSCode extension for Lean 4](https://github.com/leanprover/vscode-lean4) has a dynamic InfoView implementation. This project aims to provide a static alternative. It does not require a backend or a running Lean server, making it particularly useful for posting Lean code on static websites (e.g., blogs) for educational purposes.

It consists of a Lean program that pregenerates JSON files containing the info trees for a specified Lean file, and then an HTML/JS frontend that loads the JSON and displays the info trees with the code.

## Usage

### Building static info JSON

```bash
lake build
lake exe staticInfoView Examples/Basic.lean -o info.json
```

### View in the frontend

Open `frontend/index.html` in a web browser. Use the file picker to load the generated JSON file.

### Navigation

- **Mouse**: Click any character to see the tactic state at that position
- **Arrow Left/Right**: Navigate to previous/next tactic position
- **Arrow Up/Down**: Move to tactic on previous/next line
