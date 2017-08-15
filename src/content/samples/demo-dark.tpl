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
    </style>

    <% for (var index in htmlWebpackPlugin.files.css) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>"
                crossorigin="<%= webpackConfig.output.crossOriginLoading %>" />
        <% } else { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
        <% } %>
    <% } %>
</head>

<body>
<div style="height: 25px;background-color: black;text-align: left;padding: 10px 11px;">
    <object type="image/svg+xml" style="height: 25px;" tabindex="-1" role="img" data="https://digital.canada.ca/assets/img/cds/goc--header-logo.svg" aria-label="Symbol of the Government of Canada" class="logo"></object>
</div>


    <div class="myMap" id="mobile-map" is="rv-map" rv-config="config/demo1.json" rv-langs='["en-CA"]'>
        <noscript>
            <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download
                a browser that supports it.
                <p>

                    <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript
                        dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
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
        ].some(function (x) { return !x; });
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
        var sheet = document.createElement('style'),
            $rangeInput = $('.range input'),
            prefs = ['webkit-slider-runnable-track', 'moz-range-track', 'ms-track'];

        document.body.appendChild(sheet);

        var getTrackStyle = function (el) {
            var curVal = el.value,
                val = (curVal - 1) * 16.666666667,
                style = '';

            // Set active label
            $('.range-labels li').removeClass('active selected');

            var curLabel = $('.range-labels').find('li:nth-child(' + curVal + ')');

            curLabel.addClass('active selected');
            curLabel.prevAll().addClass('selected');

            // Change background gradient
            for (var i = 0; i < prefs.length; i++) {
                style += '.range {background: linear-gradient(to right, #37adbf 0%, #37adbf ' + val + '%, #fff ' + val + '%, #fff 100%)}';
                style += '.range input::-' + prefs[i] + '{background: linear-gradient(to right, #37adbf 0%, #37adbf ' + val + '%, #b2b2b2 ' + val + '%, #b2b2b2 100%)}';
            }

            return style;
        }

        $rangeInput.on('input', function () {
            sheet.textContent = getTrackStyle(this);
        });

        // Change input value on label click
        $('.range-labels li').on('click', function () {
            var index = $(this).index();

            $rangeInput.val(index + 1).trigger('input');

        });
    </script>
</body>

</html>