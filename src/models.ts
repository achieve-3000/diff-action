export interface Module {
  name: string
  path: string[]
}

export interface Params {
  modules: Map<string, Module>
}

export interface Diff {
  changed: boolean
}

export interface Result {
  modules: Map<string, Diff>
}
