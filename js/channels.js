const grid = document.querySelector('#channelGrid');
const search = document.querySelector('#channelSearch');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const totalElement = document.querySelector('#channelTotal');
let channels = [];
let filter = 'all';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const getStatus = (channel) => {
  const status = channel.status || channel.workStatus || 'needs-confirmation';
  if (status === 'active') return { label: 'ACTIVE', className: 'status-active', note: 'Сейчас работаю с каналом' };
  if (status === 'former_self') return { label: 'FORMER', className: 'status-former', note: channel.endReason || 'Снялся по своим причинам с поста модератора' };
  if (status === 'former_inactive') return { label: 'FORMER', className: 'status-former', note: channel.endReason || 'Сняли за инактив' };
  if (status === 'former') {
    const reason = channel.endReason === 'personal' ? 'Снялся по своим причинам с поста модератора' : channel.endReason === 'inactive' ? 'Сняли за инактив' : channel.endReason || 'Ранее модерировал';
    return { label: 'FORMER', className: 'status-former', note: reason };
  }
  return { label: 'VERIFY', className: 'status-verify', note: 'Статус моей работы с каналом требует подтверждения' };
};

const formatStarted = (channel) => {
  if (!channel.started) return `С ${channel.year}`;
  const parts = channel.started.split('-');
  if (parts.length !== 3) return channel.started;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

function cardMarkup(channel) {
  const status = getStatus(channel);
  const role = channel.role || 'Moderator';
  const platform = channel.platform || 'Twitch';
  const description = channel.description?.trim() || 'Описание стримера будет добавлено после подтверждения данных.';
  const avatar = channel.avatar?.trim();
  const avatarMarkup = avatar
    ? `<img class="channel-avatar-image" src="${escapeHtml(avatar)}" alt="Аватар @${escapeHtml(channel.username)}" loading="lazy">`
    : `<span class="channel-avatar-fallback" aria-hidden="true">${escapeHtml(channel.username.slice(0, 2).toUpperCase())}</span>`;
  const twitchCheck = channel.twitch?.status === 'valid' ? '<span class="channel-verification verified" title="Username подтверждён в Twitch">✓ Twitch</span>' : '';

  return `
    <article class="channel-card" data-status="${escapeHtml(status.label.toLowerCase())}">
      <div class="channel-card-top">
        <div class="channel-avatar">${avatarMarkup}</div>
        <div class="channel-name">
          <strong>@${escapeHtml(channel.username)}</strong>
          <span>${escapeHtml(platform)} ${twitchCheck}</span>
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
        <a class="channel-link" href="https://twitch.tv/${encodeURIComponent(channel.username)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть Twitch канал @${escapeHtml(channel.username)}">Twitch ↗</a>
      </div>
    </article>`;
}

async function hydrateAvatars() {
  const fallbackCards = [...document.querySelectorAll('.channel-avatar')];
  const missing = fallbackCards.filter((card) => !card.querySelector('img'));
  for (const card of missing) {
    const name = card.closest('.channel-card')?.querySelector('.channel-name strong')?.textContent?.replace(/^@/, '');
    if (!name) continue;
    try {
      const response = await fetch(`https://decapi.me/twitch/avatar/${encodeURIComponent(name)}`, { cache: 'force-cache' });
      const avatarUrl = (await response.text()).trim();
      if (response.ok && avatarUrl.startsWith('http')) {
        card.innerHTML = `<img class="channel-avatar-image" src="${escapeHtml(avatarUrl)}" alt="Аватар @${escapeHtml(name)}" loading="lazy">`;
      }
    } catch {
      // Keep the initials fallback when the external avatar service is unavailable.
    }
  }
}

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = channels.filter((channel) => {
    const matchesFilter = filter === 'all' || channel.year === filter;
    const searchable = `${channel.username} ${channel.displayName || ''} ${channel.description || ''}`.toLowerCase();
    return matchesFilter && searchable.includes(query);
  });
  grid.setAttribute('aria-busy', 'false');
  grid.innerHTML = visible.length ? visible.map(cardMarkup).join('') : '<div class="empty-state"><strong>Ничего не найдено</strong><span>Попробуй другой запрос или сбрось фильтр.</span></div>';
  if (visible.length) hydrateAvatars();
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
