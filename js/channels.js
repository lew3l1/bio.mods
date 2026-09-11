const grid = document.querySelector('#channelGrid');
const search = document.querySelector('#channelSearch');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const totalElement = document.querySelector('#channelTotal');
let channels = [];
let filter = 'all';

const AVATAR_CACHE_PREFIX = 'lew3l1.twitch.avatar.';
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;',
  "'": '&#39;', '"': '&quot;'
}[char]));

const getStatus = (channel) => {
  const status = channel.status || channel.workStatus || 'needs-confirmation';
  if (status === 'active') return { label: 'ACTIVE', className: 'status-active', note: 'Сейчас работаю с каналом' };
  if (status === 'former_self') return { label: 'FORMER', className: 'status-former', note: channel.endReason || 'Снялся по своим причинам с поста модератора' };
  if (status === 'former_inactive') return { label: 'FORMER', className: 'status-former', note: channel.endReason || 'Сняли за инактив' };
  if (status === 'former') return { label: 'FORMER', className: 'status-former', note: channel.endReason || 'Ранее модерировал' };
  return { label: 'VERIFY', className: 'status-verify', note: 'Статус моей работы с каналом требует подтверждения' };
};

const formatStarted = (channel) => {
  if (!channel.started) return `С ${channel.year}`;
  const parts = channel.started.split('-');
  if (parts.length !== 3) return channel.started;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

const savedAvatar = (username) => {
  try {
    const value = sessionStorage.getItem(`${AVATAR_CACHE_PREFIX}${username.toLowerCase()}`);
    return value || '';
  } catch {
    return '';
  }
};

const fallbackAvatar = (username) => `https://unttv.vercel.app/users/${encodeURIComponent(username)}/avatar.png`;

const initialAvatarSource = (channel) => channel.avatar?.trim() || savedAvatar(channel.username) || fallbackAvatar(channel.username);

function cardMarkup(channel) {
  const status = getStatus(channel);
  const role = channel.role || 'Moderator';
  const platform = channel.platform || 'Twitch';
  const description = channel.description?.trim() || 'Описание стримера будет добавлено после подтверждения данных.';
  const avatar = initialAvatarSource(channel);

  return `
    <article class="channel-card" data-status="${escapeHtml(status.label.toLowerCase())" data-username="${escapeHtml(channel.username)}">
      <div class="channel-card-top">
        <div class="channel-avatar">
          <img class="channel-avatar-image" data-avatar-for="${escapeHtml(channel.username)}" src="${escapeHtml(avatar)}" alt="Аватар @${escapeHtml(channel.username)}" loading="lazy" decoding="async">
        </div>
        <div class="channel-name">
          <strong>@${escapeHtml(channel.username)}</strong>
          <span>${escapeHtml(platform)}</span>
        </div>
        <span class="channel-status ${status.className}">${status.label}</span>
      </div>

      <div class="channel-card-body">
        <div class="channel-meta-grid">
          <div><span>ROLE</span><strong>${escapeHtml(role)}</strong></div>
          <div><span>STARTED</span><strong>${escapeHtml(formatStarted(channel))}</strong></div>
        </div>
        <div class="channel-description-block"><span>ABOUT</span><p>${escapeHtml(description)}</p></div>
        <div class="channel-status-note ${status.className}">${escapeHtml(status.note)}</div>
      </div>

      <div class="channel-card-footer">
        <span>@${escapeHtml(channel.username)}</span>
        <a class="channel-link" href="${escapeHtml(channel.url || `https://twitch.tv/${channel.username}`)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть Twitch канал @${escapeHtml(channel.username)}">Twitch ↗</a>
      </div>
    </article>`;
}

async function resolveTwitchAvatar(username) {
  const cacheKey = `${AVATAR_CACHE_PREFIX}${username.toLowerCase()}`;
  const cached = savedAvatar(username);
  if (cached) return cached;

  try {
    const response = await fetch(`https://decapi.me/twitch/avatar/${encodeURIComponent(username)}`, { cache: 'no-store' });
    const url = (await response.text()).trim();
    if (!response.ok || !url || !/^https?:\/\//i.test(url)) throw new Error('Avatar URL unavailable');
    try { sessionStorage.setItem(cacheKey, url); } catch {}
    return url;
  } catch (error) {
    return fallbackAvatar(username);
  }
}

async function hydrateVisibleAvatars() {
  const images = [...grid.querySelectorAll('[data-avatar-for]')];
  const queue = images.filter((img) => !img.closest('.channel-card')?.dataset.avatarResolved);
  const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
    while (queue.length) {
      const image = queue.shift();
      if (!image) return;
      const username = image.dataset.avatarFor;
      const url = await resolveTwitchAvatar(username);
      image.src = url;
      image.onerror = () => {
        if (!image.src.includes('loader.svg')) image.src = 'assets/loader.svg';
      };
      const card = image.closest('.channel-card');
      if (card) card.dataset.avatarResolved = 'true';
    }
  });
  await Promise.all(workers);
}

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = channels.filter((channel) => {
    const matchesFilter = filter === 'all' || channel.year === filter;
    const searchable = `${channel.username} ${channel.displayName || ''} ${channel.description || ''}`.toLowerCase();
    return matchesFilter && searchable.includes(query);
  });
  grid.setAttribute('aria-busy', 'false');
  grid.innerHTML = visible.length
    ? visible.map(cardMarkup).join('')
    : '<div class="empty-state"><strong>Ничего не найдено</strong><span>Попробуй другой запрос или сбрось фильтр.</span></div>';
  if (visible.length) hydrateVisibleAvatars();
}

async function init() {
  try {
    const response = await fetch('data/streamers.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    channels = await response.json();
    totalElement.textContent = String(channels.length);
    render();
  } catch (error) {
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = '<div class="empty-state"><strong>База каналов недоступна</strong><span>Проверь загрузку data/streamers.json.</span></div>';
    console.error('[Lew3l1] Failed to load streamer data:', error);
  }
}

filterButtons.forEach((button) => button.addEventListener('click', () => {
  filter = button.dataset.filter || 'all';
  filterButtons.forEach((item) => {
    const active = item === button;
    item.setAttribute('aria-pressed', String(active));
    item.classList.toggle('is-active', active);
  });
  render();
}));

search.addEventListener('input', render);
init();
