<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>title</title>
  </head>
<body ng-app="app">
    <!-- Protractor doesn't work well with manually bootstrapped apps, so we have to use ng-app tag and we just use a single app on the page. -->

    <div class="fgpv" rv-config="config.en-CA.json" style="height: 100%;">
        <rv-shell></rv-shell>
    </div>

</body>
</html>
