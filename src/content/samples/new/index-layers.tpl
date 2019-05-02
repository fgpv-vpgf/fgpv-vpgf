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

        #bookmarkURL {
            display: inline-block;
            width: 75.5%;
            padding: 0;
        }

        .btn {
            display: inline-block;
            width: 11%;
            float: right;
            margin-left: 1%;
            padding: 0;
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
            width: 10%;
            right: 45%;
            z-index: 100;
            top: 80px;
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
                <option value="NEEDS A CONFIG">01. Layer settings locked/disabled</option>
                <option value="NEEDS A CONFIG">02. Layer types</option>
                <option value="NEEDS A CONFIG">03. Layer customizations</option>
                <option value="NEEDS A CONFIG">04. Dynamic layers</option>
                <option value="NEEDS A CONFIG">05. Not true dynamic layers</option>
            </select>
        </div>

        <div class="row">
            <form class="tool">
                <input id="bookmarkURL" type="text" autocomplete="off">
                <button id="loadButton" class="btn" type="button">Load Bookmark</button>
                <button id="clearButton" class="btn" type="button">Clear</button>
            </form>
        </div>
    </section>

    <button id="hideShow" class="chevron top fade" type="button"></button>

    <div class="myMap" id="sample-map" is="rv-map" ramp-gtm
        rv-config="../config/config-sample-01.json"
        rv-langs='["en-CA", "fr-CA"]'
        rv-restore-bookmark="bookmark"
        rv-service-endpoint="http://section917.cloudapp.net:8000/">
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
        var SAMPLE_KEY = 'sample';
        var currentUrl = new URL(window.location.href);
        document.getElementById('selectConfig').addEventListener("change", changeConfig);
        document.getElementById('loadButton').addEventListener("click", loadBookmark);
        document.getElementById('clearButton').addEventListener("click", clearBookmark);
        document.getElementById('hideShow').addEventListener("click", hide);
        loadSample();

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
        // RV.getMap('sample-map').registerPlugin(RV.Plugins.BackToCart, 'backToCart', baseUrl);
        // RV.getMap('sample-map').registerPlugin(RV.Plugins.CoordInfo, 'coordInfo');

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
            RV.getMap('sample-map').restoreSession(keysArr);
        } else {
            const bookmark = queryStr.rv;
        }

        // load bookmark
        function loadBookmark() {
            var bookmarkURL = document.getElementById('bookmarkURL').value;
            RV.getMap('sample-map').useBookmark(bookmarkURL);
        }

        function clearBookmark() {
            document.getElementById('bookmarkURL').value = '';
            document.getElementById('bookmarkURL').selected = true;
            document.getElementById('bookmarkURL').focus();
        }

        function hide() {
            if (document.getElementById('header').style.display === 'none') {
                document.getElementById('header').style.display = 'block';
                document.getElementById('hideShow').classList.remove('bottom');
                document.getElementById('hideShow').classList.add('top');
                document.getElementById('hideShow').style.top = ('80px');
            } else {
                document.getElementById('header').style.display = 'none';
                document.getElementById('hideShow').classList.remove('top');
                document.getElementById('hideShow').classList.add('bottom');
                document.getElementById('hideShow').style.top = ('0px');
            }
        }

        // Find and load the sample specified in the key `sample`.  If `sample` is not provided, defaults to first sample.
        function loadSample() {
            var params = new URLSearchParams(currentUrl.search);
            var sampleIndex =  params.get(SAMPLE_KEY) - 1;
            var selectElem = document.getElementById('selectConfig');
            var sameplMapElem = document.getElementById('sample-map');
            if (params.has(SAMPLE_KEY) && sampleIndex >= 0 && selectElem.item(sampleIndex)) {
                var previousSample = sessionStorage.getItem('sample');
                if (previousSample !== undefined) { // first time loading
                    sameplMapElem.setAttribute('rv-config', previousSample);
                    selectElem.value = previousSample;
                    var newElem = selectElem.item(sampleIndex);
                    var newSample = newElem.value;
                    if (newElem && previousSample !== newSample) { // reload if not the same as the previous sample
                        var newSample = newElem.value;
                        sameplMapElem.setAttribute('rv-config', newSample);
                        sessionStorage.setItem('sample', newSample);
                        location.reload();
                    }
                } else { // the key `sample` is provided
                    var sampleIndex = 0;
                    params.set('sample', sampleIndex + 1);
                    sessionStorage.setItem('sample', newSample);
                    var newUrl = currentUrl.origin + currentUrl.pathname + '?' + params.toString();
                    window.location.href = newUrl;
                }
            }
        }

        // change and load the new config
        function changeConfig() {
            var currentSample = document.getElementById('selectConfig').value; // load existing config
            sessionStorage.setItem('sample', currentSample); // store new config
            var params = new URLSearchParams(currentUrl.search);
            params.set('sample', document.getElementById('selectConfig').selectedIndex + 1);
            var newUrl = currentUrl.origin + currentUrl.pathname + '?' + params.toString();
            window.location.href = newUrl;
        }
    </script>
</body>

</html>
