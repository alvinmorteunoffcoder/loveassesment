import './style.css'
import { questions } from './questions.js'

// --- OPTIONAL GOOGLE SHEET WEBHOOK INTEGRATION ---
const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyN_P-nwQ-J_Q2bAv-Bb8lhQig8oEvZj09DbcHPqndZ-Ocxm1AUSrFQfGLLT5Yzey1fLQ/exec";

// Session Counter Engine
function getSessionInfo() {
  let count = parseInt(localStorage.getItem('vault_session_counter') || '1', 10);
  let userName = localStorage.getItem('vault_user_name') || 'Shaki';
  let sessionId = `${userName} (Session #${count})`;
  return { count, userName, sessionId };
}

function incrementSessionCounter() {
  let count = parseInt(localStorage.getItem('vault_session_counter') || '1', 10) + 1;
  localStorage.setItem('vault_session_counter', count.toString());
}

// --- Web Audio Synthesizer ---
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'unlock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'shutter') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("Audio play blocked", e);
  }
}

function triggerHaptic() {
  if (navigator.vibrate) {
    try { navigator.vibrate(30); } catch (e) {}
  }
}

// --- Custom Romantic Dialogue Popups System ---
const customDialogModal = document.getElementById('custom-dialog-modal');
const dialogIcon = document.getElementById('dialog-icon');
const dialogTitle = document.getElementById('dialog-title');
const dialogMessage = document.getElementById('dialog-message');
const dialogActions = document.getElementById('dialog-actions');

function showCustomDialog({ icon = '💖', title, message, buttons = [] }) {
  playSound('click');
  triggerHaptic();

  dialogIcon.innerText = icon;
  dialogTitle.innerText = title;
  dialogMessage.innerHTML = message;
  dialogActions.innerHTML = '';

  if (buttons.length === 0) {
    buttons = [{
      text: 'Okay ❤️',
      class: 'btn-primary btn-full',
      onClick: () => {}
    }];
  }

  buttons.forEach(b => {
    const btn = document.createElement('button');
    if (b.id) btn.id = b.id;
    btn.className = b.class || 'btn-primary btn-full';
    btn.innerText = b.text;
    if (b.disabled) btn.disabled = true;

    btn.onclick = () => {
      if (btn.disabled) return;
      playSound('click');
      triggerHaptic();
      customDialogModal.classList.remove('active');
      if (b.onClick) b.onClick();
    };
    dialogActions.appendChild(btn);
  });

  customDialogModal.classList.add('active');
}

// --- Reset & Control Buttons ---
const btnResetApp = document.getElementById('btn-reset-app');
const soundToggleBtn = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');

function resetProgress() {
  incrementSessionCounter();
  localStorage.removeItem('birthdayAnswers_v2');
  localStorage.removeItem('birthdayAnswers');
  localStorage.removeItem('vault_completed_v2');
  localStorage.removeItem('secret_letter_unlocked');
  localStorage.removeItem('vault_spending_time');
  if (globalSpendingTimer) clearInterval(globalSpendingTimer);
  answers = {};
  currentLevel = 1;
  isReviewingMode = false;
  secretLetterUnlocked = false;
  pastPromptShown = false;
  totalSpendingTimeSpent = 0;
  window.location.reload();
}

btnResetApp.addEventListener('click', () => {
  showCustomDialog({
    icon: '✍️',
    title: 'Start New Session?',
    message: `Current session user: <strong>${getSessionInfo().sessionId}</strong>.<br><br>Enter user name for next session (Optional):<br><input id="dialog-user-input" type="text" class="input-field" style="margin-top:8px;" placeholder="e.g. Shaki" value="${getSessionInfo().userName}" />`,
    buttons: [
      {
        text: 'Yes, Start New Session 🔄',
        class: 'btn-primary btn-full glow-pulse',
        onClick: () => {
          const inputEl = document.getElementById('dialog-user-input');
          if (inputEl && inputEl.value.trim()) {
            localStorage.setItem('vault_user_name', inputEl.value.trim());
          }
          resetProgress();
        }
      },
      {
        text: 'Cancel',
        class: 'btn-secondary btn-full',
        onClick: () => {}
      }
    ]
  });
});

soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundIcon.innerText = soundEnabled ? '🔊' : '🔇';
  playSound('click');
});

