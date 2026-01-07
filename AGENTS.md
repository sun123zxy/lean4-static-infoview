This project implements a static InfoView for Lean 4, allowing users to generate HTML files with embedded goal and term information from Lean source files.

- Read `README.md` for an overview for human readers. Don't change it unless you are explicitly told to do so. Though you can suggest changes if you think something should be modified there for human readers.

- Detailed technical keypoints are documented as comments at the beginning of each code file. Read these beginning comments if needed.

## Structure

- **StaticInfoView.lean** - Lean program for extracting info trees and generating HTML

- **Frontend** - Modular structure with decoupled InfoView functionality
  - **index.html**: Main HTML structure with toolbar, code display area, and keyboard hint
  - **css/style.css**: General UI styles (toolbar, file picker, main layout)
  - **css/infoview.css**: Standalone InfoView styles (panel, markers, goal colorization)
  - **js/main.js**: Entry point for main frontend initialization
  - **js/state.js**: Main frontend state
  - **js/dataLoader.js**: HTML file loading and injection
  - **js/infoview.js**: Standalone InfoView module (highlighting, navigation, panel rendering, event handlers)
