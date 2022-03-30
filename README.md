# workflow-timer

**This project is WIP and not ready to use yet.**

Workflow-timer is a GitHub action that measures the duration of the workflow and compares it to the duration of historical runs.

The action should be triggered on `pull_requests` hence it will create a comment on the PR with information like:

`The workflow <workflow> took <x> seconds to run which is an increase/decrease with <y> %`

The purpose of this action is to make the developer aware of when feedbacks loops get longer. Let's say that you are running unit tests as part of your current workflow. If merging your changes (your PR) would increase the time it takes to run the unit tests by 50%, your changes probably have unwanted side effects. It's about creating awareness for the developer.

## How to use it

As the **very last job** in your workflow, add

```yml
- name: Time reporter
  uses: DeviesDevelopment/workflow-timer@master
```

## How does it work?

TODO






 