// --- State Management ---
let answers = JSON.parse(localStorage.getItem('birthdayAnswers_v2')) || {};
let currentLevel = 1;
let currentQuestionId = null;
let isReviewingMode = false;
let inspectionTimeSpent = 0;
let inspectionTimer = null;
let secretLetterUnlocked = localStorage.getItem('secret_letter_unlocked') === 'true';
let pastPromptShown = secretLetterUnlocked;
let totalSpendingTimeSpent = parseInt(localStorage.getItem('vault_spending_time') || '0', 10);
const REQUIRED_SPENDING_TIME = 30; // 30 seconds required
let globalSpendingTimer = null;
let pendingSecretLetterPopup = false;

// --- DOM Elements ---
const heartShutter = document.getElementById('heart-shutter');
const welcomeText = document.getElementById('welcome-text');
const welcomeBtns = document.getElementById('welcome-btns');
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
const errorMsg = document.getElementById('error-msg');

const stageWelcome = document.getElementById('stage-welcome');
const stageVault = document.getElementById('stage-vault');
const stageResult = document.getElementById('stage-result');

const gridContainer = document.getElementById('grid-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressHeartPin = document.getElementById('progress-heart-pin');
const keysProgressText = document.getElementById('keys-progress-text');

const questionModal = document.getElementById('question-modal');
const modalChapter = document.getElementById('modal-chapter');
const modalQuestion = document.getElementById('modal-question');
const modalHint = document.getElementById('modal-hint');
const modalBody = document.getElementById('modal-body');
const btnSubmitAnswer = document.getElementById('btn-submit-answer');
const btnCloseModal = document.getElementById('btn-close-modal');

const reviewModal = document.getElementById('review-modal');
const reviewChapterTag = document.getElementById('review-chapter-tag');
const reviewQuestionText = document.getElementById('review-question-text');
const reviewUserAns = document.getElementById('review-user-ans');
const reviewRightAns = document.getElementById('review-right-ans');
const reviewMemoryNote = document.getElementById('review-memory-note');
const btnCloseReview = document.getElementById('btn-close-review');
const btnDoneReview = document.getElementById('btn-done-review');

const bdayLetterModal = document.getElementById('bday-letter-modal');
const btnCloseLetter = document.getElementById('btn-close-letter');
const btnDoneLetter = document.getElementById('btn-done-letter');

// --- Background Particles ---
function createFloatingHearts() {
  const container = document.getElementById('hearts-container');
  setInterval(() => {
    const heart = document.createElement('div');
    heart.className = 'heart-shape';
    heart.innerHTML = ['❤️', '💖', '✨', '🌹', '💕'][Math.floor(Math.random() * 5)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = (Math.random() * 4 + 4) + 's';
    heart.style.fontSize = (Math.random() * 16 + 14) + 'px';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 7000);
  }, 400);
}

// --- Welcome Screen Logic ---
function isVaultCompleted() {
  return localStorage.getItem('vault_completed_v2') === 'true' || Object.keys(answers).length >= 22;
}

function showPoeticNamePrompt(onComplete) {
  const currentName = localStorage.getItem('vault_user_name') || 'Shaki';
  showCustomDialog({
    icon: '🌹',
    title: 'Who Is This Beautiful Soul?',
    message: `Before we unlock our Memory Vault, please tell me your sweet name, my love:<br>
      <input id="poetic-name-input" type="text" class="input-field" style="margin-top:12px;" placeholder="e.g. Shaki" value="${currentName}" />`,
    buttons: [
      {
        text: 'Begin Journey ❤️',
        class: 'btn-primary btn-full glow-pulse',
        onClick: () => {
          const inputEl = document.getElementById('poetic-name-input');
          const name = (inputEl && inputEl.value.trim()) ? inputEl.value.trim() : 'Shaki';
          localStorage.setItem('vault_user_name', name);
          showInstructionNotice(name, onComplete);
        }
      }
    ]
  });
}

function showInstructionNotice(userName, onComplete) {
  showCustomDialog({
    icon: '✨',
    title: 'A Sweet Note Before You Begin',
    message: `Dearest <strong>${userName}</strong>,<br><br>
      Please <strong>do not leave or refresh the page</strong>. Do every action slowly, take your time, and cherish every single memory.<br><br>
      As you explore our decrypted memories after completing the vault, you will unlock a special hidden secret message from my heart! 💖`,
    buttons: [
      {
        text: 'I Promise to Take My Time ❤️',
        class: 'btn-primary btn-full glow-pulse',
        onClick: () => {
          if (onComplete) onComplete();
        }
      }
    ]
  });
}

function initWelcome() {
  heartShutter.addEventListener('click', openShutter);

  btnYes.addEventListener('click', () => {
    playSound('correct');
    triggerHaptic();

    // Check if user has ALREADY completed full vault in past
    if (isVaultCompleted()) {
      showReturningUserDialogue();
      return;
    }

    if (!localStorage.getItem('vault_user_name')) {
      showPoeticNamePrompt(() => {
        switchStage(stageWelcome, stageVault);
        initVault();
      });
    } else {
      showInstructionNotice(getSessionInfo().userName, () => {
        switchStage(stageWelcome, stageVault);
        initVault();
      });
    }
  });

  btnNo.addEventListener('click', () => {
    playSound('error');
    triggerHaptic();
    errorMsg.style.display = 'block';
  });

  // Auto check on page load if already completed
  if (isVaultCompleted()) {
    setTimeout(showReturningUserDialogue, 800);
  }
}

function showReturningUserDialogue() {
  pastPromptShown = true;
  if (inspectionTimer) clearInterval(inspectionTimer);

  showCustomDialog({
    icon: '💌',
    title: 'Welcome Back, My Love!',
    message: 'You have already unlocked our eternal Memory Vault! What would you like to do?',
    buttons: [
      {
        text: '💌 View Birthday Letter',
        class: 'btn-primary btn-full glow-pulse',
        onClick: () => {
          openBirthdayLetterModal();
        }
      },
      {
        text: '🔓 Decrypt Master Answers & Memory Notes',
        class: 'btn-secondary btn-full',
        onClick: () => {
          pastPromptShown = true;
          if (globalSpendingTimer) clearInterval(globalSpendingTimer);
          switchStage(stageWelcome, stageVault);
          revealAnswersGrid();
        }
      },
      {
        text: '❌ Exit',
        class: 'btn-secondary btn-full',
        onClick: () => {
          playSound('click');
        }
      }
    ]
  });
}

function openShutter() {
  if (!heartShutter.classList.contains('open')) {
    heartShutter.classList.add('open');
    playSound('shutter');
    triggerHaptic();
  }
}

// --- Vault Engine ---
function initVault() {
  renderGrid();
  updateGridState();
  updateSecretLetterBanner();
}

function renderGrid() {
  gridContainer.innerHTML = '';
  for (let i = 1; i <= 22; i++) {
    const item = document.createElement('div');
    item.className = 'grid-item locked';
    item.id = `grid-item-${i}`;
    item.innerHTML = `
      <span class="item-num">${i}</span>
      <span class="item-icon"></span>
    `;
    item.addEventListener('click', () => handleGridItemClick(i));
    gridContainer.appendChild(item);
  }
}

function updateGridState() {
  const answeredCount = Object.keys(answers).length;
  currentLevel = answeredCount + 1;
  
  const scoreBadge = document.getElementById('vault-score-badge');
  if (scoreBadge) scoreBadge.style.display = 'none';

  const percentage = Math.min(100, (answeredCount / 22) * 100);
  progressBarFill.style.width = `${Math.max(4.5, percentage)}%`;
  progressHeartPin.style.left = `${Math.max(4.5, percentage)}%`;
  keysProgressText.innerText = `UNLOCKED: ${answeredCount} / 22`;

  if (currentLevel > 22 && !isReviewingMode) {
    setTimeout(calculateResults, 500);
    return;
  }
  
  for (let i = 1; i <= 22; i++) {
    const item = document.getElementById(`grid-item-${i}`);
    if (!item) continue;
    
    item.classList.remove('locked', 'unlocked', 'answered-correct', 'answered-wrong', 'answered-neutral');

    if (answers[i]) {
      item.classList.add('answered-neutral');
    } else if (i === currentLevel) {
      item.classList.add('unlocked');
    } else {
      item.classList.add('locked');
    }
  }
}

function handleGridItemClick(id) {
  playSound('click');
  triggerHaptic();

  if (isReviewingMode) {
    openReviewInspector(id);
    return;
  }

  if (id > currentLevel) {
    playSound('error');
    showCustomDialog({
      icon: '🔒',
      title: 'Chapter Locked!',
      message: `Answer level ${currentLevel} first to unlock chapter ${id}.`,
      buttons: [{ text: 'Got it!', class: 'btn-primary btn-full' }]
    });
    return;
  }
  
  openQuestionModal(id);
}

// --- Question Modal Logic ---
function openQuestionModal(id) {
  currentQuestionId = id;
  const q = questions.find(item => item.id === id);
  if (!q) return;

  modalChapter.innerText = `${q.title.toUpperCase()}`;
  modalQuestion.innerText = q.text;
  modalHint.innerText = getHintText(q);
  modalBody.innerHTML = '';

  if (q.type === 'mcq' || q.type === 'yesno') {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options-container';
    
    let selectedOption = answers[id]?.value || null;
    
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      if (selectedOption === opt) btn.classList.add('selected');
      btn.innerHTML = `<span>${opt}</span> <span class="opt-check">👉</span>`;
      
      btn.onclick = () => {
        playSound('click');
        triggerHaptic();
        Array.from(optionsDiv.children).forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOption = opt;
      };
      optionsDiv.appendChild(btn);
    });
    
    btnSubmitAnswer.onclick = () => {
      if (!selectedOption) {
        playSound('error');
        showCustomDialog({
          icon: '⚠️',
          title: 'Selection Required',
          message: 'Please tap one of the choices above to unlock this chapter lock!',
          buttons: [{ text: 'Okay', class: 'btn-primary btn-full' }]
        });
        return;
      }
      saveAnswer(id, selectedOption);
    };
    modalBody.appendChild(optionsDiv);
    
  } else if (q.type === 'fill' || q.type === 'collect') {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-field';
    input.placeholder = q.placeholder || 'Type your answer here...';
    if (answers[id]) input.value = answers[id].value;
    
    let wordCountBadge = null;
    if (q.minWords) {
      wordCountBadge = document.createElement('span');
      wordCountBadge.className = 'word-count-badge';
      const updateWords = () => {
        const words = input.value.trim().split(/\s+/).filter(Boolean).length;
        wordCountBadge.innerText = `Words: ${words} / ${q.minWords} minimum required`;
        wordCountBadge.style.color = words >= q.minWords ? 'var(--success-green)' : 'var(--accent-gold)';
      };
      input.addEventListener('input', updateWords);
      updateWords();
    }
    
    container.appendChild(input);
    if (wordCountBadge) container.appendChild(wordCountBadge);

    btnSubmitAnswer.onclick = () => {
      const val = input.value.trim();
      if (!val) {
        playSound('error');
        showCustomDialog({
          icon: '✍️',
          title: 'Empty Answer',
          message: 'Please write your response before unlocking!',
          buttons: [{ text: 'Understood', class: 'btn-primary btn-full' }]
        });
        return;
      }

      if (q.minWords) {
        const words = val.split(/\s+/).filter(Boolean).length;
        if (words < q.minWords) {
          playSound('error');
          showCustomDialog({
            icon: '📜',
            title: 'More Words Needed',
            message: `Please write at least ${q.minWords} words so I can deeply understand your heart! (Current: ${words} words)`,
            buttons: [{ text: 'Write More ✍️', class: 'btn-primary btn-full' }]
          });
          return;
        }
      }

      saveAnswer(id, val);
    };
    modalBody.appendChild(container);
    
  } else if (q.type === 'match') {
    const container = document.createElement('div');
    
    let selectedVal1 = answers[id]?.value?.person1 || null;
    let selectedVal2 = answers[id]?.value?.person2 || null;

    const select1 = createCustomSelect(`${q.person1}'s Outfit:`, q.options1, selectedVal1, (val) => { selectedVal1 = val; });
    const select2 = createCustomSelect(`${q.person2}'s Outfit:`, q.options2, selectedVal2, (val) => { selectedVal2 = val; });

    container.appendChild(select1);
    container.appendChild(select2);

    btnSubmitAnswer.onclick = () => {
      if (!selectedVal1 || !selectedVal2) {
        playSound('error');
        showCustomDialog({
          icon: '👗',
          title: 'Outfits Unmatched',
          message: 'Please select custom outfits for both Shaki and Charlie!',
          buttons: [{ text: 'Fix Matching', class: 'btn-primary btn-full' }]
        });
        return;
      }
      saveAnswer(id, { person1: selectedVal1, person2: selectedVal2 });
    };
    
    modalBody.appendChild(container);
  }

  questionModal.classList.add('active');
}

