# GitHub Action that detects changes between commits

# Usage
```yaml
-
  uses: achieve3000/diff-action
  with:
    # Base commit ref (Defaults to current base commit)
    base_ref: ''
    # Head commit ref (Defaults to current head commit)
    head_ref: ''
    # Repo name (Defaults to current repo)
    repo_name: ''
    # Repo owner (Defaults to current repo owner)
    repo_owner: ''
    # GH token
    token: ${{ secrets.GITHUB_TOKEN }}
    # YAML containing modules to track
    modules: '---'
```

Run from private repo
```yaml
jobs:
    # ...
    steps:
    -
      name: Checkout Action
      uses: actions/checkout@v2
      with:
        repository: achieve3000/diff-action
        path: ./.temp/diff-action
        token: ${{ secrets.CI_PAT }}
        clean: true
        ref: main
    -
      name: Diff Action
      uses: ./.temp/diff-action
      with:
        modules: |
          my-service-api:
          my-service-worker:
          terraform:
            pattern: infra/terraform/*
          kubernetes:
            pattern: infra/kubernetes/*
```