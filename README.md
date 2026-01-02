# Lean 4 Static InfoView

Disclaimer: This project is purely experimental, mainly written by LLM assistants, and may be of poor code quality. Use at your own risk. Currently only tactic state information is extracted and displayed.

[the VSCode extension of Lean 4](https://github.com/leanprover/vscode-lean4) has a dynamic InfoView implementation. This project aims to provide a static alternative. It does not require a backend or a running Lean server, hence particularly useful for posting Lean code in static websites (e.g. blogs) for educational purposes.

It consists of a Lean program that pregenerates JSON files containing the info trees for a specified Lean file, and then an HTML/JS frontend that loads the JSON and displays the info trees with the code.

## Usage

```bash
lake build
lake exe staticInfoView Examples/Basic.lean
```

Then open `infoview.html` in a web server.

### Navigation

- **Mouse**: Click any character to see the tactic state at that position
- **Arrow Left/Right**: Navigate to previous/next tactic position
- **Arrow Up/Down**: Move to tactic on previous/next line
   ```
