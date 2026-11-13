const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('each app page resolves to a unique public path after removing route groups', () => {
  const app = path.resolve(__dirname, '../app')
  const routes = new Map()
  function visit(directory, segments = []) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('@')) visit(path.join(directory, entry.name), [...segments, entry.name])
      } else if (/^page\.(tsx?|jsx?)$/.test(entry.name)) {
        const route = '/' + segments.filter(segment => !/^\(.*\)$/.test(segment)).join('/')
        const source = path.relative(app, path.join(directory, entry.name))
        assert.equal(routes.has(route), false, `${source} collides with ${routes.get(route)} at ${route}`)
        routes.set(route, source)
      }
    }
  }
  visit(app)
  assert.equal(routes.get('/[locale]'), path.join('[locale]', 'page.tsx'))
})
