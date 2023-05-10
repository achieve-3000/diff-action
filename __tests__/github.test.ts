import {expect, test, jest} from '@jest/globals'

import {randomUUID} from 'crypto'
import {Params} from '../src/models'
import {GithubAdapter} from '../src/github'

import {components} from '@octokit/openapi-types/types'

/* eslint-disable import/named */
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'
/* eslint-enable import/named */

type CompareCommitsWithBaseheadResponse = RestEndpointMethodTypes['repos']['compareCommitsWithBasehead']['response']
type CompareCommitsWithBaseheadDataDiff = CompareCommitsWithBaseheadResponse['data']['files']

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
          pattern: ['infra/terraform/**']
        }
      ],
      [
        'kubernetes',
        {
          name: 'kubernetes',
          tags: ['kubernetes', 'infra'],
          pattern: ['infra/kubernetes/**']
        }
      ],
      [
        'module1',
        {
          name: 'module1',
          tags: ['java', 'api'],
          pattern: ['module1/**']
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

function createMockResponse(files: object[]): Promise<CompareCommitsWithBaseheadDataDiff> {
  return Promise.resolve(files.map(o => o as components['schemas']['diff-entry']))
}

function createGithubAdapter(params: Params, files: object[]) {
  const adapter = new GithubAdapter(params)
  const result = createMockResponse(files)

  jest.spyOn(adapter, 'compareCommits').mockImplementation(() => result)

  return adapter
}

test('compare commits', async () => {
  const params = createParams()
  const response = [
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

  const adapter = createGithubAdapter(params, response)
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
  const response = [
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

  const adapter = createGithubAdapter(params, response)
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

test('compare commits on subpath', async () => {
  const params = createParams()
  const response = [
    {
      filename: 'infra/terraform/config/dev/config.yaml',
      status: 'modified'
    },
    {
      filename: 'infra/terraform/config/qa/config.yaml',
      status: 'modified'
    },
    {
      filename: 'module1/src/main/resources/log4j.properties',
      status: 'modified'
    }
  ]

  const adapter = createGithubAdapter(params, response)
  const result = await adapter.compare()

  expect(result.changed).toBeTruthy()

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
      all: ['infra/terraform/config/dev/config.yaml', 'infra/terraform/config/qa/config.yaml'],
      added: [],
      removed: [],
      renamed: [],
      modified: ['infra/terraform/config/dev/config.yaml', 'infra/terraform/config/qa/config.yaml']
    }
  })

  expect(result.modules.get('module1')).toMatchObject({
    changed: true,
    files: {
      all: ['module1/src/main/resources/log4j.properties'],
      added: [],
      removed: [],
      renamed: [],
      modified: ['module1/src/main/resources/log4j.properties']
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
