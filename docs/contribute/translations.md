The viewer can support multiple languages. It allows the user to switch languages at any time from the left side menu. We currently support both English and French. Use this guide to understand how to add, remove, or change language translations as well as how to use these translations in your code.

We use the [Angular Translate](https://angular-translate.github.io/) library.

## translations.csv

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

## Adding a language

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

## Removing a language

Removing a language has a similar process to adding a language. On the host page code, such as `index.html`, we have to locate the viewer element and remove the language we no longer want. We can also remove the translations from `src/locales/translations.csv`, one per line.


## Updating a language

Find the line in `src/locales/translations.csv` that contains the translation you want to change and make the modifications needed. That's it!

## Using translations

You should refer to the [Angular Translate](https://angular-translate.github.io/) library documentation for a complete guide. Here we'll go through two simple use cases:
- Getting a translation with JavaScript
- Using a translation in an HTML template

#### Getting a translation with JavaScript

Make sure the `$translate` service is available in your directive or service then try `const myTranslation = $translate.instant('helloworld.div.content');` We saw in an above example that `helloworld.div.content` is a translation key, so we are providing that to the `$translate` service. This service will return the appropriate language as selected by the user.

#### Using a translation in an HTML template

Inside your angular template simply write `{{ helloworld.div.content | translate }}` and it will be replaced by the appropriate language as selected by the user.
