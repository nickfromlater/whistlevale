#!/usr/bin/env node
/*
 * Print a copy-pasteable brief for one exhibition bay.
 *
 * The point is the first instruction: the agent asks the person what they want
 * to build before touching anything. A brief that guesses produces a generic
 * bench and a bored contributor; a brief that asks produces the thing they came
 * for. Everything after that is the repository facts an agent would otherwise
 * spend an hour discovering — and the three rules that fail review most often.
 *
 *   node scripts/bay.mjs GH-47
 *   node scripts/bay.mjs GH-47 --markdown
 */
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const REPO = 'https://github.com/nickfromlater/whistlevale.git';

// Gallery identities and codes, read from grandhall.html so this can never
// drift from the room a contributor is looking at.
async function galleries() {
  const html = await readFile(path.join(root, 'grandhall.html'), 'utf8');
  const block = html.match(/const ROOMS=\[([\s\S]*?)\];\s*const CONNECTIONS/);
  if (!block) throw new Error('Could not read ROOMS from grandhall.html.');
  const out = [];
  const re = /id:'([a-z]+)',code:'([A-Z]+)'[^}]*?name:'([^']*)'[^}]*?x:(-?[\d.]+),z:(-?[\d.]+)/g;
  let m;
  while ((m = re.exec(block[1]))) {
    out.push({id: m[1], code: m[2], name: m[3], x: Number(m[4]), z: Number(m[5])});
  }
  return out;
}

const NOTES = {
  grand: 'Where it all began',
  steam: 'For things with wheels and stories',
  worlds: 'A whole world on a small table',
  conservatory: 'Let a little of the outside in',
  architecture: 'A place for places',
  curiosity: 'For the beautifully unclassifiable',
  workshop: 'It does not have to be finished',
};

/* The Hall's own bay formula: four tables in the Grand Hall, sixteen elsewhere. */
async function bayFacts(id) {
  const rooms = await galleries();
  for (const [index, room] of rooms.entries()) {
    const positions = index === 0
      ? [[-8, 17.6], [8, 17.6], [-8, -21.4], [8, -21.4]]
      : [-8, 8].flatMap(x => [-20, -14.6, -9.2, -3.8, 1.6, 7, 12.4, 17.8].map(z => [x, z]));
    for (const [i, [x, z]] of positions.entries()) {
      const bayId = room.code + '-' + String(i + 1).padStart(2, '0');
      if (bayId !== id) continue;
      return {
        id: bayId, gallery: room.id, galleryName: room.name,
        galleryNote: NOTES[room.id] || '', x: room.x + x, z: room.z + z,
      };
    }
  }
  return null;
}

function brief(bay, builders) {
  return `Whistlevale is a hand-built 3D model-railway house. I want to add something to
exhibition bay ${bay.id}, in ${bay.galleryName} — "${bay.galleryNote}".

**First: ask me what I want to build there, and wait for my answer.** Don't
choose for me and don't start until I've told you. If I'm vague, ask what the
scene should make someone feel, and who is in it.

Then:

1. If you don't already have the repo here, clone it:
   git clone ${REPO}
   Read AGENTS.md, then run: npm run contribute -- commons
   No install, no API key, and Node 24+ / Python 3.10+ is all it needs.

2. Build it as a contribution to \`contributions/world.json\`:
   - room: "commons"   (the shared contribution room)
   - kind: one of vignette, building, prop, planting, furniture
   - id: a lowercase slug that starts with ${bay.id.toLowerCase()}-
   - place it near x ${bay.x}, z ${bay.z}  (bay ${bay.id}'s floor position)
   - credits: at least one, with a "name" I choose. A handle needs BOTH
     "platform" (github/x/bluesky) and "handle", without the @.

3. Three rules that fail review most often:
   - Props that touch must be ONE composed builder, not two placements.
     Overlapping footprints are rejected with coordinates.
   - Only allowlisted builders: ${builders}.
     Anything else needs a new reviewed builder in src/community-core.js.
   - Resolve assets through houseRecordingURL(), never a literal path — a
     literal works locally and 404s in production.

4. Check it, and don't loosen a budget to make a check pass:
   npm run check:contributions -- --json
   npm test
   python3 scripts/serve.py --port 4175    (look at it, desktop and phone)

5. Open a pull request using .github/PULL_REQUEST_TEMPLATE.md. Branch from
   main. Say what you actually verified and mark anything you couldn't check
   as unverified. Don't merge — a maintainer reviews it.`;
}

const id = (process.argv[2] || '').toUpperCase();
if (!id) {
  console.error('Usage: node scripts/bay.mjs GH-47 [--markdown]');
  process.exit(1);
}
const bay = await bayFacts(id);
if (!bay) {
  console.error(`Bay ${id} not found in grandhall.html.`);
  process.exit(1);
}
const core = await readFile(path.join(root, 'src/community-core.js'), 'utf8');
const builders = (core.match(/COMMUNITY_BUILDERS=Object\.freeze\(\{([^}]*)\}/) || [, ''])[1]
  .split(',').map(s => s.split(':')[0].trim()).filter(Boolean).join(', ');

const text = brief(bay, builders);
if (process.argv.includes('--markdown')) {
  console.log('```\n' + text + '\n```');
} else {
  console.log('─'.repeat(74));
  console.log(`  Bay ${bay.id} · ${bay.galleryName}`);
  console.log('  Copy everything below to your coding agent.');
  console.log('─'.repeat(74) + '\n');
  console.log(text);
}
