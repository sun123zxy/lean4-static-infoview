// ============================================================================
// Main Initialization
// ============================================================================

import { setupFilePickerListeners } from './dataLoader.js';
import { setupKeyboardNavigation } from './navigation.js';

window.addEventListener('DOMContentLoaded', () => {
    setupFilePickerListeners();
    setupKeyboardNavigation();
});
