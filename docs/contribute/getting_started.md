# Overview

This guide is intended for JavaScript developers who are interested in contributing to the RAMP code base. You should be comfortable with the source control tool named **Git**, have an account on https://github.com, and possess some basic experience with **npm** and **node**.

We'll outline the tools you'll needed to get started, how to setup and run the project locally, and some useful commands and resources.

## Tools we use

Below is a list of the software you'll need to download and install before continuing:

- A source code editor. We use [Visual Studio Code](https://code.visualstudio.com/), but feel free to use one you're most comfortable with.
- [Git](https://git-scm.com/downloads)

  > A version control system (VCS) for tracking changes in computer files and coordinating work on those files among multiple people.

- [Node.js](https://nodejs.org/en/) v8.9.0+ supported, v10.15.0 current

  > Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world.

## Our work flow

### The fork and pull model

We follow the **fork and pull** model which lets anyone fork an existing repository and push changes to their personal fork without requiring access be granted to the source repository. The changes must then be pulled into the source repository by the project maintainer.

This model reduces the amount of friction for new contributors and is popular with open source projects because it allows people to work independently without upfront coordination. **Pull requests** are especially useful in the Fork & Pull Model because they provide a way to notify project maintainers about changes in your fork.

Further reading: https://help.github.com/en/articles/about-collaborative-development-models

### Git rebase

In Git, there are two main ways to integrate changes from one branch into another: the merge and the rebase. We use **rebase** instead of **merge** since it integrates new changes into one clean timeline.

If you were working from an outdated version of the base branch, your commit history has diverged from the upstream base branch. When you rebase, you are updating your base branch to the latest commit, and then placing your commits on top of that.

<p align="center">
  ![](assets/images/rebase.gif)
</p>

- See: [Git Branching - Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)
- See: [Merging vs. Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)
- See: [A Rebase Workflow for Git](https://randyfay.com/content/rebase-workflow-git)

### Commits

We have precise rules over how git commit messages can be formatted. This leads to **more readable messages** that are easy to follow when looking through the **project history**.

#### Commit message format
Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special format that includes a **type**, **scope** and **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Any line of the commit message cannot be longer 100 characters. This allows the message to be easier to read on github as well as in various git tools.

#### Type
Must be one of the following:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing
  semi-colons, etc)
* **refactor**: A code change that neither fixes a bug or adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation
  generation

#### Scope
The scope could be anything specifying place of the commit change. For example `UI`,
`geoSearch`, `plugin`, `API`, etc...

#### Subject
The subject contains succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize first letter
* no dot (.) at the end

#### Body
Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes"
The body should include the motivation for the change and contrast this with previous behavior.

#### Footer
The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.

## Local setup

Now let's fork the RAMP repo and setup a working local copy.


### Fork the project

Login to your https://github.com account and navigate to https://github.com/fgpv-vpgf/fgpv-vpgf. On this page click on the "Fork" button near the top and follow the on screen prompts to have your own copy of RAMP.

<p align="center">
  ![](assets/images/contribute/github-fork.png)
</p>


### Setup forked repo for development

Now that you have a forked copy of the RAMP repo, we'll set it up on your local machine. Run the following commands in terminal, git bash, or wherever Git and Node are available:

#### Clone the forked repo

```bash
git clone git@github.com:[GITHUB USERNAME]/fgpv-vpgf.git LOCAL/REPO/PATH
cd LOCAL/REPO/PATH
```

Replace **[GITHUB USERNAME]** with your github username and **LOCAL/REPO/PATH** to wherever you'd like to save a copy of the forked repo on your local system. Git will create this path for you if it does not exist.

#### Add remote upstream

```bash
git remote add upstream https://github.com/fgpv-vpgf/fgpv-vpgf.git
```

You'll be **pulling changes from upstream**, but **pushing to origin**.

#### Fetch origin + upstream branches & tags

```bash
git fetch --all
```

#### Checkout + npm install

```bash
git checkout BRANCH
npm i
```

Replace **BRANCH** with whatever branch/tag you'd like to start working with, typically `develop`.

### Run locally

You should test changes you make to the RAMP code base often, on your local machine. To do so run:

```bash
npm run serve
```

Opening your preferred browser, navigate to `http://localhost:6001` to see a full inventory of sample pages and configuration files.

## Useful Commands

|Command|Description|
|---------|----------|
|`npm run build`|Creates local build folder|
|`npm run build -- --env.prod`|Creates local build folder in production mode, including a zipped dist folder|
|`npm run serve`|Runs a local server|
|`npm run serve -- --env.prod`|Runs a local server in production mode|
|`npm run docs && npm run docute`| Generates documentation and starts a local server for viewing them |

## HTTPS

RAMP supports deployments to https production environments. It's important to know that all urls in your configuration file (including any proxies, map printing services, and layer services) must also be https enabled as most browsers block [mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content). If you'd like to host both http and https connections for the same page setup your configuration file for https (https mixed content loaded on http connections is allowed).

### Testing https on localhost

You can locally test RAMP using https by running the `npm run serve -- --env.https`. Navigate to https://localhost:6001/samples/index-https.html. You'll receive a "Your connection is not private" message in chrome since the SSL certificate generated by `webpack-dev-server` is self-signed. For testing purposes this is fine - click on "Advanced" then "Proceed to localhost (unsafe)".