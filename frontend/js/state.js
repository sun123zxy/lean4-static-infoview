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
    currentFile: null
};

/**
 * Reset state when loading a new file
 */
export function resetState() {
    // Reset file state
    state.currentFile = null;
}
