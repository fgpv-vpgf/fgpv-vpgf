<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta content="width=device-width,initial-scale=1" name="viewport">
    <title>title</title>

    <style>
        .myMap {
            height: 100%;
        }
    </style>

    <% for (var index in htmlWebpackPlugin.files.css) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"/>
        <% } else { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
        <% } %>
    <% } %>
</head>

<!-- rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-keys='["Airports"]' -->

<body>
    <div class="myMap" id="theme-map" is="rv-map"
        rv-config="config/config-sample-60.json"
        rv-langs='["en-CA", "fr-CA"]'
        rv-wait="true"
        rv-restore-bookmark="bookmark">
         <noscript>
            <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

            <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
        </noscript>
    </div>

    <script src="https://code.jquery.com/jquery-3.3.1.js"></script>

    <script>
        var needIePolyfills = [
            'Promise' in window,
            'TextDecoder' in window,
            'findIndex' in Array.prototype,
            'find' in Array.prototype,
            'from' in Array,
            'startsWith' in String.prototype,
            'endsWith' in String.prototype,
            'outerHTML' in SVGElement.prototype
        ].some(function(x) { return !x; });
        if (needIePolyfills) {
            // NOTE: this is the only correct way of injecting scripts into a page and have it execute before loading/executing any other scripts after this point (ie polyfills must be executed before the bootstrap)
            // more info on script loading: https://www.html5rocks.com/en/tutorials/speed/script-loading/
            document.write('<script src="../ie-polyfills.js"><\/script>');
        }
    </script>

    <% for (var index in htmlWebpackPlugin.files.js) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>" integrity="<%= htmlWebpackPlugin.files.jsIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"></script>
        <% } else { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>"></script>
        <% } %>
    <% } %>

    <script>
        // https://css-tricks.com/snippets/javascript/get-url-variables/
        function getQueryVariable(variable)
        {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i=0;i<vars.length;i++) {
                    var pair = vars[i].split("=");
                    if(pair[0] == variable){return pair[1];}
            }
            return(false);
        }

        // plugins
        const baseUrl = window.location.href.split('?')[0] + '?keys={RV_LAYER_LIST}';
        RV.getMap('theme-map').registerPlugin(RV.Plugins.BackToCart, 'backToCart', baseUrl);
        RV.getMap('theme-map').registerPlugin(RV.Plugins.CoordInfo, 'coordInfo');

        function bookmark(){
            return new Promise(function (resolve) {
                var thing = getQueryVariable("rv");
                console.log(thing);
                resolve(thing);
            });
        }

        function queryStringToJSON(q) {
            var pairs = q.search.slice(1).split('&');
            var result = {};
            pairs.forEach(function(pair) {
                pair = pair.split('=');
                result[pair[0]] = decodeURIComponent(pair[1] || '');
            });
            return JSON.parse(JSON.stringify(result));
        }
        // grab & process the url
        var queryStr = queryStringToJSON(document.location);
        var keys = queryStr.keys;
        if (keys) {
            // turn keys into an array, pass them to the map
            var keysArr = keys.split(',');
            RV.getMap('theme-map').restoreSession(keysArr);
        } else {
            var bookmark = queryStr.rv;
            // console.log(bookmark);
            RV.getMap('theme-map').initialBookmark(bookmark);
        }
    </script>
</body>

</html>
