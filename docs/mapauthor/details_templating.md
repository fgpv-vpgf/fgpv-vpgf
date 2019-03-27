# Details Templating

The viewer allows you to display identify/details results with a custom template.

The related config options, these are specified on a layer:

**details** an object containing two properties:

**template** is needed for any type of layer that wants a template, this path can be *relative* to the site (or *absolute*).

**parser** is needed for layers that return HTML/text responses as those cannot be handled in a general way. This path can be *relative* to the site (or *absolute*).

Example:
```json
{
    "id": "abc",
    [...],
    "details" : {
        "template": <path to template>,
        "parser": <path to parser>
    }
}
```


## Templates

The templates are *AngularJS* templates, which means they can use any angular functionality.
The most useful one is variable binding which looks like: `{{ variable }}`

The data for feature layers will be given to you on `self.layer`, so lets say you want to have a header that has the `Country` field.

Your template would include `<h1>{{ self.layer['Country'] }}</h1>`

## Parsers

These are plain Javascript functions of the form
```
function(*data*, *lang*){
    //...use data
    return *objectMadeFromData*
}
```

The function should expect the data in the form of a string, and whatever your function returns will be given to you on `self.layer` to use in your template. The current language code is passed to the parser function as the second argument and is also avaialbe on the scope as `self.lang`.