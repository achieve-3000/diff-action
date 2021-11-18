import {expect, test} from '@jest/globals'
import {randomUUID} from 'crypto'
import {Params} from '../src/models'
import {GithubAdapter} from '../src/github'
import nock from 'nock'

function createParams(): Params {
  return {
    token: randomUUID(),
    base_ref: randomUUID(),
    head_ref: randomUUID(),
    repo_name: 'diff-action',
    repo_owner: 'achieve-3000',
    modules: new Map([
      [
        'terraform',
        {
          name: 'terraform',
          tags: ['terraform', 'infra'],
          pattern: ['infra/terraform/*']
        }
      ],
      [
        'kubernetes',
        {
          name: 'kubernetes',
          tags: ['kubernetes', 'infra'],
          pattern: ['infra/kubernetes/*']
        }
      ],
      [
        'module1',
        {
          name: 'module1',
          tags: ['java', 'api'],
          pattern: ['module1/*']
        }
      ],
      [
        'module2',
        {
          name: 'module2',
          tags: ['java', 'worker'],
          pattern: ['module2/*.js']
        }
      ]
    ])
  }
}

function mockCompareResponse(params: Params, body: object) {
  const host = 'https://api.github.com'
  const path = `/repos/${params.repo_owner}/${params.repo_name}/compare/${params.base_ref}...${params.head_ref}`

  nock(host).persist().get(path).reply(200, body)
}

test('compare commits', async () => {
  const params = createParams()
  const response = {
    files: [
      {
        filename: 'infra/terraform/added.txt',
        status: 'added'
      },
      {
        filename: 'infra/terraform/modified.txt',
        status: 'modified'
      },
      {
        filename: 'infra/terraform/renamed.txt',
        status: 'renamed'
      },
      {
        filename: 'infra/terraform/removed.txt',
        status: 'removed'
      },
      {
        filename: 'module1/added.txt',
        status: 'added'
      },
      {
        filename: 'module1/modified.txt',
        status: 'modified'
      },
      {
        filename: 'module2/modified.txt',
        status: 'added'
      }
    ]
  }

  mockCompareResponse(params, response)

  const adapter = new GithubAdapter(params)
  const result = await adapter.compare()

  expect(Array.from(result.modules.keys())).toEqual(
    expect.arrayContaining(['kubernetes', 'terraform', 'module1', 'module2'])
  )

  expect(result.modules.get('kubernetes')).toMatchObject({
    changed: false,
    files: {
      all: [],
      added: [],
      removed: [],
      renamed: [],
      modified: []
    }
  })

  expect(result.modules.get('terraform')).toMatchObject({
    changed: true,
    files: {
      all: [
        'infra/terraform/added.txt',
        'infra/terraform/modified.txt',
        'infra/terraform/renamed.txt',
        'infra/terraform/removed.txt'
      ],
      added: ['infra/terraform/added.txt'],
      removed: ['infra/terraform/removed.txt'],
      renamed: ['infra/terraform/renamed.txt'],
      modified: ['infra/terraform/modified.txt']
    }
  })

  expect(result.modules.get('module1')).toMatchObject({
    changed: true,
    files: {
      all: ['module1/added.txt', 'module1/modified.txt'],
      added: ['module1/added.txt'],
      removed: [],
      renamed: [],
      modified: ['module1/modified.txt']
    }
  })

  expect(result.modules.get('module2')).toMatchObject({
    changed: false,
    files: {
      all: [],
      added: [],
      removed: [],
      renamed: [],
      modified: []
    }
  })
})

test('map diff tags', async () => {
  const params = createParams()
  const response = {
    files: [
      {
        filename: 'infra/terraform/added.txt',
        status: 'added'
      },
      {
        filename: 'infra/terraform/modified.txt',
        status: 'modified'
      },
      {
        filename: 'infra/terraform/renamed.txt',
        status: 'renamed'
      },
      {
        filename: 'infra/terraform/removed.txt',
        status: 'removed'
      },
      {
        filename: 'infra/kubernetes/added.txt',
        status: 'added'
      },
      {
        filename: 'module1/added.txt',
        status: 'added'
      },
      {
        filename: 'module1/modified.txt',
        status: 'modified'
      },
      {
        filename: 'module2/modified.txt',
        status: 'added'
      }
    ]
  }

  mockCompareResponse(params, response)

  const adapter = new GithubAdapter(params)
  const result = await adapter.compare()

  expect(Array.from(result.modules.keys())).toEqual(
    expect.arrayContaining(['kubernetes', 'terraform', 'module1', 'module2'])
  )

  expect(Array.from(result.tags.keys())).toEqual(
    expect.arrayContaining(['kubernetes', 'terraform', 'infra', 'api', 'worker'])
  )

  expect(result.tags).toEqual(
    new Map([
      ['infra', ['terraform', 'kubernetes']],
      ['kubernetes', ['kubernetes']],
      ['terraform', ['terraform']],
      ['java', ['module1']],
      ['api', ['module1']],
      ['worker', []]
    ])
  )
})
