<!DOCTYPE html>
<html lang="en">

<head>
        <meta charset="utf-8" />
        <meta content="width=device-width,initial-scale=1" name="viewport" />
        <title>Areas of interst: Pics</title>

        <style>
            body {
                display: flex;
                flex-direction: column;
            }

            .myMap {
                height: 100%;
            }
        </style>

        <script src="/ramp-plugin-areas-of-interest.js"></script>

        <% for (var index in htmlWebpackPlugin.files.css) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"/>
        <% } else { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
        <% } %>
    <% } %>
    </head>

<body>

    <h1>
            Federal Geospatial Platform Visualiser -
            <span style="color:blue">Areas of Interest Demo</span>
        </h1>
        <p>
            <a href="./aoi-pics-index.html">No Pictures Demo</a>
        </p>
        <script
            src="https://code.jquery.com/jquery-3.2.1.min.js"
            integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4="
            crossorigin="anonymous"
        ></script>

    <div class="myMap"
            id="sample-map"
            is="rv-map"
            rv-config="aoi-pics-config.json"
            rv-langs='["en-CA", "fr-CA"]'
            rv-plugins="AreasOfInterest" >
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