// --- Custom Select Dropdown Builder ---
function createCustomSelect(labelTitle, optionsList, initialVal, onSelectCallback) {
  const box = document.createElement('div');
  box.className = 'custom-select-box';

  const label = document.createElement('label');
  label.className = 'custom-select-label';
  label.innerText = labelTitle;

  const trigger = document.createElement('div');
  trigger.className = 'custom-select-trigger';
  trigger.innerHTML = `<span class="trigger-text">${initialVal || 'Choose custom outfit...'}</span> <span>▼</span>`;

  const menu = document.createElement('div');
  menu.className = 'custom-options-menu';

  optionsList.forEach(opt => {
    const item = document.createElement('div');
    item.className = 'custom-option-item';
    if (initialVal === opt) item.classList.add('selected');
    item.innerText = opt;
    
    item.onclick = () => {
      playSound('click');
      triggerHaptic();
      Array.from(menu.children).forEach(c => c.classList.remove('selected'));
      item.classList.add('selected');
      trigger.querySelector('.trigger-text').innerText = opt;
      menu.classList.remove('active');
      onSelectCallback(opt);
    };
    menu.appendChild(item);
  });

  trigger.onclick = () => {
    playSound('click');
    menu.classList.toggle('active');
  };

  box.appendChild(label);
  box.appendChild(trigger);
  box.appendChild(menu);
  return box;
}

