So you've written some code, tested it, and pushed it to your forked repo. Now what? Maybe you haven't even gotten this far. Fear not, this guide will get you on the right path to sharing your work with this project. Before you continue with this guide, you should have a basic understanding of two important concepts we follow:

### 1. Git Rebase
  > Reapply commits on top of another base tip.

  > We use `git rebase` to integrate new changes into our code. It modifies the commit history into one clean timeline. If you were working from an old version of the develop branch, your commit history has essentially diverged from develop. When you rebase, you are updating your develop branch to the latest version, and then putting your commits on top of that. 
We usually rebase on top of our develop branch using `git rebase upstream/develop`

  ![](./images/rebase.gif)
  - See: [Git Branching - Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)
  - See: [Merging vs. Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)
  - See: [A Rebase Workflow for Git](https://randyfay.com/content/rebase-workflow-git)

### 2. The fork and pull model

  > The Fork & Pull Model lets anyone fork an existing repository and push changes to their personal fork without requiring access be granted to the source repository. The changes must then be pulled into the source repository by the project maintainer. This model reduces the amount of friction for new contributors and is popular with open source projects because it allows people to work independently without upfront coordination. [...] Pull requests are especially useful in the Fork & Pull Model because they provide a way to notify project maintainers about changes in your fork.


## Workflow Example - Making a new branch
Let's start from the beginning. You found a nasty bug in `src/app/bootstrap.js` and know how to fix it. The first thing we should do is open git bash and change our working directory to our local copy of the project as explained in the {@tutorial getting_started} guide. 

All branches we create should be based off the `develop` branch. This isn't entirely true, but for this guide it is. See our {@tutorial branching} guide for a more detailed lesson. Since the `develop` branch updates frequently, we can avoid rebase trouble if we update `develop` first.

```sh
git checkout develop
git pull --ff-only upstream develop
```

Now that we are on the up-to-date develop branch we can branch off into our own:

```sh
git checkout -b my-bootstrap-fix
```

At this point you can modify `src/app/bootstrap.js` with your fix and test then commit the change.

```sh
gulp test
git commit -am 'fix(ui): I fixed bootstrap!'
git push origin my-bootstrap-fix
```

At this point you can open a pull request with this project, and if your code is accepted it will be merged.


## Workflow Example - Making changes to an existing branch

It turns out the code we wrote for `src/app/bootstrap.js` is a horrible mess. We've received some code reviews advising us to make changes and try again. Having made the changes needed we should commit them:

```sh
git commit -a --amend --no-edit
```

Before we push our changes to our forked repo, we need to be sure our current branch `my-bootstrap-fix` is rebased on an up-to-date `develop` branch. 

```sh
git checkout develop
git pull --ff-only upstream develop
git checkout -
git rebase develop
```

Great, now we just test our changes one last time then push them

```sh
gulp test
git push -f origin my-bootstrap-fix
```
