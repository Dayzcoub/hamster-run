# Hamster Crew — UI Design Reference

Актуальный дизайн-ориентир для игры **Hamster Crew**. Документ фиксирует утверждённое направление, чтобы следующие правки не расползались по стилю и не превращались в набор локальных CSS-костылей.

## 1. Статус

Текущий утверждённый визуальный вектор: **premium dark arcade / pseudo-isometric backstage runner**.

Игра должна выглядеть как маленькая, но качественная инди-аркада про хомяка-монтажника, который спасает мероприятия от кабелей, кофров, дедлайнов, завхоза и бытового хаоса.

Главная цель UI: сохранить юмор и простоту игры, но убрать ощущение прототипной веб-страницы.

## 2. Загруженные референсы

Пользователь загрузил 5 актуальных референсов в источники чата. Они считаются текущим визуальным эталоном для дальнейшей доводки.

Референсы покрывают:

1. **Main Menu / Главное меню**  
   Крупный `HAMSTER CREW`, профиль монтажника, вертикальные кнопки справа, хомяк-герой, тёмный фон, gold/cyan акценты.

2. **Level Select / Выбор уровня**  
   Экран кампании с горизонтальными mission cards, активные и locked-состояния, крупный заголовок и кнопка `Главное меню`.

3. **Gameplay HUD / Игровой экран**  
   Compact HUD сверху, chips ресурсов, таймер/статус, 3 дорожки, хомяк на псевдоизометрической полосе, нижняя compact-подсказка.

4. **Result / Техсводка**  
   Большая оценка, миссионная сводка, stat cards справа, progress bar, primary-кнопка `Повторить`, secondary-кнопки `К уровням` и `Главное меню`.

5. **Общий стиль**  
   Dark navy / graphite, мягкие glass-панели, cyan contour glow, warm gold primary actions, backstage/event-production atmosphere.

Если референсы будут перенесены в репозиторий, предпочтительная папка:

```text
docs/reference/
```

Рекомендуемые имена файлов:

```text
docs/reference/hamster-main-menu.jpg
docs/reference/hamster-level-select.jpg
docs/reference/hamster-gameplay-hud.jpg
docs/reference/hamster-result-summary.jpg
docs/reference/hamster-style-board.jpg
```

## 3. Визуальная система

### 3.1. Цвета

Основная палитра:

```css
--bg-main: #060b14;
--bg-deep: #08111f;
--bg-panel: rgba(16, 27, 44, 0.92);
--bg-panel-strong: rgba(23, 38, 60, 0.96);
--bg-card: rgba(19, 33, 55, 0.9);

--stroke-main: rgba(104, 137, 180, 0.36);
--stroke-soft: rgba(120, 160, 210, 0.22);
--stroke-cyan: #2cddf2;
--stroke-gold: #ffc247;

--accent-gold: #ffc247;
--accent-gold-hot: #ffb21f;
--accent-cyan: #5cebff;
--accent-blue: #2f8dff;
--accent-danger: #ff5a4e;
--accent-warning: #ff9e2a;

--text-main: #f4f7fb;
--text-soft: #aeb8c8;
--text-muted: #6f7c91;
--text-disabled: #536074;
```

### 3.2. Главные акценты

- **Gold** — только для главного действия: `Играть`, `Старт`, `Повторить`, grade/award highlights.
- **Cyan** — статус, контуры, secondary glow, прогресс, HUD-индикаторы.
- **Danger orange/red** — косяки, предупреждения, опасные объекты.
- **Dark glass panels** — все карточки, HUD, mission cards, stat cards.

### 3.3. Панели и карточки

Все основные блоки должны выглядеть как игровые glass/dark panels:

- тёмный градиент сверху вниз;
- тонкая cyan/blue обводка;
- внутренний светлый highlight сверху;
- мягкая тень;
- большой radius;
- без плоских серых веб-блоков.

## 4. Экран: Главное меню

### Что должно быть

- Левая зона:
  - profile badge `Монтажник`;
  - XP/progress;
  - крупный title `HAMSTER CREW`;
  - subtitle про монтажный хаос;
  - хомяк-герой рядом с title.

- Правая зона:
  - вертикальная stack-группа кнопок;
  - `Играть` — gold primary;
  - `Уровни` — secondary blue;
  - `Склад — скоро`, `Магазин — скоро` — disabled;
  - `Настройки — позже` — visible secondary/dim.

### Важные правила

- Хомяк не должен иметь белую подложку/овал под ногами. Временный CSS-файл `src/hamster-shadow-fix.css` обрезает белый овал и заменяет его тёмной тенью. В будущем лучше переэкспортировать сам спрайт без белой подложки.
- В iPhone Safari landscape все кнопки должны помещаться по высоте.
- Не возвращать старое пустое меню без персонажа и профиля.

## 5. Экран: Выбор уровня

### Что должно быть

- Заголовок:
  - eyebrow `КАМПАНИЯ`;
  - крупно `Выбор уровня`;
  - кнопка `Главное меню` справа.

