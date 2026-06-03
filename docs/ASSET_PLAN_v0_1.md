# PACK.IT RUN — Asset Plan v0.1

Дата фиксации: 2026-06-03

## 1. Назначение документа

Этот документ фиксирует план игровых ассетов для **PACK.IT RUN: Хомяк на монтаже** до начала массовой генерации/рисования.

Цель: не делать “красивые картинки вообще”, а подготовить production-ready asset list: какие файлы нужны, где лежат, в каком стиле, размере, формате и в каком порядке утверждаются.

## 2. Общий принцип ассетов

Ассеты должны быть:

```text
2D
псевдо-изометрические
мультяшные
читаемые в маленьком размере
с прозрачным фоном для игровых объектов
без лишней сцены вокруг отдельного объекта
с единым направлением света
с мягкой изометрической тенью
```

Базовый свет:

```text
сверху-слева / чуть спереди
```

Базовая тень:

```text
мягкая тень вниз-вправо
```

Форматы:

```text
PNG/WebP — игровые спрайты
SVG — простые UI-иконки и векторные знаки
JSON — манифест ассетов
```

Для игровых объектов основной формат:

```text
PNG с прозрачным фоном
2x или 4x размер
масштабирование в коде
```

## 3. Структура папок

Рекомендуемая структура:

```text
assets/
  sprites/
    characters/
      hamster/
      spaniel/

    collectibles/
    obstacles/
    powerups/
    bosses/

    environments/
      dk/
      wedding/
      concert/
      kids_room/

    ui/
      icons/
      buttons/
      badges/

  backgrounds/
    dk/
    wedding/
    concert/
    kids_room/

  atlases/
  audio/
  fonts/

  manifest.json
```

На v0.1 можно создать только нужные папки, но финальная структура должна учитывать расширение игры.

## 4. Pack 01 — Core Character + DK

Первый ассет-пак нужен для первого красивого каркаса v0.1.

### Персонаж

```text
hamster_run_01
hamster_jump
hamster_slide
hamster_hit
hamster_celebrate
```

На v0.1 достаточно одной позы на состояние. Полноценный sprite sheet можно сделать позже.

### Collectibles

```text
bread
cable_coil
c2_connector
bolt
stage_deck
```

### Obstacles

```text
flight_case
cable_loop
mic_stand
mystery_box
cart
```

### DK environment

```text
dk_background
dk_floor_lanes
```

Если фон делается слоями:

```text
dk_back_wall
dk_curtains
dk_stage_floor
dk_lanes_overlay
dk_light_beams
dk_side_props
```

### UI icons

```text
ui_bread
ui_resource
ui_mistake
ui_progress
ui_lock
ui_play
ui_restart
ui_home
ui_settings
```

## 5. Pack 02 — Spaniel + UI + Wedding

Для v0.2.

### Spaniel

```text
spaniel_idle
spaniel_run
spaniel_rescue
spaniel_bring_bread
spaniel_chaos_mode
```

### Powerups

```text
helmet_powerup
bread_magnet
coffee_boost
tape_fix
battle_squeak
```

### Wedding environment

```text
wedding_background
wedding_tent_back
wedding_string_lights
wedding_wet_floor
wedding_tables
wedding_generator
wedding_guest_silhouette
```

### Wedding obstacles

```text
puddle
guest
chair
table_edge
low_garland
generator_cable
cake
```

## 6. Pack 03 — Concert + Bosses

Для v0.3.

### Concert environment

```text
concert_background
concert_stage_back
concert_truss
concert_led_screen
concert_smoke
concert_light_beams
concert_sub_stack
concert_backstage_cases
```

### Concert obstacles

```text
falling_truss
bass_wave
smoke_cloud
large_case
led_cart
cable_tangle
```

### Bosses

```text
keymaster
dead_generator
sub_protect
```

### Boss projectiles / effects

```text
key_throw
generator_spark
bass_wave
protect_warning
```

## 7. Pack 04 — Kids Room Madness

Для v1.0 / бонусного уровня.

### Kids room background

```text
kids_room_background
kids_room_back_wall
kids_room_bed
kids_room_carpet_lanes
kids_room_blanket_curtain
kids_room_toy_boxes
kids_room_silly_shadows
```

### Kids room obstacles

