// ============================================================================
// Position Management and Keyboard Navigation
// ============================================================================

import { state } from './state.js';
import { updateInfoPanel } from './infoPanel.js';

export function setPosition(offset) {
    state.currentPosition = offset;
    
    // Throttle updates using requestAnimationFrame
    if (!state.updateScheduled) {
        state.updateScheduled = true;
        requestAnimationFrame(() => {
            state.updateScheduled = false;
            
            // Remove previous active class (cached reference)
            if (state.activeElement) {
                state.activeElement.classList.remove('active');
            }
            
            // Get element from cache (O(1) lookup)
            const charElement = state.offsetToElement.get(state.currentPosition);
            if (charElement) {
                charElement.classList.add('active');
                charElement.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
                state.activeElement = charElement;
            }
            
            // Update info panel
            updateInfoPanel(state.currentPosition);
        });
    }
}

export function findPreviousOffset(offset) {
    if (state.tacticOffsets.length === 0) return offset;
    
    let left = 0, right = state.tacticOffsets.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        state.tacticOffsets[mid] < offset ? left = mid + 1 : right = mid - 1;
    }
    
    return right >= 0 ? state.tacticOffsets[right] : offset;
}

export function findNextOffset(offset) {
    if (state.tacticOffsets.length === 0) return offset;
    
    let left = 0, right = state.tacticOffsets.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        state.tacticOffsets[mid] <= offset ? left = mid + 1 : right = mid - 1;
    }
    
    return left < state.tacticOffsets.length ? state.tacticOffsets[left] : offset;
}

export function moveVertical(direction) {
    if (!state.infoData || state.lineOffsets.length === 0 || state.tacticOffsets.length === 0) {
        return state.currentPosition;
    }
    
    // Binary search to find current line
    let currentLine = 0;
    for (let i = 0; i < state.lineOffsets.length; i++) {
        if (state.currentPosition < state.lineOffsets[i]) {
            currentLine = i - 1;
            break;
        }
        if (i === state.lineOffsets.length - 1) {
            currentLine = i;
        }
    }
    
    const currentColumn = state.currentPosition - state.lineOffsets[currentLine];
    
    // Search for the next/previous line with tactics
    let searchLine = currentLine + direction;
    
    while (searchLine >= 0 && searchLine < state.lineOffsets.length) {
        const lineStart = state.lineOffsets[searchLine];
        const lineEnd = searchLine + 1 < state.lineOffsets.length 
            ? state.lineOffsets[searchLine + 1] - 1 
            : state.tacticOffsets[state.tacticOffsets.length - 1];
        
        // Try to find a tactic on this line at the target column
        const targetOffset = lineStart + currentColumn;
        
        // First, try to find tactic at or near target column
        for (let i = 0; i < state.tacticOffsets.length; i++) {
            if (state.tacticOffsets[i] >= targetOffset && state.tacticOffsets[i] <= lineEnd) {
                return state.tacticOffsets[i];
            }
        }
        
        // If no tactic at target column, find any tactic on this line
        for (let i = 0; i < state.tacticOffsets.length; i++) {
            if (state.tacticOffsets[i] >= lineStart && state.tacticOffsets[i] <= lineEnd) {
                return state.tacticOffsets[i];
            }
        }
        
        // No tactics on this line, continue searching
        searchLine += direction;
    }
    
    // No tactics found in that direction
    return state.currentPosition;
}

export function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (!state.infoData) return;
        
        let newPosition = state.currentPosition;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                newPosition = findPreviousOffset(state.currentPosition);
                break;
            case 'ArrowRight':
                e.preventDefault();
                newPosition = findNextOffset(state.currentPosition);
                break;
            case 'ArrowUp':
                e.preventDefault();
                newPosition = moveVertical(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                newPosition = moveVertical(1);
                break;
            default:
                return;
        }
        
        setPosition(newPosition);
    });
}
