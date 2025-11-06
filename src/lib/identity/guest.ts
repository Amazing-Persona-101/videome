export function randomSeed(): string {
  const buf = new Uint32Array(4); // Use a larger buffer to guarantee enough characters
  crypto.getRandomValues(buf);
  let tempString = '';
  // Convert each random number to a base-36 string and concatenate
  for (let i = 0; i < buf.length; i++) {
    tempString += buf[i].toString(36);
  }
  // Slice the first 12 characters from the combined string
  return tempString.slice(0, 12);
}

const ROBO_SETS = {
  robot: 'set1',
  monster: 'set2',
  head: 'set3',
  cat: 'set4'
} as const;
export type RoboKey = keyof typeof ROBO_SETS;

export function buildRoboUrl(setKey: RoboKey, seed: string, size = 96) {
  const setParam = ROBO_SETS[setKey];
  return `https://robohash.org/${encodeURIComponent(seed)}.png?set=${setParam}&size=${size}x${size}`;
}

function makeRandomName(seed = ''): string {
  const adj = [
    'bright',
    'cosmic',
    'lucky',
    'golden',
    'wild',
    'sunny',
    'fuzzy',
    'neon',
    'silver',
    'chill'
  ];
  const animal = [
    'otter',
    'fox',
    'panda',
    'tiger',
    'dolphin',
    'koala',
    'falcon',
    'lynx',
    'orca',
    'lemur'
  ];
  const a = adj[Math.floor(Math.random() * adj.length)];
  const b = animal[Math.floor(Math.random() * animal.length)];
  const n = (seed || randomSeed()).slice(0, 3).toUpperCase();
  return `${a}_${b}_${n}`;
}

export function caret(
  node: HTMLInputElement,
  where: 'start' | 'end' | 'select' | number = 'end'
) {
  queueMicrotask(() => {
    node.focus();
    if (where === 'select') {
      node.select();
    } else {
      const pos =
        where === 'start' ? 0 :
          where === 'end' ? node.value.length :
            Math.max(0, Math.min(Number(where), node.value.length));
      node.setSelectionRange(pos, pos);
    }
  });
  return { update(newWhere: string | number) { where = newWhere; } };
}


export async function getRandomName(seed: string) {
  const response = await fetch('https://randomuser.me/api/?inc=login&results=1&noinfo');
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    const name = `${data.results[0].login.username} ${data.results[0].login.password}`;
    return name;
  } else {
    return makeRandomName(seed);
  }
}