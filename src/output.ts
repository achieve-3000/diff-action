import * as core from '@actions/core'
import {Result} from './models'

export function setDiffOutput(result: Result): object {
  const entries = Array.from(result.modules)
  const output = Object.fromEntries(entries)

  core.setOutput('diff', output)

  return output
}
