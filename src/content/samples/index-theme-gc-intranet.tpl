<!DOCTYPE html><!--[if lt IE 9]>
<html class="no-js lt-ie9" lang="en" dir="ltr">
    <![endif]--><!--[if gt IE 8]><!-->
    <html class="no-js" lang="en" dir="ltr">
        <!--<![endif]-->
        <head>
            <meta charset="utf-8">
            <!-- Web Experience Toolkit (WET) / Boîte à outils de l'expérience Web (BOEW)
                wet-boew.github.io/wet-boew/License-en.html / wet-boew.github.io/wet-boew/Licence-fr.html -->
            <title>Government of Canada Intranet theme - Working examples - Web Experience Toolkit</title>
            <meta content="width=device-width,initial-scale=1" name="viewport">
            <!-- Meta data -->
            <meta name="description" content="Web Experience Toolkit (WET) includes reusable components for building and maintaining innovative Web sites that are accessible, usable, and interoperable. These reusable components are open source software and free for use by departments and external Web communities">
            <meta name="dcterms.title" content="Government of Canada Intranet theme - Web Experience Toolkit">
            <meta name="dcterms.creator" content="French name of the content author / Nom en français de l'auteur du contenu">
            <meta name="dcterms.issued" title="W3CDTF" content="Date published (YYYY-MM-DD) / Date de publication (AAAA-MM-JJ)">
            <meta name="dcterms.modified" title="W3CDTF" content="Date modified (YYYY-MM-DD) / Date de modification (AAAA-MM-JJ)">
            <meta name="dcterms.subject" title="scheme" content="French subject terms / Termes de sujet en français">
            <meta name="dcterms.language" title="ISO639-2" content="eng">
            <!-- Meta data-->
            <!--[if gte IE 9 | !IE ]><!-->
            <link href="https://wet-boew.github.io/themes-dist/theme-gc-intranet//theme-gc-intranet/assets/favicon.ico" rel="icon" type="image/x-icon">
            <link rel="stylesheet" href="https://wet-boew.github.io/themes-dist/theme-gc-intranet//theme-gc-intranet/css/theme.min.css">
            <!--<![endif]-->
            <!--[if lt IE 9]>
            <link href="https://wet-boew.github.io/themes-dist/theme-gc-intranet//theme-gc-intranet/assets/favicon.ico" rel="shortcut icon" />
            <link rel="stylesheet" href="https://wet-boew.github.io/themes-dist/theme-gc-intranet//theme-gc-intranet/css/ie8-theme.min.css" />
            <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
            <script src="https://wet-boew.github.io/themes-dist/theme-gc-intranet//wet-boew/js/ie8-wet-boew.min.js"></script>
            <![endif]-->
            <noscript>
                <link rel="stylesheet" href="https://wet-boew.github.io/themes-dist/theme-gc-intranet//wet-boew/css/noscript.min.css" />
            </noscript>
            <style>
                .myMap {
                    height: 600px;
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
        <body vocab="http://schema.org/" typeof="WebPage">
            <ul id="wb-tphp">
                <li class="wb-slc">
                    <a class="wb-sl" href="#wb-cont">Skip to main content</a>
                </li>
                <li class="wb-slc visible-sm visible-md visible-lg">
                    <a class="wb-sl" href="#wb-info">Skip to "About this site"</a>
                </li>
            </ul>
            <header role="banner">
                <div id="wb-bnr">
                    <div id="wb-bar">
                        <div class="container">
                            <div class="row">
                                <object id="gcwu-sig" type="image/svg+xml" tabindex="-1" role="img" data="https://wet-boew.github.io/themes-dist/theme-gc-intranet//theme-gc-intranet/assets/sig-blk-en.svg" aria-label="Government of Canada"></object>
                                <section id="wb-lng">
                                    <h2>Language selection</h2>
                                    <ul class="list-inline">
                                        <li><a lang="fr" href="index-fr.html">Français</a></li>
                                    </ul>
                                </section>
                                <section class="wb-mb-links col-xs-12 visible-sm visible-xs" id="wb-glb-mn">
                                    <h2>Search and menus</h2>
                                    <ul class="pnl-btn list-inline text-right">
                                        <li><a href="#mb-pnl" title="Search and menus" aria-controls="mb-pnl" class="overlay-lnk btn btn-sm btn-default" role="button"><span class="glyphicon glyphicon-search"><span class="glyphicon glyphicon-th-list"><span class="wb-inv">Search and menus</span></span></span></a></li>
                                    </ul>
                                    <div id="mb-pnl"></div>
                                </section>
                            </div>
                        </div>
                    </div>
                    <div class="container">
                        <div class="row">
                            <div id="wb-sttl" class="col-md-12">
                                <a href="http://wet-boew.github.io/v4.0-ci/index-en.html">
                                <span>Environment and Climate Change Canada</span>
                                </a>
                                <object id="wmms" type="image/svg+xml" tabindex="-1" role="img" data="https://wet-boew.github.io/themes-dist/theme-gc-intranet//theme-gc-intranet/assets/wmms-intra.svg" aria-label="Symbol of the Government of Canada"></object>
                            </div>
                            <section id="wb-srch" class="visible-md visible-lg">
                                <h2>Search</h2>
                                <form action="https://google.ca/search" method="get" role="search" class="form-inline">
                                    <div class="form-group">
                                        <label for="wb-srch-q">Search website</label>
                                        <input id="wb-srch-q" class="form-control" name="q" type="search" value="" size="27" maxlength="150">
                                        <input type="hidden" name="q" value="site:wet-boew.github.io OR site:github.com/wet-boew/">
                                    </div>
                                    <button type="submit" id="wb-srch-sub" class="btn btn-default">Search</button>
                                </form>
                            </section>
                        </div>
                    </div>
                </div>
                <nav role="navigation" id="wb-sm" data-ajax-replace="https://wet-boew.github.io/themes-dist/theme-gc-intranet//ajax/sitemenu-en.html" data-trgt="mb-pnl" class="wb-menu visible-md visible-lg" typeof="SiteNavigationElement">
                    <div class="container nvbar">
                        <h2>Topics menu</h2>
                        <div class="row">
                            <ul class="list-inline menu">
                                <li><a href="https://wet-boew.github.io/themes-dist/theme-gc-intranet//index-en.html">WET project</a></li>
                                <li><a href="https://wet-boew.github.io/themes-dist/theme-gc-intranet//docs/start-en.html#implement">Implement WET</a></li>
                                <li><a href="https://wet-boew.github.io/themes-dist/theme-gc-intranet//docs/start-en.html">Contribute to WET</a></li>
                            </ul>
                        </div>
                    </div>
                </nav>
                <nav role="navigation" id="wb-bc" property="breadcrumb">
                    <h2>You are here:</h2>
                    <div class="container">
                        <div class="row">
                            <ol class="breadcrumb">
                                <li>
                                    <a href="http://wet-boew.github.io/v4.0-ci/index-en.html">Home</a>
                                </li>
                                <li>
                                    <a href="http://wet-boew.github.io/v4.0-ci/demos/index-en.html">Working examples</a>
                                </li>
                                <li>Government of Canada Intranet theme</li>
                            </ol>
                        </div>
                    </div>
                </nav>
            </header>
            <main role="main" property="mainContentOfPage" class="container">
                <h1 id="wb-cont" property="name">Government of Canada Intranet theme</h1>
                <div class="myMap" id="theme-map" is="rv-map"
                    rv-config="config/config-sample-60.json"
                    rv-langs='["en-CA", "fr-CA"]'
                    rv-wait="true"
                    rv-restore-bookmark="bookmark">
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
                    RV.getMap('theme-map').registerPlugin(RV.Plugins.BackToCart, 'backToCart', baseUrl);
                    RV.getMap('theme-map').registerPlugin(RV.Plugins.CoordInfo, 'coordInfo');

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
                        RV.getMap('theme-map').restoreSession(keysArr);
                    } else {
                        var bookmark = queryStr.rv;
                        // console.log(bookmark);
                        RV.getMap('theme-map').initialBookmark(bookmark);
                    }
                </script>
                <dl id="wb-dtmd">
                    <dt>Date modified:&#32;</dt>
                    <dd><time property="dateModified">2017-10-25</time></dd>
                </dl>
            </main>
            <footer role="contentinfo" id="wb-info" class="visible-sm visible-md visible-lg wb-navcurr">
                <div class="container">
                    <nav role="navigation">
                        <h2>About this site</h2>
                        <div class="row">
                            <section class="col-sm-3">
                                <h3>Contact us</h3>
                                <ul class="list-unstyled">
                                    <li><a href="https://github.com/wet-boew/wet-boew/issues/new">Questions or comments?</a></li>
                                </ul>
                            </section>
                            <section class="col-sm-3">
                                <h3>About</h3>
                                <ul class="list-unstyled">
                                    <li><a href="http://wet-boew.github.io/v4.0-ci/index-en.html#about">About the Web Experience Toolkit</a></li>
                                    <li><a href="http://www.tbs-sct.gc.ca/ws-nw/index-eng.asp">About the Web Standards</a></li>
                                </ul>
                            </section>
                            <section class="col-sm-3">
                                <h3>News</h3>
                                <ul class="list-unstyled">
                                    <li><a href="https://github.com/wet-boew/wet-boew/pulse">Recent project activity</a></li>
                                    <li><a href="https://github.com/wet-boew/wet-boew/graphs">Project statistics</a></li>
                                </ul>
                            </section>
                            <section class="col-sm-3">
                                <h3>Stay connected</h3>
                                <ul class="list-unstyled">
                                    <li><a href="https://twitter.com/WebExpToolkit">Twitter</a></li>
                                </ul>
                            </section>
                        </div>
                        <ul id="gc-tctr" class="list-inline">
                            <li><a rel="license" href="http://wet-boew.github.io/wet-boew/License-en.html">Terms and conditions</a></li>
                            <li><a href="http://www.tbs-sct.gc.ca/tbs-sct/common/trans-eng.asp">Transparency</a></li>
                        </ul>
                    </nav>
                </div>
            </footer>
            <!--[if gte IE 9 | !IE ]><!-->
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.js"></script>
            <script src="https://wet-boew.github.io/themes-dist/theme-gc-intranet//wet-boew/js/wet-boew.min.js"></script>
            <!--<![endif]-->
            <!--[if lt IE 9]>
            <script src="https://wet-boew.github.io/themes-dist/theme-gc-intranet//wet-boew/js/ie8-wet-boew2.min.js"></script>
            <![endif]-->
            <script src="https://wet-boew.github.io/themes-dist/theme-gc-intranet//theme-gc-intranet/js/theme.min.js"></script>
        </body>
    </html>
