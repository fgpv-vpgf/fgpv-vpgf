<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta content="width=device-width,initial-scale=1" name="viewport">
    <title>Test Samples - RAMP2 Viewer</title>

    <style>
        body {
            display: flex;
            flex-direction: column;
        }

        .myMap {
            height: 100%;
        }

        #header {
            width: 100%;
            background: linear-gradient(#CFD8DC, #FFFFFF);
        }

        #hideShow {
            position: absolute;
            width: 150px;
            right: 45%;
            z-index: 100;
            top: 48px;
            padding: 0;
        }

        .fade {
            opacity: 0.5;
            transition: opacity .25s ease-in-out;
        }

        .fade:hover {
            opacity: 1;
        }

        .chevron::before {
            border-style: solid;
            border-width: 0.25em 0.25em 0 0;
            content: '';
            display: inline-block;
            height: 0.45em;
            position: relative;
            top: 0.45em;
            transform: rotate(-45deg);
            vertical-align: top;
            width: 0.45em;
        }

        .chevron.bottom:before {
            top: 0.15em;
            transform: rotate(135deg);
        }

        .row {
            margin: 10px;
        }

        .tool {
            width: 100%;
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
    <section id="header">
        <div class="row">
            <select id="selectConfig" class="tool">
                <option value="config/config-BC-Critical-Habitat.json">BC Critical Habitat</option>
            </select>
        </div>
    </section>

    <button id="hideShow" class="chevron top fade" type="button"></button>

    <div class="myMap" id="mobile-map" is="rv-map"
        rv-config="config/config-BC-Critical-Habitat.json"
        rv-langs='["en-CA", "fr-CA"]'
        rv-restore-bookmark="bookmark">
         <noscript>
            <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

            <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
        </noscript>
    </div>

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
        document.getElementById('selectConfig').addEventListener("change", changeConfig);
        document.getElementById('hideShow').addEventListener("click", hide);

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
        RV.getMap('mobile-map').registerPlugin(RV.Plugins.BackToCart, 'backToCart', baseUrl);
        RV.getMap('mobile-map').registerPlugin(RV.Plugins.CoordInfo, 'coordInfo');

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
            RV.getMap('mobile-map').restoreSession(keysArr);
        } else {
            const bookmark = queryStr.rv;

            // update the config values if needed
            var previouslySelectedConfig = sessionStorage.getItem('sampleConfig');
            if (previouslySelectedConfig) {
                document.getElementById('mobile-map').setAttribute('rv-config', previouslySelectedConfig);
                document.getElementById('selectConfig').value = previouslySelectedConfig;
            } else {
                const currentConfig = document.getElementById('mobile-map').getAttribute('rv-config');
                sessionStorage.setItem('sampleConfig', currentConfig);
            }
        }

        function hide() {
            if (document.getElementById("header").style.display === "none") {
                document.getElementById("header").style.display = "block";
                document.getElementById("hideShow").classList.remove('bottom');
                document.getElementById("hideShow").classList.add('top');
                document.getElementById("hideShow").style.top = ('48px');
            } else {
                document.getElementById("header").style.display = "none";
                document.getElementById("hideShow").classList.remove('top');
                document.getElementById("hideShow").classList.add('bottom');
                document.getElementById("hideShow").style.top = ('0px');
            }
        }

        // change and load the new config
        function changeConfig() {
            var selectedConfig = document.getElementById('selectConfig').value;
            document.getElementById('mobile-map').setAttribute('rv-config', selectedConfig);
            RV.getMap('mobile-map').reInitialize();
            sessionStorage.setItem('sampleConfig', selectedConfig);
        }
    </script>
</body>

</html>
