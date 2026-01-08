/* ============================================================================
 * Lean 4 Static InfoView - Standalone Script
 * ============================================================================
 * This file contains all InfoView and syntax highlighting functionality.
 * It is designed to be reusable and independent of other frontend code.
 * 
 * Usage: Call initInfoview() after injecting code content into the DOM.
 * 
 * ## Technical Keypoints
 * 
 * ### Standalone InfoView Architecture
 * - **Global API**: `window.initInfoview()` - Call after injecting marked-up HTML into DOM
 * - **No dependencies**: Standalone JavaScript (no module system) and CSS
 * - **Auto-detection**: Finds `<code class="infoview-lean">` and initializes automatically
 * 
 * ### InfoView Features
 * - **Floating Panel**: Right-side panel created dynamically in JavaScript
 * - **Toggle Button**: Attached to right edge, keyboard shortcut 'I' to toggle
 * - **Resizable**: Drag left border to adjust width
 * - **Default Visible**: Shows by default, auto-expands when clicking markers
 * - **Smooth Animation**: Slide in/out transitions (0.3s ease)
 * 
 * ### Syntax Highlighting
 * - **Library**: highlight.js with highlightjs-lean
 * - **Method**: DOM tree walker (`highlightTextNodes`) preserves marker spans
 * - **Integrated**: Part of `initInfoview()` initialization
 * 
 * ### Event Handling
 * - **Goal Markers**: Click to select and show info, auto-expands InfoView if hidden
 * - **Term Markers**: Hover with nested opacity (`mouseover`/`mouseleave`, `stopPropagation()`)
 * - **Keyboard Navigation**: Arrow keys (line-aware), PageUp/Down, Home/End
 * - **Keyboard Shortcut**: 'I' key to toggle InfoView (with input field detection)
 * ========================================================================== */

// State

let infoviewState = {
    isVisible: true,
    width: 400,
    isResizing: false
};

// Syntax highlighting with fallback
function tryHighlight(code) {
    if (typeof hljs !== 'undefined') {
        try { return hljs.highlight(code, { language: 'lean', ignoreIllegals: true }).value; }
        catch (e) { console.warn('Highlighting failed:', e); }
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
            const temp = document.createElement('span');
            temp.innerHTML = tryHighlight(text);
            const parent = node.parentNode;
            while (temp.firstChild) parent.insertBefore(temp.firstChild, node);
            parent.removeChild(node);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(highlightTextNodes);
    }
}

// Create InfoView DOM elements
function createInfoViewDOM() {
    const panel = document.createElement('div');
    panel.id = 'infoview-panel';
    panel.innerHTML = `
        <div id="infoview-resize-handle"></div>
        <div id="infoview-header">Lean InfoView</div>
        <div id="infoview-content" class="info-empty">Click on the code to see information</div>
    `;
    
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'infoview-toggle';
    toggleBtn.innerHTML = '&gt;';
    toggleBtn.title = 'Toggle InfoView';
    toggleBtn.style.right = infoviewState.width + 'px';
    
    // Append to body
    document.body.appendChild(panel);
    document.body.appendChild(toggleBtn);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
    
    for (const line of lines) {
        if (line.match(/^Goals?: \d+$/)) {
            headerLine = line;
            html += `<div class="goal-header">${escapeHtml(line)}</div>`;
        } else if (line.match(/^Goal \d+:$/)) {
            if (currentGoal !== null) html += processGoal(currentGoal);
            html += `<div class="goal-label">${escapeHtml(line)}</div>`;
            currentGoal = '';
        } else if (line.trim() === '---') {
            if (currentGoal !== null) {
                html += processGoal(currentGoal);
                currentGoal = '';
            }
        } else if (currentGoal !== null) {
            currentGoal += (currentGoal ? '\n' : '') + line;
        }
    }
    
    if (currentGoal !== null && currentGoal.trim()) html += processGoal(currentGoal);
    
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
        msgDiv.className = 'info-message term-info';
        msgDiv.innerHTML = `<div class="term-display">
            <div class="term-label">Term:</div> <div class="term-text">${tryHighlight(content.text).replace(/\n/g, '<br>')}</div><br>
            <div class="term-type-label">Type:</div> <div class="term-type-value">${tryHighlight(content.type).replace(/\n/g, '<br>')}</div>
        </div>`;
    } else {
        // Display goal information
        msgDiv.className = 'info-message';
        msgDiv.innerHTML = colorizeGoal(content);
    }
    
    infoContent.appendChild(msgDiv);
}

// Select a goal marker and update InfoView
function selectMarker(marker) {
    document.querySelectorAll('.goal-marker.active').forEach(m => m.classList.remove('active'));
    marker.classList.add('active');
    showInfoView();
    marker.scrollIntoView({ block: 'center', behavior: 'smooth' });
    updateInfoPanel(marker.getAttribute('data-goal'), 'goal');
}

