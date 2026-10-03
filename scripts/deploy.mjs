// Builds the site and publishes dist/ to the gh-pages branch, which GitHub Pages
// serves. The branch holds only the built files, as one commit that is replaced
// at every deploy: its history is not worth keeping.
//
//   npm run deploy
import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
const read = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim()

const remote = read('git', ['remote', 'get-url', 'origin'])
const commit = read('git', ['rev-parse', '--short', 'HEAD'])

run('npm', ['run', 'build'])
// GitHub Pages runs Jekyll by default, which skips files it does not expect. This turns it off.
writeFileSync(resolve(dist, '.nojekyll'), '')

rmSync(resolve(dist, '.git'), { recursive: true, force: true })
run('git', ['init', '--quiet', '--initial-branch=gh-pages'], dist)
run('git', ['add', '--all'], dist)
run('git', ['commit', '--quiet', '-m', `"Deploy ${commit}"`], dist)
run('git', ['push', '--force', '--quiet', remote, 'gh-pages'], dist)
rmSync(resolve(dist, '.git'), { recursive: true, force: true })

console.log(`Published ${commit} to the gh-pages branch of ${remote}`)
