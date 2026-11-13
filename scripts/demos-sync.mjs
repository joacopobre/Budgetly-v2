// Copies the HyperFrames demo sources in demos/ to public/demos/ so the
// landing page can embed them with the HyperFrames player.
//
//   npm run demos:sync
//
// Run it after editing anything in demos/ or styles/tokens.css.
// public/demos/vendor/ (the player runtime) and public/demos/posters/ are
// left alone.
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root_ = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root_, 'demos')
const dest = join(root_, 'public', 'demos')
const entries = ['index.html', 'compositions', 'assets']

mkdirSync(dest, { recursive: true })
for (const entry of entries) {
  const from = join(src, entry)
  if (!existsSync(from)) throw new Error(`demos/${entry} is missing`)
  rmSync(join(dest, entry), { recursive: true, force: true })
  // dereference: assets/tokens.css is a link to styles/tokens.css
  cpSync(from, join(dest, entry), { recursive: true, dereference: true })
}

const size = dir =>
  readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => {
    const p = join(dir, e.name)
    return sum + (e.isDirectory() ? size(p) : statSync(p).size)
  }, 0)
const kb = entries.reduce((sum, e) => {
  const p = join(dest, e)
  return sum + (statSync(p).isDirectory() ? size(p) : statSync(p).size)
}, 0) / 1024
console.log(`demos → public/demos (${kb.toFixed(0)} KB)`)

// The landing page plays one scene at a time, so it needs each scene's slot on
// the root timeline. demos/index.html is the source of truth; the app reads
// this generated manifest (lib/demos.ts).
const html = readFileSync(join(src, 'index.html'), 'utf8')
const root = html.match(/<div[^>]*data-composition-id="main"[^>]*>/s)?.[0] ?? ''
const size16 = { width: Number(root.match(/data-width="(\d+)"/)?.[1]), height: Number(root.match(/data-height="(\d+)"/)?.[1]) }
const scenes = {}
for (const [tag] of html.matchAll(/<div[^>]*data-composition-src="[^"]+"[^>]*>/gs)) {
  const attr = name => tag.match(new RegExp(`${name}="([^"]+)"`))?.[1]
  const start = Number(attr('data-start'))
  const duration = Number(attr('data-duration'))
  if (!attr('data-composition-id') || Number.isNaN(start) || Number.isNaN(duration)) {
    throw new Error(`Scene host needs numeric data-start and data-duration: ${tag}`)
  }
  scenes[attr('data-composition-id')] = { start, end: +(start + duration).toFixed(3) }
}
writeFileSync(join(root_, 'lib', 'demos.manifest.json'), JSON.stringify({ ...size16, scenes }, null, 2) + '\n')
console.log(`lib/demos.manifest.json: ${Object.keys(scenes).join(', ')}`)
