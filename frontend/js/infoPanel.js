// ============================================================================
// Info Panel Management and Goal Syntax Highlighting
// ============================================================================

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

export function updateInfoPanel(goalText) {
    const infoContent = document.getElementById('info-content');
    
    if (goalText && goalText.trim()) {
        infoContent.innerHTML = '';
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'info-message';
        msgDiv.innerHTML = colorizeGoal(goalText);
        infoContent.appendChild(msgDiv);
    } else {
        infoContent.innerHTML = '<div class="info-empty">No information available at this position</div>';
    }
}
