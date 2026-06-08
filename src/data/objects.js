export const objectCatalog = {
  bread: { type: 'collectible', visualKey: 'bread', resource: 'bread', value: 1 },
  cable: { type: 'collectible', visualKey: 'cable_coil', resource: 'cable', value: 1 },
  c2: { type: 'collectible', visualKey: 'c2_connector', resource: 'c2', value: 1 },
  bolts: { type: 'collectible', visualKey: 'bolt', resource: 'bolts', value: 1 },
  deck: { type: 'collectible', visualKey: 'stage_deck', resource: 'deck', value: 1 },

  powercon: { type: 'collectible', visualKey: 'powercon', resource: 'powercon', value: 1 },
  tape: { type: 'collectible', visualKey: 'tape', resource: 'tape', value: 1 },
  led: { type: 'collectible', visualKey: 'led', resource: 'led', value: 1 },
  truss: { type: 'collectible', visualKey: 'truss', resource: 'truss', value: 1 },

  case: { type: 'obstacle', visualKey: 'flight_case', dodge: 'jump', damage: 1, clearanceHeight: 30 },
  cable_loop: { type: 'obstacle', visualKey: 'cable_loop', dodge: 'jump', damage: 1, clearanceHeight: 18 },
  mic_stand: { type: 'obstacle', visualKey: 'mic_stand', dodge: 'slide', damage: 1 },
  mystery_box: { type: 'obstacle', visualKey: 'mystery_box', dodge: 'jump', damage: 1, clearanceHeight: 34 },
  cart: { type: 'obstacle', visualKey: 'cart', dodge: 'jump', damage: 1, clearanceHeight: 42 },

  // Themed obstacle aliases. They use existing art now, but keep separate gameplay IDs
  // so level weights can be tuned now and art can be swapped later without changing logic.
  wedding_generator: { type: 'obstacle', visualKey: 'cart', dodge: 'jump', damage: 1, clearanceHeight: 42 },
  wedding_wet_cable: { type: 'obstacle', visualKey: 'cable_loop', dodge: 'jump', damage: 1, clearanceHeight: 16 },
  wedding_guest_chair: { type: 'obstacle', visualKey: 'mystery_box', dodge: 'jump', damage: 1, clearanceHeight: 32 },

  concert_subwoofer: { type: 'obstacle', visualKey: 'flight_case', dodge: 'jump', damage: 1, clearanceHeight: 38 },
  concert_smoke_machine: { type: 'obstacle', visualKey: 'mystery_box', dodge: 'jump', damage: 1, clearanceHeight: 30 },
  concert_moving_head: { type: 'obstacle', visualKey: 'mic_stand', dodge: 'slide', damage: 1 },

  kids_toy_car: { type: 'obstacle', visualKey: 'cart', dodge: 'jump', damage: 1, clearanceHeight: 30 },
  kids_blocks: { type: 'obstacle', visualKey: 'mystery_box', dodge: 'jump', damage: 1, clearanceHeight: 28 },
  kids_sock_trap: { type: 'obstacle', visualKey: 'cable_loop', dodge: 'jump', damage: 1, clearanceHeight: 14 },

  // Big Concert two-lane dodge-only obstacles: jump/slide do not clear them.
  truss_section_left: {
    type: 'obstacle',
    visualKey: 'truss_section_left',
    dodge: 'lane_change',
    damage: 1,
    laneSpan: 2,
    blockedLanes: [0, 1],
  },
  truss_section_right: {
    type: 'obstacle',
    visualKey: 'truss_section_right',
    dodge: 'lane_change',
    damage: 1,
    laneSpan: 2,
    blockedLanes: [1, 2],
  },
};
