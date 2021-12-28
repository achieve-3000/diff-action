import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import {Module, Params} from './models'
import {context} from '@actions/github'

function getInput(name: string, defaultValue = ''): string {
  return core.getInput(name) || defaultValue
}

function getYamlInput(name: string): Map<string, Object> {
  const input = getInput(name)

  try {
    const values = yaml.load(input) as Object
    const entries = Object.entries(values)

    return new Map(entries)
  } catch (e) {
    core.error(`Failed to parse yaml input ${name}:'${input}'`)
    throw e
  }
}

function getYamlFile(config: string): Map<string, Object> {
  const input = fs.readFileSync(config, 'utf8')

  try {
    const values = yaml.load(input) as Object
    const entries = Object.entries(values)

    return new Map(entries)
  } catch (e) {
    core.error(`Failed to read yaml file ${config}:'${input}'`)
    throw e
  }
}

function getModulesMap(): Map<string, Object> {
  const config = getInput('config', '')
  const isFile = config ? fs.lstatSync(config).isFile() : false

  if (config && !isFile) {
    core.error(`Invalid config file '${config}'`)
  }

  if (!config) {
    return getYamlInput('modules')
  }

  const values = getYamlFile(config)
  const modules = values.get('modules') || {}
  const result = new Map(Object.entries(modules))

  return result
}

function getModules(): Map<string, Module> {
  const result = new Map()
  const modules = getModulesMap()

  for (const key of modules.keys()) {
    const entry = modules.get(key) || {}
    const value = new Map(Object.entries(entry))

    if (value.has('pattern') && !Array.isArray(value.get('pattern'))) {
      value.set('pattern', [value.get('pattern')])
    }

    const name: string = value.get('name') || key
    const tags: string[] = value.get('tags') || []
    const pattern: string[] = value.get('pattern') || [`${key}/**`]

    result.set(name, {name, tags, pattern})
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
