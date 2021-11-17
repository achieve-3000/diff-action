jest.mock('@actions/core')

import {expect, jest, test} from '@jest/globals'
import {Result} from '../src/models'
import {setDiffOutput} from '../src/output'
import * as core from '@actions/core'

function createResult(values: Map<string, string[]>): Readonly<Result> {
  const keys = Array.from(values)
  const changed = keys.some(e => e[1].length > 0)
  const modules = new Map(
    keys.map(e => [
      e[0],
      {
        changed: e[1].length > 0,
        files: {
          all: e[1],
          added: [],
          removed: [],
          renamed: [],
          modified: e[1]
        }
      }
    ])
  )

  return {changed, modules}
}

test('Set diff output', () => {
  const actual = setDiffOutput(
    createResult(
      new Map([
        ['module1', ['README.md']],
        ['module2', []],
        ['terraform', ['README.md']],
        ['kubernetes', []]
      ])
    )
  )

  const expectedModules = {
    all: ['kubernetes', 'module1', 'module2', 'terraform'],
    changes: ['module1', 'terraform']
  }

  const expectedDiff = {
    module1: {
      changed: true,
      files: {
        all: ['README.md'],
        added: [],
        removed: [],
        renamed: [],
        modified: ['README.md']
      }
    },
    module2: {
      changed: false,
      files: {all: [], added: [], removed: [], renamed: [], modified: []}
    },
    terraform: {
      changed: true,
      files: {
        all: ['README.md'],
        added: [],
        removed: [],
        renamed: [],
        modified: ['README.md']
      }
    },
    kubernetes: {
      changed: false,
      files: {all: [], added: [], removed: [], renamed: [], modified: []}
    }
  }

  expect(actual.changed).toEqual(true)
  expect(core.setOutput).toHaveBeenCalledWith('changed', true)

  expect(actual.diff).toMatchObject(expectedDiff)
  expect(core.setOutput).toHaveBeenCalledWith('diff', expectedDiff)

  expect(actual.modules).toEqual(expectedModules)
  expect(core.setOutput).toHaveBeenCalledWith('modules', expectedModules)
})
