jest.mock('@actions/core')

import {expect, jest, test} from '@jest/globals'
import {Result} from '../src/models'
import {setDiffOutput} from '../src/output'
import * as core from '@actions/core'

function createResult(values: Map<string, string[]>): Readonly<Result> {
  const tags = new Map()
  const modules = new Map()
  const entries = Array.from(values)
  const changed = entries.some(e => e[1].length > 0)

  for (const [key, value] of entries) {
    const changed = value.length > 0
    const diff = {
      changed: value.length > 0,
      tags: [key],
      files: {
        all: value,
        added: [],
        removed: [],
        renamed: [],
        modified: value
      }
    }

    modules.set(key, diff)
    tags.set(key, changed ? [key] : [])
  }

  return {changed, tags, modules}
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

  const expectedTags = {
    module1: {
      changed: true,
      modules: ['module1']
    },
    module2: {
      changed: false,
      modules: []
    },
    terraform: {
      changed: true,
      modules: ['terraform']
    },
    kubernetes: {
      changed: false,
      modules: []
    }
  }

  const expectedModules = {
    all: ['kubernetes', 'module1', 'module2', 'terraform'],
    changes: ['module1', 'terraform']
  }

  const expectedDiff = {
    module1: {
      changed: true,
      tags: ['module1'],
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
      tags: ['module2'],
      files: {all: [], added: [], removed: [], renamed: [], modified: []}
    },
    terraform: {
      changed: true,
      tags: ['terraform'],
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
      tags: ['kubernetes'],
      files: {all: [], added: [], removed: [], renamed: [], modified: []}
    }
  }

  expect(actual.changed).toEqual(true)
  expect(core.setOutput).toHaveBeenCalledWith('changed', JSON.stringify(true))

  expect(actual.tags).toEqual(expectedTags)
  expect(core.setOutput).toHaveBeenCalledWith('tags', JSON.stringify(expectedTags))

  expect(actual.diff).toMatchObject(expectedDiff)
  expect(core.setOutput).toHaveBeenCalledWith('diff', JSON.stringify(expectedDiff))

  expect(actual.modules).toEqual(expectedModules)
  expect(core.setOutput).toHaveBeenCalledWith('modules', JSON.stringify(expectedModules))
})

test('Set diff output no changes', () => {
  const actual = setDiffOutput(
    createResult(
      new Map([
        ['module1', []],
        ['module2', []],
        ['terraform', []],
        ['kubernetes', []]
      ])
    )
  )

  const expectedTags = {
    module1: {
      changed: false,
      modules: []
    },
    module2: {
      changed: false,
      modules: []
    },
    terraform: {
      changed: false,
      modules: []
    },
    kubernetes: {
      changed: false,
      modules: []
    }
  }

  const expectedModules = {
    all: ['kubernetes', 'module1', 'module2', 'terraform'],
    changes: []
  }

  const expectedDiff = {
    module1: {
      changed: false,
      tags: ['module1'],
      files: {all: [], added: [], removed: [], renamed: [], modified: []}
    },
    module2: {
      changed: false,
      tags: ['module2'],
      files: {all: [], added: [], removed: [], renamed: [], modified: []}
    },
    terraform: {
      changed: false,
      tags: ['terraform'],
      files: {all: [], added: [], removed: [], renamed: [], modified: []}
    },
    kubernetes: {
      changed: false,
      tags: ['kubernetes'],
      files: {all: [], added: [], removed: [], renamed: [], modified: []}
    }
  }

  expect(actual.changed).toEqual(false)
  expect(core.setOutput).toHaveBeenCalledWith('changed', JSON.stringify(false))

  expect(actual.tags).toEqual(expectedTags)
  expect(core.setOutput).toHaveBeenCalledWith('tags', JSON.stringify(expectedTags))

  expect(actual.diff).toMatchObject(expectedDiff)
  expect(core.setOutput).toHaveBeenCalledWith('diff', JSON.stringify(expectedDiff))

  expect(actual.modules).toEqual(expectedModules)
  expect(core.setOutput).toHaveBeenCalledWith('modules', JSON.stringify(expectedModules))
})
