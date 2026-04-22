# Contributing Guide

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

## Translations

The viewer can support multiple languages. It allows the user to switch languages at any time from the left side menu. We currently support both English and French. Use this guide to understand how to add, remove, or change language translations as well as how to use these translations in your code.

We use the [Angular Translate](https://angular-translate.github.io/) library.

### translations.csv

The translations file is located in `src/locales/translations.csv`. This file contains the translations for all languages for every viewer component. Each line in this file has the structure:

`Description, translation key, language 1[, language 2, ...]`

**Description** is merely a short sentence about where this translation is being used. This helps to quickly identify translations to their usage.

**Translation Key** is string identifier that we'll use later in this guide to tell the translation service to fetch this particular translation. It contains no spaces and it can contain a period (`.`) to organize translations into groupings.

**Language 1** is required, it is the default language. After this you can add 0 or more languages.

Here is a sample translation file with 2 translations in three languages:

```csv
Hello World div content, helloworld.div.content, Hello World, Bonjour Monde, El polo loco
Button label for Hello World, helloworld.button.label, Yes, Oui, Si
```

The general structure should now be clear; Each line of this file contains all language translations for one particular translation key.

### Adding a language

Lets assume we want to add a third language, Spanish. First, let's locate the translation file in `src/locales/translations.csv`. For every line in this file we must append the Spanish translation to the end. So, for example, if one line in the file is currently:

```csv
Button label for Hello World, helloworld.button.label, Yes, Oui
```

Then we'll change this to:

```csv
Button label for Hello World, helloworld.button.label, Yes, Oui, Si
```

Now on the host page code, such as `index.html`, we have to locate the viewer element and append the new language. Here is a partial view of what that would look like:

```html
<div class="fgpv" is="rv-map" rv-langs='["en-CA", "fr-CA", "es-ES"]'
```

### Removing a language

Removing a language has a similar process to adding a language. On the host page code, such as `index.html`, we have to locate the viewer element and remove the language we no longer want. We can also remove the translations from `src/locales/translations.csv`, one per line.


### Updating a language

Find the line in `src/locales/translations.csv` that contains the translation you want to change and make the modifications needed. That's it!

### Using translations

You should refer to the [Angular Translate](https://angular-translate.github.io/) library documentation for a complete guide. Here we'll go through two simple use cases:
- Getting a translation with JavaScript
- Using a translation in an HTML template

#### Getting a translation with JavaScript

Make sure the `$translate` service is available in your directive or service then try `const myTranslation = $translate.instant('helloworld.div.content');` We saw in an above example that `helloworld.div.content` is a translation key, so we are providing that to the `$translate` service. This service will return the appropriate language as selected by the user.

#### Using a translation in an HTML template

Inside your angular template simply write `{{ helloworld.div.content | translate }}` and it will be replaced by the appropriate language as selected by the user.

## Meta Documentation

We are using [jsdoc](http://usejsdoc.org/) for documenting the viewer and the geoapi library.

Documentation blocks for jsdoc should start with `/**` and generally follow the javadoc format and markup style:

```text
/**
 * Main function description.
 * @function functionName
 * @return {Object} random variable
 */
```

The following is a quick reference of useful markup tags.
- [@class](http://usejsdoc.org/tags-class.html)
- [@function](http://usejsdoc.org/tags-function.html)
- [@global](http://usejsdoc.org/tags-global.html)
- [@member](http://usejsdoc.org/tags-member.html)
- [@memberof](http://usejsdoc.org/tags-memberof.html)
- [@module](http://usejsdoc.org/tags-module.html)
- [@namespace](http://usejsdoc.org/tags-namespace.html)
- [@param](http://usejsdoc.org/tags-param.html)
- [@private](http://usejsdoc.org/tags-private.html)
- [@return](http://usejsdoc.org/tags-returns.html)

### Documenting Services

All services in Angular should be linked to modules.  In jsdoc we tag the service as `@module` and the module as `@namespace` (this is confusing, but it seems to work best with the doc output).

- `@memberof` should reference the angular module (`@namespace` in jsdoc)
- Markdown can be used within the description section

### Documenting Directives

Ideally angular directives would be listed separately from services.  Unfortunately all angular specific doc tools seem to break and lack documentation.  As such we are using the same structure for modules; however, if it becomes possible to easily separate them in the future we would like to do so.

#### Directive Sample

```js
    /**
     * @module rvShell
     * @memberof app.layout
     * @restrict E
     * @description
     *
     * The `ShellController` controller handles the shell which is the visible part of the layout.
     * `self.isLoading` is initially `true` and causes the loading overlay to be displayed; when `configService` resolves, it's set to `false` and the loading overly is removed.
     */
```

- `@restrict` is left over from our earlier attempt to document directives, it can remain in place and will be ignored by jsdoc

### Documenting Functions

Javascript allows functions to be defined in a variety of ways.  In the context of a service or directive the function will automatically be linked as long as the `@module` tag is declared on the top level item.

#### Function Sample

```js
        /**
         * Add RCS config layers to configuration after startup has finished
         * @function rcsAddKeys
         * @param {Array}  keys    list of keys marking which layers to retrieve
         * @return {Promise} promise of full config nodes for newly added layers
         */
```

- `@function` can be omitted for `@class` contexts, the parser is smart enough to figure that out, `@function` should be used everywhere else
- if documenting a `Promise` describe the type which it will resolve with (simply knowing that you get back a promise is not very helpful)
- `@private` can be used to document functions which are not exposed by the service, directive or class being documented
