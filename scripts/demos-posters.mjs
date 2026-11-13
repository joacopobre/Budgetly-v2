// Renders one still frame per demo, in light and dark, to
// public/demos/posters/<demo>-<theme>.webp.
//
//   npm run demos:posters
//
// The landing page shows these before a demo loads, and instead of the demo
// when the visitor prefers reduced motion. Needs ffmpeg on the PATH.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(root, 'lib', 'demos.manifest.json'), 'utf8'))
const out = join(root, 'public', 'demos', 'posters')

// Seconds into each scene: a frame that shows what the demo is about.
const moments = { dashboard: 4.6, capture: 6.1, import: 5.3, fund: 4.2, limit: 10.2 }

const HF = ['--yes', 'hyperframes@0.9.40']
mkdirSync(out, { recursive: true })

for (const theme of ['light', 'dark']) {
  // The CLI renders the project as written, so the dark set comes from a
  // temporary copy with the theme attribute set on <html>.
  const work = mkdtempSync(join(tmpdir(), 'budgetly-demos-'))
  cpSync(join(root, 'demos'), work, {
    recursive: true,
    dereference: true,
    filter: src => !src.includes('.hyperframes') && !src.includes('node_modules'),
  })
  if (theme === 'dark') {
    const file = join(work, 'index.html')
    writeFileSync(file, readFileSync(file, 'utf8').replace('<html\n', '<html\n  data-theme="dark"\n'))
  }
  const shots = join(work, '_shots')
  const ids = Object.keys(moments).filter(id => manifest.scenes[id])
  const times = ids.map(id => (manifest.scenes[id].start + moments[id]).toFixed(2))
  execFileSync('npx', [...HF, 'snapshot', work, '--at', times.join(','), '--no-end', '-o', shots], { stdio: 'inherit' })
  const frames = readdirSync(shots).filter(f => f.startsWith('frame-')).sort()
  ids.forEach((id, i) => {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(shots, frames[i]), '-c:v', 'libwebp', '-quality', '82', join(out, `${id}-${theme}.webp`)])
    console.log(`posters/${id}-${theme}.webp`)
  })
  rmSync(work, { recursive: true, force: true })
}
