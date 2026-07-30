const tutorialSteps = [
  {
    title: "Welcome!",
    message: "Welcome to Gobble Drive! This quick tour will show you the ropes.",
    target: null
  },
  {
    title: "Explore Folders",
    message: "Double-click the 'Getting Started' folder to see what's inside.",
    target: '[data-name="Getting Started"]',
    expectedEvent: 'dblclick'
  },
  {
    title: "Preview a File",
    message: "Double-click 'El Nido.jpg' to open the image preview.",
    target: '[data-name="El Nido.jpg"]',
    expectedEvent: 'dblclick'
  },
  {
    title: "Close Preview",
    message: "Click the 'X' button to close the image preview.",
    target: '#closePreviewModal',
    expectedEvent: 'click'
  },
  {
    title: "Explore Item Options",
    message: "Close the preview if it's open, then click the 3-dots on 'El Nido.jpg' to see actions like Rename or Download.",
    target: '[data-name="El Nido.jpg"] .options-btn',
    expectedEvent: 'click'
  },
  {
    title: "Close Options Menu",
    message: "Click anywhere outside the menu to close it.",
    target: null
  },
  {
    title: "Star a File",
    message: "Click the star button on 'El Nido.jpg' to save this file for quick access later.",
    target: '[data-name="El Nido.jpg"] .star-toggle-btn',
    expectedEvent: 'click'
  },
  {
    title: "Upload your own Files",
    message: "Use the floating '+' button to add your own files and folders to Gobble Drive.",
    target: '#openUploadModal',
    expectedEvent: 'click'
  },
  {
    title: "You're ready to go!",
    message: "That's it! You're ready to start managing your own files. Happy Gobbling!",
    target: '#uploadModal .modal-content',
    isFinal: true
  }
];

// Initialize step from localStorage so it survives navigation reloads
let currentStep = parseInt(localStorage.getItem('tutorialStep'), 10);
if (Number.isNaN(currentStep)) currentStep = 0;

