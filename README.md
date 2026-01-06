# Lean 4 Static InfoView

[The VSCode extension for Lean 4](https://github.com/leanprover/vscode-lean4) has a dynamic InfoView implementation. This project aims to provide a static alternative.

- [See our online frontend here](https://sun123zxy.github.io/lean4-static-infoview/)

It does not require a backend or a running Lean server. With our parser executable, you analyze a Lean source file offline to extract information such as tactic states and term types into a static HTML file. It can then be loaded and viewed in a web browser frontend. This makes it lightweight and easy to deploy, particularly useful for sharing, presentation, and hosting Lean code on static websites like GitHub Pages.

It consists of a Lean program that generates HTML files with embedded tactic state markers, and an HTML/JS frontend that displays the code with an interactive InfoView panel and syntax highlighting.

- **Non-intrusive Parser:** The parser executable is designed to be non-intrusive, so you don't need to modify your existing Lean projects to use it.
- **Embeddable infoview.js:** The interactive InfoView and syntax highlighting is decoupled from our frontend implementation, hence can be easily embedded into your own websites by including corresponding JavaScript and CSS files.

Currently the following info types can be extracted and displayed:

- tactic state information
- term type information

**Disclaimer:** This project is purely experimental, made for personal use, in early stages, written with LLM assistance, and potentially of poor code quality. Use at your own risk.

## The Parser Executable

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

The generated `output.html` is a an HTML file containing your code, marked-up with extracted information such as tactic state and term type information, ready to be viewed in the frontend.

### Intrusive Integration

Alternatively, you can integrate the parser into your own Lean project intrusively. Simply copy `StaticInfoView.lean` into your project, and refer to our `lakefile.toml` to modify your lakefile accordingly.

### Command Line Options

```bash
Usage: staticInfoView [options] <lean-file>
Options:
  -g           Export goal/tactic information
  -t           Export term type information
  -o <file>    Specify output file (default: <input>.html)

Examples:
  staticInfoView path/to/FileToBeAnalyzed.lean -o output.html -g -t
```

## The Frontend

### Viewing in the Frontend

Just open the generated marked-up code file in our online frontend. The frontend page is located at `frontend/index.html`. If you want to run it locally, you may need to serve the frontend via a local web server instead of opening the HTML file directly.

### Integrating into Your Website

To use our interactive InfoView and syntax highlighting in your website, put `js/infoview.js` and `css/infoview.css` into your project, and embed the following in `<head>` and `<body>` of your HTML file respectively:

```html
<link rel="stylesheet" href="css/infoview.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css">
```

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://unpkg.com/highlightjs-lean/dist/lean.min.js"></script>
<script src="js/infoview.js"></script>
```

You may change the highlighting style by replacing the highlight.js CSS file. Then follow these steps:

- your Lean code should first be analyzed by our parser executable offline to generate a marked-up code in HTML format.

- Put the content of the generated file into your webpage, at a desired location to display the code. Make sure to preserve the `<pre><code class="infoview-lean">` structure of the marked-up code.

- Include the following script to initialize InfoView:

  ```js
  document.addEventListener('DOMContentLoaded', (event) => {
    initInfoview();
  });
  ```

  This function will automatically find the `<pre><code class="infoview-lean">` structure in the HTML content, and set up interactive InfoView and syntax highlighting accordingly.