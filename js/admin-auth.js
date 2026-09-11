const AUTH_KEY = 'lew3l1.mods.auth.v1';
const SESSION_KEY = 'lew3l1.mods.session.v1';

const authGate = document.querySelector('#authGate');
const adminApp = document.querySelector('#adminApp');
const form = document.querySelector('#authForm');
const password = document.querySelector('#authPassword');
const confirmPassword = document.querySelector('#authConfirm');
const confirmWrap = document.querySelector('#authConfirmWrap');
const title = document.querySelector('#authTitle');
const subtitle = document.querySelector('#authSubtitle');
const submitText = document.querySelector('#authSubmitText');
const message = document.querySelector('#authMessage');

let authMode = 'login';

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

async function derive(passwordValue, saltHex) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(passwordValue), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: 180000, hash: 'SHA-256' }, keyMaterial, 256);
  return bytesToHex(new Uint8Array(bits));
}

function randomSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bytesToHex(salt);
}

function equalSafe(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
}

async function isConfigured() {
  return Boolean(localStorage.getItem(AUTH_KEY));
}

async function configurePassword(value) {
  const salt = randomSalt();
  const hash = await derive(value, salt);
  localStorage.setItem(AUTH_KEY, JSON.stringify({ salt, hash, createdAt: new Date().toISOString() }));
}

function showApp() {
  authGate.hidden = true;
  adminApp.hidden = false;
  window.dispatchEvent(new CustomEvent('lew3l1:auth-ready'));
}

function setMode(mode) {
  authMode = mode;
  const registration = mode === 'register';
  title.textContent = registration ? 'Создание локального доступа' : 'Вход в control panel';
  subtitle.textContent = registration
    ? 'Первый запуск: придумай пароль минимум из 10 символов. Он останется только в этом браузере.'
    : 'Админ-панель не связана с публичной навигацией. Введи свой пароль.';
  confirmWrap.hidden = !registration;
  submitText.textContent = registration ? 'Создать и войти' : 'Войти';
  message.textContent = '';
  password.value = '';
  confirmPassword.value = '';
  password.focus();
}

async function login(value) {
  const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  if (!stored?.salt || !stored?.hash) return false;
  const hash = await derive(value, stored.salt);
  return equalSafe(hash, stored.hash);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  const value = password.value;

  if (value.length < 10) {
    message.textContent = 'Пароль должен содержать минимум 10 символов.';
    return;
  }

  try {
    if (authMode === 'register') {
      if (value !== confirmPassword.value) {
        message.textContent = 'Пароли не совпадают.';
        return;
      }
      await configurePassword(value);
      sessionStorage.setItem(SESSION_KEY, '1');
      showApp();
      return;
    }

    const ok = await login(value);
    if (!ok) {
      message.textContent = 'Неверный пароль.';
      password.select();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');
    showApp();
  } catch (error) {
    console.error('[Lew3l1 Auth]', error);
    message.textContent = 'Не удалось инициализировать авторизацию в этом браузере.';
  }
});

window.addEventListener('logout', () => {
  sessionStorage.removeItem(SESSION_KEY);
  adminApp.hidden = true;
  authGate.hidden = false;
  setMode('login');
});

(async function boot() {
  const configured = await isConfigured();
  const session = sessionStorage.getItem(SESSION_KEY) === '1';
  setMode(configured ? 'login' : 'register');
  if (configured && session) showApp();
})();
