import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'

export type SitemapSnapshot = { version: 1; origin: string; generatedAt: number; files: Record<string, string> }
export function createSnapshotStore(directory: string, origin: string, generate: () => Promise<Record<string, string>>, now = Date.now) {
  const file = path.join(directory, `${createHash('sha256').update(origin).digest('hex').slice(0, 16)}.json`)
  let pending: Promise<{ snapshot: SitemapSnapshot; stale: boolean }> | undefined
  const ttl = 60 * 60 * 1000
  const maxAge = 7 * 24 * ttl
  async function read(): Promise<SitemapSnapshot | null> {
    try {
      const data = JSON.parse(await readFile(file, 'utf8')) as SitemapSnapshot
      if (data.version !== 1 || data.origin !== origin || !Number.isFinite(data.generatedAt) || data.generatedAt > now() || !data.files?.['index.xml']) return null
      if (Object.entries(data.files).some(([name, xml]) => !/^[a-z0-9-]+\.xml$/.test(name) || typeof xml !== 'string' || !xml.startsWith('<?xml'))) return null
      return data
    } catch { return null }
  }
  async function load(force: boolean) {
    const previous = await read()
    if (!force && previous && now() - previous.generatedAt < ttl) return { snapshot: previous, stale: false }
    try {
      const files = await generate()
      if (!files['index.xml']) throw new Error('Sitemap index missing')
      const snapshot: SitemapSnapshot = { version: 1, origin, generatedAt: now(), files }
      await mkdir(directory, { recursive: true })
      const temporary = `${file}.${randomUUID()}.tmp`
      await writeFile(temporary, JSON.stringify(snapshot), { encoding: 'utf8', mode: 0o600 })
      await rename(temporary, file)
      return { snapshot, stale: false }
    } catch (error) {
      if (!previous || now() - previous.generatedAt > maxAge) throw error
      console.error('Sitemap refresh failed; serving last complete snapshot:', error instanceof Error ? error.message : 'unknown error')
      return { snapshot: previous, stale: true }
    }
  }
  return { get(force = false) {
    if (!pending) pending = load(force).finally(() => { pending = undefined })
    return pending
  } }
}