```text
lego_mine
sock_pile
toy_car
plush_blockade
pencil_truss
charger_cable
falling_blocks
blanket_wave
```

### Mess Entity boss

```text
mess_entity_idle
mess_entity_chase
mess_entity_angry
mess_entity_boss_form
chaos_vortex
sock_storm
plush_directors
final_bread
```

Сущность Срача должна быть смешной, чуть жутковатой, не хоррорной, читаемой как куча бытового хаоса с глазами.

## 8. Главный персонаж — хомяк

Хомяк — самый важный ассет. Его стиль задаёт всю игру.

Образ:

```text
боевой хомяк-техник
маленький, но серьёзный
каска
сигнальная жилетка
пояс с инструментами
пухлое тело
маленькие лапы
деловое выражение лица
хлеб как священный артефакт
```

Стиль:

```text
cute but serious
cartoon production worker
expressive
compact silhouette
readable mobile game character
```

Цвета:

```text
мех: тёплый бежево-золотистый
каска: жёлтая / оранжевая
жилетка: оранжевая с reflective stripes
пояс: тёмно-коричневый
глаза: тёмные
хлеб: золотистый
```

### Hamster poses v0.1

#### hamster_run_01

- корпус наклонён вперёд;
- одна лапа впереди, другая назад;
- серьёзное лицо;
- каска чуть наклонена;
- хлеб в лапе или на поясе.

#### hamster_jump

- лапы вверх / вперёд;
- тело вытянуто;
- выражение напряжённое;
- каска держится.

#### hamster_slide

- низкая поза подката;
- каска вперёд;
- пыль за спиной.

#### hamster_hit

- удивлённые глаза;
- каска съехала;
- маленькие звёздочки.

#### hamster_celebrate

- лапа вверх;
- хлеб поднят;
- довольное лицо.

## 9. Помощник — шоколадный русский спаниель

Спаниель не обязателен в gameplay v0.1, но его стиль надо зафиксировать заранее.

Образ:

```text
шоколадный русский спаниель
длинные уши
добрый, но боевой
смешной спутник
маленькая каска опционально
может держать хлеб
```

Цвета:

```text
мех: тёмный шоколад
блики: мягкий коричневый
нос: почти чёрный
глаза: тёплые
каска: жёлтая
```

Позы:

```text
spaniel_idle
spaniel_run
spaniel_rescue
spaniel_bring_bread
spaniel_chaos_mode
```

`spaniel_chaos_mode` нужен для детской комнаты: спаниель вроде помогает, но сам может устроить “режим радость”.

## 10. Collectibles

Все collectibles должны быть меньше препятствий, яркими и с лёгким свечением.

### bread

Главный предмет.

- кусочек хлеба / батона;
- золотистый;
- лёгкое свечение;
- можно добавить крошки;
- должен быть милым и узнаваемым.

### cable_coil

- чёрный моток кабеля;
- синий / серый блик;
- не должен выглядеть как препятствие.

### c2_connector

- металлический крепёж;
- серебристый;
- маленький cyan highlight.

### bolt

- маленький болт;
- блестящий;
- можно группой 2–3 штуки.

### stage_deck

- мини-плитка настила;
- тёмный верх;
- металлическая кромка.

## 11. Obstacles

Препятствия должны быть массивнее и опаснее collectibles.

### flight_case

- серый / чёрный кофр;
- металлические уголки;
- замки;
- колёса;
- изометрический вид;
- читается как объект, через который надо прыгать или который надо обходить.

### cable_loop

- петля кабеля на полу;
- чёрная;
- лёгкая опасная красная обводка / тень;
- низкое препятствие.

### mic_stand

- тонкая стойка;
- круглая база;
- микрофон сверху;
- может быть слегка наклонена.

### mystery_box

- коробка с проводами;
- из неё торчат кабели;
- выглядит хаотично.

### cart

- маленькая тележка;
- металлическая платформа;
- колёса;
- может быть с ящиком сверху.

## 12. Уровень ДК — ассеты

Для v0.1 нужен характерный ДК.

Палитра:

```text
бордовый
тёмное дерево
старое золото
пыльный серый
тёплый жёлтый свет
```

Визуал:

```text
тёмно-бордовые кулисы
старый деревянный пол
тёплый пыльный прожектор
серые кофры
микрофонные стойки
кабельные петли
```

