import * as core from '@actions/core'
import {Diff, Result} from './models'

interface Output {
  changed: boolean
}

function format(diff: Diff): Output {
  return {
    changed: diff.changed
  }
}

export function setDiffOutput(result: Result): void {
  const entries = Array.from(result.modules)
  const values = entries.map(e => [e[0], format(e[1])])
  const diff = Object.fromEntries(values)

  core.setOutput('diff', diff)
}
