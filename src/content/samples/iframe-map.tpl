<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta content="width=device-width,initial-scale=1" name="viewport">
    <title>Test Samples - RAMP2 Viewer</title>

    <% for (var index in htmlWebpackPlugin.files.css) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"/>
        <% } else { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
        <% } %>
    <% } %>

    <style>
        body {
            display: flex;
            flex-direction: column;
        }



        .myMap {
            height: 100%;
        }
    </style>

</head>

<body>
<div id="fgpmap" is="rv-map" class="myMap" data-rv-config="config/config-sample-01-structured-visibility-sets.json" data-rv-langs='["en-CA"]' data-rv-service-endpoint="http://section917.cloudapp.net:8000/" data-rv-keys=''>
    <noscript>
        <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

        <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
    </noscript>
</div>

<script>
        // credit: http://stackoverflow.com/a/21903119
        function getUrlParameter(sParam) {
            var sPageURL = decodeURIComponent(window.location.search.substring(1)),
                sURLVariables = sPageURL.split('&'),
                sParameterName,
                i;

            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('=');

                if (sParameterName[0] === sParam) {
                    return sParameterName[1] === undefined ? true : sParameterName[1];
                }
            }
        }

        var testConfig = getUrlParameter('config');
        if (testConfig) {
            document.getElementById("fgpmap").setAttribute("rv-config", testConfig);
        }
    </script>

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

        const baseUrl = window.location.href.split('?')[0] + '?keys={RV_LAYER_LIST}';
        RV.getMap('fgpmap').registerPlugin(RV.Plugins.BackToCart, 'backToCart', baseUrl);
        RV.getMap('fgpmap').registerPlugin(RV.Plugins.CoordInfo, 'coordInfo');

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
            RV.getMap('fgpmap').restoreSession(keysArr);
        } else {
            var bookmark = queryStr.rv;
            // console.log(bookmark);
            RV.getMap('fgpmap').initialBookmark(bookmark);
        }

        function getBookmark(){
            RV.getMap('fgpmap').getBookmark().then(function (bookmark) {
                document.getElementById("bookmarkDisplay").value = window.location.href.split('?')[0] + '?rv=' + String(bookmark);
            });
        }
        function testBackToCart() {
            const map = RV.getMap('fgpmap');

            map.getBookmark()
                .then(function (bookmark) {
                    sessionStorage.setItem('fgpmap', bookmark);
                    return map.getRcsLayerIDs();
                })
                .then(function (keys) {
                    window.location.href = window.location.href.split('?')[0] + '?keys=' + keys.toString();
                });
        }
    </script>
</body>
</html>