function getHintText(q) {
  if (q.type === 'collect') return "💡 Express your genuine heart's feeling!";
  if (q.type === 'yesno') return "💡 Answer from your heart!";
  return "💡 Unlock this memory lock correctly!";
}

btnCloseModal.onclick = () => {
  playSound('click');
  questionModal.classList.remove('active');
  checkPendingSecretLetter();
};

function saveAnswer(id, value) {
  playSound('unlock');
  triggerHaptic();
  
  const timestamp = new Date().toLocaleString();
  const sessionInfo = getSessionInfo();
  const q = questions.find(item => item.id === id);

  answers[id] = { value, timestamp, sessionId: sessionInfo.sessionId };
  localStorage.setItem('birthdayAnswers_v2', JSON.stringify(answers));
  questionModal.classList.remove('active');
  checkPendingSecretLetter();

  if (GOOGLE_SHEET_WEBHOOK_URL) {
    let formattedVal = typeof value === 'object' ? JSON.stringify(value) : value;
    fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionInfo.sessionId,
        timestamp: timestamp,
        chapterId: id,
        questionTitle: q ? q.title : `Chapter ${id}`,
        questionText: q ? q.text : '',
        userAnswer: formattedVal,
        correctAnswer: q ? (typeof q.answer === 'object' ? JSON.stringify(q.answer) : q.answer) : ''
      })
    }).catch(err => console.warn('Google Sheet Sync Error', err));
  }

  updateGridState();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Decrypted Answers & Memory Review Modal ---
