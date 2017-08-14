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
            margin: 10px;
        }

        #map-scenario-menu {
            position: absolute;
            bottom: 10px;
            left: 37%;
            z-index: 99999;
            background: hsl(0, 0%, 19%);
            border-radius: 5px;
            border: 1px solid #222;
            font-family: Fira Sans, sans-serif;
            text-transform: uppercase;
            font-size: 0.8rem;
        }

        #map-scenario-menu > div {
            margin-top: 0;
        }

        #col-rcp {
            width: 150px;
        }

        #col-period {
            width: 350px;
        }

        #col-rcp, #col-period {
            display: inline-block;
            vertical-align: top;
            padding: 10px 10px;
        }

        .radiotitle {
            text-align: center;
            color: #bbb;
            margin-bottom: -10px;
        }

        .range {
  position: relative;
  width: 550px;
  height: 5px;
}

.range input {
  width: 100%;
  position: absolute;
  top: 2px;
  height: 0;
  -webkit-appearance: none;
}
.range input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  margin: -8px 0  0;
  border-radius: 50%;
  background: #37adbf;
  cursor: pointer;
  border: 0 !important;
}
.range input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  margin: -8px 0  0;
  border-radius: 50%;
  background: #37adbf;
  cursor: pointer;
  border: 0 !important;
}
.range input::-ms-thumb {
  width: 18px;
  height: 18px;
  margin: -8px 0  0;
  border-radius: 50%;
  background: #37adbf;
  cursor: pointer;
  border: 0 !important;
}
.range input::-webkit-slider-runnable-track {
  width: 100%;
  height: 2px;
  cursor: pointer;
  background: #b2b2b2;
}
.range input::-moz-range-track {
  width: 100%;
  height: 2px;
  cursor: pointer;
  background: #b2b2b2;
}
.range input::-ms-track {
  width: 100%;
  height: 2px;
  cursor: pointer;
  background: #b2b2b2;
}
.range input:focus {
  background: none;
  outline: none;
}
.range input::-ms-track {
  width: 100%;
  cursor: pointer;
  background: transparent;
  border-color: transparent;
  color: transparent;
}

.range-labels {
  padding: 0;
  list-style: none;
}
.range-labels li {
  position: relative;
  float: left;
  width: 90.25px;
  text-align: center;
  color: #b2b2b2;
  font-size: 12px;
  cursor: pointer;
}
.range-labels li::before {
  position: absolute;
  top: -14px;
  right: 0;
  left: 0;
  content: "";
  margin: 0 auto;
  width: 9px;
  height: 9px;
  background: #b2b2b2;
  border-radius: 50%;
}
.range-labels .active {
  color: #37adbf;
}
.range-labels .selected::before {
  background-color: rgb(96,125,139);
}
.range-labels .active.selected::before {
  display: none;
}

.range-labels li.first:before {
    left: -98px;
    z-index: -1;
}  

.range-labels li.last {
    text-align: right;
}
.range-labels li.third {
    width: 33%;
}


.md-thumb:after {
    background-color: rgb(96,125,139) !important;
}

md-slider {
    height: 20px !important;
}

.range-labels li.last:before {
    right: -105px;
}

md-switch {
    margin-bottom: 0 !important;
}

md-switch .md-container {
    margin-left: 40px;
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

<body>

    <div class="myMap" id="mobile-map" is="rv-map"
        rv-config="config/demo1.json"
        rv-langs='["en-CA"]'>
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
