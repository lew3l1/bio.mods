const STORAGE_KEY = 'lew3l1.mods.admin.v1';
const DATA_URL = 'data/streamers.json';
const TWITCH_API = 'https://decapi.me/twitch';

const state = { items: [], selected: -1, dirty: new Set() };
const $ = (selector) => document.querySelector(selector);

const els = {
  list: $('#adminList'), count: $('#adminCount'), dirty: $('#adminDirty'), valid: $('#adminValid'), search: $('#adminSearch'),
  form: $('#editorForm'), empty: $('#emptyEditor'), title: $('#editorTitle'),
  importButton: $('#importButton'), importFile: $('#importFile'), exportButton: $('#exportButton'), verifyAllButton: $('#verifyAllButton'),
  addButton: $('#addButton'), resetButton: $('#resetButton'), deleteButton: $('#deleteButton'), logoutButton: $('#logoutButton'),
  hint: $('#editorHint'), twitchStatusText: $('#twitchStatusText'), verifyButton: $('#verifyButton'),
  username: $('#fieldUsername'), displayName: $('#fieldDisplayName'), year: $('#fieldYear'),
  started: $('#fieldStarted'), role: $('#fieldRole'), platform: $('#fieldPlatform'), status: $('#fieldStatus'),
  ended: $('#fieldEnded'), endReason: $('#fieldEndReason'), description: $('#fieldDescription'),
  avatar: $('#fieldAvatar'), url: $('#fieldUrl'), services: [...document.querySelectorAll('[data-service]')]
};

const defaults = {
  platform: 'Twitch', role: 'Moderator', status: 'needs-confirmation', displayName: '', started: '', ended: '', endReason: '',
  description: '', avatar: '', services: [], url: '', twitch: { status: 'unchecked', checkedAt: '', id: '', avatar: '' }
};

function normalize(item) {
  const next = { ...defaults, ...item, twitch: { ...defaults.twitch, ...(item?.twitch || {}) } };
  next.username = String(next.username || '').trim();
  next.year = String(next.year || '').trim();
  next.url = String(next.url || `https://twitch.tv/${next.username}`).trim();
  next.services = Array.isArray(next.services) ? next.services : [];
  return next;
}

function setMessage(text) { els.hint.textContent = text; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  updateSummary();
  renderList();
}

function markDirty(index) {
  state.dirty.add(index);
  saveDraft();
}

function updateSummary() {
  els.count.textContent = String(state.items.length);
  els.dirty.textContent = String(state.dirty.size);
  els.valid.textContent = String(state.items.filter((item) => item.twitch?.status === 'valid').length);
}

function loadData() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      state.items = JSON.parse(local).map(normalize);
      renderList();
      updateSummary();
      return;
    }
  } catch (error) { console.warn('[Lew3l1 Admin] local draft unavailable', error); }

  fetch(DATA_URL, { cache: 'no-store' })
    .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
    .then((items) => { state.items = items.map(normalize); renderList(); updateSummary(); })
    .catch((error) => { console.error(error); state.items = []; renderList(); setMessage('Не удалось загрузить data/streamers.json.'); });
}

function statusLabel(item) {
  return ({
    active: 'ACTIVE', former_self: 'FORMER · свои причины', former_inactive: 'FORMER · инактив', former: 'FORMER', 'needs-confirmation': 'VERIFY'
  })[item.status] || 'VERIFY';
}

function twitchLabel(item) {
  if (item.twitch?.status === 'valid') return 'TWITCH ✓';
  if (item.twitch?.status === 'invalid') return 'TWITCH ✕';
  return 'TWITCH ?';
}

function renderList() {
  const query = els.search.value.trim().toLowerCase();
  const items = state.items.map((item, index) => ({ item, index })).filter(({ item }) => `${item.username} ${item.displayName}`.toLowerCase().includes(query));
  els.list.innerHTML = items.length ? items.map(({ item, index }) => `
    <button class="admin-list-item ${state.selected === index ? 'is-selected' : ''}" type="button" data-index="${index}">
      <span class="admin-avatar">${item.avatar ? `<img src="${escapeHtml(item.avatar)}" alt="" loading="lazy">` : escapeHtml((item.username || '??').slice(0, 2).toUpperCase())}</span>
      <span class="admin-item-copy"><strong>@${escapeHtml(item.username || 'new-channel')}</strong><small>${escapeHtml(item.year || '—')} · ${escapeHtml(item.role || 'Moderator')}</small></span>
      <span class="admin-item-badges"><small>${twitchLabel(item)}</small><small>${statusLabel(item)}</small></span>
    </button>`).join('') : '<div class="admin-list-empty">Ничего не найдено.</div>';
  els.list.querySelectorAll('[data-index]').forEach((button) => button.addEventListener('click', () => select(Number(button.dataset.index))));
  updateSummary();
}

