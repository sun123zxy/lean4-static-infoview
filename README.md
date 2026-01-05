# Lean 4 Static InfoView

[The VSCode extension for Lean 4](https://github.com/leanprover/vscode-lean4) has a dynamic InfoView implementation. This project aims to provide a static alternative.

- [Demo](https://sun123zxy.github.io/lean4-static-infoview/)

It does not require a backend or a running Lean server. With our parser executable, you analyze a Lean source file offline to extract information such as tactic states and term types into a static HTML file. It can then be loaded and viewed in a web browser frontend. This makes it lightweight and easy to deploy, particularly useful for sharing, presentation, and hosting Lean code on static websites like GitHub Pages.

It consists of a Lean program that generates HTML files with embedded tactic state markers, and an HTML/JS frontend that displays the code with interactive goal markers and syntax highlighting. The parser executable is designed to be non-intrusive, so you don't have to modify your existing Lean projects to use it.

Currently the following info types are extracted and displayed:

- tactic state information
- term type information

**Disclaimer:** This project is purely experimental, in early stages, mainly written with LLM, and potentially of poor code quality. Use at your own risk.

## Usage (Non-intrusive)

Please ensure that **the project to be analyzed uses the same Lean version as this repository.**

### Building the Executable

First, clone this repository and build the executable:

```bash
lake build
```

The built executable can be found at `.lake/build/staticInfoView`.

> Note that it is not a standalone binary, as our project relies `supportInterpreter = true` feature and hence depends on Lean's runtime libraries. The executable is supposed to be run with correct library paths set up by Lake. You can run it via Lake commands such as via `lake env` or `lake exe`. Alternatively, you can manually add Lean's PATH into your PATH.

### Parsing a Lean File

Now switch the current directory to the project to be analyzed. Run the following command:

```bash
lake env /path/to/lean4-static-infoview/.lake/build/staticInfoView path/to/FileToBeAnalyzed.lean -o output.html -g -t
```

> This will run the executable in the context of your project, so that dependencies can be resolved correctly. That's why the Lean version of the parser and your project must match.

The generated `output.html` is an HTML file marked up with extracted information such as tactic state and term type information.

### Viewing in the Frontend

Now you can run our `frontend/` in a web server and use the file picker to load the generated HTML file.

## Usage (Intrusive)

Since the Lean version must match, it's also reasonable to integrate static InfoView directly into your own Lean project. Simply copy `StaticInfoView.lean` into your project, and refer to our `lakefile.toml` to modify your lakefile accordingly.

## Command Line Options

```default
Usage: staticInfoView [options] <lean-file>
Options:
  -g           Export goal/tactic information
  -t           Export term type information
  -o <file>    Specify output file (default: <input>.html)

Examples:
  staticInfoView path/to/FileToBeAnalyzed.lean -o output.html -g -t
```
