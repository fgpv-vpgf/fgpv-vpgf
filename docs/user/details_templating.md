The viewer allows you to display identify/details results with a custom template.

There are 2 config attributes that are needed:

**templateUrl** is needed for any type of layer that wants a template, this is an *absolute* path to your template.

**parserUrl** is needed for layers that return HTML/text responses as those cannot be handled in a general way. This is an *absolute* path to your parser file.


###Templates:

The templates are *AngularJS* templates, which means they can use any angular functionality.
The most useful one is variable binding which looks like: `{{ variable }}`

The data for feature layers will be given to you on `self.layer`, so lets say you want to have a header that has the `Country` field.

Your template would include `<h1>{{ self.layer['Country'] }}</h1>`

###Parsers:

These are plain Javascript functions of the form
```
function(*data*){
    //...use data
    return *objectMadeFromData*
}
```

The function should expect the data in the form of a string, and whatever your function returns will be given to you on `self.layer` to use in your template.