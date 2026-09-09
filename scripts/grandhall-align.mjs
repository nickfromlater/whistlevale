#!/usr/bin/env node
/*
 * Translate a Grand Hall export into the repository's community format.
 *
 *   grandhall.html exports  { format:'whistlevale.community.v1', entries:[...] }
 *   the repo validates      { format:'whistlevale-community', version:1, works:[...] }
 *
 * The Hall is a good front door — a numbered empty bay invites a stranger far
 * better than a schema does, and each bay already carries its own camera, so a
 * contribution arrives framed. But it speaks a different dialect, and its
 * galleries are not registered rooms. This turns one into the other and then
 * runs the result through the real validator, so a contributor learns whether
 * their bay will land before they open a pull request.
 *
 *   node scripts/grandhall-align.mjs <export.json> [--out contributions/world.json]
 *   node scripts/grandhall-align.mjs --selftest
 */
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// Galleries are presentation, not rooms. Everything lands in the shared
// contribution room and keeps its gallery in the work id, which is the only
// free-form field the validator allows.
const ROOM = 'commons';
const GALLERIES = new Set(['grand', 'steam', 'worlds', 'conservatory',
                           'architecture', 'curiosity', 'workshop']);

const slug = value => String(value ?? '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

/* A bay stores a camera and a target. The validator wants distance/yaw/pitch. */
function viewFromBay(bay) {
  if (!Array.isArray(bay?.camera) || !Array.isArray(bay?.target)) return undefined;
  const [cx, cy, cz] = bay.camera, [tx, ty, tz] = bay.target;
  const dx = cx - tx, dy = cy - ty, dz = cz - tz;
  const distance = Math.hypot(dx, dy, dz);
  return {
    distance: Number(distance.toFixed(3)),
    yaw: Number(Math.atan2(dx, dz).toFixed(4)),
    pitch: Number(Math.asin(Math.min(1, Math.max(-1, dy / (distance || 1)))).toFixed(4)),
  };
}

export function alignExport(doc) {
  const notes = [];
  if (doc?.format !== 'whistlevale.community.v1') {
    notes.push(`Expected a Grand Hall export (whistlevale.community.v1), got ${doc?.format}.`);
  }
  const entries = Array.isArray(doc?.entries) ? doc.entries : [];
  const works = [];

  for (const entry of entries) {
    const bayId = String(entry.bay ?? entry.id ?? '').toLowerCase();
    const gallery = entry.gallery || entry.room;
    const title = entry.title || entry.name || bayId;
    const id = slug(`${bayId}-${title}`) || slug(bayId);

    const placements = (entry.miniatures || entry.placements || []).map(p => ({
      builder: p.builder,
      at: p.at,
      ...(p.angle !== undefined ? {angle: p.angle} : {}),
      ...(p.y !== undefined ? {y: p.y} : {}),
      ...(p.scale !== undefined ? {scale: p.scale} : {}),
      ...(p.pose !== undefined ? {pose: p.pose} : {}),
      ...(p.variant !== undefined ? {variant: p.variant} : {}),
      ...(p.color !== undefined ? {color: p.color} : {}),
    }));

    if (gallery && !GALLERIES.has(gallery)) notes.push(`${bayId}: unknown gallery "${gallery}".`);
    if (!placements.length) { notes.push(`${bayId}: no placements; skipped.`); continue; }

    const view = viewFromBay(entry.bay_geometry || entry.bayGeometry || entry);
    const work = {
      id,
      title: String(title).slice(0, 80),
      kind: entry.kind || 'vignette',
      room: ROOM,
      source: 'contributions/world.json',
      // A credit always needs `name`; platform+handle are optional extras and
      // must arrive together. Fall back to the handle as the chosen public name
      // so a Hall entry that only gave a handle still validates.
      credits: (entry.credits || []).map(c => {
        const credit = {name: String(c.name || c.handle || 'Anonymous').slice(0, 64)};
        if (c.platform && c.handle) {
          credit.platform = c.platform;
          credit.handle = String(c.handle).replace(/^@/, '');
        }
        if (c.note) credit.note = String(c.note).slice(0, 160);
        return credit;
      }),
      miniatures: placements,
    };
    // A view is optional, and the validator floors distance at 10. Bay cameras
    // sit closer than that, so an out-of-range view is dropped with a note
    // rather than silently clamped into a shot the author never framed.
    if (view) {
      if (view.distance >= 10 && view.distance <= 120 && view.pitch >= 0.2 && view.pitch <= 1.35) {
        work.view = view;
      } else {
        notes.push(`${id}: bay camera is outside the validator's view range `
          + `(distance ${view.distance}, pitch ${view.pitch}); view omitted.`);
      }
    }
    works.push(work);
  }
  return {catalogue: {format: 'whistlevale-community', version: 1, works}, notes};
}

/* Run the produced catalogue through the repository's own validator. */
async function validate(catalogue) {
  const source = await readFile(path.join(root, 'src/community-core.js'), 'utf8');
  const context = {};
  new Function(`${source}\nthis.validateCommunity=validateCommunity;`).call(context);
  try {
    const clean = context.validateCommunity(catalogue);
    return {ok: true, works: clean.works.length};
  } catch (error) {
    return {ok: false, reason: error.message};
  }
}

const SELFTEST = {
  format: 'whistlevale.community.v1',
  exportedAt: new Date().toISOString(),
  entries: [{
    bay: 'GH-07', gallery: 'curiosity', kind: 'vignette',
    title: 'Waiting for the late train',
    credits: [{handle: 'someone', platform: 'x', note: 'First bay.'}],
    camera: [-3, 4.6, 23.4], target: [-8, 2.35, 17.6],
    miniatures: [
      {builder: 'person', at: [-8, 17.6], pose: 'sit', variant: 3, angle: 0.4},
      {builder: 'case', at: [-6.7, 18.3], angle: 0.2},
    ],
  }],
};

if (process.argv[1] && process.argv[1].endsWith('grandhall-align.mjs')) {
  const selftest = process.argv.includes('--selftest');
  const file = process.argv.slice(2).find(a => !a.startsWith('--'));
  const outIndex = process.argv.indexOf('--out');
  try {
    const doc = selftest ? SELFTEST : JSON.parse(await readFile(file, 'utf8'));
    if (!selftest && !file) throw new Error('Usage: grandhall-align.mjs <export.json> [--out <path>]');
    const {catalogue, notes} = alignExport(doc);
    const result = await validate(catalogue);

    console.log(`Grand Hall entries : ${(doc.entries || []).length}`);
    console.log(`Aligned works      : ${catalogue.works.length}`);
    for (const note of notes) console.log(`  note: ${note}`);
    console.log(result.ok
      ? `Validator          : PASS (${result.works} works accepted)`
      : `Validator          : FAIL — ${result.reason}`);

    if (outIndex !== -1 && result.ok) {
      const out = process.argv[outIndex + 1];
      await writeFile(path.join(root, out), JSON.stringify(catalogue, null, 2) + '\n');
      console.log(`Written            : ${out}`);
    }
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
