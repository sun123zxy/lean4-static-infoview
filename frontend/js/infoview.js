/* ============================================================================
 * Lean 4 Static InfoView - Standalone Script
 * ============================================================================
 * This file contains all InfoView and syntax highlighting functionality.
 * It is designed to be reusable and independent of other frontend code.
 * 
 * Usage: Call initInfoview() after injecting code content into the DOM.
 * ========================================================================== */

// ============================================================================
// Section 1: InfoView State
// ============================================================================

let infoviewState = {
    isVisible: true,
    width: 400,
    isResizing: false
};

// ============================================================================
// Section 2: Syntax Highlighting
// ============================================================================

/**
 * Safely highlight Lean code with fallback if highlight.js is not loaded
 * @param {string} code - The code to highlight
 * @returns {string} - HTML string with highlighted code or escaped plain text
 */
function tryHighlight(code) {
    if (typeof hljs !== 'undefined') {
        try {
            return hljs.highlight(code, { language: 'lean', ignoreIllegals: true }).value;
        } catch (e) {
            console.warn('Highlighting failed, falling back to plain text:', e);
        }
    }
    // Fallback: escape HTML and return plain text
    return escapeHtml(code);
}

/**
 * Recursively walk the DOM and highlight text nodes while preserving marker spans
 */
function highlightTextNodes(node) {
    if (!node) return;
    
    // If it's a text node, highlight it
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text.trim()) {
            // Highlight this text fragment
            const highlighted = tryHighlight(text);
            
            // Create a temporary container to parse the highlighted HTML
            const temp = document.createElement('span');
            temp.innerHTML = highlighted;
            
            // Replace the text node with the highlighted content
            const parent = node.parentNode;
            while (temp.firstChild) {
                parent.insertBefore(temp.firstChild, node);
            }
            parent.removeChild(node);
        }
    } 
    // If it's an element node, recurse into its children
    else if (node.nodeType === Node.ELEMENT_NODE) {
        // Process children in reverse to handle node removal safely
        const children = Array.from(node.childNodes);
        for (const child of children) {
            highlightTextNodes(child);
        }
    }
}

// ============================================================================
// Section 3: InfoView DOM Creation
// ============================================================================

/**
 * Creates and injects the InfoView panel and toggle button into the DOM
 */
function createInfoViewDOM() {
    // Create InfoView panel
    const panel = document.createElement('div');
    panel.id = 'infoview-panel';
    
    // Create resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'infoview-resize-handle';
    panel.appendChild(resizeHandle);
    
    // Create header
    const header = document.createElement('div');
    header.id = 'infoview-header';
    header.textContent = 'Lean InfoView';
    panel.appendChild(header);
    
    // Create content area
    const content = document.createElement('div');
    content.id = 'infoview-content';
    content.className = 'info-empty';
    content.textContent = 'Click on the code to see information';
    panel.appendChild(content);
    
    // Create toggle button
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'infoview-toggle';
    toggleBtn.innerHTML = '&gt;';
    toggleBtn.title = 'Toggle InfoView';
    toggleBtn.style.right = infoviewState.width + 'px';
    
    // Append to body
    document.body.appendChild(panel);
    document.body.appendChild(toggleBtn);
}

// ============================================================================
// Section 4: Info Panel Rendering
// ============================================================================

/**
 * Escapes HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Processes a single goal by separating hypotheses and target with ⊢
 */
function processGoal(goalText) {
    // Split by turnstile to separate hypotheses from target
    const vdashIndex = goalText.indexOf('⊢');
    
    if (vdashIndex === -1) {
        // No turnstile, treat entire text as hypotheses
        const highlighted = tryHighlight(goalText.trim()).replace(/\n/g, '<br>');
        return `<div class="goal-hypotheses">${highlighted}</div>`;
    }
    
    const hypotheses = goalText.substring(0, vdashIndex).trim();
    const target = goalText.substring(vdashIndex + 1).trim();
    
    let html = '';
    
    // Highlight hypotheses
    if (hypotheses) {
        const hypothesesHighlighted = tryHighlight(hypotheses).replace(/\n/g, '<br>');
        html += `<div class="goal-hypotheses">${hypothesesHighlighted}</div>`;
    }
    
    // Add turnstile and target
    const targetHighlighted = tryHighlight(target).replace(/\n/g, '<br>');
    html += `<div class="goal-target"><span class="goal-vdash">⊢</span> ${targetHighlighted}</div>`;
    
    return html;
}

