<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta content="width=device-width,initial-scale=1" name="viewport">
    <title>title</title>

    <style>
        .container {
            display: flex;
            width: 100%;
            height: 100%;
            flex-flow: row wrap;
        }

        .myMap {
            flex: 1 auto;
            margin: 10px;
            border: 1px solid black;
            height: 820px;
        }

        .fullrow {
            flex: 2 100%;
        }

        /* Edge hack, seems like body is at z-index 0 and sits on top of the map which is at z-index: -1 */
        body { background: transparent; }
    </style>

    <!-- example of host page loading angular and jquery dependencies by itself -->
    <script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.2.0.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.11/angular.min.js"></script>

    <script>
        $.getJSON("config-mobile-2.json", function (data) {
            console.log('config!', data);

            data.map.legend.type = 'autopopulate';

            // global, watch out!
            config_mobile_2_auto = {
                'en-CA': data,
                'fr-CA': data
            };
        });
    </script>

    <link href="../styles.css" rel="stylesheet">
</head>

<body>
    <div class="container">
        <div class="myMap" is="rv-map" rv-config="config-mobile-2.json" rv-langs='["en-CA", "fr-CA"]'
            rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-keys='["Airports"]'>
            <noscript>
                <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
            </noscript>
        </div>

        <div class="myMap" is="rv-map" rv-config="config_mobile_2_auto" rv-langs='["en-CA", "fr-CA"]'
            rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-keys='["Airports"]'>
            <noscript>
                <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
            </noscript>
        </div>

        <div class="myMap fullrow" is="rv-map" rv-config="config-mobile-3.json" rv-langs='["en-CA", "fr-CA"]'
            rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-keys='["Airports"]'>
            <noscript>
                <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
            </noscript>
        </div>
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

</body>

</html>
