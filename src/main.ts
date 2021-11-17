import * as core from '@actions/core'
import {readParams} from './input'
import {setDiffOutput} from './output'
import {GithubAdapter} from './github'

async function run(): Promise<void> {
  try {
    core.debug(`Running ...`)

    const config = readParams()
    const adapter = new GithubAdapter(config)
    const result = await adapter.compare()

    setDiffOutput(result)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }

    throw error
  }
}

run()
