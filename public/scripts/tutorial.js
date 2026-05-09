const tutorialSteps = [
  {
    title: "Welcome!",
    message: "Welcome to Gooble Drive! This quick tour will show you the ropes.",
    target: null
  },
  {
    title: "Explore Folders",
    message: "Double-click the 'Getting Started' folder to see what's inside.",
    target: '[data-name="Getting Started"]',
    expectedEvent: 'dblclick'
  },
  {
    title: "Open a File",
    message: "Double-click 'El Nido.jpg' to open it in a new tab.",
    target: '[data-name="El Nido.jpg"]',
    expectedEvent: 'dblclick'
  },
  {
    title: "Explore Item Options",
    message: "Click the 3-dots on 'El Nido.jpg' to see actions like Rename or Download.",
    target: '[data-name="El Nido.jpg"] .options-btn',
    expectedEvent: 'click'
  },
  {
    title: "Star a File",
    message: "Click the star button to save this file for quick access later.",
    target: '[data-name="El Nido.jpg"] .star-toggle-btn',
    expectedEvent: 'click'
  },
  {
    title: "Upload your own Files and Folders",
    message: "Use the 'Upload' button to add your own files and folders to Gooble Drive.",
    target: '#openUploadModal',
    expectedEvent: 'click'
  },
  {
    title: "You're ready to go!",
    message: "That's it! You're ready to start managing your own files. Happy Goobling!",
    target: null,
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
  document.getElementById('tutorialMessage').innerText = step.message;
  document.getElementById('tutorialStepCount').innerText = `${currentStep + 1} / ${tutorialSteps.length}`;
  nextBtn.innerText = step.isFinal ? "Finish" : "Next";

  document.querySelectorAll('.tutorial-spotlight').forEach(el => el.classList.remove('tutorial-spotlight'));

  const targetEl = step.target ? document.querySelector(step.target) : null;

  if (targetEl) {
    targetEl.classList.add('tutorial-spotlight');
    targetEl.style.opacity = '1';
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  positionModal(modal, targetEl);

  if (step === tutorialSteps[1]) {
    nextBtn.style.display = 'none';
  }

  if (step === tutorialSteps[3] && dom?.options?.menu) {
    dom.options.menu.style.zIndex = '9002'; // Ensure options menu appears above modal
    dom.options.menu.style.top = '0';
    dom.options.menu.style.left = '0';
  }

  if (step === tutorialSteps[5] && dom?.modals?.upload) {
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
  const modalWidth = modal.getBoundingClientRect().width || 300;
  const modalHeight = modal.offsetHeight || modal.getBoundingClientRect().height;
  const padding = 15;
  const minMargin = 20;

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

  document.querySelectorAll('.tutorial-spotlight').forEach(el => el.classList.remove('tutorial-spotlight'));

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

