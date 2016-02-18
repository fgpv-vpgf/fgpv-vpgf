# Contributing

Most of this document is the same as what is found in the
[viewer repository guidelines](https://github.com/fgpv-vpgf/fgpv-vpgf/blob/master/CONTRIBUTING.md).
The differences are listed below.

## Testing

Karma is not used for testing.  Who needs a DOM simulator when you are working
with clean npm style Javascript modules?  Jasmine is used to keep consistency
between testing environments.

## Commit Scopes

The viewer commit scopes do not apply to this project, instead use top level module
names for commit scopes.  Currently:

- attribute
- basemap
- core (use this in place of index)
- events
- layer
- mapManager
- shared
