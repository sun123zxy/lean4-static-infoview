// ============================================================================
// State Management
// ============================================================================

let infoData = null;
let currentPosition = 0;
let positionMap = new Map();
let tacticOffsets = [];  // Offsets where tactic info exists
let offsetToElement = new Map();
let lineOffsets = [];
let updateScheduled = false;
let activeElement = null;
let infoContentElement = null;
let lastRenderedInfo = null;

// ============================================================================
// Data Loading
// ============================================================================

async function loadInfoData() {
    try {
        const response = await fetch('info.json');
        const data = await response.json();
        infoData = data;
        
        // Build position map and tactic offset array using info_strings lookup
        if (data.positions && data.info_strings) {
            const offsets = [];
            data.positions.forEach(pos => {
                const infoText = data.info_strings[pos.info_id];
                positionMap.set(pos.offset, [infoText]);
                offsets.push(pos.offset);
            });
            // Sort offsets for binary search
            tacticOffsets = offsets.sort((a, b) => a - b);
        }
        
        displayCode(data.source);
    } catch (error) {
        console.error('Error loading info.json:', error);
        document.getElementById('code-content').textContent = 
            'Error: Could not load info.json. Run "lake exe staticInfoView <file>" to generate data.';
    }
}

// ============================================================================
// Code Display
// ============================================================================
function displayCode(source) {
    const codeContent = document.getElementById('code-content');
    codeContent.innerHTML = '';
    
    const lines = source.split('\n');
    let offset = 0;
    const offsets = [];
    const elemMap = new Map();
    const lineOffsetCache = [0]; // First line starts at 0
    
    lines.forEach((line, lineIndex) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'code-line';
        
        // Line number
        const lineNum = document.createElement('span');
        lineNum.className = 'line-number';
        lineNum.textContent = (lineIndex + 1).toString();
        lineDiv.appendChild(lineNum);
        
        // Line content - iterate through actual characters in source
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const span = document.createElement('span');
            span.className = 'code-char';
            span.textContent = char;
            span.dataset.offset = offset;
            
            offsets.push(offset);
            elemMap.set(offset, span);
            lineDiv.appendChild(span);
            // Increment by byte length for UTF-8 encoding
            offset += new Blob([char]).size;
        }
        
        // Add newline character
        if (lineIndex < lines.length - 1) {
            const newline = document.createElement('span');
            newline.className = 'code-char';
            newline.textContent = '\n';
            newline.dataset.offset = offset;
            offsets.push(offset);
            elemMap.set(offset, newline);
            lineDiv.appendChild(newline);
            offset += 1; // newline is 1 byte
            lineOffsetCache.push(offset); // Start of next line
        }
        
        codeContent.appendChild(lineDiv);
    });
    
    // Cache data structures for element lookup
    offsetToElement = elemMap;
    lineOffsets = lineOffsetCache;
    
    // Event delegation for clicks
    codeContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('code-char')) {
            setPosition(parseInt(e.target.dataset.offset, 10));
        }
    });
}

// ============================================================================
// Position Management
// ============================================================================

function setPosition(offset) {
    currentPosition = offset;
    
    // Throttle updates using requestAnimationFrame
    if (!updateScheduled) {
        updateScheduled = true;
        requestAnimationFrame(() => {
            updateScheduled = false;
            
            // Remove previous active class (cached reference)
            if (activeElement) {
                activeElement.classList.remove('active');
            }
            
            // Get element from cache (O(1) lookup)
            const charElement = offsetToElement.get(currentPosition);
            if (charElement) {
                charElement.classList.add('active');
                charElement.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
                activeElement = charElement;
            }
            
            // Update info panel
            updateInfoPanel(currentPosition);
        });
    }
}

// ============================================================================
// Goal Syntax Highlighting
// ============================================================================

