# workflow-timer

Workflow-timer is a GitHub action that measures the duration of the workflow and compares it to the duration of historical runs.

The action should be triggered on `pull_requests` hence it will create a comment on the PR with information like:

`🕒 Workflow "Unit tests" took 22.056s which is a decrease with 6.944s (23.94%) compared to latest run on master/main.`

The purpose of this action is to make the developer aware of when feedbacks loops get longer. Let's say that you are running unit tests as part of your current workflow. If merging your changes (your PR) would increase the time it takes to run the unit tests by 50%, your changes probably have unwanted side effects. It's about creating awareness for the developer.

## How to use it

As the **very last job** in your workflow, add

```yml
- name: Time reporter
  uses: DeviesDevelopment/workflow-timer@v0.0.2
```

Workflow-timer compares the current workflow run with the latest run on the master/main branch. Therefore, the same workflow needs to run when merging with the master as well, otherwise, there will be no data to compare. We suggest having the following definition in the workflow:

```yaml
on:
  push:
    branches: master
  pull_request:
    branches: master
```

## How to contribute

Feel free to open a pull request! All contributions, no matter how small, are more than welcome. Happy hacking!
