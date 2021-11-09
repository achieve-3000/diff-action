jest.mock('@actions/core')

import {expect, jest, test} from '@jest/globals'
import {Result} from '../src/models'
import {setDiffOutput} from '../src/output'
import * as core from '@actions/core'

function createResult(values: Map<string, string[]>): Readonly<Result> {
  const keys = Array.from(values)
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

  return {modules}
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

  const expected = {
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

  expect(actual).toMatchObject(expected)
  expect(core.setOutput).toHaveBeenCalledWith('diff', expected)
})
