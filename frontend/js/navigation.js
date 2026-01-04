// ============================================================================
// Navigation and Marker Interaction
// ============================================================================
// 
// Handles:
// - Goal marker click interactions and keyboard navigation
// - Term marker hover interactions with exponential opacity for nested terms
// - Info panel updates for both goal states and term types
// ============================================================================

import { state } from './state.js';
import { updateInfoPanel } from './infoPanel.js';

/**
 * Sets up click and hover handlers for goal and term markers
 */
export function setupMarkerClickHandlers() {
    const markers = document.querySelectorAll('.goal-marker');
    
    // Goal marker click handlers
    markers.forEach(marker => {
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            selectMarker(marker);
        });
        
        // Make markers tabbable
        marker.setAttribute('tabindex', '0');
        
        // Handle Enter/Space on focused marker
        marker.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectMarker(marker);
            }
        });
    });
    
    // Term marker hover handlers
    // Uses mouseover (not mouseenter) to detect hover transitions between nested terms
    const termMarkers = document.querySelectorAll('.term-marker');
    termMarkers.forEach(termMarker => {
        const handleTermHover = (e) => {
            // Stop propagation ensures only the innermost term responds
            e.stopPropagation();
            
            const termType = termMarker.getAttribute('data-type');
            const termText = termMarker.textContent;
            
            if (termType) {
                // Set opacity factors: 1.0 for hovered term, 0.5, 0.25, 0.125... for parents
                let opacityFactor = 1.0;
                let me = termMarker;
                do {
                    if (me.classList.contains('term-marker')) {
                        const myType = me.getAttribute('data-type');
                        if (myType) {
                            me.style.setProperty('--opacity-factor', opacityFactor.toString());
                            opacityFactor *= 0.5;
                        }
                    }
                    me = me.parentElement;
                } while (me && me !== document.body);
                
                // Show term text and type in info panel
                updateInfoPanel({ text: termText, type: termType}, 'term');
            }
        };
        
        // mouseover fires when transitioning from child to parent, mouseenter doesn't
        termMarker.addEventListener('mouseover', handleTermHover);
        
        termMarker.addEventListener('mouseleave', () => {
            // Clean up opacity factors from this term and all parents
            termMarker.style.removeProperty('--opacity-factor');
            
            let parent = termMarker.parentElement;
            while (parent && parent !== document.body) {
                if (parent.classList.contains('term-marker')) {
                    parent.style.removeProperty('--opacity-factor');
                }
                parent = parent.parentElement;
            }
            
            // Restore goal state display if a goal marker is active
            if (state.currentMarker) {
                const goalText = state.currentMarker.getAttribute('data-goal');
                updateInfoPanel(goalText, 'goal');
            }
        });
    });
    
    // Auto-select first marker on load
    if (markers.length > 0) {
        selectMarker(markers[0]);
    }
}

/**
 * Selects a goal marker and displays its tactic state
 */
function selectMarker(marker) {
    // Remove active styling from previous marker
    if (state.currentMarker) {
        state.currentMarker.classList.remove('active');
    }
    
    // Apply active styling to new marker
    marker.classList.add('active');
    state.currentMarker = marker;
    
    // Scroll marker into view
    marker.scrollIntoView({ block: 'center', behavior: 'smooth' });
    
    // Display tactic state from data attribute
    const goalText = marker.getAttribute('data-goal');
    updateInfoPanel(goalText);
}

/**
 * Gets the vertical position of an element for line-aware navigation
 */
function getYPosition(element) {
    return element.offsetTop;
}

/**
 * Finds the leftmost marker on a different line
 * @param {Array} markers - Array of goal marker elements
 * @param {number} currentIndex - Current marker index
 * @param {string} direction - 'next' or 'previous'
 * @returns {number} Index of target marker
 */
function findMarkerOnDifferentLine(markers, currentIndex, direction) {
    const currentY = getYPosition(markers[currentIndex]);
    const tolerance = 5; // pixels tolerance for same line
    
    if (direction === 'next') {
        // Find first marker on next line (leftmost)
        for (let i = currentIndex + 1; i < markers.length; i++) {
            const markerY = getYPosition(markers[i]);
            if (Math.abs(markerY - currentY) > tolerance) {
                return i;
            }
        }
    } else { // previous
        // Find first marker on previous line (leftmost)
        // First, find any marker on a different line going backward
        let targetY = null;
        for (let i = currentIndex - 1; i >= 0; i--) {
            const markerY = getYPosition(markers[i]);
            if (Math.abs(markerY - currentY) > tolerance) {
                targetY = markerY;
                break;
            }
        }
        
        // If found a different line, find the leftmost marker on that line
        if (targetY !== null) {
            for (let i = 0; i < markers.length; i++) {
                const markerY = getYPosition(markers[i]);
                if (Math.abs(markerY - targetY) <= tolerance) {
                    return i;
                }
            }
        }
    }
    return currentIndex; // Stay at current if no marker found on different line
}

/**
 * Sets up keyboard navigation for goal markers
 * Supports: Arrow keys, Page Up/Down, Home/End
 */
export function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (!state.currentMarker) return;
        
        const markers = Array.from(document.querySelectorAll('.goal-marker'));
        const currentIndex = markers.indexOf(state.currentMarker);
        let newIndex = currentIndex;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    newIndex = currentIndex - 1;
                }
                break;
            case 'ArrowRight':
            case 'PageDown':
                e.preventDefault();
                if (currentIndex < markers.length - 1) {
                    newIndex = currentIndex + 1;
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                newIndex = findMarkerOnDifferentLine(markers, currentIndex, 'previous');
                break;
            case 'ArrowDown':
                e.preventDefault();
                newIndex = findMarkerOnDifferentLine(markers, currentIndex, 'next');
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = markers.length - 1;
                break;
            default:
                return;
        }
        
        if (newIndex !== currentIndex) {
            selectMarker(markers[newIndex]);
        }
    });
}