function openReviewInspector(id) {
  const q = questions.find(item => item.id === id);
  if (!q) return;

  reviewChapterTag.innerText = `${q.title.toUpperCase()} — DECRYPTED`;
  reviewQuestionText.innerText = q.text;

  const ans = answers[id]?.value;
  let formattedUserAns = 'No answer submitted';
  let formattedRightAns = 'Personal Expression';

  if (q.type === 'match') {
    if (ans) formattedUserAns = `${q.person1}: ${ans.person1} | ${q.person2}: ${ans.person2}`;
    formattedRightAns = `${q.person1}: ${q.answer.person1} | ${q.person2}: ${q.answer.person2}`;
  } else if (q.type === 'collect' || q.type === 'yesno') {
    if (ans) formattedUserAns = typeof ans === 'object' ? JSON.stringify(ans) : ans;
    formattedRightAns = q.type === 'yesno' ? "No, Never! ❤️" : "Direct response collected";
  } else {
    if (ans) formattedUserAns = typeof ans === 'object' ? JSON.stringify(ans) : ans;
    formattedRightAns = typeof q.answer === 'object' ? JSON.stringify(q.answer) : q.answer;
  }

  const isCorrect = isAnswerCorrect(q, ans);

  if (ans && q.type !== 'collect' && q.type !== 'yesno') {
    let badgeHtml = '';
    const cleanUser = formattedUserAns.toString().trim().toLowerCase();
    const cleanRight = formattedRightAns.toString().trim().toLowerCase();

    if (isCorrect) {
      if (cleanUser === cleanRight) {
        badgeHtml = `<span class="ans-badge match-correct">✓ Exact Match</span>`;
      } else {
        badgeHtml = `<span class="ans-badge match-correct">✓ Close Match Accepted</span> <span class="match-fuzzy-tag">(Marked Right ❤️)</span>`;
      }
    } else {
      badgeHtml = `<span class="ans-badge match-wrong">✕ Mismatched</span>`;
    }
    reviewUserAns.innerHTML = `<div>${escapeHtml(formattedUserAns)}</div><div style="margin-top:4px;">${badgeHtml}</div>`;
  } else {
    reviewUserAns.innerText = formattedUserAns;
  }

  reviewRightAns.innerText = formattedRightAns;
  reviewMemoryNote.innerText = q.note || "A precious memory cherished forever.";

  reviewModal.classList.add('active');
}

