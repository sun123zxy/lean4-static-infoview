// ============================================================================
// Info Panel Resize and Toggle
// ============================================================================

export function setupResizeHandle() {
    const resizeHandle = document.getElementById('resize-handle');
    const infoPanel = document.getElementById('info-panel');
    let isResizing = false;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const containerWidth = document.getElementById('main-content').offsetWidth;
        const newWidth = containerWidth - e.clientX;
        
        // Enforce min/max constraints
        if (newWidth >= 100 && newWidth <= containerWidth * 0.95) {
            infoPanel.style.width = newWidth + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}
