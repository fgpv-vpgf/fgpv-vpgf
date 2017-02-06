Adds a link in the viewers left side menu which, when clicked, returns the user to a catalog. This plugin also saves the viewers state in local storage so that upon their return it is restored automatically.

##### Class Pointer
`RV.Plugins.BackToCart`

##### Extends
{@tutorial menu_item}

##### Required parameters (1)
| Name | Description |
|--------|---|
| `catalogURL` | a string URL to the catalog. The string may contain `{RV_LAYER_LIST}` which will be replaced with a comma separated list of layers |