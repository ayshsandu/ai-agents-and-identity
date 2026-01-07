// Slide Controller - Adapts individual slides for index.html navigation

// State check helper
function getState() {
    let currentStep = 0; // Default to 0 if undefined
    let totalSteps = 0;

    // Detect variables
    if (typeof window.currentStep !== 'undefined') {
        currentStep = window.currentStep;
    } else if (typeof window.currentStepIndex !== 'undefined') {
        currentStep = window.currentStepIndex;
    }

    if (typeof window.totalSteps !== 'undefined') {
        totalSteps = window.totalSteps; // Explicit total
    } else if (typeof window.stepsData !== 'undefined') {
        totalSteps = window.stepsData.length; // Implicit from array
    } else {
        // Assume 0 steps (static page)
        totalSteps = 0;
    }

    return { currentStep, totalSteps };
}

// 1. Listen for messages from Parent (if Parent has focus)
window.addEventListener('message', function (event) {
    if (event.data.action === 'NAVIGATE') {
        const direction = event.data.direction;
        handleNavigationCommand(direction);
    }
});

function handleNavigationCommand(direction) {
    const s = getState();
    console.log(`[SlideController] Command: ${direction}, Step: ${s.currentStep}/${s.totalSteps}`);

    if (direction === 'NEXT') {
        if (s.totalSteps > 0 && s.currentStep < s.totalSteps) {
            // Trigger internal
            dispatchKey('ArrowRight');
            // We assume it worked.
            window.parent.postMessage({ status: 'HANDLED' }, '*');
        } else {
            // Done
            window.parent.postMessage({ status: 'DONE_NEXT' }, '*');
        }
    } else if (direction === 'PREV') {
        if (s.totalSteps > 0 && s.currentStep > 0) {
            dispatchKey('ArrowLeft');
            window.parent.postMessage({ status: 'HANDLED' }, '*');
        } else {
            window.parent.postMessage({ status: 'DONE_PREV' }, '*');
        }
    }
}

function dispatchKey(key) {
    const event = new KeyboardEvent('keydown', {
        key: key,
        code: key,
        bubbles: true,
        cancelable: true,
        view: window
    });
    document.dispatchEvent(event);
}

// 2. Listen for local Keydowns (if Iframe has focus)
document.addEventListener('keydown', (e) => {
    // Only intercept navigation keys
    if (!['ArrowRight', ' ', 'Enter', 'PageDown', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
        return;
    }

    const s = getState();
    const isNext = ['ArrowRight', ' ', 'Enter', 'PageDown', 'ArrowDown'].includes(e.key);
    const isPrev = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key);

    console.log(`[SlideController] Key: ${e.key}, Next?${isNext}, Step: ${s.currentStep}/${s.totalSteps}`);

    if (isNext) {
        // If we are at the end, we capture and send message
        if (s.currentStep >= s.totalSteps) {
            e.preventDefault();
            e.stopPropagation();
            window.parent.postMessage({ status: 'DONE_NEXT' }, '*');
        }
        // Else: let it bubble, existing script handles it.
    } else if (isPrev) {
        // If we are at start, capture and send message
        if (s.currentStep <= 0) {
            e.preventDefault();
            e.stopPropagation();
            window.parent.postMessage({ status: 'DONE_PREV' }, '*');
        }
        // Else: bubble
    }
}, true); // Use capture to intercept before content?? No, bubble is fine usually, but capture ensures we run before some listeners? 
// Actually, standard bubble is fine, but we want to know state BEFORE changes? 
// The existing listeners are on 'document' bubble phase usually.
// If we add ours last, it runs last. If we add first (capture), we run first.
// If we run first: 
//   Next: if current < total, we let it pass.
//   Next: if current == total, we STOP it and send message.
// This is perfert.

// Initial Handshake
window.parent.postMessage({ status: 'READY' }, '*');
