# Lew3l1 Mods — тест-план

## Smoke
- [ ] `index.html` открывается без console errors.
- [ ] Все 4 страницы имеют рабочую навигацию.
- [ ] `data/streamers.json` загружается на `channels.html`.
- [ ] В исходном наборе отображается 41 канал.
- [ ] Поиск фильтрует по Twitch username.
- [ ] Фильтры 2024/2025/2026 работают и обновляют `aria-pressed`.
- [ ] Twitch-ссылки открываются в новой вкладке.

## Accessibility
- [ ] Keyboard focus виден на ссылках и кнопках.
- [ ] Search имеет accessible label.
- [ ] Filter buttons сообщают состояние через `aria-pressed`.
- [ ] Есть `prefers-reduced-motion`.
- [ ] Контраст текста проверен перед production release.

## Responsive
- [ ] 390×844: навигация и CTA не выходят за viewport.
- [ ] 768×1024: карточки переходят в 2 колонки.
- [ ] 1440×900: основной layout не растягивается больше 1240px.
- [ ] 1920×1080: контент остаётся визуально центрированным.

## Data quality
- [ ] Не придумывать display name, avatar, description или status без подтверждённого источника.
- [ ] Даты с точным днём хранить в ISO `YYYY-MM-DD`.
- [ ] Twitch username использовать отдельно от display name.
