import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import {Module, Params} from './models'

function getInput(name: string, defaultValue = ''): string {
  return core.getInput(name) || defaultValue
}

function getYamlInput<T>(name: string): T {
  const input = getInput(name)

  try {
    return yaml.load(input) as T
  } catch (e) {
    core.error(`Failed to parse yaml input ${name}:'${input}'`)
    throw e
  }
}

function readModules(): Map<string, Module> {
  const input = getYamlInput<Map<string, Object>>('modules')
  const entries = Object.entries(input)
  const result = new Map()

  for (const [key, value] of entries) {
    if (value?.path && !Array.isArray(value.path)) {
      value.path = [value.path]
    }

    const name: string = value?.name || key
    const path: string[] = value?.path || [key]

    result.set(name, {name, path})
  }

  return result
}

export function readParams(): Readonly<Params> {
  return {
    modules: readModules()
  }
}
