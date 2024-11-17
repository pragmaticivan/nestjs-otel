# Contributing Guide

We'd love your help!

- [Contributing Guide](#contributing-guide)
  - [Development Quick Start](#development-quick-start)
  - [Report a bug or requesting feature](#report-a-bug-or-requesting-feature)
  - [How to contribute](#how-to-contribute)
      - [Conventional commit](#conventional-commit)
    - [Fork](#fork)

## Development Quick Start

To get the project started quickly, you can follow these steps. For more
detailed instructions, see [development](#development) below.

```sh
git clone https://github.com/pragmaticivan/nestjs-otel.git
cd nestjs-otel
npm ci
npm run test
```

## Report a bug or requesting feature

Reporting bugs is an important contribution. Please make sure to include:

- expected and actual behavior.
- Node version that application is running.
- OpenTelemetry version that application is using.
- if possible - repro application and steps to reproduce.

## How to contribute

#### Conventional commit

The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history; which makes it easier to write automated tools on top of. This convention dovetails with SemVer, by describing the features, fixes, and breaking changes made in commit messages. You can see examples [here](https://www.conventionalcommits.org/en/v1.0.0-beta.4/#examples).
We use [commitlint](https://github.com/conventional-changelog/commitlint) and [husky](https://github.com/typicode/husky) to prevent bad commit message.
For example, you want to submit the following commit message `git commit -s -am "my bad commit"`.
You will receive the following error :

```text
✖   type must be one of [ci, feat, fix, docs, style, refactor, perf, test, revert, chore] [type-enum]
```

Here an example that will pass the verification: `git commit -s -am "chore(opentelemetry): update deps"`

### Fork

In the interest of keeping this repository clean and manageable, you should work from a fork. To create a fork, click the 'Fork' button at the top of the repository, then clone the fork locally using `git clone git@github.com:USERNAME/nestjs-otel.git`.

You should also add this repository as an "upstream" repo to your local copy, in order to keep it up to date. You can add this as a remote like so:

```sh
git remote add upstream https://github.com/pragmaticivan/nestjs-otel.git

#verify that the upstream exists
git remote -v
```

To update your fork, fetch the upstream repo's branches and commits, then merge your main with upstream's main:

```sh
git fetch upstream
git checkout main
git merge upstream/main
```

Remember to always work in a branch of your local copy, as you might otherwise have to contend with conflicts in main.
