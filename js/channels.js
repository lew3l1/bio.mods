const grid = document.querySelector('#channelGrid');
const search = document.querySelector('#channelSearch');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
let channels = [];
let filter = 'all';

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[char]));

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = channels.filter((channel) => {
    const matchesFilter = filter === 'all' || channel.year === filter;
    const matchesSearch = channel.username.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  if (!visible.length) {
    grid.innerHTML = '<div class="empty-state">Каналы не найдены. Попробуй изменить фильтр или запрос.</div>';
    return;
  }

  grid.innerHTML = visible.map((channel) => `
    <article class="channel-card">
      <div class="channel-head">
        <div class="avatar" aria-hidden="true"></div>
        <div class="channel-name"><strong>@${escapeHtml(channel.username)}</strong><span>Twitch</span></div>
        <span class="channel-status">SOURCE</span>
      </div>
      <div class="channel-info">
        <div class="channel-year">SINCE ${escapeHtml(channel.year)}</div>
        <div class="channel-role">Moderator</div>
        <p class="channel-description">Описание канала будет добавлено после подтверждения данных.</p>
        <div class="channel-footer"><span class="channel-link">@${escapeHtml(channel.username)}</span><a class="channel-link" href="https://twitch.tv/${encodeURIComponent(channel.username)}" target="_blank" rel="noreferrer">Twitch ↗</a></div>
      </div>
    </article>`).join('');
}

async function init() {
  try {
    const response = await fetch('data/streamers.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    channels = await response.json();
    render();
  } catch (error) {
    grid.innerHTML = '<div class="empty-state">Не удалось загрузить базу каналов.</div>';
    console.error(error);
  }
}

filterButtons.forEach((button) => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));
search.addEventListener('input', render);
init();
