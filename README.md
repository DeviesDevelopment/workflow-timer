# workflow-timer

Workflow-timer is a GitHub action that measures the duration of a workflow and
compares it to the duration of historical runs.

The action should be triggered on `pull_request` hence it will create a comment
on the PR with information like:

`🕒 Workflow "Unit tests" took 22.056s which is a decrease with 6.944s (23.94%) compared to latest run on main.`

The purpose of this action is to make the developer aware of when feedbacks
loops get longer. Let's say that you are running unit tests as part of your
current workflow. If merging your changes (your PR) would increase the time it
takes to run the unit tests by 50%, your changes probably have unwanted side
effects. It's about creating awareness for the developer.

## How to use it

As the **very last job** in your workflow, add

```yml
- name: Time reporter
  uses: DeviesDevelopment/workflow-timer@v0.0.4
```

Workflow-timer compares the current workflow run with the latest run on another branch (typically your default branch).
Therefore, the same workflow needs to run when merging with that other branch as well, otherwise, there will be no data to compare.
We suggest having the following definition in the workflow:

```yml
on:
  push:
    branches: main
  pull_request:
    branches: main
```

If workflow-timer is used in a private repository, additional permissions are
required. Add the following permissions to the workflow:

```yml
permissions:
  actions: read
  pull-requests: write
```

### Setting a custom branch to compare with

If you use a different branch than `main` as your default branch, you can specify what branch to compare with.

```yml
- name: Time reporter
  uses: DeviesDevelopment/workflow-timer@v0.0.4
  with:
    compareBranch: 'your-branch-name'
```

## How to contribute

Feel free to open a pull request! All contributions, no matter how small, are
more than welcome. Happy hacking!
