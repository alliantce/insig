workflow "Basic CI workflow" {
  on = "push"
  resolves = ["Run Tests"]
}

action "Run ESLint" {
  uses = "actions/npm@master"
  args = "lint:js"
}

action "Run Solium" {
  uses = "actions/npm@master"
  args = "lint:sol"
  needs = "Run ESLint"
}

action "Run Tests" {
  uses = "actions/npm@master"
  args = "test"
  needs = "Run Solium"
}