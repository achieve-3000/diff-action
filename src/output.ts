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

export function setDiffOutput(result: Result): DiffOutput {
  const tags = Object.fromEntries(Array.from(result.tags))
  const entries = Array.from(result.modules)
  const modules = createModulesOutput(entries)
  const diff = Object.fromEntries(entries)
  const changed = result.changed

  core.setOutput('modules', modules)
  core.setOutput('changed', changed)
  core.setOutput('tags', tags)
  core.setOutput('diff', diff)

  return {diff, tags, changed, modules}
}
