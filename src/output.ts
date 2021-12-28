import * as core from '@actions/core'
import {DiffEntry, Result} from './models'

export interface DiffOutput {
  diff: object
  changed: boolean
  modules: ModulesOutput
  tags: object
}

export interface ModulesOutput {
  all: string[]
  changes: string[]
}

export interface TagOutput {
  changed: boolean
  modules: string[]
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b)
}

function createModulesOutput(entries: [string, DiffEntry][]): ModulesOutput {
  const all = entries.map(e => e[0]).sort(compareStrings)
  const changes = entries
    .filter(e => e[1].changed)
    .map(e => e[0])
    .sort(compareStrings)

  return {all, changes}
}

function createDiffOutput(tags: Map<string, string[]>): object {
  const result = new Map()

  for (const [tag, modules] of tags) {
    result.set(tag, {
      changed: modules.length > 0,
      modules: modules.sort(compareStrings)
    })
  }

  return Object.fromEntries(result)
}

export function setDiffOutput(result: Result): DiffOutput {
  const tags = createDiffOutput(result.tags)
  const entries = Array.from(result.modules)
  const modules = createModulesOutput(entries)
  const diff = Object.fromEntries(entries)
  const changed = result.changed

  core.setOutput('modules', JSON.stringify(modules))
  core.setOutput('changed', JSON.stringify(changed))
  core.setOutput('tags', JSON.stringify(tags))
  core.setOutput('diff', JSON.stringify(diff))

  return {diff, tags, changed, modules}
}