function renderTutorialStep() {
  const step = tutorialSteps[currentStep];
  const modal = document.getElementById('tutorialModal');
  const overlay = document.getElementById('tutorialOverlay');
  const nextBtn = document.getElementById('nextTutorialStep');

  if (!modal || !overlay || !nextBtn) return;

  document.getElementById('tutorialTitle').innerText = step.title;
  
  const isMobile = window.innerWidth <= 768;
  let dynamicMessage = step.message;
  if (isMobile) {
    dynamicMessage = dynamicMessage.replace(/Double-click/g, 'Click');
  }
  document.getElementById('tutorialMessage').innerText = dynamicMessage;
  
  document.getElementById('tutorialStepCount').innerText = `${currentStep + 1} / ${tutorialSteps.length}`;
  nextBtn.innerText = step.isFinal ? "Finish" : "Next";

  document.querySelectorAll('.tutorial-spotlight').forEach(el => {
    el.classList.remove('tutorial-spotlight');
    if (el._tutorialAddedRelative) {
      el.style.position = '';
      delete el._tutorialAddedRelative;
    }
  });
  document.querySelectorAll('.grid-item').forEach(el => {
    if (el._tutorialElevated) {
      el.style.zIndex = '';
      delete el._tutorialElevated;
    }
  });

  const targetEl = step.target ? document.querySelector(step.target) : null;

  if (targetEl) {
    targetEl.classList.add('tutorial-spotlight');
    targetEl.style.opacity = '1';
    
    // Elevate element via z-index safely by ensuring it has a position
    if (window.getComputedStyle(targetEl).position === 'static') {
      targetEl.style.position = 'relative';
      targetEl._tutorialAddedRelative = true;
    }
    
    // Fix stacking context issue for nested elements (like options-btn in a grid-item)
    // where a hover transform creates a new stacking context and drops it below the overlay
    const gridItem = targetEl.closest('.grid-item');
    if (gridItem && gridItem !== targetEl) {
      gridItem.style.zIndex = '9001';
      gridItem._tutorialElevated = true;
    }
    
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  positionModal(modal, targetEl);

  // Clean up any previous event listener
  if (window._tutorialCurrentTarget && window._tutorialCurrentHandler) {
    window._tutorialCurrentTarget.removeEventListener(window._tutorialCurrentEvent, window._tutorialCurrentHandler);
  }

  if (step.expectedEvent && targetEl) {
    const eventToListen = (step.expectedEvent === 'dblclick' && isMobile) ? 'click' : step.expectedEvent;
    
    window._tutorialCurrentTarget = targetEl;
    window._tutorialCurrentEvent = eventToListen;
    window._tutorialCurrentHandler = (e) => {
      // Small delay allows the UI action (like opening a modal or menu) to trigger first
      setTimeout(() => {
        // For Step 1 (index 1), folder navigation handles the reload, but we can safely call handleNext to update localStorage
        handleNext();
      }, 50);
    };
    targetEl.addEventListener(eventToListen, window._tutorialCurrentHandler, { once: true });
    
    // Hide the Next button so the user MUST interact with the element
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'block';
  }

  if (step === tutorialSteps[3]) {
    // Elevate the preview modal so the close button spotlight appears above the tutorial overlay
    if (dom?.modals?.preview) {
      dom.modals.preview.style.zIndex = '9002';
    }
  }

  if (step === tutorialSteps[4]) {
    // If we're on the options step, make sure the preview modal is closed
    // so it doesn't block the UI for clicking the options button
    if (dom?.modals?.preview) {
      dom.modals.preview.style.zIndex = '';
      dom.modals.preview.classList.remove('active', 'show');
      document.body.classList.remove('modal-open');
    }
    
    if (dom?.options?.menu) {
      dom.options.menu.style.zIndex = '9002'; // Ensure options menu appears above modal
      dom.options.menu.style.top = '0';
      dom.options.menu.style.left = '0';
    }
  }

  if (step === tutorialSteps[6]) {
    // Ensure options menu is closed so it doesn't obstruct the star button
    if (dom?.options?.menu) {
      dom.options.menu.style.zIndex = '';
      dom.options.menu.classList.remove('active', 'show');
    }
  }

  if (step === tutorialSteps[8] && dom?.modals?.upload) {
    dom.modals.upload.style.zIndex = '9002'; // Ensure upload modal appears above tutorial
  }

  modal.classList.add('active');
  overlay.classList.add('active');
}

function hideTutorialStep() {
  const modal = document.getElementById('tutorialModal');
  const overlay = document.getElementById('tutorialOverlay');

  modal?.classList.remove('active');
  overlay?.classList.remove('active');
}

function updateTutorialUI({ animate = false } = {}) {
  if (animate) {
    hideTutorialStep();
    window.setTimeout(renderTutorialStep, 260);
  } else {
    renderTutorialStep();
  }
}

function autoAdvanceAfterFolderNav() {
  const isSubfolderPage = /^\/dashboard\/\d+($|\/)/.test(window.location.pathname);

  if (currentStep === 1 && isSubfolderPage) {
    currentStep = 2;
    localStorage.setItem('tutorialStep', currentStep);
    return true;
  }

  return false;
}

// Position modal next to target element
function positionModal(modal, target) {
  if (!modal) return;

  // for mobile screens, place the modal above the floating add button if it exists
  if (window.innerWidth <= 767) {
    modal.style.position = 'fixed';
    modal.style.top = 'auto';
    modal.style.left = '50%';
    modal.style.transform = 'translateX(-50%)';
    modal.style.width = 'min(calc(100vw - 32px), 340px)';
    modal.style.maxWidth = '100%';
    modal.style.right = 'auto';

    const floatingBtn = document.querySelector('.floating-add-btn');
    if (floatingBtn) {
      const buttonRect = floatingBtn.getBoundingClientRect();
      const gap = 12;
      const bottomOffset = Math.max(20, window.innerHeight - buttonRect.top + gap);
      modal.style.bottom = `${bottomOffset}px`;
    } else {
      modal.style.bottom = '20px';
    }

    return;
  }

  const rect = target ? target.getBoundingClientRect() : null;
  const wasActive = modal.classList.contains('active');
  if (!wasActive) {
    modal.style.visibility = 'hidden';
    modal.classList.add('active');
  }
  
  const modalWidth = modal.getBoundingClientRect().width || 300;
  const modalHeight = modal.offsetHeight || modal.getBoundingClientRect().height || 180;
  
  if (!wasActive) {
    modal.classList.remove('active');
    modal.style.visibility = '';
  }

  const padding = 20;
  const minMargin = 32;

  if (!rect) {
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = '300px';
    modal.style.maxWidth = '100%';
    return;
  }

  modal.style.position = 'absolute';
  modal.style.transform = 'none';

  let top = window.scrollY + rect.bottom + padding;
  const bottomLimit = window.scrollY + window.innerHeight - modalHeight - minMargin;

  if (top > bottomLimit) {
    top = window.scrollY + rect.top - modalHeight - padding;
  }

  if (top < window.scrollY + minMargin) {
    top = window.scrollY + minMargin;
  }

  let left = rect.left;
  const rightLimit = window.innerWidth - modalWidth - minMargin;

  if (left < minMargin) {
    left = minMargin;
  } else if (left > rightLimit) {
    left = rightLimit;
  }

  modal.style.top = `${top}px`;
  modal.style.left = `${left}px`;
}

function handleNext() {
  if (currentStep < tutorialSteps.length - 1) {
    currentStep++;
    localStorage.setItem('tutorialStep', currentStep);
    updateTutorialUI({ animate: true });
  } else {
    finishTutorial();
  }
}

// Logic to cancel
const cancelTutorialBtn = document.getElementById('cancelTutorial');
cancelTutorialBtn?.addEventListener('click', finishTutorial);

async function finishTutorial() {
  localStorage.removeItem('tutorialStep');

  const modal = document.getElementById('tutorialModal');
  const overlay = document.getElementById('tutorialOverlay');

  modal?.classList.remove('active');
  overlay?.classList.remove('active');

  document.querySelectorAll('.tutorial-spotlight').forEach(el => {
    el.classList.remove('tutorial-spotlight');
    if (el._tutorialAddedRelative) {
      el.style.position = '';
      delete el._tutorialAddedRelative;
    }
  });
  document.querySelectorAll('.grid-item').forEach(el => {
    if (el._tutorialElevated) {
      el.style.zIndex = '';
      delete el._tutorialElevated;
    }
  });

  // Close all active modals and reset z-index
  if (window.dom?.modals) {
    Object.values(window.dom.modals).forEach(m => {
      m.classList.remove('show', 'active');
      m.style.zIndex = '';
    });
    document.body.classList.remove('modal-open');
  }

  try {
    await fetch('/user/complete-tutorial', {
      method: 'POST'
    });
  } catch (err) {
    console.error("Failed to save tutorial progress", err);
  }
}

// ===== EVENT LISTENERS =====

const nextTutorialBtn = document.getElementById('nextTutorialStep');
nextTutorialBtn?.addEventListener('click', handleNext);
cancelTutorialBtn?.addEventListener('click', finishTutorial);

window.addEventListener('resize', () => {
  const step = tutorialSteps[currentStep];
  const modal = document.getElementById('tutorialModal');

  if (step.target) {
    const targetEl = document.querySelector(step.target);
    if (targetEl && modal) {
      positionModal(modal, targetEl);
    }
  }
});

const initTutorial = () => {
  const shouldAnimate = autoAdvanceAfterFolderNav();
  updateTutorialUI({ animate: shouldAnimate });
};

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initTutorial();
} else {
  document.addEventListener('DOMContentLoaded', initTutorial);
}