- Горизонтальная лента mission cards:
  - `ДК “Почти готово”` — активный/лучший результат;
  - `Свадьба в шатре` — доступен;
  - `Большой концерт` — locked;
  - `???` / bonus level — locked/secret.

### Состояния карточек

- `is-active`: gold stroke/glow.
- `is-available`: cyan stroke.
- `is-locked`: grayscale + opacity + lock badge.

### Правила

- На compact landscape минимум 2.5–3 карточки должны быть видны сразу, остальные доступны горизонтальным скроллом.
- Кнопка `Старт` — gold primary.
- Кнопка `Закрыто` — disabled.
- Locked-карточки не должны кликаться.

## 6. Экран: Gameplay HUD

### Что должно быть

- Верхний compact HUD:
  - pause button;
  - статус уровня / intro phrase;
  - таймер;
  - score/style chip;
  - chips: хлеб, ресурсы, косяки, финты;
  - progress bar.

- Игровое поле:
  - 3 дорожки;
  - псевдоизометрическая перспектива;
  - backstage/event-production настроение;
  - объекты с понятной подсветкой;
  - хомяк с нормальной тенью.

- Нижняя подсказка:
  - `Свайп: дорожка · вверх прыжок · вниз подкат · финты дают бонус`.

### Правила

- HUD не должен съедать игровое поле.
- На iPhone Safari compact landscape HUD обязан оставаться в своей сеточной строке и не распухать.
- Логика `LevelController`, движение, collision, scoring не менять без отдельной задачи.

## 7. Экран: Result / Техсводка

### Что должно быть

- Большая panel/card.
- Слева:
  - eyebrow `ТЕХСВОДКА`;
  - название уровня;
  - крупная оценка `D/S/A/B/...`;
  - юмористическая фраза;
  - primary button `Повторить`.

- Справа:
  - stat cards:
    - выполнение + progress;
    - хлеб;
    - косяки;
    - финты;
    - прыжок/подкат;
    - очки.

- Низ справа:
  - `К уровням`;
  - `Главное меню`.

### Правила

- На compact landscape stat cards не должны наезжать на кнопки.
- Вся карточка результата должна помещаться в доступную высоту Safari.
- `Повторить` визуально главнее навигационных кнопок.

## 8. Текущие файлы UI-реализации

Основные файлы, связанные с дизайном:

```text
src/styles.css
src/compact-landscape.css
src/hamster-shadow-fix.css
src/screens/MainMenuScreen.js
src/screens/LevelSelectScreen.js
src/screens/GameScreen.js
src/screens/ResultScreen.js
src/render/CanvasRenderer.js
src/data/levels.js
```

## 9. Что уже сделано в репо

- Добавлен premium arcade shell.
- Пересобрано главное меню.
- Пересобран выбор уровней.
- Пересобран gameplay HUD.
- Пересобрана техсводка/result screen.
- Добавлен compact landscape CSS для iPhone Safari.
- Добавлен CSS-fix белого овала под хомяком в меню.
- Сохранена базовая игровая механика.

## 10. Что ещё нужно добить

### Высокий приоритет

1. Проверить main menu после `hamster-shadow-fix.css`: белая подложка под хомяком должна исчезнуть.
2. Проверить result screen на реальном iPhone Safari: ничего не должно обрезаться снизу.
3. Проверить gameplay HUD: не должен быть слишком высоким, canvas должен занимать основную часть экрана.
4. Проверить level select: locked card не должна выглядеть как обрезанная ошибка; это допустимо только как горизонтальный scroll rail.

### Средний приоритет

1. Улучшить `CanvasRenderer.drawBackground()`:
   - backstage silhouettes;
   - truss lines;
   - road cases;
   - cable arcs;
   - stage light gradients.

2. Улучшить `CanvasRenderer.drawLanes()`:
   - более глубокая перспектива;
   - lane highlights;
   - reflective floor;
   - cyan/gold guide lines.

3. Добавить единые SVG UI-icons вместо emoji/текстовых символов.

### Низкий приоритет

1. Перенести загруженные референсы в `docs/reference/`.
2. Переэкспортировать `hamster_run_01` без белого овала, чтобы удалить временный CSS-fix.
3. Добавить дополнительные фоновые WebP для уровней.

## 11. Запрещено без отдельной задачи

- Менять механику движения.
- Менять физику прыжка/подката.
- Менять collision logic.
- Менять scoring/progress/unlock rules.
- Добавлять реальные покупки/магазин/склад.
- Переписывать проект на другой фреймворк.
- Добавлять хаотичные inline styles.
- Лепить локальные CSS-костыли поверх каждого блока без системной причины.

## 12. Принцип следующих правок

Любая новая UI-правка должна идти через один из уровней:

1. theme tokens;
2. shared UI components;
3. screen layout;
4. compact landscape override;
5. canvas renderer polish.

Сначала править системно, потом точечно. Точечные фиксы допустимы только как временные и должны быть вынесены в отдельный файл или явно подписанный блок CSS.