/**
 * Colorizes goal state text with syntax highlighting
 */
function colorizeGoal(text) {
    let html = '';
    
    // Split text into individual goals using "Goal n:" and "---" as separators
    const lines = text.split('\n');
    
    let currentGoal = null;
    let headerLine = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Match "Goals: N" header or "Goal N:" label
        if (line.match(/^Goals?: \d+$/)) {
            headerLine = line;
            html += `<div class="goal-header">${escapeHtml(line)}</div>`;
            continue;
        }
        
        if (line.match(/^Goal \d+:$/)) {
            // Process previous goal if exists
            if (currentGoal !== null) {
                html += processGoal(currentGoal);
            }
            // Start new goal
            html += `<div class="goal-label">${escapeHtml(line)}</div>`;
            currentGoal = '';
            continue;
        }
        
        // Separator between goals
        if (line.trim() === '---') {
            if (currentGoal !== null) {
                html += processGoal(currentGoal);
                currentGoal = '';
            }
            continue;
        }
        
        // Accumulate goal content
        if (currentGoal !== null) {
            currentGoal += (currentGoal ? '\n' : '') + line;
        }
    }
    
    // Process last goal
    if (currentGoal !== null && currentGoal.trim()) {
        html += processGoal(currentGoal);
    }
    
    return html;
}

/**
 * Updates the info panel with goal state or term type information
 */
function updateInfoPanel(content, type = 'goal') {
    const infoContent = document.getElementById('infoview-content');
    
    if (!content || (typeof content === 'string' && !content.trim())) {
        infoContent.className = 'info-empty';
        infoContent.textContent = 'No information available at this position';
        return;
    }
    
    infoContent.className = '';
    infoContent.innerHTML = '';
    const msgDiv = document.createElement('div');
    
    if (type === 'term') {
        // Display term and its type information
        msgDiv.className = 'info-message term-info';
        const termHighlighted = tryHighlight(content.text).replace(/\n/g, '<br>');
        const typeHighlighted = tryHighlight(content.type).replace(/\n/g, '<br>');
        msgDiv.innerHTML = `
            <div class="term-display">
                <div class="term-label">Term:</div> <div class="term-text">${termHighlighted}</div><br>
                <div class="term-type-label">Type:</div> <div class="term-type-value">${typeHighlighted}</div>
            </div>`;
            
    } else {
        // Display goal information
        msgDiv.className = 'info-message';
        msgDiv.innerHTML = colorizeGoal(content);
    }
    
    infoContent.appendChild(msgDiv);
}

// ============================================================================
// Section 5: Event Handlers
// ============================================================================

/**
 * Selects a goal marker and displays its tactic state
 */
function selectMarker(marker) {
    // Remove active styling from all markers
    const allMarkers = document.querySelectorAll('.goal-marker');
    allMarkers.forEach(m => m.classList.remove('active'));
    
    // Apply active styling to new marker
    marker.classList.add('active');
    
    // Show InfoView if it's hidden
    showInfoView();
    
    // Scroll marker into view
    marker.scrollIntoView({ block: 'center', behavior: 'smooth' });
    
    // Display tactic state from data attribute
    const goalText = marker.getAttribute('data-goal');
    updateInfoPanel(goalText, 'goal');
}

/**
 * Gets the vertical position of an element for line-aware navigation
 */
function getYPosition(element) {
    return element.offsetTop;
}

/**
 * Finds the leftmost marker on a different line
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
 * Sets up click and hover handlers for goal and term markers
 */
function setupMarkerHandlers() {
    // Goal marker click handlers
    const goalMarkers = document.querySelectorAll('.goal-marker');
    goalMarkers.forEach(marker => {
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
                updateInfoPanel({ text: termText, type: termType }, 'term');
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
            const activeMarker = document.querySelector('.goal-marker.active');
            if (activeMarker) {
                const goalText = activeMarker.getAttribute('data-goal');
                updateInfoPanel(goalText, 'goal');
            }
        });
    });
}

