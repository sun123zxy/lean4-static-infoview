// ============================================================================
// Navigation and Marker Selection
// ============================================================================

import { state } from './state.js';
import { updateInfoPanel } from './infoPanel.js';

export function setupMarkerClickHandlers() {
    const markers = document.querySelectorAll('.goal-marker');
    
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
    
    // Auto-select first marker
    if (markers.length > 0) {
        selectMarker(markers[0]);
    }
}

function selectMarker(marker) {
    // Remove active class from previous marker
    if (state.currentMarker) {
        state.currentMarker.classList.remove('active');
    }
    
    // Add active class to new marker
    marker.classList.add('active');
    state.currentMarker = marker;
    
    // Scroll into view
    marker.scrollIntoView({ block: 'center', behavior: 'smooth' });
    
    // Update info panel with goal text from data attribute
    const goalText = marker.getAttribute('data-goal');
    updateInfoPanel(goalText);
}

function getYPosition(element) {
    return element.offsetTop;
}

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
