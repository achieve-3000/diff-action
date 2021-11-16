import * as core from '@actions/core'
import {DiffEntry, Module, Params, Result} from './models'

import {getOctokit} from '@actions/github'
import {GitHub} from '@actions/github/lib/utils'

/* eslint-disable import/named */
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'
import micromatch from 'micromatch'
/* eslint-enable import/named */

type CompareCommitsParameters = RestEndpointMethodTypes['repos']['compareCommits']['parameters']
type CompareCommitsResponse = RestEndpointMethodTypes['repos']['compareCommits']['response']
type CompareCommitsDataDiff = CompareCommitsResponse['data']['files']

export class GithubAdapter {
  params: Params
  octokit: InstanceType<typeof GitHub>

  constructor(params: Params, octokit: InstanceType<typeof GitHub> | undefined = undefined) {
    this.params = params
    this.octokit = octokit || getOctokit(params.token)
  }

  private async compareCommits(): Promise<CompareCommitsDataDiff> {
    const params: CompareCommitsParameters = {
      owner: this.params.repo_owner,
      repo: this.params.repo_name,
      head: this.params.head_ref,
      base: this.params.base_ref
    }

    const result: CompareCommitsResponse = await this.octokit.rest.repos.compareCommits(params)
    const files = result.data.files

    return files
  }

  private isMatch(module: Module, filename: string): boolean {
    return micromatch.isMatch(filename, module.pattern)
  }

  compareModule(module: Module, dataDiff: CompareCommitsDataDiff): DiffEntry {
    const files = dataDiff || []
    const entry: Map<string, string[]> = new Map([
      ['all', []],
      ['added', []],
      ['removed', []],
      ['renamed', []],
      ['modified', []]
    ])

    for (const file of files) {
      if (!entry.has(file.status)) {
        core.setFailed(`Unknown file status '${file.status}'.`)
        continue
      }

      if (!this.isMatch(module, file.filename)) {
        continue
      }

      entry.get('all')?.push(file.filename)
      entry.get(file.status)?.push(file.filename)
    }

    const all = entry.get('all') || []
    const added = entry.get('added') || []
    const removed = entry.get('removed') || []
    const renamed = entry.get('renamed') || []
    const modified = entry.get('modified') || []

    return {
      changed: all.length > 0,
      files: {
        all,
        added,
        removed,
        renamed,
        modified
      }
    }
  }

  async compareModules(modules: Map<string, Module>): Promise<Map<string, DiffEntry>> {
    const diff = await this.compareCommits()
    const result = new Map()

    for (const [key, val] of modules) {
      result.set(key, this.compareModule(val, diff))
    }

    return new Map(result)
  }

  async compare(): Promise<Result> {
    return {
      modules: await this.compareModules(this.params.modules)
    }
  }
}