Фон лучше делать слоями, чтобы позже добавить параллакс.

## 13. UI ассеты

Иконки:

```text
ui_bread
ui_resources
ui_mistakes
ui_progress
ui_lock
ui_play
ui_restart
ui_home
ui_settings
ui_sound
ui_music
ui_vibration
```

Badges:

```text
grade_s
grade_a
grade_b
grade_c
grade_d
level_locked
level_completed
boss_defeated
```

Декоративные элементы:

```text
panel_corner_bolt
small_warning_stripe
tech_label
project_card_stamp
```

Карточки, кнопки и панели по возможности делать CSS-стилями, а не отдельными картинками.

## 14. Иконка приложения

Будущие размеры:

```text
favicon.svg
icon-180.png
icon-192.png
icon-512.png
apple-touch-icon.png
```

Идея:

```text
хомяк в каске + кусок хлеба + маленький cyan stage light
```

На иконку не надо помещать всю игру.

## 15. Asset manifest

Нужно заложить `assets/manifest.json`.

Пример:

```json
{
  "version": 1,
  "sprites": {
    "hamster_run_01": {
      "path": "assets/sprites/characters/hamster/hamster_run_01.png",
      "type": "character",
      "anchor": { "x": 0.5, "y": 0.85 }
    },
    "bread": {
      "path": "assets/sprites/collectibles/bread.png",
      "type": "collectible",
      "anchor": { "x": 0.5, "y": 0.5 }
    },
    "flight_case": {
      "path": "assets/sprites/obstacles/flight_case.png",
      "type": "obstacle",
      "anchor": { "x": 0.5, "y": 0.85 }
    }
  }
}
```

Зачем нужен manifest:

- renderer не зависит от прямых путей;
- ассеты можно менять без переписывания кода;
- можно добавить preload;
- можно добавить fallback primitive.

## 16. Размеры ассетов

### Characters

```text
source: 512×512
display: 96–140 px по высоте
transparent PNG/WebP
```

### Collectibles

```text
source: 256×256
display: 32–56 px
transparent PNG/WebP
```

### Obstacles

```text
source: 512×512
display: 80–180 px
transparent PNG/WebP
```

### Bosses

```text
source: 1024×1024
display: 220–420 px
transparent PNG/WebP
```

### Backgrounds

```text
source: 1920×1080 или 2560×1440
display: cover / canvas background
```

### UI icons

```text
source: SVG или 256×256 PNG
display: 20–64 px
```

## 17. Правила генерации ассетов

Общий стиль-промпт:

```text
stylized 2D pseudo-isometric cartoon game asset, clean silhouette, transparent background, soft shadow, dark techno stage lighting, readable mobile game sprite, polished casual arcade style, no text, no watermark
```

Для объектов:

```text
single object, centered, transparent background, 3/4 pseudo-isometric view, soft shadow, clean outline
```

Для персонажей:

```text
full body character sprite, transparent background, 3/4 pseudo-isometric view, expressive, readable at small size
```

Для фонов:

```text
wide 2D pseudo-isometric game background, layered environment, no characters, no UI, 16:9, atmospheric lighting
```

## 18. Порядок утверждения ассетов

Не генерировать сразу 200 файлов.

Порядок:

```text
1. Утвердить стиль хомяка.
2. Утвердить стиль ДК.
3. Сделать Pack 01.
4. Вставить Pack 01 в v0.1 код.
5. После проверки gameplay делать Pack 02.
```

Главное правило:

```text
сначала хомяк, потом всё остальное
```

## 19. Что нельзя делать

Нельзя:

- смешивать разные стили ассетов;
- делать объекты без прозрачного фона;
- делать отдельный объект с большим фоном вокруг;
- делать слишком мелкие нечитаемые детали;
- делать realistic-render рядом с cartoon-asset;
- пихать текст на игровые спрайты;
- делать опасные объекты похожими на collectibles;
- игнорировать `visualKey` и manifest.

## 20. Следующий практический шаг

Следующий шаг после этого документа:

```text
подготовить 4–6 вариантов главного хомяка в одном стиле
выбрать финальный силуэт
после утверждения сделать 5 поз v0.1
```

Хомяк — главный визуальный якорь игры. Если он не работает, остальные ассеты не спасут проект.
