<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta content="width=device-width,initial-scale=1" name="viewport">
    <title>Test Samples - RAMP2 Viewer</title>

    <style>
        body {

            flex-direction: column;
        }

        .myMap {
            height: 100%;
            border: 1px black solid;
        }

        .flexMap {
            flex: 1;
        }

        #hideShow {
            position: absolute;
            width: 10%;
            right: 45%;
            z-index: 100;
            top: 80px;
            padding: 0;
        }

        .row {
            height: 650px;

        }
    </style>
    <script src="./plugins/coordInfo/coordInfo.js"></script>

    <% for (var index in htmlWebpackPlugin.files.css) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"/>
        <% } else { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
        <% } %>
    <% } %>

</head>

<!-- rv-service-endpoint="http://section917.canadacentral.cloudapp.azure.com/" rv-keys='["Airports"]' -->

<body>
    <h1>Title 1</h1>
    <div class="myMap" id="sample-map" is="rv-map" ramp-gtm
        rv-config="config/config-many-1.json"
        rv-langs='["en-CA", "fr-CA"]'
        rv-restore-bookmark="bookmark"
        rv-plugins="coordInfo"
        rv-service-endpoint="http://section917.canadacentral.cloudapp.azure.com/">
         <noscript>
            <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

            <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
        </noscript>
    </div>
        <h1>Title 2</h1>
        <div class="myMap flexMap" id="second-map" is="rv-map" ramp-gtm
            rv-config="config/config-many-2.json"
            rv-langs='["en-CA", "fr-CA"]'
            rv-restore-bookmark="bookmark"
            rv-plugins="coordInfo"
            rv-service-endpoint="http://section917.canadacentral.cloudapp.azure.com/">
            <noscript>
                <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
            </noscript>
        </div>
        <h1>Title 3</h1>
        <div class="myMap flexMap" id="third-map" is="rv-map" ramp-gtm
            rv-config="config/config-many-3.json"
            rv-langs='["en-CA", "fr-CA"]'
            rv-restore-bookmark="bookmark"
            rv-plugins="coordInfo"
            rv-service-endpoint="http://section917.canadacentral.cloudapp.azure.com/">
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
</body>

</html>
