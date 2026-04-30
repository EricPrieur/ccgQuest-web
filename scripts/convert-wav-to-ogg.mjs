// Convert every .wav under public/assets/Sounds (or a directory passed as
// the first arg) to .ogg using ffmpeg-static. The original .wav files are
// removed after a successful conversion.
//
//   node scripts/convert-wav-to-ogg.mjs                      # whole sounds tree
//   node scripts/convert-wav-to-ogg.mjs public/assets/Sounds/Axes
//   node scripts/convert-wav-to-ogg.mjs --keep ...           # keep originals
//
// Quality is libvorbis -q:a 5 (~160 kbps VBR), good for short SFX.

import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const positional = args.filter(a => !a.startsWith('--'));
const root = resolve(positional[0] || 'public/assets/Sounds');

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (entry.toLowerCase().endsWith('.wav')) convert(full);
  }
}

function convert(wav) {
  const ogg = wav.replace(/\.wav$/i, '.ogg');
  const result = spawnSync(
    ffmpeg,
    ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '5', ogg],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );
  if (result.status !== 0) {
    console.error(`FAILED: ${wav}`);
    return;
  }
  console.log(`ok  ${ogg}`);
  if (!keep) unlinkSync(wav);
}

walk(root);
