import * as core from '@actions/core'
import {Params, Result} from './models'
import {readParams} from './input'
import {setDiffOutput} from './output'

function check(config: Params): Readonly<Result> {
  const modules = new Map()

  for (const [k, v] of config.modules) {
    modules.set(k, {
      module: v,
      changed: true
    })
  }

  return {modules}
}

async function run(): Promise<void> {
  try {
    core.debug(`Running ...`)

    const config = readParams()
    const diff = check(config)

    // core.info(`modules : ${core.getInput('modules')}`)
    // core.info(`modules no trim : ${core.getInput('modules')}`)
    // core.info(`modules : ${core.getInput('modules', {trimWhitespace: false})}`)

    setDiffOutput(diff)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }

    throw error
  }
}

run()