function select(index) {
  state.selected = index;
  const item = state.items[index];
  if (!item) { els.form.hidden = true; els.empty.hidden = false; return; }
  els.empty.hidden = true; els.form.hidden = false;
  els.title.textContent = `@${item.username || 'new-channel'}`;
  els.username.value = item.username; els.displayName.value = item.displayName; els.year.value = item.year; els.started.value = item.started;
  els.role.value = item.role; els.platform.value = item.platform; els.status.value = item.status; els.ended.value = item.ended;
  els.endReason.value = item.endReason; els.description.value = item.description; els.avatar.value = item.avatar; els.url.value = item.url;
  els.services.forEach((checkbox) => { checkbox.checked = item.services.includes(checkbox.value); });
  renderTwitchStatus(item);
  setMessage(state.dirty.has(index) ? 'Есть несохранённые изменения.' : 'Изменения сохраняются в черновик браузера.');
  renderList();
}

function renderTwitchStatus(item) {
  const status = item.twitch?.status || 'unchecked';
  if (status === 'valid') {
    const date = item.twitch.checkedAt ? new Date(item.twitch.checkedAt).toLocaleString('ru-RU') : 'сейчас';
    els.twitchStatusText.textContent = `Username существует · ID ${item.twitch.id || '—'} · ${date}`;
    els.twitchStatusText.dataset.state = 'valid';
  } else if (status === 'invalid') {
    els.twitchStatusText.textContent = `Username не найден в Twitch · проверено ${item.twitch.checkedAt ? new Date(item.twitch.checkedAt).toLocaleString('ru-RU') : 'сейчас'}`;
    els.twitchStatusText.dataset.state = 'invalid';
  } else {
    els.twitchStatusText.textContent = 'Не проверено';
    delete els.twitchStatusText.dataset.state;
  }
}

function readForm() {
  return normalize({
    ...state.items[state.selected], username: els.username.value, displayName: els.displayName.value, year: els.year.value,
    started: els.started.value, role: els.role.value, platform: els.platform.value, status: els.status.value,
    ended: els.ended.value, endReason: els.endReason.value, description: els.description.value, avatar: els.avatar.value,
    url: els.url.value || `https://twitch.tv/${els.username.value.trim()}`,
    services: els.services.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value)
  });
}

function writeCurrent() {
  if (state.selected < 0) return false;
  const item = readForm();
  if (!item.username || !/^\d{4}$/.test(item.year)) { setMessage('Username и корректный год обязательны.'); return false; }
  if (item.username.toLowerCase() !== state.items[state.selected].username.toLowerCase()) item.twitch = { ...defaults.twitch };
  state.items[state.selected] = item;
  markDirty(state.selected);
  els.title.textContent = `@${item.username}`;
  renderTwitchStatus(item);
  setMessage('Карточка сохранена в черновик.');
  return true;
}

function addItem() {
  writeCurrent();
  const item = normalize({ username: `new-channel-${state.items.length + 1}`, year: String(new Date().getFullYear()) });
  state.items.push(item); state.selected = state.items.length - 1; markDirty(state.selected); select(state.selected); els.username.focus();
}

function deleteItem() {
  if (state.selected < 0) return;
  const item = state.items[state.selected];
  if (!window.confirm(`Удалить @${item.username}?`)) return;
  state.items.splice(state.selected, 1);
  state.dirty = new Set([...state.dirty].filter((index) => index !== state.selected).map((index) => index > state.selected ? index - 1 : index));
  state.selected = Math.min(state.selected, state.items.length - 1); saveDraft(); select(state.selected);
}

