// ============================================================================
// State Management
// ============================================================================

export const state = {
    currentFile: null,
    currentMarker: null
};

export function resetState() {
    state.currentMarker = null;
}
