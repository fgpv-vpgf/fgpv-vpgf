<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="utf-8">
        <meta content="width=device-width,initial-scale=1" name="viewport">
        <title>title</title>

        <style>

            _body:after {
                position: fixed;
                content: "";
                width: 50%;
                height: 50%;
                top: 0;
                right: 0;
                border: 1px solid darkorange;
            }

            .myMap {
                border: 1px solid black;
                margin: 50px;
                position: relative;
            }

            ._myMap:after {
                position: absolute;
                content: "";
                width: 50%;
                height: 50%;
                top: 0;
                right: 0;
                border: 1px solid darkgreen;
            }

            .row {
                display: flex;
                height: 650px;
            }

            .one {
                height: 700px;
            }

            .two {
                flex: 2;

            }

            .three {
                flex: 3;
            }

        </style>
    </head>

    <body>
        <div class="myMap one" is="rv-map" rv-config='config-all.en.json'>
            <noscript>
                <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
            </noscript>
        </div>

        <div class="row">
            <div class="myMap two" is="rv-map" rv-config="config.fr-CA.json">
                <noscript>
                    <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                    <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
                </noscript>
            </div>

            <div class="myMap three" is="rv-map" rv-config="config.en-CA.json">
                <noscript>
                    <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                    <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
                </noscript>
            </div>
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

    </body>

</html>
