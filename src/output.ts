import * as core from '@actions/core'
import {DiffEntry, Result} from './models'

export interface DiffOutput {
  diff: object
  changed: boolean
  modules: ModulesOutput
}

export interface ModulesOutput {
  all: string[]
  changes: string[]
}

function createModulesOutput(entries: [string, DiffEntry][]): ModulesOutput {
  const compare = (a: string, b: string): number => a.localeCompare(b)
  const all = entries.map(e => e[0]).sort(compare)
  const changes = entries
    .filter(e => e[1].changed)
    .map(e => e[0])
    .sort(compare)

  return {all, changes}
}

export function setDiffOutput(result: Result): DiffOutput {
  const entries = Array.from(result.modules)
  const modules = createModulesOutput(entries)
  const diff = Object.fromEntries(entries)
  const changed = result.changed

  core.setOutput('modules', modules)
  core.setOutput('changed', changed)
  core.setOutput('diff', diff)

  return {diff, changed, modules}
}
