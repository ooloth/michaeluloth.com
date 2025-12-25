import { determineBuildStatus } from './determine-build-notification'
import type { BuildStatusInputs } from '@/io/pushover/types'

const WORKFLOW_URL = 'https://github.com/ooloth/michaeluloth.com/actions/runs/123'

function createInputs(overrides: Partial<BuildStatusInputs> = {}): BuildStatusInputs {
  return {
    deploy: '',
    lighthouse: '',
    metadata: '',
    build: '',
    test: '',
    typecheck: '',
    lint: '',
    format: '',
    workflowUrl: WORKFLOW_URL,
    ...overrides,
  }
}

describe('determineBuildStatus', () => {
  describe('success case', () => {
    it('returns success message without URL when deployment succeeds', () => {
      const inputs = createInputs({ deploy: 'success' })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '✅ michaeluloth.com deployed successfully',
      })
      expect(result.url).toBeUndefined()
    })
  })

  describe('failure cases - priority order', () => {
    it('reports deployment failure when deploy fails', () => {
      const inputs = createInputs({
        deploy: 'failure',
        lighthouse: 'success',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Deployment to Cloudflare failed',
        url: WORKFLOW_URL,
      })
    })

    it('reports Lighthouse failure when deploy is not success/failure and Lighthouse fails', () => {
      const inputs = createInputs({
        deploy: 'skipped',
        lighthouse: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Lighthouse checks failed',
        url: WORKFLOW_URL,
      })
    })

    it('reports metadata failure when earlier jobs pass and metadata fails', () => {
      const inputs = createInputs({
        deploy: 'skipped',
        lighthouse: 'skipped',
        metadata: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Metadata validation failed',
        url: WORKFLOW_URL,
      })
    })

    it('reports build failure when earlier jobs pass and build fails', () => {
      const inputs = createInputs({
        build: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Build failed',
        url: WORKFLOW_URL,
      })
    })

    it('reports test failure when earlier jobs pass and test fails', () => {
      const inputs = createInputs({
        test: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Tests failed',
        url: WORKFLOW_URL,
      })
    })

    it('reports typecheck failure when earlier jobs pass and typecheck fails', () => {
      const inputs = createInputs({
        typecheck: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Type checking failed',
        url: WORKFLOW_URL,
      })
    })

    it('reports lint failure when earlier jobs pass and lint fails', () => {
      const inputs = createInputs({
        lint: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Linting failed',
        url: WORKFLOW_URL,
      })
    })

    it('reports format failure when earlier jobs pass and format fails', () => {
      const inputs = createInputs({
        format: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Formatting check failed',
        url: WORKFLOW_URL,
      })
    })
  })

  describe('fallback case', () => {
    it('reports generic pipeline failure when no specific failure is detected', () => {
      const inputs = createInputs({
        deploy: 'cancelled',
        lighthouse: 'cancelled',
        metadata: 'cancelled',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Deployment pipeline failed',
        url: WORKFLOW_URL,
      })
    })

    it('reports generic pipeline failure when all jobs are skipped', () => {
      const inputs = createInputs({
        deploy: 'skipped',
        lighthouse: 'skipped',
        metadata: 'skipped',
        build: 'skipped',
        test: 'skipped',
        typecheck: 'skipped',
        lint: 'skipped',
        format: 'skipped',
      })
      const result = determineBuildStatus(inputs)

      expect(result).toEqual({
        message: '❌ Deployment pipeline failed',
        url: WORKFLOW_URL,
      })
    })
  })

  describe('priority order validation', () => {
    it('reports deployment failure even when later jobs also fail', () => {
      const inputs = createInputs({
        deploy: 'failure',
        lighthouse: 'failure',
        build: 'failure',
        format: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result.message).toBe('❌ Deployment to Cloudflare failed')
    })

    it('reports Lighthouse failure even when later jobs also fail', () => {
      const inputs = createInputs({
        lighthouse: 'failure',
        metadata: 'failure',
        build: 'failure',
      })
      const result = determineBuildStatus(inputs)

      expect(result.message).toBe('❌ Lighthouse checks failed')
    })

    it('reports first failing job in priority order', () => {
      // Build fails, but format also fails
      const inputs1 = createInputs({
        build: 'failure',
        format: 'failure',
      })
      expect(determineBuildStatus(inputs1).message).toBe('❌ Build failed')

      // Format fails, but build succeeds
      const inputs2 = createInputs({
        build: 'success',
        format: 'failure',
      })
      expect(determineBuildStatus(inputs2).message).toBe('❌ Formatting check failed')
    })
  })

  describe('URL inclusion', () => {
    it('includes URL for all failure cases', () => {
      const failureCases: BuildStatusInputs[] = [
        createInputs({ deploy: 'failure' }),
        createInputs({ lighthouse: 'failure' }),
        createInputs({ metadata: 'failure' }),
        createInputs({ build: 'failure' }),
        createInputs({ test: 'failure' }),
        createInputs({ typecheck: 'failure' }),
        createInputs({ lint: 'failure' }),
        createInputs({ format: 'failure' }),
      ]

      for (const inputs of failureCases) {
        const result = determineBuildStatus(inputs)
        expect(result.url).toBe(WORKFLOW_URL)
      }
    })

    it('does not include URL for success case', () => {
      const inputs = createInputs({ deploy: 'success' })
      const result = determineBuildStatus(inputs)

      expect(result.url).toBeUndefined()
    })
  })
})
