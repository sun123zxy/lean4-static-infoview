// ============================================================================
// Info Panel Management and Goal Syntax Highlighting
// ============================================================================

import { state } from './state.js';

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

export function updateInfoPanel(offset) {
    if (!state.infoContentElement) {
        state.infoContentElement = document.getElementById('info-content');
    }
    
    // Look for info at this position
    let info = state.positionMap.get(offset);
    
    // If no exact match, find the most recent tactic state before this position
    if (!info && state.tacticOffsets.length > 0) {
        // Binary search to find the position at or before the clicked offset
        let left = 0;
        let right = state.tacticOffsets.length - 1;
        let bestOffset = -1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const midOffset = state.tacticOffsets[mid];
            
            if (midOffset <= offset) {
                bestOffset = midOffset;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        // Use the most recent tactic state
        if (bestOffset >= 0) {
            info = state.positionMap.get(bestOffset);
        }
    }
    
    // Skip re-rendering if info hasn't changed
    if (info === state.lastRenderedInfo) {
        return;
    }
    state.lastRenderedInfo = info;
    
    if (info && info.length > 0) {
        state.infoContentElement.innerHTML = '';
        info.forEach(message => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'info-message';
            // Apply syntax highlighting to goal text
            msgDiv.innerHTML = colorizeGoal(message);
            state.infoContentElement.appendChild(msgDiv);
        });
    } else {
        state.infoContentElement.innerHTML = '<div class="info-empty">No information available at this position</div>';
    }
}
