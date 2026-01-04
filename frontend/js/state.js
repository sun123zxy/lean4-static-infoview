// ============================================================================
// State Management
// ============================================================================
//
// Global state for:
// - Current file and marker selection
// - Export metadata (what was included in the file)
// - Display preferences (user-controlled visibility)
// ============================================================================

export const state = {
    currentFile: null,
    currentMarker: null,
    exportedGoals: true,    // Whether goals were exported in the loaded file
    exportedTerms: true,    // Whether terms were exported in the loaded file
    displayGoals: true      // User preference: show/hide goal markers
};

/**
 * Reset state when loading a new file
 */
export function resetState() {
    state.currentMarker = null;
    state.exportedGoals = true;
    state.exportedTerms = true;
    state.displayGoals = true;
}