btnCloseReview.onclick = () => { playSound('click'); reviewModal.classList.remove('active'); checkPendingSecretLetter(); };
btnDoneReview.onclick = () => { playSound('click'); reviewModal.classList.remove('active'); checkPendingSecretLetter(); };

// --- Unrolled Birthday Letter Modal Handler ---
function triggerPastAndFutureDialogue() {
  pastPromptShown = true;
  showCustomDialog({
    icon: '⏳',
    title: 'A Letter From My Heart',
    message: `"I know I almost ruined our past & past memories... but will you continue with me from here after for our bright, beautiful, and eternal future? 🌹✨"`,
    buttons: [
      {
        text: 'Yes, Forever & Always! ❤️',
        class: 'btn-primary btn-full glow-pulse',
        onClick: () => {
          playSound('correct');
          createFloatingHearts();
          openBirthdayLetterModal();
        }
      },
      {
        text: 'I am yours for life 💖',
        class: 'btn-secondary btn-full',
        onClick: () => {
          playSound('correct');
          createFloatingHearts();
          openBirthdayLetterModal();
        }
      }
    ]
  });
}

function openBirthdayLetterModal() {
  localStorage.setItem('vault_completed_v2', 'true');
  localStorage.setItem('secret_letter_unlocked', 'true');
  secretLetterUnlocked = true;
  pastPromptShown = true;
  updateSecretLetterBanner();
  bdayLetterModal.classList.add('active');
  const letterCard = bdayLetterModal.querySelector('.letter-card');
  if (letterCard) {
    letterCard.classList.remove('unroll-anim');
    void letterCard.offsetWidth; // trigger reflow for smooth scroll unrolling animation
    letterCard.classList.add('unroll-anim');
  }
}
btnCloseLetter.onclick = () => { playSound('click'); bdayLetterModal.classList.remove('active'); };
btnDoneLetter.onclick = () => { playSound('click'); bdayLetterModal.classList.remove('active'); };

// --- Decrypted Answers 30s Auto Timer Engine ---
function startDecryptedAnswersTimer() {
  updateSecretLetterBanner();
  
  if (secretLetterUnlocked) return;
  if (globalSpendingTimer) return;

  globalSpendingTimer = setInterval(() => {
    totalSpendingTimeSpent += 1;
    localStorage.setItem('vault_spending_time', totalSpendingTimeSpent.toString());
    updateSecretLetterBanner();

    if (totalSpendingTimeSpent >= REQUIRED_SPENDING_TIME) {
      clearInterval(globalSpendingTimer);
      globalSpendingTimer = null;
      secretLetterUnlocked = true;
      localStorage.setItem('secret_letter_unlocked', 'true');
      updateSecretLetterBanner();

      if (questionModal.classList.contains('active') || reviewModal.classList.contains('active')) {
        pendingSecretLetterPopup = true;
      } else {
        trigger5SecondUnskippableAlert();
      }
    }
  }, 1000);
}

function updateSecretLetterBanner() {
  const statusEl = document.getElementById('secret-letter-status');
  const btnEl = document.getElementById('btn-open-secret-letter');
  
  if (secretLetterUnlocked) {
    if (statusEl) statusEl.innerHTML = `💌 <strong>Secret Birthday Letter Unlocked!</strong> 💖`;
    if (btnEl) btnEl.style.display = 'inline-flex';
  } else if (isReviewingMode) {
    if (statusEl) statusEl.innerHTML = `🔐 <strong>Decrypted Vault:</strong> Reading memory notes... 🌹`;
    if (btnEl) btnEl.style.display = 'none';
  } else {
    if (statusEl) statusEl.innerHTML = `🔐 <strong>Decrypted Vault:</strong> Complete 22 chapters to decrypt answers & unlock Secret Letter 💌`;
    if (btnEl) btnEl.style.display = 'none';
  }
}

function checkPendingSecretLetter() {
  if (pendingSecretLetterPopup) {
    pendingSecretLetterPopup = false;
    setTimeout(() => {
      trigger5SecondUnskippableAlert();
    }, 300);
  }
}

