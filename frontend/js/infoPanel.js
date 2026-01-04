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
        // Skip lines that start with spaces (indented content within types/values)
        else if ((line.match(/^[^⊢]+:/) || line.trim().startsWith(':=')) && !line.match(/^\s/)) {
            if (line.trim().startsWith(':=')) {
                // Let-value line
                html += `<div class="goal-let-value">${escapeHtml(line)}</div>`;
            } else {
                // Hypothesis: "name : type"
                const colonPos = line.indexOf(':');
                if (colonPos > 0) {
                    const name = line.substring(0, colonPos);
                    const type = line.substring(colonPos);
                    const nameClass = name.trim() === 'inst' ? 'goal-hyp-name inst' : 'goal-hyp-name';
                    html += `<div class="goal-hyp"><span class="${nameClass}">${escapeHtml(name)}</span><span class="goal-hyp-type">${escapeHtml(type)}</span></div>`;
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
            // do nothing
        }
        else if (line.trim() === '') {
            // html += '<div>&nbsp;</div>';
            // do nothing
        }
        else {
            html += `<div>${escapeHtml(line)}</div>`;
        }
    }
    
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
        msgDiv.innerHTML = `
            <div class="term-display">
                <span class="term-label">Term:</span> <span class="term-text">${hljs.highlight(content.text, { language: 'lean', ignoreIllegals: true }).value}</span><br>
                <span class="term-type-label">Type:</span> <span class="term-type-value">${hljs.highlight(content.type, { language: 'lean', ignoreIllegals: true }).value}</span>
            </div>`
            
    } else {
        // Display goal information
        msgDiv.className = 'info-message';
        msgDiv.innerHTML = colorizeGoal(content);
    }
    
    infoContent.appendChild(msgDiv);
}
