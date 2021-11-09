const context = {
  eventName: 'push',
  repo: {
    owner: 'achieve-3000',
    repo: 'diff-action'
  },
  payload: {
    before: '0000000',
    after: '0000000',
    pull_request: {
      base: {
        sha: '0000000'
      },
      head: {
        sha: '0000000'
      }
    }
  }
}

jest.mock('@actions/github', () => ({
  get context() {
    return context
  }
}))

import fs from 'fs'
import yaml from 'js-yaml'
import {env} from 'process'
import {resolve} from 'path'
import {randomUUID} from 'crypto'
import {readParams} from '../src/input'
import {expect, test, jest, beforeEach} from '@jest/globals'

beforeEach(() => {
  const filePath = resolve(__dirname, '../', 'action.yml')
  const contents = fs.readFileSync(filePath, 'utf8')
  const data = yaml.load(contents) as Record<'inputs', Map<string, any>>
  const inputs: Map<string, Record<'default', string>> = new Map(Object.entries(data.inputs))

  inputs.forEach((value, key) => {
    const envName = `INPUT_${key.toUpperCase()}`
    const envValue = value.default || ''

    env[envName] = envValue
  })

  env['GITHUB_REPOSITORY'] = 'achieve-3000/diff-action'
  env['INPUT_TOKEN'] = randomUUID()
})

test('readParams modules', () => {
  env['INPUT_MODULES'] = `
      ---
      module1:
      module2: {}
      terraform:
        path: infra/terraform
      kubernetes:
        path: [infra/kubernetes]
  `.trim()

  const actual = readParams()

  expect(actual.modules.size).toEqual(4)

  expect(actual.modules.get('module1')).toMatchObject({
    name: 'module1',
    path: ['module1']
  })

  expect(actual.modules.get('module2')).toMatchObject({
    name: 'module2',
    path: ['module2']
  })

  expect(actual.modules.get('kubernetes')).toMatchObject({
    name: 'kubernetes',
    path: ['infra/kubernetes']
  })

  expect(actual.modules.get('terraform')).toMatchObject({
    name: 'terraform',
    path: ['infra/terraform']
  })
})

test('read default pull_request commit', () => {
  context.eventName = 'pull_request'
  context.payload.pull_request.base.sha = randomUUID()
  context.payload.pull_request.head.sha = randomUUID()

  const actual = readParams()

  expect(actual.base_ref).toEqual(context.payload.pull_request.base.sha)
  expect(actual.head_ref).toEqual(context.payload.pull_request.head.sha)
})

test('read default push commit', () => {
  context.eventName = 'push'
  context.payload.before = randomUUID()
  context.payload.after = randomUUID()

  const actual = readParams()

  expect(actual.base_ref).toEqual(context.payload.before)
  expect(actual.head_ref).toEqual(context.payload.after)
})

test('read input commit', () => {
  env['INPUT_HEAD_REF'] = randomUUID()
  env['INPUT_BASE_REF'] = randomUUID()

  const actual = readParams()

  expect(actual.base_ref).toEqual(env['INPUT_BASE_REF'])
  expect(actual.head_ref).toEqual(env['INPUT_HEAD_REF'])
})

test('read default repo', () => {
  const actual = readParams()

  expect(actual.repo_name).toEqual('diff-action')
  expect(actual.repo_owner).toEqual('achieve-3000')
})

test('read input repo', () => {
  env['INPUT_REPO_NAME'] = randomUUID()
  env['INPUT_REPO_OWNER'] = randomUUID()

  const actual = readParams()

  expect(actual.repo_name).toEqual(env['INPUT_REPO_NAME'])
  expect(actual.repo_owner).toEqual(env['INPUT_REPO_OWNER'])
})
