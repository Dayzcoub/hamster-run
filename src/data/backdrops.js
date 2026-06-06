export const backdrops = {
  dk_almost_ready: {
    visualKey: 'backdrop_dk_almost_ready',
    levelId: 'dk_almost_ready',
    theme: 'dk',
    title: 'ДК “Почти готово”',
    webp: 'assets/sprites/IMG_2957.webp',
    scrollRatio: 0.18,
    fit: 'cover',
    status: 'uploaded-temp-path',
  },
  wedding_tent: {
    visualKey: 'backdrop_wedding_tent',
    levelId: 'wedding_tent',
    theme: 'wedding',
    title: 'Свадьба в шатре',
    png: 'assets/backgrounds/backdrop_wedding_tent.png',
    scrollRatio: 0.2,
    fit: 'cover',
    status: 'uploaded-renamed',
  },
  big_concert: {
    visualKey: 'backdrop_big_concert',
    levelId: 'big_concert',
    theme: 'concert',
    title: 'Большой концерт',
    png: 'assets/backgrounds/backdrop_big_concert.png',
    scrollRatio: 0.16,
    fit: 'cover',
    status: 'uploaded-renamed',
  },
  kids_room: {
    visualKey: 'backdrop_kids_room',
    levelId: 'kids_room',
    theme: 'kids_room',
    title: 'Детская комната',
    png: 'assets/backgrounds/backdrop_kids_room.png',
    scrollRatio: 0.22,
    fit: 'cover',
    status: 'uploaded-renamed',
  },
};

export function backdropForLevel(level) {
  return backdrops[level?.id] || null;
}
