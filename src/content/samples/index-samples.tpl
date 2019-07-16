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

    <script src="./plugins/customExport/customExport.js"></script>

</head>

<!-- rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-keys='["Airports"]' -->

<body>
    <section id="header">
        <div class="row">
            <select id="selectConfig" class="tool">
                <option value="config/config-sample-01.json">01. Layer with visibility sets</option>
                <option value="config/config-sample-02.json">02. Layer with controlled layers</option>
                <option value="config/config-sample-03.json">03. Layer with Direct linking of dynamic child</option>
                <option value="config/config-sample-04.json">04. Layer with one group linking to multiple layers in child entries</option>
                <option value="config/config-sample-05.json">05. Nested visibility sets</option>
                <option value="config/config-sample-06.json">06. Dynamic layer with children split across multiple top level groups</option>
                <option value="config/config-sample-07.json">07. Dynamic layer controls several of the children in the dynamic group</option>
                <option value="config/config-sample-08.json">08. Layer with single entry collapsed set </option>
                <option value="config/config-sample-09.json">09. Multiple layers with opacity, visibility both disabled and locked</option>
                <option value="config/config-sample-10.json">10. Multiple layers with opacity disabled and locked</option>
                <option value="config/config-sample-11.json">11. Dynamic layers with many different inital opacities</option>
                <option value="config/config-sample-12.json">12. Multiple layers with opacity locked</option>
                <option value="config/config-sample-13.json">13. Multiple layers with visibility disabled and locked</option>
                <option value="config/config-sample-14.json">14. Multiple layers with visibility disabled initially</option>
                <option value="config/config-sample-15.json">15. Multiple layers with visibility locked</option>
                <option value="config/config-sample-16.json">16. Tile layer which is only valid in one of the basemap projections</option>
                <option value="config/config-sample-17.json">17. Layer with only Information section</option>
                <option value="config/config-sample-18.json">18. Layer with symbology overridden by config file specified image file</option>
                <option value="config/config-sample-19.json">19. Customized Map info </option>
                <option value="config/config-sample-20.json">20. Layer with Bounding box disabled</option>
                <option value="config/config-sample-21.json">21. Layer with Query disabled</option>
                <option value="config/config-sample-22.json">22. Layer with Snapshot disabled</option>
                <option value="config/config-sample-23.json">23. Layer with Metadata disabled</option>
                <option value="config/config-sample-24.json">24. Layer with Boundary zoom disabled</option>
                <option value="config/config-sample-25.json">25. Layer with Reload disabled</option>
                <option value="config/config-sample-26.json">26. Layer with Remove disabled</option>
                <option value="config/config-sample-27.json">27. Layer with Settings disabled</option>
                <option value="config/config-sample-28.json">28. Layer without option to view its data table</option>
                <option value="config/config-sample-29.json">29. Layer with metadata included</option>
                <option value="config/config-sample-30.json">30. Viewer with Map re-order disabled for auto legends</option>
                <option value="config/config-sample-31.json">31. Layer with customized title of a data table</option>
                <option value="config/config-sample-32.json">32. Super group with tile layer, dynamic layer- Controls visibility/settings and disable visibility</option>
                <option value="config/config-sample-33.json">33. Zoom scale dependent layer as a part of visibility group and standalone</option>
                <option value="config/config-sample-34.json">34. Set table open by default</option>
                <option value="config/config-sample-35.json">35. Layer with layer import disabled</option>
                <option value="config/config-sample-36.json">36. Disabled global search for a table</option>
                <option value="config/config-sample-37.json">37. Set sorting field by default</option>
                <option value="config/config-sample-38.json">38. Set width for a column</option>
                <option value="config/config-sample-39.json">39. Order Fields</option>
                <option value="config/config-sample-40.json">40. Hide/Display field</option>
                <option value="config/config-sample-41.json">41. ABOUT MAP with custom content</option>
                <option value="config/config-sample-42.json">42. Sample with hidden layer</option>
                <option value="config/config-sample-43.json">43. Map with custom title</option>
                <option value="config/config-sample-44.json">44. Viewer with custom name and logo</option>
                <option value="config/config-sample-45.json">45. Viewer defaulting to Mercator, with no layers</option>
                <option value="config/config-sample-46.json">46. Layers with filter applied on load</option>
                <option value="config/config-sample-47.json">47. Dynamic opacity controls for "not-true-dynamic" dynamic layers</option>
                <option value="config/config-sample-48.json">48. failure testing</option>
                <option value="config/config-sample-49.json">49. failure testing with custom url</option>
                <option value="config/config-sample-50.json">50. Layer entry with description beneath layer title</option>
                <option value="config/config-sample-51.json">51. Physical layer order must match config layer order</option>
                <option value="config/config-sample-52.json">52. Disabled Overview Map</option>
                <option value="config/config-sample-53.json">53. Layer Refresh Interval</option>
                <option value="config/config-sample-54.json">54. True Dynamic Layers with different image format</option>
                <option value="config/config-sample-55.json">55. Custom made north arrow icon</option>
                <option value="config/config-sample-56.json">56. Initial basemap loaded is broken</option>
                <option value="config/config-sample-57.json">57. Layer Re-ordering enabled</option>
                <option value="config/config-sample-58.json">58. Layer with fields not searchable and default values for filters</option>
                <option value="config/config-sample-59.json">59. Custom attribution (text, image and link)</option>
                <option value="config/config-sample-60.json">60. Tile layer</option>
                <option value="config/config-sample-61.json">61. a) Side menu Area of interest plugin (Pictures Enabled)</option>
                <option value="config/config-sample-62.json">62. b) Side menu Area of interest plugin (No Pictures)</option>
                <option value="config/config-sample-63.json">63. Basemap with opacity set on layers</option>
                <option value="config/config-sample-64.json">64. Map with navigation restricted</option>
                <option value=""                            >65. Map with no config provided</option>
                <option value="config/config-sample-66.json">66. WFS layer defined in config</option>
                <option value="config/config-sample-67.json">67. Big images in layer info/symbology</option>
                <option value="config/config-sample-68.json">68. Details panel templating</option>
                <option value="config/config-sample-69.json">69. Custom ESRI API location</option>
                <option value="config/config-sample-70.json">70. Symbology stack expand by default</option>
                <option value="config/config-sample-71.json">71. CORS Everywhere</option>
                <option value="config/config-sample-72.json">72. Collapsed visibility set + hidden layer group</option>
                <option value="config/config-sample-73.json">73. Dynamic layers display field configuration</option>
                <option value="config/config-sample-74.json">74. Custom layer renderer on client</option>
                <option value="config/config-sample-75.json">75. All layer types</option>
                <option value="config/config-sample-76.json">76. WFS with system co-ords in attributes</option>
                <option value="config/config-sample-77.json">77. Legend with titles that are removed in export and custom legend width</option>
                <option value="config/config-sample-78.json">78. Tile layer with some tiles missing</option>
                <option value="config/config-sample-79.json">79. Use https for Get Coord Info plugin</option>
                <option value="config/config-sample-80.json">80. Failing about and help</option>
                <option value="config/config-sample-81.json">81. Mystery config 0</option>
                <option value="config/config-sample-82.json">82. Mystery config 1</option>
                <option value="config/config-sample-83.json">83. Mystery config 2</option>
                <option value="config/config-sample-84.json">84. Local Export + Tainted Images + cleanCanvas option</option>
                <option value="config/config-sample-85.json">85. File based layers</option>
                <option value="config/config-sample-86.json">86. API 2 blocks for a single layer</option>
                <option value="config/config-sample-87.json">87. Enlarge correct symbology from stack</option>
                <option value="config/config-sample-88.json">88. Dynamic and Non-dyamic layers with default values</option>
                <option value="config/config-sample-89.json">89. Custom Geosearch sorted results</option>
                <option value="config/config-sample-90.json">90. Layer with custom field alias</option>
                <option value="config/config-sample-91.json">91. Custom Symbology Stacks</option>
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
        rv-config="config/config-sample-01.json"
        rv-langs='["en-CA", "fr-CA"]'
        rv-restore-bookmark="bookmark"
        rv-plugins="customExport"
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
