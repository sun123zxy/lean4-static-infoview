// ============================================================================
// State Management
// ============================================================================
//
// Global state for:
// - Current file name
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
