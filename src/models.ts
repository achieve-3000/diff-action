export interface Module {
  name: string
  pattern: string[]
}

export interface Params {
  token: string
  base_ref: string
  head_ref: string
  repo_name: string
  repo_owner: string
  modules: Map<string, Module>
}

export interface DiffEntry {
  changed: boolean
  files: DiffFiles
}

export interface DiffFiles {
  all: string[]
  added: string[]
  removed: string[]
  renamed: string[]
  modified: string[]
}

export interface Result {
  modules: Map<string, DiffEntry>
}
