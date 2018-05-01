# Contributing

 - [Workflow](#workflow)
 - [Testing](#testing)
 - [Commit Guidelines](#commit)
 - [Commit Scopes](#commit-scopes)

## <a name="workflow"></a> Workflow

We use a fork and pull model for development using GitHub pull requests.  To add a new feature please fork the respository and open a pull request to the `#develop` branch.  All pull requests will be reviewed on [reviewable.io](https://reviewable.io/).

## <a name="testing"></a> Testing

We are using Karma for unit testing and protractor for integration tests.  Code accompanied by unit tests is far more likely to be merged.  We do not have any firm coverage goals at the moment but we should be trying to write unit tests wherever possible.  Any PRs which affect code but do not include unit tests should address why no unit tests were added in the PR comments or gitter before initiating the PR.

Unit tests should not be hard to run, please run them locally before pushing to GitHub.  Although we do have travis integration it should be used primarily for integration tests and as a double check for unit tests.

## <a name="docs"></a> Documentation

We are using dgeni for all project documentation.  All code should be kept up to date with appropriate *jsdoc* markup for automatic API doc generation.  Any complex code changes or user facing changes should also be accompanied by supplemental documentation and diagrams where possible.

## <a name="commit"></a> Git Commit Guidelines

> These guidelines are derived from [Angular Contribution Guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#-git-commit-guidelines).

We have very precise rules over how our git commit messages can be formatted.  This leads to **more
readable messages** that are easy to follow when looking through the **project history**.  But also, we use the git commit messages to **generate the changelog**.

### Commit Message Format
Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Any line of the commit message cannot be longer 100 characters! This allows the message to be easier
to read on github as well as in various git tools.

### Type
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

### Scope
The scope could be anything specifying place of the commit change. For example `geoLocator`,
`geoSearch`, `sets`, `data`, `rmBasemap`, `rmNavigation`, `rmExport`, etc...

### Subject
The subject contains succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize first letter
* no dot (.) at the end

### Body
Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes"
The body should include the motivation for the change and contrast this with previous behavior.

### Footer
The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.

#### Breaking Changes
All breaking changes have to be mentioned in footer with the description of the change, justification and migration notes

```
	BREAKING CHANGE: isolate scope bindings definition has changed and
	    the inject option for the directive controller injection was removed.

	    To migrate the code follow the example below:

	    Before:

	    scope: {
	      myAttr: 'attribute',
	      myBind: 'bind',
	      myExpression: 'expression',
	      myEval: 'evaluate',
	      myAccessor: 'accessor'
	    }

	    After:

	    scope: {
	      myAttr: '@',
	      myBind: '@',
	      myExpression: '&',
	      // myEval - usually not useful, but in cases where the expression is assignable, you can use '='
	      myAccessor: '=' // in directive's template change myAccessor() to myAccessor
	    }

	    The removed `inject` wasn't generaly useful for directives so there should be no code using it.
```

#### Closes
Closed bugs should be listed on a separate line in the footer prefixed with `Closes`, `Fixes` or `Resolves` (notice capital letters) keyword like this:

```
Closes #234
```

or in case of multiple issues:

```
Closes #123, #245, #992
```

###Examples

```
chore(queryToggle): revert config

reset query toggle to default (show:true) in dev config
```

```
fix(datagrid): fix full-data transition in IE*

IE is so slow, it can't pick up nodes created by WET scripts when creating timelines,
so it won't animate side panel tab nodes.
Do not create this timeline if you can't find nodes; check if the timeline has 0 duration
just before the transition; if so, recreate the timeline.

Closes #8149
```

```
docs(help): entry for user added layers
```

```
chore(grunt): move task options to separate files

Tasks moved: uglify, json-minify, imagemin, htmlmin, cssmin, concat
Will be used with load-grunt-config.

Resolves #1234
```

```
docs(help): update dataset section

Closes #8223
```

## <a name="commit-scopes"></a> Commit Scopes

With respect to the git commit guidelines above, the following scopes should be used for `feat` and `fix` types:

- 😾 or :pouting_cat: (formerly ui)
- 🍱 or :bento: (formerly layout)
- 💾 or :floppy_disk: (formerly data)
- 💩 or :neckbeard: (formerly common)
- 🔮 or :globe_with_meridians: (formerly geo)
- 🍩 or :doughnut: (formerly core)
- ⛄️ (intention)

For the remaining types the above list should be used wherever possible, but we include some additions:

- :tractor: (formerly build)
- :shipit: (formerly release)
- :toilet: (formerly libs)
