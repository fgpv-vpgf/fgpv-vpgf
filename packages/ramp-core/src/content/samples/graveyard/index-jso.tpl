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

        /* Edge hack, seems like body is at z-index 0 and sits on top of the map which is at z-index: -1 */
        body { background: transparent; }
    </style>

</head>

<body>
    <div class="myMap" is="rv-map" rv-config="config.[lang].json" rv-langs='["en-CA", "fr-CA"]'
         rv-service-endpoint="http://section917.canadacentral.cloudapp.azure.com/" rv-keys='["Airports"]'
         rv-restore-bookmark="bookmark">

         <noscript>
            <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

            <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
        </noscript>
    </div>

    <script>
    var RV = { dojoURL: 'http://fgpv.cloudapp.net/demo/esrijso/dojo/dojo.js' };
    var dojoConfig = {
        baseUrl: 'http://fgpv.cloudapp.net/demo/esrijso/',
        packages: [
          { "name": "dojo", "location": 'http://fgpv.cloudapp.net/demo/esrijso/dojo' },
          {"name": "dojox", "location": 'http://fgpv.cloudapp.net/demo/esrijso/dojox' },
          {"name": "esri", "location": 'http://fgpv.cloudapp.net/demo/esrijso/esri' }
        ]
    };
    </script>

    

    <script>

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

        function bookmark(){
            return new Promise(function (resolve) {
                var thing = getQueryVariable("rv");
                console.log(thing);
                resolve(thing);
            });
        }
    </script>
</body>

</html>
