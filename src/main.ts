import * as core from '@actions/core'

async function run(): Promise<void> {
  try {
    core.debug(`Running ...`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }

    throw error
  }
}

run()