const btnOpenSecretLetter = document.getElementById('btn-open-secret-letter');
if (btnOpenSecretLetter) {
  btnOpenSecretLetter.addEventListener('click', () => {
    playSound('click');
    triggerHaptic();
    openBirthdayLetterModal();
  });
}



function trigger5SecondUnskippableAlert() {
  pastPromptShown = true;
  let remainingSeconds = 5;

  showCustomDialog({
    icon: '⏳',
    title: 'One More Step Required!',
    message: `One final step to unlock your Birthday Letter... Please wait <strong id="unskippable-timer" style="font-size:1.2rem; color:var(--primary-neon);">5</strong> seconds! 💖`,
    buttons: [
      {
        id: 'btn-unskippable',
        text: 'Please Wait (5s)...',
        class: 'btn-secondary btn-full disabled',
        disabled: true,
        onClick: () => {
          triggerPastAndFutureDialogue();
        }
      }
    ]
  });

  const btnEl = document.getElementById('btn-unskippable');
  const timerTextEl = document.getElementById('unskippable-timer');

  const countInterval = setInterval(() => {
    remainingSeconds -= 1;
    if (timerTextEl) timerTextEl.innerText = remainingSeconds;
    if (btnEl) btnEl.innerText = `Please Wait (${remainingSeconds}s)...`;

    if (remainingSeconds <= 0) {
      clearInterval(countInterval);
      if (timerTextEl) timerTextEl.innerText = '0';
      if (btnEl) {
        btnEl.innerText = 'Proceed to Final Step 💌';
        btnEl.className = 'btn-primary btn-full glow-pulse';
        btnEl.disabled = false;
      }
    }
  }, 1000);
}

// --- Results & Scoring ---
function calculateResults() {
  switchStage(stageVault, stageResult);
  
  let score = 0;
  let maxScore = 0;
  
  questions.forEach(q => {
    if (q.type === 'collect' || q.type === 'yesno') return;
    maxScore++;
    
    const ans = answers[q.id]?.value;
    if (!ans) return;
    
    if (isAnswerCorrect(q, ans)) {
      score++;
    }
  });
  
  const percentage = Math.round((score / maxScore) * 100);
  document.getElementById('score-percentage-text').innerText = `${percentage}%`;
  showResultUI(percentage);
}

function cleanString(str) {
  return str ? str.toString().toLowerCase().replace(/[^\w\s]/g, '').trim() : '';
}

function isAnswerCorrect(q, ans) {
  if (!ans) return false;

  if (q.type === 'mcq' || q.type === 'yesno') {
    return cleanString(ans) === cleanString(q.answer);
  }

  if (q.type === 'match') {
    if (typeof ans !== 'object' || !ans) return false;
    return ans.person1 === q.answer.person1 && ans.person2 === q.answer.person2;
  }

  if (q.type === 'fill') {
    const userClean = cleanString(ans);
    if (!userClean) return false;

    // Exact match against main answer
    if (userClean === cleanString(q.answer)) return true;

    // Check accepted answers list
    if (q.acceptedAnswers && Array.isArray(q.acceptedAnswers)) {
      if (q.acceptedAnswers.some(target => cleanString(target) === userClean)) {
        return true;
      }
      // Substring token match for fill phrases (e.g. "moon light" inside "moon light lamp")
      if (q.acceptedAnswers.some(target => {
        const cleanT = cleanString(target);
        return cleanT.length >= 3 && (userClean.includes(cleanT) || cleanT.includes(userClean));
      })) {
        return true;
      }
    }
    return false;
  }

  return cleanString(ans) === cleanString(q.answer);
}

function showResultUI(percentage) {
  const title = document.getElementById('result-title');
  const desc = document.getElementById('result-desc');
  const emoji = document.getElementById('result-emoji');
  
  const disqualifiedUI = document.getElementById('disqualified-ui');
  const finalMessageUI = document.getElementById('final-message-ui');

  // ALWAYS require sending kisses first for all scores!
  disqualifiedUI.style.display = 'block';
  finalMessageUI.style.display = 'none';
  
  if (percentage > 90) {
    emoji.innerText = '🥰';
    title.innerText = 'You Really Love Me! ❤️';
    desc.innerText = 'Pure soulmates! You remember every single detail of our journey.';
  } else if (percentage >= 80) {
    emoji.innerText = '🥺';
    title.innerText = 'You Love Me A Little Bit More!';
    desc.innerText = 'Almost flawless! You know my heart inside out.';
  } else if (percentage >= 70) {
    emoji.innerText = '🤨';
    title.innerText = 'Are You Serious About Us?';
    desc.innerText = 'A few memories slipped away... but we can make many more!';
  } else {
    emoji.innerText = '😭';
    title.innerText = 'System Needs More Love!';
    desc.innerText = 'You scored less than 70%. But love grants second chances...';
  }
}