function colorizeGoal(text) {
    const lines = text.split('\n');
    let html = '';
    
    for (let line of lines) {
        // Match "Goals: N" header
        if (line.match(/^Goals: \d+$/)) {
            html += `<div class="goal-header">${line}</div>`;
        }
        // Match "Goal N:" label
        else if (line.match(/^Goal \d+:$/)) {
            html += `<div class="goal-label">${line}</div>`;
        }
        // Match hypothesis line "name : type" or "name := value"
        else if (line.match(/^[^⊢]+:/) || line.trim().startsWith(':=')) {
            if (line.trim().startsWith(':=')) {
                // Let-value line
                html += `<div class="goal-let-value">${escapeHtml(line)}</div>`;
            } else {
                // Hypothesis: "name : type"
                const colonPos = line.indexOf(':');
                if (colonPos > 0) {
                    const name = line.substring(0, colonPos);
                    const type = line.substring(colonPos);
                    html += `<div class="goal-hyp"><span class="goal-hyp-name">${escapeHtml(name)}</span><span class="goal-hyp-type">${escapeHtml(type)}</span></div>`;
                } else {
                    html += `<div>${escapeHtml(line)}</div>`;
                }
            }
        }
        // Match goal line with turnstile "⊢"
        else if (line.includes('⊢')) {
            const parts = line.split('⊢');
            html += `<div class="goal-target"><span class="goal-vdash">⊢</span> <span class="goal-type">${escapeHtml(parts[1] || '')}</span></div>`;
        }
        // Separator or other lines
        else if (line.trim() === '---') {
            html += `<div class="goal-separator">${line}</div>`;
        }
        else if (line.trim() === '') {
            html += '<div>&nbsp;</div>';
        }
        else {
            html += `<div>${escapeHtml(line)}</div>`;
        }
    }
    
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// Info Panel Management
// ============================================================================

function updateInfoPanel(offset) {
    if (!infoContentElement) {
        infoContentElement = document.getElementById('info-content');
    }
    
    // Look for info at this position
    let info = positionMap.get(offset);
    
    // If no exact match, find the most recent tactic state before this position
    if (!info && tacticOffsets.length > 0) {
        // Binary search to find the position at or before the clicked offset
        let left = 0;
        let right = tacticOffsets.length - 1;
        let bestOffset = -1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const midOffset = tacticOffsets[mid];
            
            if (midOffset <= offset) {
                bestOffset = midOffset;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        // Use the most recent tactic state
        if (bestOffset >= 0) {
            info = positionMap.get(bestOffset);
        }
    }
    
    // Skip re-rendering if info hasn't changed
    if (info === lastRenderedInfo) {
        return;
    }
    lastRenderedInfo = info;
    
    if (info && info.length > 0) {
        infoContentElement.innerHTML = '';
        info.forEach(message => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'info-message';
            // Apply syntax highlighting to goal text
            msgDiv.innerHTML = colorizeGoal(message);
            infoContentElement.appendChild(msgDiv);
        });
    } else {
        infoContentElement.innerHTML = '<div class="info-empty">No information available at this position</div>';
    }
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

document.addEventListener('keydown', (e) => {
    if (!infoData) return;
    
    let newPosition = currentPosition;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            newPosition = findPreviousOffset(currentPosition);
            break;
        case 'ArrowRight':
            e.preventDefault();
            newPosition = findNextOffset(currentPosition);
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

function findPreviousOffset(offset) {
    if (tacticOffsets.length === 0) return offset;
    
    let left = 0, right = tacticOffsets.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        tacticOffsets[mid] < offset ? left = mid + 1 : right = mid - 1;
    }
    
    return right >= 0 ? tacticOffsets[right] : offset;
}

function findNextOffset(offset) {
    if (tacticOffsets.length === 0) return offset;
    
    let left = 0, right = tacticOffsets.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        tacticOffsets[mid] <= offset ? left = mid + 1 : right = mid - 1;
    }
    
    return left < tacticOffsets.length ? tacticOffsets[left] : offset;
}

function moveVertical(direction) {
    if (!infoData || lineOffsets.length === 0 || tacticOffsets.length === 0) return currentPosition;
    
    // Binary search to find current line
    let currentLine = 0;
    for (let i = 0; i < lineOffsets.length; i++) {
        if (currentPosition < lineOffsets[i]) {
            currentLine = i - 1;
            break;
        }
        if (i === lineOffsets.length - 1) {
            currentLine = i;
        }
    }
    
    const currentColumn = currentPosition - lineOffsets[currentLine];
    
    // Search for the next/previous line with tactics
    let searchLine = currentLine + direction;
    
    while (searchLine >= 0 && searchLine < lineOffsets.length) {
        const lineStart = lineOffsets[searchLine];
        const lineEnd = searchLine + 1 < lineOffsets.length ? lineOffsets[searchLine + 1] - 1 : tacticOffsets[tacticOffsets.length - 1];
        
        // Try to find a tactic on this line at the target column
        const targetOffset = lineStart + currentColumn;
        
        // First, try to find tactic at or near target column
        for (let i = 0; i < tacticOffsets.length; i++) {
            if (tacticOffsets[i] >= targetOffset && tacticOffsets[i] <= lineEnd) {
                return tacticOffsets[i];
            }
        }
        
        // If no tactic at target column, find any tactic on this line
        for (let i = 0; i < tacticOffsets.length; i++) {
            if (tacticOffsets[i] >= lineStart && tacticOffsets[i] <= lineEnd) {
                return tacticOffsets[i];
            }
        }
        
        // No tactics on this line, continue searching
        searchLine += direction;
    }
    
    // No tactics found in that direction
    return currentPosition;
}

// ============================================================================
// Initialization
// ============================================================================

window.addEventListener('DOMContentLoaded', loadInfoData);
