const grid = document.querySelector('#channelGrid');
const search = document.querySelector('#channelSearch');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const totalElement = document.querySelector('#channelTotal');
const totalYearsElement = document.querySelector('#channelYears');
let channels = [];
let filter = 'all';

const AVATAR_CACHE_PREFIX = 'lew3l1.twitch.avatar.';
const escapeHtml = (value = '') => String(value).replace(/[&<>\'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;',
  "'": '&#39;', '"': '&quot;'
}[char]));

const getWorkStatus = (channel) => {
  const status = channel.workStatus || 'active';
  const map = {
    active: { label: 'ACTIVE', className: 'status-active', note: 'Работаю с каналом' },
    former_self: { label: 'FORMER', className: 'status-former', note: channel.workNote || 'Снялся по своим причинам с поста модератора' },
    former_streamer: { label: 'FORMER', className: 'status-former', note: channel.workNote || 'Работа завершена по решению стримера' },
    former_inactive: { label: 'FORMER', className: 'status-inactive', note: channel.workNote || 'Работа завершена из-за неактивности' },
    former_access: { label: 'FORMER', className: 'status-former', note: channel.workNote || 'Работа завершена после потери доступа к каналу' },
    temporarily_removed: { label: 'TEMPORARY', className: 'status-temporary', note: channel.workNote || 'Временно не модерирую канал' },
    deleted: { label: 'DELETED', className: 'status-deleted', note: channel.workNote || 'Канал удалён' }
  };
  return map[status] || map.active;
};

const formatStarted = (channel) => {
  if (!channel.started) return `С ${channel.year}`;
  const parts = channel.started.split('-');
  if (parts.length !== 3) return channel.started;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

const savedAvatar = (username) => {
  try { return sessionStorage.getItem(`${AVATAR_CACHE_PREFIX}${username.toLowerCase()}`) || ''; } catch { return ''; }
};

function avatarMarkup(channel) {
  const source = channel.avatar?.trim() || savedAvatar(channel.username);
  if (source) return `<img class="channel-avatar-image" data-avatar-for="${escapeHtml(channel.username)}" src="${escapeHtml(source)}" alt="Аватар @${escapeHtml(channel.username)}" loading="lazy" decoding="async">`;
  return `<span class="channel-avatar-fallback" data-avatar-for="${escapeHtml(channel.username)}" aria-hidden="true">${escapeHtml(channel.username.slice(0, 2).toUpperCase())}</span>`;
}

const servicesMarkup = (services = []) => services.length
  ? `<div class="channel-services">${services.slice(0, 5).map((service) => `<span>${escapeHtml(service)}</span>`).join('')}</div>`
  : '';

function cardMarkup(channel) {
  const work = getWorkStatus(channel);
  const role = channel.role || 'Moderator';
  const platform = channel.platform || 'Twitch';
  const displayName = channel.displayName?.trim() || `@${channel.username}`;
  const description = channel.description?.trim() || 'Twitch-канал из модераторского портфолио Lew3l1.';

  return `
    <article class="channel-card" data-status="${escapeHtml(work.label.toLowerCase())}" data-username="${escapeHtml(channel.username)}">
      <div class="channel-card-top">
        <div class="channel-avatar" data-avatar-host="${escapeHtml(channel.username)}">${avatarMarkup(channel)}</div>
        <div class="channel-name">
          <strong>${escapeHtml(displayName)}</strong>
          <span>@${escapeHtml(channel.username)} · ${escapeHtml(platform)}</span>
        </div>
        <span class="channel-status ${work.className}">${work.label}</span>
      </div>

      <div class="channel-card-body">
        <div class="channel-meta-grid">
          <div><span>ROLE</span><strong>${escapeHtml(role)}</strong></div>
          <div><span>WORK</span><strong>${escapeHtml(work.label === 'ACTIVE' ? 'Сейчас' : work.label === 'TEMPORARY' ? 'Временно' : 'Завершена')}</strong></div>
          <div><span>STARTED</span><strong>${escapeHtml(formatStarted(channel))}</strong></div>
          <div><span>PLATFORM</span><strong>${escapeHtml(platform)}</strong></div>
        </div>
        <div class="channel-description-block"><span>ABOUT</span><p>${escapeHtml(description)}</p></div>
        ${servicesMarkup(channel.services)}
        <div class="channel-status-note ${work.className}">${escapeHtml(work.note)}</div>
      </div>

      <div class="channel-card-footer">
        <span>@${escapeHtml(channel.username)}</span>
        <a class="channel-link" href="${escapeHtml(channel.url || `https://twitch.tv/${channel.username}`)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть Twitch канал @${escapeHtml(channel.username)}">Twitch ↗</a>
      </div>
    </article>`;
}

async function resolveTwitchAvatar(username) {
  const cached = savedAvatar(username);
  if (cached) return cached;

  const response = await fetch(`https://decapi.me/twitch/avatar/${encodeURIComponent(username)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Avatar HTTP ${response.status}`);
  const url = (await response.text()).trim();
  if (!/^https?:\/\//i.test(url)) throw new Error('No avatar URL returned');
  try { sessionStorage.setItem(`${AVATAR_CACHE_PREFIX}${username.toLowerCase()}`, url); } catch {}
  return url;
}

async function hydrateVisibleAvatars() {
  const hosts = [...document.querySelectorAll('[data-avatar-host]')];
  const queue = hosts.filter((host) => host.dataset.resolved !== 'true');
  const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
    while (queue.length) {
      const host = queue.shift();
      if (!host) return;
      const username = host.dataset.avatarHost;
      try {
        const url = await resolveTwitchAvatar(username);
        host.innerHTML = `<img class="channel-avatar-image" src="${escapeHtml(url)}" alt="Аватар @${escapeHtml(username)}" loading="lazy" decoding="async">`;
      } catch {
        host.innerHTML = `<span class="channel-avatar-fallback" aria-hidden="true">${escapeHtml(username.slice(0, 2).toUpperCase())}</span>`;
      }
      host.dataset.resolved = 'true';
    }
  });
  await Promise.all(workers);
}

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = channels.filter((channel) => {
    const matchesFilter = filter === 'all' || channel.year === filter;
    const searchable = `${channel.username} ${channel.displayName || ''} ${channel.description || ''} ${channel.role || ''}`.toLowerCase();
    return matchesFilter && searchable.includes(query);
  });

  grid.setAttribute('aria-busy', 'false');
  grid.innerHTML = visible.length ? visible.map(cardMarkup).join('') : '<div class="empty-state"><strong>Ничего не найдено</strong><span>Попробуй другой запрос или сбрось фильтр.</span></div>';
  if (visible.length) hydrateVisibleAvatars();
}

async function init() {
  try {
    const response = await fetch('data/streamers.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    channels = await response.json();
    totalElement.textContent = String(channels.length);
    const years = [...new Set(channels.map((channel) => Number(channel.year)).filter(Boolean))].sort((a, b) => a - b);
    if (totalYearsElement && years.length) totalYearsElement.textContent = `${years[0]}–${years[years.length - 1]}`;
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
