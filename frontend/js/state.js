// ============================================================================
// State Management
// ============================================================================

export const state = {
    infoData: null,
    currentPosition: 0,
    positionMap: new Map(),
    tacticOffsets: [],
    offsetToElement: new Map(),
    lineOffsets: [],
    updateScheduled: false,
    activeElement: null,
    infoContentElement: null,
    lastRenderedInfo: null
};

export function resetState() {
    state.positionMap.clear();
    state.tacticOffsets = [];
    state.currentPosition = 0;
    state.activeElement = null;
    state.lastRenderedInfo = null;
}
