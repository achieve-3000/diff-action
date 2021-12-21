# GitHub Action that detects changes between commits

# Usage
```yaml
-
  uses: achieve-3000/diff-action
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

## Dynamic matrix
[See](.github/workflows/diff.yml)

```yaml
jobs:
  diff:
    name: Diff
    runs-on: ubuntu-20.04
    outputs:
      modules: ${{ steps.run.outputs.modules }}
      changed: ${{ steps.run.outputs.changed }}
      diff: ${{ steps.run.outputs.diff }}
      tags: ${{ steps.run.outputs.tags }}
    steps:
    -
      name: Checkout code
      uses: actions/checkout@v2
    -
      uses: achieve-3000/diff-action@main
      id: run
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        modules: |
          src:
            tags: [ts]
          dist:
            tags: [js]
            pattern: dist/*
          workflows:
            pattern:
              - .github/workflows/*
    -
      name: Print output
      run: echo '${{ toJSON(steps.run.outputs) }}'

  print-changes:
    needs: [diff]
    name: Print changes
    runs-on: ubuntu-20.04
    if: ${{ needs.diff.outputs.changed }}
    strategy:
      fail-fast: false
      matrix:
        module: ${{ fromJson(needs.diff.outputs.modules).changes }}
    steps:
    -
      name: Print module
      run: echo '${{ matrix.module }}'
    -
      name: Print diff
      run: echo '${{ toJSON(fromJson(needs.diff.outputs.diff)[matrix.module]) }}'
    -
      name: Print files
      run: echo '${{ toJSON(fromJson(needs.diff.outputs.diff)[matrix.module].files.all) }}'
```