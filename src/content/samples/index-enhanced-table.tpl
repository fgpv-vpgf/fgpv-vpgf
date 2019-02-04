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
    <script src="./plugins/enhancedTable/enhancedTable.js"></script>
    <link rel="stylesheet" href="./plugins/enhancedTable/enhancedTable.css" />

    <script src="./features/epsg.js"></script>

    <% for (var index in htmlWebpackPlugin.files.css) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"/>
        <% } else { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
        <% } %>
    <% } %>

    <script>
    window.configReader = {
        preInit: function(config={showText: [], title: 'Title not set in config!'}, completeConfig) {
            if (config.run) {
                console.log('configReader: Started with title "' + config.title + '".');
            }
        }
    };
    </script>
</head>

<!-- rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-keys='["Airports"]' -->

<body>
    <div class="myMap" id="feature-map" is="rv-map"
        rv-config="config-enhanced-table.json"
        rv-langs='["en-CA", "fr-CA"]'
        rv-wait="true"
        rv-plugins="enhancedTable,customEPSG,configReader">
         <noscript>
            <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

            <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
        </noscript>
    </div>

    <script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Object.entries,Object.values,Array.prototype.find,Array.prototype.findIndex,Array.prototype.values,Array.prototype.includes,HTMLCanvasElement.prototype.toBlob,String.prototype.repeat,String.prototype.codePointAt,String.fromCodePoint,NodeList.prototype.@@iterator,Promise,Promise.prototype.finally"></script>

    <% for (var index in htmlWebpackPlugin.files.js) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>" integrity="<%= htmlWebpackPlugin.files.jsIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"></script>
        <% } else { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>"></script>
        <% } %>
    <% } %>

    <script>
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

        var bookmark = queryStr.rv;
        console.log(bookmark);
        RV.getMap('feature-map').initialBookmark(bookmark);
    </script>
</body>

</html>
