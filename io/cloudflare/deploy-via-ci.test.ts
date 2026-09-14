import { describe, it, expect } from 'vitest'
import { accessSync, constants, readFileSync } from 'fs'
import { join } from 'path'

/**
 * `npm run deploy:ci` spans three files that have no other connection to each other:
 * the npm script, the bash script it runs, and the `workflow_dispatch` trigger the
 * bash script needs. Removing any one of them leaves the other two looking correct
 * and fails only at deploy time, which is the worst moment to find out.
 */
describe('deploy:ci', () => {
  const repoRoot = join(__dirname, '../..')
  const scriptPath = join(repoRoot, 'io/cloudflare/deploy-via-ci.sh')
  const workflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf-8')
  const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'))

  it('runs the deploy script from an npm script', () => {
    expect(packageJson.scripts['deploy:ci']).toBe('bash io/cloudflare/deploy-via-ci.sh')
  })

  it('has a deploy script on disk', () => {
    expect(() => accessSync(scriptPath, constants.R_OK)).not.toThrow()
  })

  it('dispatches the workflow the CI pipeline actually deploys from', () => {
    const script = readFileSync(scriptPath, 'utf-8')

    expect(script).toContain("WORKFLOW='ci.yml'")
    expect(script).toContain("BRANCH='main'")
  })

  it('gives the CI workflow a workflow_dispatch trigger for the script to fire', () => {
    expect(triggersIn(workflow)).toContain('workflow_dispatch')
  })

  it('keeps the push trigger, so merges to main still deploy', () => {
    expect(triggersIn(workflow)).toContain('push')
  })
})

/**
 * Reads the keys of a workflow's top-level `on:` block without a YAML parser, so a
 * `workflow_dispatch` mentioned in a comment or nested inside a job doesn't count.
 */
function triggersIn(workflow: string): string[] {
  const lines = workflow.split('\n')
  const onIndex = lines.findIndex(line => /^on:/.test(line))
  if (onIndex === -1) return []

  const afterOn = lines.slice(onIndex + 1)
  const nextTopLevelKey = afterOn.findIndex(line => /^\S/.test(line))
  const block = nextTopLevelKey === -1 ? afterOn : afterOn.slice(0, nextTopLevelKey)

  return block.filter(line => /^ {2}\S/.test(line)).map(line => line.trim().replace(/:.*$/, ''))
}
