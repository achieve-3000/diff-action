import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import {Module, Params} from './models'
import {context} from '@actions/github'

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

function getModules(): Map<string, Module> {
  const input = getYamlInput<Map<string, Object>>('modules') || {}
  const entries = Object.entries(input)
  const result = new Map()

  for (const [key, value] of entries) {
    if (value?.pattern && !Array.isArray(value.pattern)) {
      value.pattern = [value.pattern]
    }

    const name: string = value?.name || key
    const pattern: string[] = value?.pattern || [`${key}/*`]

    result.set(name, {name, pattern})
  }

  return result
}

function getDiffRef(): [string, string] {
  if (context.eventName === 'pull_request') {
    return [context.payload.pull_request?.base?.sha, context.payload.pull_request?.head?.sha]
  }

  if (context.eventName === 'push') {
    return [context.payload.before, context.payload.after]
  }

  core.setFailed(`Unsupported event ${context.eventName}.`)

  return ['HEAD', 'HEAD']
}

function getBaseRef(): string {
  return getInput('base_ref', getDiffRef()[0])
}

function getHeadRef(): string {
  return getInput('head_ref', getDiffRef()[1])
}

function getRepoName(): string {
  return getInput('repo_name', context.repo.repo)
}

function getRepoOwner(): string {
  return getInput('repo_owner', context.repo.owner)
}

function getToken(): string {
  return core.getInput('token', {required: true})
}

export function readParams(): Readonly<Params> {
  return {
    token: getToken(),
    modules: getModules(),
    base_ref: getBaseRef(),
    head_ref: getHeadRef(),
    repo_name: getRepoName(),
    repo_owner: getRepoOwner()
  }
}
