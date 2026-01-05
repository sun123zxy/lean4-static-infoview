// ============================================================================
// Info Panel Management and Goal Syntax Highlighting
// ============================================================================
//
// Handles:
// - Colorizing goal state output (hypotheses, turnstile, targets)
// - Displaying term type information
// - Managing info panel content updates
// ============================================================================

/**
 * Colorizes goal state text with syntax highlighting
 * Applies VS Code dark theme colors to different components
 * @param {string} text - Raw goal state text
 * @returns {string} HTML with syntax highlighting
 */
export function colorizeGoal(text) {
    let html = '';
    
    // Split text into individual goals using "Goal n:" and "---" as separators
    const goalRegex = /^(Goals?: \d+|Goal \d+:)/m;
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
 * Processes a single goal by separating hypotheses and target with ⊢
 * @param {string} goalText - Text of a single goal
 * @returns {string} HTML with highlighted hypotheses and target
 */
function processGoal(goalText) {
    // Split by turnstile to separate hypotheses from target
    const vdashIndex = goalText.indexOf('⊢');
    
    if (vdashIndex === -1) {
        // No turnstile, treat entire text as hypotheses
        const highlighted = hljs.highlight(goalText.trim(), { language: 'lean', ignoreIllegals: true }).value.replace(/\n/g, '<br>');
        return `<div class="goal-hypotheses">${highlighted}</div>`;
    }
    
    const hypotheses = goalText.substring(0, vdashIndex).trim();
    const target = goalText.substring(vdashIndex + 1).trim();
    
    let html = '';
    
    // Highlight hypotheses
    if (hypotheses) {
        const hypothesesHighlighted = hljs.highlight(hypotheses, { language: 'lean', ignoreIllegals: true }).value.replace(/\n/g, '<br>');
        html += `<div class="goal-hypotheses">${hypothesesHighlighted}</div>`;
    }
    
    // Add turnstile and target
    const targetHighlighted = hljs.highlight(target, { language: 'lean', ignoreIllegals: true }).value.replace(/\n/g, '<br>');
    html += `<div class="goal-target"><span class="goal-vdash">⊢</span> ${targetHighlighted}</div>`;
    
    return html;
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} HTML-safe text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Updates the info panel with goal state or term type information
 * @param {string|Object} content - Goal text string or {text, type} object for terms
 * @param {string} type - 'goal' or 'term'
 */
export function updateInfoPanel(content, type = 'goal') {
    const infoContent = document.getElementById('info-content');
    
    if (!content || (typeof content === 'string' && !content.trim())) {
        infoContent.innerHTML = '<div class="info-empty">No information available at this position</div>';
        return;
    }
    
    infoContent.innerHTML = '';
    const msgDiv = document.createElement('div');
    
    if (type === 'term') {
        // Display term and its type information
        msgDiv.className = 'info-message term-info';
        const termHighlighted = hljs.highlight(content.text, { language: 'lean', ignoreIllegals: true }).value.replace(/\n/g, '<br>');
        const typeHighlighted = hljs.highlight(content.type, { language: 'lean', ignoreIllegals: true }).value.replace(/\n/g, '<br>');
        msgDiv.innerHTML = `
            <div class="term-display">
                <div class="term-label">Term:</div> <div class="term-text">${termHighlighted}</div><br>
                <div class="term-type-label">Type:</div> <div class="term-type-value">${typeHighlighted}</div>
            </div>`
            
    } else {
        // Display goal information
        msgDiv.className = 'info-message';
        msgDiv.innerHTML = colorizeGoal(content);
    }
    
    infoContent.appendChild(msgDiv);
}
