export const levelPreviews = {
  dk_almost_ready: {
    levelId: 'dk_almost_ready',
    title: 'ДК “Почти готово”',
    png: 'assets/previews/levels/preview_dk_almost_ready.png',
  },
  wedding_tent: {
    levelId: 'wedding_tent',
    title: 'Свадьба в шатре',
    png: 'assets/previews/levels/preview_wedding_tent.png',
  },
  big_concert: {
    levelId: 'big_concert',
    title: 'Большой концерт',
    png: 'assets/previews/levels/preview_big_concert.png',
  },
  kids_room: {
    levelId: 'kids_room',
    title: 'Детская комната',
    png: 'assets/previews/levels/preview_kids_room.png',
  },
};

export function previewForLevel(level) {
  return levelPreviews[level?.id] || null;
}