function onSameLine(marker1, marker2) {
    const rect1 = marker1.getBoundingClientRect();
    const rect2 = marker2.getBoundingClientRect();
    // Two markers are on the same line if their vertical ranges overlap
    return !(rect1.bottom < rect2.top || rect2.bottom < rect1.top);
}

function findMarkerOnDifferentLine(markers, currentIndex, direction) {
    let targetIndex = currentIndex;
    if (direction === 'next') {
        // Find first marker not on the same line
        while (targetIndex + 1 < markers.length){
            targetIndex++;
            if (!onSameLine(markers[targetIndex], markers[targetIndex - 1])) break;
        }
    } else {
        // Find first marker on previous line (scan backwards, then find leftmost on that line)
        while (targetIndex - 1 >= 0){
            targetIndex--;
            if (!onSameLine(markers[targetIndex], markers[targetIndex + 1])) break;
        }
        while (targetIndex - 1 >= 0){
            if (!onSameLine(markers[targetIndex], markers[targetIndex - 1])) break;
            targetIndex--;
        }
    }
    return targetIndex;
}

/**
 * Sets up click and hover handlers for goal and term markers
 */
function setupMarkerHandlers() {
    document.querySelectorAll('.goal-marker').forEach(marker => {
        marker.addEventListener('click', (e) => { e.stopPropagation(); selectMarker(marker); });
        marker.setAttribute('tabindex', '0');
        marker.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectMarker(marker); }
        });
    });
    
    document.querySelectorAll('.term-marker').forEach(termMarker => {
        termMarker.addEventListener('mouseover', (e) => {
            e.stopPropagation();
            const termType = termMarker.getAttribute('data-type');
            if (termType) {
                // Set opacity factors: 1.0 for hovered term, 0.5, 0.25, 0.125... for parents
                let opacityFactor = 1.0;
                let me = termMarker;
                do {
                    if (me.classList.contains('term-marker') && me.getAttribute('data-type')) {
                        me.style.setProperty('--opacity-factor', opacityFactor.toString());
                        opacityFactor *= 0.5;
                    }
                    me = me.parentElement;
                } while (me && me !== document.body);
                updateInfoPanel({ text: termMarker.textContent, type: termType }, 'term');
            }
        });
        
        // Clean up opacity factors from this term and all parents
        termMarker.addEventListener('mouseleave', () => {
            termMarker.style.removeProperty('--opacity-factor');
            let parent = termMarker.parentElement;
            while (parent && parent !== document.body) {
                if (parent.classList.contains('term-marker'))
                    parent.style.removeProperty('--opacity-factor');
                parent = parent.parentElement;
            }
            const activeMarker = document.querySelector('.goal-marker.active');
            if (activeMarker) updateInfoPanel(activeMarker.getAttribute('data-goal'), 'goal');
        });
    });
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const currentMarker = document.querySelector('.goal-marker.active');
        if (!currentMarker) return;
        
        const markers = Array.from(document.querySelectorAll('.goal-marker'));
        const currentIndex = markers.indexOf(currentMarker);
        let newIndex = currentIndex;
        
        switch(e.key) {
            case 'ArrowLeft': case 'PageUp':
                e.preventDefault();
                if (currentIndex > 0) newIndex = currentIndex - 1;
                break;
            case 'ArrowRight': case 'PageDown':
                e.preventDefault();
                if (currentIndex < markers.length - 1) newIndex = currentIndex + 1;
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
            default: return;
        }
        
        if (newIndex !== currentIndex) selectMarker(markers[newIndex]);
    });
}

/**
 * Sets up the resize handle for adjusting InfoView width
 */
function setupResizeHandler() {
    const resizeHandle = document.getElementById('infoview-resize-handle');
    const panel = document.getElementById('infoview-panel');
    const toggleBtn = document.getElementById('infoview-toggle');
    
    resizeHandle.addEventListener('mousedown', () => {
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
    setTimeout(() => toggleBtn.classList.remove('transitioning'), 300);
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
    setTimeout(() => toggleBtn.classList.remove('transitioning'), 300);
}

/**
 * Sets up the toggle button for showing/hiding InfoView
 */
function setupToggleButton() {
    const toggleInfoView = () => infoviewState.isVisible ? hideInfoView() : showInfoView();
    document.getElementById('infoview-toggle').addEventListener('click', toggleInfoView);
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'i' || e.key === 'I') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            toggleInfoView();
        }
    });
}

function initInfoview() {
    // 1. Apply syntax highlighting to the code
    const code = document.querySelector('code.infoview-lean');
    if (code) highlightTextNodes(code);
    
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
        updateInfoPanel(firstMarker.getAttribute('data-goal'), 'goal');
    }
}

// Expose globally
window.initInfoview = initInfoview;
