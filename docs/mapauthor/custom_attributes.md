The following attributes are defined on the application's DOM node (e.g. `<div is="rv-map"></div>`).

**rv-langs** (example: `data-rv-langs='["en-CA", "fr-CA"]'`)
> An array of strings containing language codes which are available for configuration

**rv-config** (Multiple methods to specify config)

  (example: `data-rv-config="config.${lang}.json"`)
> Either a global variable structured with one key per language, and an object under each key representing the full configuration or a relative URL to a configuration file, it should contain the token `${lang}` which will be replaced by the currently configured language code

  (example: `window.config={ ... }` and `data-rv-config="config"`)
> Set the attribute as the name of the property added on the window object. Set the window object to the full configuration. For example, if `window.config` is set as the configuration, then `data-rv-config="config"`. NOTE: No quotations around the object

  (example: `data-rv-config='{ ... }'`)
> Set the attribute as a single line JSON object. NOTE: Must have single quotation around the object

**rv-service-endpoint** (example: `data-rv-service-endpoint="http://section917.cloudapp.net:8000/"`)
> A URL pointing to an RCS instance

**rv-keys** (example: `data-rv-keys='["Airports"]'`)
> An array of string representing keys to be retrieved from the RCS

**rv-restore-bookmark** (example: `data-rv-restore-bookmark="bookmark"`)
> Appearantly, some attributes prefer an air of mistery surrounding them

**rv-wait** (example: `data-rv-wait="true"`)
> Required if the viewer accepts a bookmark. The viewer then waits for either a url bookmark or until it confirms no bookmark is present.


Note that in the examples, all attributes are prefixed with `data-`; although not strictly necessary, this allows your HTML to pass HTML validation.