function resetDraft() {
  if (!window.confirm('Удалить локальные изменения и загрузить исходный JSON заново?')) return;
  localStorage.removeItem(STORAGE_KEY); state.items = []; state.dirty.clear(); state.selected = -1; els.form.hidden = true; els.empty.hidden = false;
  fetch(DATA_URL, { cache: 'no-store' }).then((response) => response.json()).then((items) => { state.items = items.map(normalize); renderList(); setMessage('Черновик сброшен.'); }).catch(() => setMessage('Не удалось восстановить исходный JSON.'));
}

function exportJson() {
  writeCurrent();
  const blob = new Blob([JSON.stringify(state.items, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'streamers.json'; link.click(); URL.revokeObjectURL(link.href);
  setMessage('JSON экспортирован. Замени им data/streamers.json в репозитории.');
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => { try { const data = JSON.parse(reader.result); if (!Array.isArray(data)) throw new Error('Expected array'); state.items = data.map(normalize); state.dirty = new Set(state.items.map((_, index) => index)); state.selected = -1; saveDraft(); els.form.hidden = true; els.empty.hidden = false; setMessage(`Импортировано ${state.items.length} записей.`); } catch { setMessage('Ошибка: файл не является корректным массивом JSON.'); } };
  reader.readAsText(file);
}

async function decapi(route, username) {
  const response = await fetch(`${TWITCH_API}/${route}/${encodeURIComponent(username)}`, { cache: 'no-store' });
  const text = (await response.text()).trim();
  if (!response.ok || !text || /not found|404|error/i.test(text)) throw new Error(text || `HTTP ${response.status}`);
  return text;
}

async function verifyTwitch(index, silent = false) {
  const item = state.items[index];
  if (!item?.username) return false;
  if (!silent) setMessage(`Проверяю @${item.username} в Twitch…`);
  try {
    const id = await decapi('id', item.username);
    let avatar = item.avatar;
    try { avatar = await decapi('avatar', item.username); } catch (avatarError) { console.warn('[Twitch avatar]', avatarError); }
    item.twitch = { status: 'valid', checkedAt: new Date().toISOString(), id, avatar: avatar || '' };
    if (avatar) item.avatar = avatar;
    if (!item.url) item.url = `https://twitch.tv/${item.username}`;
    state.items[index] = normalize(item); markDirty(index); if (state.selected === index) { renderTwitchStatus(state.items[index]); els.avatar.value = state.items[index].avatar; }
    if (!silent) setMessage(`@${item.username}: Twitch username подтверждён.`);
    return true;
  } catch (error) {
    item.twitch = { status: 'invalid', checkedAt: new Date().toISOString(), id: '', avatar: '' };
    state.items[index] = normalize(item); markDirty(index); if (state.selected === index) renderTwitchStatus(state.items[index]);
    if (!silent) setMessage(`@${item.username}: username не найден.`);
    return false;
  }
}

async function verifyAll() {
  if (!state.items.length) return;
  els.verifyAllButton.disabled = true;
  for (let index = 0; index < state.items.length; index += 1) {
    await verifyTwitch(index, true);
    if (index < state.items.length - 1) await new Promise((resolve) => setTimeout(resolve, 700));
  }
  els.verifyAllButton.disabled = false;
  renderList();
  setMessage(`Проверка завершена: ${state.items.filter((item) => item.twitch?.status === 'valid').length}/${state.items.length} username найдено.`);
}

els.form.addEventListener('submit', (event) => { event.preventDefault(); writeCurrent(); renderList(); });
['input', 'change'].forEach((eventName) => els.form.addEventListener(eventName, () => { if (state.selected < 0) return; state.items[state.selected] = readForm(); markDirty(state.selected); els.title.textContent = `@${state.items[state.selected].username || 'new-channel'}`; }));
els.search.addEventListener('input', renderList); els.addButton.addEventListener('click', addItem); els.deleteButton.addEventListener('click', deleteItem);
els.resetButton.addEventListener('click', resetDraft); els.exportButton.addEventListener('click', exportJson); els.verifyAllButton.addEventListener('click', verifyAll);
els.verifyButton.addEventListener('click', () => verifyTwitch(state.selected));
els.importButton.addEventListener('click', () => els.importFile.click());
els.importFile.addEventListener('change', (event) => { const [file] = event.target.files; if (file) importJson(file); event.target.value = ''; });
els.logoutButton.addEventListener('click', () => window.dispatchEvent(new Event('logout')));

loadData();