/**
 * Sets up keyboard navigation for goal markers
 */
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const currentMarker = document.querySelector('.goal-marker.active');
        if (!currentMarker) return;
        
        const markers = Array.from(document.querySelectorAll('.goal-marker'));
        const currentIndex = markers.indexOf(currentMarker);
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

/**
 * Sets up the resize handle for adjusting InfoView width
 */
function setupResizeHandler() {
    const resizeHandle = document.getElementById('infoview-resize-handle');
    const panel = document.getElementById('infoview-panel');
    const toggleBtn = document.getElementById('infoview-toggle');
    
    resizeHandle.addEventListener('mousedown', (e) => {
        infoviewState.isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!infoviewState.isResizing) return;
        
        const newWidth = window.innerWidth - e.clientX;
        
        // Apply new width
        if (newWidth >= 100) {
            infoviewState.width = newWidth;
            panel.style.width = newWidth + 'px';
            toggleBtn.style.right = newWidth + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (infoviewState.isResizing) {
            infoviewState.isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

/**
 * Show the InfoView panel with animation
 */
function showInfoView() {
    if (infoviewState.isVisible) return;
    
    const toggleBtn = document.getElementById('infoview-toggle');
    const panel = document.getElementById('infoview-panel');
    
    infoviewState.isVisible = true;
    toggleBtn.classList.add('transitioning');
    panel.classList.remove('hidden');
    toggleBtn.innerHTML = '&gt;';
    toggleBtn.style.right = infoviewState.width + 'px';
    
    setTimeout(() => {
        toggleBtn.classList.remove('transitioning');
    }, 300);
}

/**
 * Hide the InfoView panel with animation
 */
function hideInfoView() {
    if (!infoviewState.isVisible) return;
    
    const toggleBtn = document.getElementById('infoview-toggle');
    const panel = document.getElementById('infoview-panel');
    
    infoviewState.isVisible = false;
    toggleBtn.classList.add('transitioning');
    panel.classList.add('hidden');
    toggleBtn.innerHTML = '&lt;';
    toggleBtn.style.right = '0';
    
    setTimeout(() => {
        toggleBtn.classList.remove('transitioning');
    }, 300);
}

/**
 * Sets up the toggle button for showing/hiding InfoView
 */
function setupToggleButton() {
    const toggleInfoView = () => {
        if (infoviewState.isVisible) {
            hideInfoView();
        } else {
            showInfoView();
        }
    };
    
    // Click handler for toggle button
    const toggleBtn = document.getElementById('infoview-toggle');
    toggleBtn.addEventListener('click', toggleInfoView);
    
    // Keyboard shortcut 'I' to toggle InfoView
    document.addEventListener('keydown', (e) => {
        if (e.key === 'i' || e.key === 'I') {
            // Only trigger if not typing in an input field
            if (!isTypingInInput()) {
                e.preventDefault();
                toggleInfoView();
            }
        }
    });
}

/**
 * Check if the user is currently typing in an input or textarea
 */
function isTypingInInput() {
    const activeElement = document.activeElement;
    return activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
}

// ============================================================================
// Section 6: Global Initialization API
// ============================================================================

/**
 * Initializes the InfoView for the current code content
 * Should be called after injecting HTML content into the DOM
 */
function initInfoview() {
    // 1. Apply syntax highlighting to the code
    const code = document.querySelector('code.infoview-lean');
    if (code) {
        highlightTextNodes(code);
    }
    
    // 2. Create InfoView DOM elements
    createInfoViewDOM();
    
    // 3. Setup all event handlers
    setupMarkerHandlers();
    setupKeyboardNavigation();
    setupResizeHandler();
    setupToggleButton();
    
    // 4. Initialize: select first goal marker
    const firstMarker = document.querySelector('.goal-marker');
    if (firstMarker) {
        firstMarker.classList.add('active');
        const goalText = firstMarker.getAttribute('data-goal');
        updateInfoPanel(goalText, 'goal');
    }
}

// Expose globally
window.initInfoview = initInfoview;
