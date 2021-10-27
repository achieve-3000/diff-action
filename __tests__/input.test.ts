import fs from 'fs'
import yaml from 'js-yaml'
import {env} from 'process'
import {resolve} from 'path'
import {readParams, Module} from '../src/input'
import {expect, test, beforeEach} from '@jest/globals'

beforeEach(() => {
  const filePath = resolve(__dirname, '../', 'action.yml')
  const contents = fs.readFileSync(filePath, 'utf8')
  const data = yaml.load(contents) as Record<'inputs', Map<string, any>>
  const inputs: Map<string, Record<'default', string>> = new Map(
    Object.entries(data.inputs)
  )

  inputs.forEach((value, key) => {
    const envName = `INPUT_${key.toUpperCase()}`
    const envValue = value.default || ''

    env[envName] = envValue
  })
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
