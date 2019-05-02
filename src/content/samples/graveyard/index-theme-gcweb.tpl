<!DOCTYPE html><!--[if lt IE 9]>
<html class="no-js lt-ie9" lang="en" dir="ltr">
    <![endif]--><!--[if gt IE 8]><!-->
    <html class="no-js" lang="en" dir="ltr">
        <!--<![endif]-->
        <head>
            <meta charset="utf-8">
            <!-- Web Experience Toolkit (WET) / Boîte à outils de l'expérience Web (BOEW)
                wet-boew.github.io/wet-boew/License-en.html / wet-boew.github.io/wet-boew/Licence-fr.html -->
            <title>Canada.ca theme - Canada.ca</title>
            <meta content="width=device-width,initial-scale=1" name="viewport">
            <!-- Meta data -->
            <meta name="description" content="Web Experience Toolkit (WET) includes reusable components for building and maintaining innovative Web sites that are accessible, usable, and interoperable. These reusable components are open source software and free for use by departments and external Web communities">
            <!-- Meta data-->
            <!--[if gte IE 9 | !IE ]><!-->
            <link href="https://wet-boew.github.io/themes-dist/GCWeb//GCWeb/assets/favicon.ico" rel="icon" type="image/x-icon">
            <link rel="stylesheet" href="https://wet-boew.github.io/themes-dist/GCWeb//GCWeb/css/theme.min.css">
            <!--<![endif]-->
            <!--[if lt IE 9]>
            <link href="https://wet-boew.github.io/themes-dist/GCWeb/assets/favicon.ico" rel="shortcut icon" />
            <link rel="stylesheet" href="https://wet-boew.github.io/themes-dist/GCWeb/css/ie8-theme.min.css" />
            <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
            <script src="https://wet-boew.github.io/themes-dist/GCWeb//wet-boew/js/ie8-wet-boew.min.js"></script>
            <![endif]-->
            <!--[if lte IE 9]>
            <![endif]-->
            <noscript>
                <link rel="stylesheet" href="https://wet-boew.github.io/themes-dist/GCWeb//wet-boew/css/noscript.min.css" />
            </noscript>
            <!-- Google Tag Manager DO NOT REMOVE OR MODIFY - NE PAS SUPPRIMER OU MODIFIER -->
            <script>dataLayer1 = [];</script>
            <!-- End Google Tag Manager -->
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
            <!-- Google Tag Manager DO NOT REMOVE OR MODIFY - NE PAS SUPPRIMER OU MODIFIER -->
            <noscript><iframe title="Google Tag Manager" src="//www.googletagmanager.com/ns.html?id=GTM-TLGQ9K" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
            <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer1'?'&l='+l:'';j.async=true;j.src='//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer1','GTM-TLGQ9K');</script>
            <!-- End Google Tag Manager -->
            <ul id="wb-tphp">
                <li class="wb-slc">
                    <a class="wb-sl" href="#wb-cont">Skip to main content</a>
                </li>
                <li class="wb-slc visible-sm visible-md visible-lg">
                    <a class="wb-sl" href="#wb-info">Skip to "About this site"</a>
                </li>
            </ul>
            <header role="banner">
                <div id="wb-bnr" class="container">
                    <section id="wb-lng" class="visible-md visible-lg text-right">
                        <h2 class="wb-inv">Language selection</h2>
                        <div class="row">
                            <div class="col-md-12">
                                <ul class="list-inline margin-bottom-none">
                                    <li><a lang="fr" href="https://www.canada.ca/fr.html">Français</a></li>
                                </ul>
                            </div>
                        </div>
                    </section>
                    <div class="row">
                        <div class="brand col-xs-8 col-sm-9 col-md-6">
                            <a href="https://www.canada.ca/en.html"><object type="image/svg+xml" tabindex="-1" data="https://wet-boew.github.io/themes-dist/GCWeb//GCWeb/assets/sig-blk-en.svg"></object><span class="wb-inv"> Government of Canada / <span lang="fr">Gouvernement du Canada</span></span></a>
                        </div>
                        <section class="wb-mb-links col-xs-4 col-sm-3 visible-sm visible-xs" id="wb-glb-mn">
                            <h2>Search and menus</h2>
                            <ul class="list-inline text-right chvrn">
                                <li><a href="#mb-pnl" title="Search and menus" aria-controls="mb-pnl" class="overlay-lnk" role="button"><span class="glyphicon glyphicon-search"><span class="glyphicon glyphicon-th-list"><span class="wb-inv">Search and menus</span></span></span></a></li>
                            </ul>
                            <div id="mb-pnl"></div>
                        </section>
                        <section id="wb-srch" class="col-xs-6 text-right visible-md visible-lg">
                            <h2>Search</h2>
                            <form action="#" method="post" name="cse-search-box" role="search" class="form-inline">
                                <div class="form-group">
                                    <label for="wb-srch-q" class="wb-inv">Search website</label>
                                    <input id="wb-srch-q" list="wb-srch-q-ac" class="wb-srch-q form-control" name="q" type="search" value="" size="27" maxlength="150" placeholder="Search Canada.ca">
                                    <datalist id="wb-srch-q-ac">
                                        <!--[if lte IE 9]>
                                        <select>
                                            <![endif]-->
                                            <!--[if lte IE 9]>
                                        </select>
                                        <![endif]-->
                                    </datalist>
                                </div>
                                <div class="form-group submit">
                                    <button type="submit" id="wb-srch-sub" class="btn btn-primary btn-small" name="wb-srch-sub"><span class="glyphicon-search glyphicon"></span><span class="wb-inv">Search</span></button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
                <nav role="navigation" id="wb-sm" data-ajax-replace="https://wet-boew.github.io/themes-dist/theme-base//ajax/sitemenu-en.html" data-trgt="mb-pnl" class="wb-menu visible-md visible-lg" typeof="SiteNavigationElement">
                    <div class="container nvbar">
                        <h2>Topics menu</h2>
                        <div class="row">
                            <ul class="list-inline menu">
                                <li><a href="https://www.canada.ca/en/services/jobs.html">Jobs</a></li>
                                <li><a href="http://www.cic.gc.ca/english/index.asp">Immigration</a></li>
                                <li><a href="https://travel.gc.ca/">Travel</a></li>
                                <li><a href="https://www.canada.ca/en/services/business.html">Business</a></li>
                                <li><a href="https://www.canada.ca/en/services/benefits.html">Benefits</a></li>
                                <li><a href="https://www.canada.ca/en/services/health.html">Health</a></li>
                                <li><a href="https://www.canada.ca/en/services/taxes.html">Taxes</a></li>
                                <li><a href="https://www.canada.ca/en/services.html">More services</a></li>
                            </ul>
                        </div>
                    </div>
                </nav>
                <nav role="navigation" id="wb-bc" property="breadcrumb">
                    <h2>You are here:</h2>
                    <div class="container">
                        <div class="row">
                            <ol class="breadcrumb">
                                <li><a href="https://www.canada.ca/en.html">Home</a></li>
                                <li>
                                    <a href="http://wet-boew.github.io/v4.0-ci/demos/index-en.html">Working examples</a>
                                </li>
                                <li><a href="https://www.ec.gc.ca/?lang=En">Environment and Climate Change Canada</a></li>
                                <li>FGPV-VPGV</li>
                            </ol>
                        </div>
                    </div>
                </nav>
            </header>
            <main role="main" property="mainContentOfPage" class="container">
                <h1 property="name" id="wb-cont">Canada.ca theme</h1>
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
                </div>
                </div>
            </main>
            <aside class="gc-nttvs container">
                <h2>Government of Canada activities and initiatives</h2>
                <div id="gcwb_prts" class="wb-eqht row">
                    <section class="col-lg-4 col-md-6 mrgn-bttm-md">
                        <a rel="external" href="#">
                            <h3 class="h5">[Activities and initiatives hyperlink text]</h3>
                            <img class="img-responsive thumbnail mrgn-bttm-sm" src="https://wet-boew.github.io/themes-dist/theme-base//img/features/355x113.png" alt="">
                        </a>
                        <p>Brief description of the initiative, task or information being promoted.</p>
                    </section>
                    <section class="col-lg-4 col-md-6 mrgn-bttm-md">
                        <a rel="external" href="#">
                            <h3 class="h5">[Activities and initiatives hyperlink text]</h3>
                            <img class="img-responsive thumbnail mrgn-bttm-sm" src="https://wet-boew.github.io/themes-dist/theme-base//img/features/355x113.png" alt="">
                        </a>
                        <p>Brief description of the initiative, task or information being promoted.</p>
                    </section>
                    <section class="col-lg-4 col-md-6 mrgn-bttm-md">
                        <a rel="external" href="#">
                            <h3 class="h5">[Activities and initiatives hyperlink text]</h3>
                            <img class="img-responsive thumbnail mrgn-bttm-sm" src="https://wet-boew.github.io/themes-dist/theme-base//img/features/355x113.png" alt="">
                        </a>
                        <p>Brief description of the initiative, task or information being promoted.</p>
                    </section>
                </div>
            </aside>
            <footer role="contentinfo" id="wb-info">
                <nav role="navigation" class="container wb-navcurr">
                    <h2 class="wb-inv">About government</h2>
                    <ul class="list-unstyled colcount-sm-2 colcount-md-3">
                        <li><a href="https://www.canada.ca/en/contact.html">Contact us</a></li>
                        <li><a href="https://www.canada.ca/en/government/dept.html">Departments and agencies</a></li>
                        <li><a href="https://www.canada.ca/en/government/publicservice.html">Public service and military</a></li>
                        <li><a href="https://www.canada.ca/en/news.html">News</a></li>
                        <li><a href="https://www.canada.ca/en/government/system/laws.html">Treaties, laws and regulations</a></li>
                        <li><a href="https://www.canada.ca/en/transparency/reporting.html">Government-wide reporting</a></li>
                        <li><a href="http://pm.gc.ca/eng">Prime Minister</a></li>
                        <li><a href="https://www.canada.ca/en/government/system.html">How government works</a></li>
                        <li><a href="http://open.canada.ca/en/">Open government</a></li>
                    </ul>
                </nav>
                <div class="brand">
                    <div class="container">
                        <div class="row">
                            <nav class="col-md-10 ftr-urlt-lnk">
                                <h2 class="wb-inv">About this site</h2>
                                <ul>
                                    <li><a href="https://www.canada.ca/en/social.html">Social media</a></li>
                                    <li><a href="https://www.canada.ca/en/mobile.html">Mobile applications</a></li>
                                    <li><a href="https://www1.canada.ca/en/newsite.html">About Canada.ca</a></li>
                                    <li><a href="https://www.canada.ca/en/transparency/terms.html">Terms and conditions</a></li>
                                    <li><a href="https://www.canada.ca/en/transparency/privacy.html">Privacy</a></li>
                                </ul>
                            </nav>
                            <div class="col-xs-6 visible-sm visible-xs tofpg">
                                <a href="#wb-cont">Top of Page <span class="glyphicon glyphicon-chevron-up"></span></a>
                            </div>
                            <div class="col-xs-6 col-md-2 text-right">
                                <object type="image/svg+xml" tabindex="-1" role="img" data="https://wet-boew.github.io/themes-dist/GCWeb//GCWeb/assets/wmms-blk.svg" aria-label="Symbol of the Government of Canada"></object>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
            <!--[if gte IE 9 | !IE ]><!-->
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.js"></script>
            <script src="https://wet-boew.github.io/themes-dist/GCWeb//wet-boew/js/wet-boew.min.js"></script>
            <!--<![endif]-->
            <!--[if lt IE 9]>
            <script src="https://wet-boew.github.io/themes-dist/GCWeb//wet-boew/js/ie8-wet-boew2.min.js"></script>
            <![endif]-->
            <script src="https://wet-boew.github.io/themes-dist/GCWeb//GCWeb/js/theme.min.js"></script>
        </body>
    </html>