// --- WhatsApp & 25s Unlock Flow ---
const btnGetMessage = document.getElementById('btn-get-message');
const whatsappLoader = document.getElementById('whatsapp-loader');

btnGetMessage.onclick = () => {
  showCustomDialog({
    icon: '💋',
    title: 'Unlock Confirmation',
    message: 'To unlock the vault, you will send 22,000 kisses to my WhatsApp!',
    buttons: [
      {
        text: 'Send 22,000 Kisses! 😘',
        class: 'btn-primary btn-full glow-pulse',
        onClick: () => {
          const text = encodeURIComponent("Here are 22,000 kisses for you! 😘😘😘💋💋💋 I want to unlock our memory vault!");
          window.open(`https://wa.me/918610629868?text=${text}`, '_blank');
          
          btnGetMessage.style.display = 'none';
          whatsappLoader.style.display = 'flex';
          
          let totalTimeMs = 25000;
          let elapsedTimeMs = 0;
          let activeSeconds = 0;

          const trackActive = () => { activeSeconds++; };
          window.addEventListener('mousemove', trackActive);
          window.addEventListener('touchstart', trackActive);

          const kissInterval = setInterval(() => {
            let increment = 1000;
            if (activeSeconds >= 10) {
              increment = 2000;
            }
            elapsedTimeMs += increment;

            if (elapsedTimeMs >= totalTimeMs) {
              clearInterval(kissInterval);
              window.removeEventListener('mousemove', trackActive);
              window.removeEventListener('touchstart', trackActive);

              whatsappLoader.style.display = 'none';
              document.getElementById('disqualified-ui').style.display = 'none';
              document.getElementById('final-message-ui').style.display = 'block';
              
              document.getElementById('result-title').innerText = "Unlocked With 22,000 Kisses! 💋";
              
              revealAnswersGrid();
            }
          }, 1000);
        }
      },
      {
        text: 'Cancel',
        class: 'btn-secondary btn-full',
        onClick: () => {}
      }
    ]
  });
};

// --- Review Answers Logic ---
document.getElementById('btn-review-answers').onclick = () => {
  playSound('click');
  triggerHaptic();
  isReviewingMode = true;
  if (localStorage.getItem('vault_completed_v2') === 'true') {
    pastPromptShown = true;
    if (globalSpendingTimer) clearInterval(globalSpendingTimer);
  }
  switchStage(stageResult, stageVault);
  revealAnswersGrid();
};

function revealAnswersGrid() {
  isReviewingMode = true;
  localStorage.setItem('vault_completed_v2', 'true');

  if (!gridContainer.children || gridContainer.children.length === 0) {
    renderGrid();
  }

  // Calculate and display final score badge on decrypted answers page
  const scoreBadge = document.getElementById('vault-score-badge');
  if (scoreBadge) {
    let score = 0;
    let maxScore = 0;
    questions.forEach(q => {
      if (q.type === 'collect' || q.type === 'yesno') return;
      maxScore++;
      const ans = answers[q.id]?.value;
      if (ans && isAnswerCorrect(q, ans)) score++;
    });
    const percentage = Math.round((score / maxScore) * 100);
    scoreBadge.innerText = `🏆 SCORE: ${percentage}%`;
    scoreBadge.style.display = 'inline-block';
  }

  progressBarFill.style.width = '100%';
  progressHeartPin.style.left = '100%';
  keysProgressText.innerText = `ALL 22 CHAPTERS UNLOCKED`;

  questions.forEach(q => {
    const item = document.getElementById(`grid-item-${q.id}`);
    if (!item) return;

    item.classList.remove('locked', 'unlocked', 'answered-neutral');
    
    if (q.type === 'collect' || q.type === 'yesno') {
       item.classList.add('answered-neutral');
       return;
    }
    
    const ans = answers[q.id]?.value;
    const correct = isAnswerCorrect(q, ans);
    
    if (correct) {
      item.classList.add('answered-correct');
    } else {
      item.classList.add('answered-wrong');
    }
  });

  if (!pastPromptShown || !secretLetterUnlocked) {
    startDecryptedAnswersTimer();
  }
}

function switchStage(from, to) {
  from.classList.remove('active');
  to.classList.add('active');
}

// Boot Application
createFloatingHearts();
initWelcome();
