<!DOCTYPE html>
<html class="no-js" lang="en" dir="ltr">
<head>
    <meta charset="utf-8">
    <title>FGP Viewer</title>
    <meta content="width=device-width,initial-scale=1" name="viewport">
    <link href="http://wet-boew.github.io/themes-dist/GCWeb/GCWeb/assets/favicon.ico" rel="icon" type="image/x-icon">
    <link rel="stylesheet" href="http://wet-boew.github.io/themes-dist/GCWeb/GCWeb/css/theme.min.css">

    <% for (var index in htmlWebpackPlugin.files.css) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"/>
        <% } else { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
        <% } %>
    <% } %>

    <style>
        main div.myMap {
            height: 700px;
            margin: 10px -15px -15px -15px;
        }

        a {
            color: #0d520d;
            text-decoration: underline!important;
        }
        a:visited {
            color: #0D520D;
        }
        .gc-nttvs a h3:hover {
            color: #0000FF;
            text-decoration: underline;
        }
        .alert-info, .label-info, .label-info[href]:active, .label-info[href]:focus, .label-info[href]:hover, details.alert.alert-info, details.alert[open].alert-info {
            background: #DCF7DB;
            border-color: #0D520D;
        }
        .alert-info>:first-child:before {
            color: #0D520D;
            content: "\e086";
        }
        #app-brand {
            background-color: #1C761C;
            color: #fff;
            min-height: 45px;
            /* padding-top: 5px; */
        }
        .app-name {
            font-size: 1.6em;
            padding-top: 5px;
            padding-left: 20px;
            background-color: #0D520D;
            min-height: 45px;
            max-width: 165px;
            margin-left: -15px;
        }
        .app-name:before {
            content: '';
            display: block;
            position: absolute;
            left: 165px;
            top: 0;
            width: 0;
            height: 0;
            border-top: 22.5px solid transparent;
            border-bottom: 22.5px solid transparent;
            border-left: 20px solid #0D520D;
            clear: both;
        }

        .btn-primary, .btn-primary {
        background-color: #0D520D;
        color: #fff;
        }
        .btn-primary:hover, .btn-primary:focus {
        background-color: #ccc;
        color: #000;
        }
        .btn-primary-inv, .btn-primary-inv {
        background-color: #ccc;
        color: #000;
        }
        .btn-primary-inv:hover, .btn-primary-inv:focus {
        background-color: #0D520D;
        color: #fff;
        }

        .fgp-h1-top {
            margin-top: 10px;
        }
        .fgp-h2-padding {
            padding: 0px 10px 0px 10px;
        }
        .fgp-imageDiv {
            box-shadow: 1px 1px 10px #999;
            margin: 2px;
            max-height: 250px;
            cursor: pointer;
            display:inline-block;
            *display:inline;
            *zoom:1;
            vertical-align:top;
        }
        .fgp-imgDiv {
            width:250px;
            max-width:250px;
            max-height: 250px;
        }
        .fgp-imgMaps {
            width: 100%;
            height: 100%;
            border: solid #DDD;
        }
        .fgp-imgRefs {
            box-shadow: 10px 10px 5px #888888;
            border: solid 1px black;
        }
        .fgp-imgRefsMaxWidth {
            max-width: 95%;
        }
        .fgp-infoDiv {
            box-shadow: 10px 10px 5px #888888;
            border: solid 3px darkgreen;
            border-radius: 25px;
            background-color: #BDEFBD;
            padding: 15px;
        }
        .fgp-infoDiv-blue {
            box-shadow: inset 2px 2px 2px #888, 10px 10px 5px #888;
            border: solid 3px #29527D;
            border-radius: 25px;
            background-color: #FFFFFF;
            padding: 15px;
        }
        .fgp-infoDiv-green {
            box-shadow: inset 2px 2px 2px #888, 10px 10px 5px #888;
            border: solid 3px #0D520D;
            border-radius: 25px;
            background-color: #FFFFFF;
            padding: 15px;
        }
        .fgp-infoDiv-purple {
            box-shadow: inset 2px 2px 2px #888, 10px 10px 5px #888;
            border: solid 3px #7030A0;
            border-radius: 25px;
            background-color: #FFFFFF;
            padding: 15px;
        }
        .fgp-main-content {
            border-left: 0px;
            border-right: 0px;
        }
        .fgp-map-container {
            bottom: 0px;
        }
        .fgp-map-gal-container {
            width:358px;
            height: 358px;
        }
        .fgp-map-gal-container img {
            width:358px;
            height: 358px;
        }
        .fgp-map-gal-titles {
            height: 50px;
            text-align: center;
            background-color: #EEEEEE;
            padding: 0px 15px 15px 0;
            width:358px;
        }
        .fgp-map-img {
            width: 225px;
            height: 225px;
        }
        #fgp-overflow{
            border:1px solid #000;
            height:440px;
            width:100%;
            overflow-x:scroll;
            overflow-y:hidden;
        }
        #fgp-overflow .fgp-map-container{width:3000px;}
        #fgp-overflow .fgp-map-container div{
            float:left;
            width:265px;
            height:205px;
            float:left;
            padding-left:10px;
            padding-right:20px;
        }
        #fgpSignIn {
        padding-left: 15px;
        padding-right: 15px;
        }
        .fgp-proj-desc {
            font-size:10px;
        }
        .fgp-proj-name {
            font-size:12px;
        }
        .fgp-proj-title {
            background-color: #D4D4D4;
            color: black;
            width:99.6%;
            padding-top:5px;
            padding-bottom:5px;
        }
        .fgp-proj-type {
            font-size:14px;
        }
        .fgp-scrolls {
            overflow-x: scroll;
            overflow-y: hidden;
            width: 2250px;
            white-space:nowrap;
        }
        .fgp-splash-container {
            border-left: 0px;
            border-right: 0px;
            background-image: url("sp-pe-bg.jpg");
            background-repeat: no-repeat;
        }
        .fgp-sttl {
            font-size: 1.1em;
            text-shadow: 1px 1px 1px #333;
            color: #fff;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .fgp-summary-nobrd {
            border:none;
        }
        .fgp-wrapper {
            background:#EFEFEF;
            box-shadow: 1px 1px 10px #999;
            margin: auto;
            text-align: center;
            position: relative;
            -webkit-border-radius: 5px;
            -moz-border-radius: 5px;
            border-radius: 5px;
            margin-bottom: 20px ;
            padding-top: 5px;
        }

        h1 {
        color: #0D520D;
        border-bottom: 1px solid #0D520D;
        }
        h2 {
        color: #0D520D;
        }
        h3 {
        color: #0D520D;
        }
        h4 {
        color: #0D520D;
        }
        h5 {
        color: #0D520D;
        }
        .splash #bg {
            background: url(images/splash_bg_3.gif) no-repeat center center fixed;
            -webkit-background-size: cover;
            -moz-background-size: cover;
            -o-background-size: cover;
            background-size: cover;
            position: fixed;
            left: 0;
            top: 0;
            min-width: 100%;
            min-height: 100%;
        }

        #wb-info .brand {
            border-top: 4px solid #0D520D;
        }
        .wb-tabs.carousel-s2 {
                font-size: 0.7em;
        }
        .wb-tabs.carousel-s2 [role=tablist]>li.nxt a,
        .wb-tabs.carousel-s2 [role=tablist]>li.plypause a,
        .wb-tabs.carousel-s2 [role=tablist]>li.prv a {
            color: #0D520D;
        }
        .wb-tabs.carousel-s2 [role=tablist]>li.prv a:hover .glyphicon,
        .wb-tabs.carousel-s2 [role=tablist]>li.nxt a:hover .glyphicon,
        .wb-tabs.carousel-s2 [role=tablist]>li.plypause a:hover,
        .wb-tabs.carousel-s2 [role=tablist]>li.prv a:focus .glyphicon,
        .wb-tabs.carousel-s2 [role=tablist]>li.nxt a:focus .glyphicon,
        .wb-tabs.carousel-s2 [role=tablist]>li.plypause a:focus {
            background-color: #0D520D;
            color: white;
        }
        #wb-srch button, .srchbox button {
            background-color: #0D520D;
            border-color: #0D520D;
        }
        #wb-srch button:hover, .srchbox button {
            background-color: #ccc;
            border-color: #000;
            border: solid 1px black;
        }
        .wb-tabs.carousel-s2 [role=tablist]>li.prv a:hover .glyphicon,
        .wb-tabs.carousel-s2 [role=tablist]>li.nxt a:hover .glyphicon,
        .wb-tabs.carousel-s2 [role=tablist]>li.plypause a:hover,
        .wb-tabs.carousel-s2 [role=tablist]>li.prv a:focus .glyphicon,
        .wb-tabs.carousel-s2 [role=tablist]>li.nxt a:focus .glyphicon,
        .wb-tabs.carousel-s2 [role=tablist]>li.plypause a:focus {
            background-color: #2572B4;
            color: white;
        }
        .tool-link {
            padding: 11px 0 0 30px;
        }
        .pull-right {
            float: right!important;
        }
        #app-brand a {
            text-decoration: none;
            color: #fff;
        }
        .tool-link-icon {
            width: 25px;
            margin: 0 5px 3px 0;
        }
        img {
            vertical-align: middle;
        }
        img {
            border: 0;
        }
        .bold-gc {
            font-weight: 800;
        }
        #wb-sm {
            background: #606060;
        }
        #wb-sm .menu>li a:hover, #wb-sm .menu>li a:focus {
            background: #484848!important;
            text-shadow: none;
        }
    </style>

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
        <div id="wb-bnr" class="container">
            <section id="wb-lng" class="visible-md visible-lg text-right">
                <h2 class="wb-inv">Language selection</h2>
                <div class="row">
                    <div class="col-md-12">
                        <ul class="list-inline margin-bottom-none">
                            <li><a lang="fr" href="index-fgp-en.html">English</a></li>
                        </ul>
                    </div>
                </div>
            </section>
            <div class="row">
                <div class="brand col-xs-8 col-sm-9 col-md-6">
                    <a href="http://www.canada.ca/en/index.html">
                        <object type="image/svg+xml" tabindex="-1" data="http://wet-boew.github.io/themes-dist/GCWeb/GCWeb/assets/sig-blk-en.svg"></object><span class="wb-inv"> Government of Canada</span></a>
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
                            <input id="wb-srch-q" list="wb-srch-q-ac" class="wb-srch-q form-control" name="q" type="search" value="" size="27" maxlength="150" placeholder="Search GCTools" style="height: 22px;">
                            <datalist id="wb-srch-q-ac">
                                <!--[if lte IE 9]><select><![endif]-->
                                <!--[if lte IE 9]></select><![endif]-->
                            </datalist>
                        </div>
                        <div class="form-group submit">
                            <button type="submit" id="wb-srch-sub" class="btn btn-primary btn-small" name="wb-srch-sub"><span class="glyphicon-search glyphicon"></span><span class="wb-inv">Search</span></button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
                <div id="app-brand" class="wb-init wb-data-ajax-replace-inited">
            <div class="container">
                <div class="row">
                    <div class="col-sm-3">
                        <div class="app-name">
                            <a href="http://132.156.21.102/en/fgp-intranet.html">
                            <span><span class="bold-gc">GC</span>geo</span>
                            </a>
                        </div>
                    </div>
                    <div class="col-sm-9">
                        <div class="pull-right tool-link">
                            <a href="http://intranet.canada.ca/">
                            <img class="tool-link-icon" alt="GCintranet" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAmCAYAAACoPemuAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAZ1JREFUeNrMmIFxwyAMAI3PA9ANPAIb1N0g3SQblA1y2SAjdAPbEyQjeANnAypSOUdd0sNCNNKdzuRidG8kIUFVCRVFmeSc28HjFbQDNQ9eu4AOoKNS6rPYFwBMC3oAnd12mXFuyw1liUAxQMsBZEDPjl/O5NVDqNmVE2/b/AeUf78vBodBPhNco3G+3uj+OcmtxJhqVza6rR+Wkn2bJWJHE8xYThcusl/Z2hOToY2BHTKzzKILbY6NXyXJE8NDP7lEXqF8vfhBHdQ+LaB2a2T5BsOCLEVuLA3+6BgMTks3geOeaKe7x1gs5RPl3ceFb3EgNq7hPpYBVoEt1WSukgl6L1ZpllJClI9gHG6Q2YlUFwpgkw0WxoYkqSuhUpcK3gy5hGCDILAhBBsFgY13MDz3SUiC63IGDYP/JADsFMvKI+OqTZTVQoafYLCEU/jHE8COyMB6GNlF2nS+wwih9zcJ9npKr68eHXixbdEpe05C3dR/xNUbuDB9gxd5RbByq6xLFdHXUMwXd3bLKpW86hywUyh71ZkIzHY2/RJgAGgraQvkEBT7AAAAAElFTkSuQmCC" /><span class="bold-gc">GC</span>intranet</a>
                        </div>
                        <div class="pull-right tool-link">
                            <a href="http://www.gcpedia.gc.ca/wiki/?setlang=en">
                            <img class="tool-link-icon" alt="GCpedia" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAmCAYAAACoPemuAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAhRJREFUeNrUWItRwzAMTXodwBvQEcIEDRt0hGwAG2AmyAiFCdoNEiZIN0iYIN3AyIdchLHxpzEY3ely18rOy/OzLLkoMrUyZpAQYgePLXgNXlnCTuA9+GtZlsdkXwBgNuAt+CzCbcaxm6VB8UhAJoB8CUAV+CCWtyGaPQQ1i3Qm565yA+UEV5pEDo8BnOFPE/jLlaq4AW8s/53Bb2HnTi62dE11C2i1dmlOH7PWd58tL8nJMW+F2ARMPHvESelwiOW2PGXSVUdSRqh1nowpvV126opguye6+gtjVId0KZuASeTyvDliHiPASXL4BRiefSFsNalYk1jk2aoY2wZOkIoxheUCLHS3NQm1VlPxV0U+Vn3LY5ks5ceuBLHFpIgmNW2rXEvrNWzNM7CWTC+Y/VkOjB2x1lfZfIMVRNTpP3icdz5n5UDm/FKZkPNy55hvoIz1nt8g457A7ywsMHwpw/9PWtdUkI6p/+Edn+2YizGM60jNfrDE16RX6AzvkOPk0TNaxu/05ZxdnQ2WRmrZH7S40dBZCVXKwHOvPhSBmTqv2aSz1rezwVgdGNfmGhEMI4xxWncRsMrakEJRZ6+x9J0jLpN6ObNstNayjLO1pQuoUg+oJeV73z4B9Wcyfk3q8LV9ILAhpn27xk5aWqmj27dcGt7/dUWg7dS8LlWyvoZa+OKOh7CU8qqzx12Z9qrzt+1dgAEAtrx39EWRYuQAAAAASUVORK5CYII%3D" /><span class="bold-gc">GC</span>pedia</a>
                        </div>
                        <div class="pull-right tool-link">
                            <a href="https://gcconnex.gc.ca/">
                                <img alt="GCconnex" class="tool-link-icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAmCAYAAACoPemuAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAoNJREFUeNrMWItRwzAMbTgG6AZkA8IEhA0YwWzQbpANMoLZoDABZQKXCdJOkG4QVE6+E4psy2nCoTtdco4jP+tnWavVP6Viyk/DMDzD4xG4Bq4C0w7Ae+DPoijeFtsBgCmBW+B+yKce/y3nBtVEAFngGniDXONYCGAzB6AK2EU0YXAeBWJxzET+c5O1h6BiZmvJ3F9ExtuEeau5QQ10x/C+I+M75pfDLOBQWApUK2zEU8W+tQpwpQaYS/gGX5g6u4++KtNXnSb6QmSpVgVNcaroXCFIODVTTEhBGZxnEhtp6FwFONmkEV9wAaF9wn94MrYKd2kkYH3CJCawy1qQVQfkmYQL9KOzL2ZCRaR2qE2L78kIjJj0WWPGUuG0uWQTOa5NpQiH39bD/LROrXuD2KTsu8dnvUCxUrM1KFUUmESnCOhrqWJrjOjWqzVQ6F3oFfgIfA98iar1RDBnlPVFNHWIZXvJhz5wnKYIg2O7CT61i8hzoepkJZyH3jlp6HfK8zSWoEfyJHAhH9tCjX4m6l8J79sME24DMn7eca2RvBtm6yNMpJHyLr3jnKMC1BR5BwrM/3wUUsYZmYe2CtgEeXvpSAraXfA/p/UvlNcl5HWjI4kd4iXedkK0UZTMv461hDxD5PXcx3y+upBVmKjNcH7NXMswBAtFe+VFRX3hYGV5qSmtO3KBrVkVWiorDstKa0PkbZjfNdHeBTpsrB/xAuF98E4d6F/89C18PkSN2ZhcmPswx/XNaq5cSs2KJixCfgSPD8WB7Ts6J5KkL//eJTpBNPs/eQvMeRu/hvJbBMwUbgFQ05sqGW2oXC1d34aauXHX5GhpyVbnHgNi2VbnX9O3AAMAKWdBIdpEO1sAAAAASUVORK5CYII%3D" /><span class="bold-gc">GC</span>connex</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <nav role="navigation" id="wb-sm" data-ajax-replace="http://wet-boew.github.io/themes-dist/GCWeb/ajax/sitemenu-fr.html" data-trgt="mb-pnl" class="wb-menu visible-md visible-lg" typeof="SiteNavigationElement">
            <div class="container nvbar">
                <h2>Topics menu</h2>
                <div class="row">
                    <ul class="list-inline menu">
                    </ul>
                </div>
            </div>
        </nav>
        <nav role="navigation" id="wb-bc" property="breadcrumb">
            <h2>You are here:</h2>
            <div class="container">
                <div class="row">
                    <ol class="breadcrumb">
                      <li><a href="fgp-intranet.html">Home</a></li>
                      <li>Visualisateur pour la Plateforme géospatiale fédérale</li>
                    </ol>
                </div>
            </div>
        </nav>
    </header>

    <main role="main" property="mainContentOfPage" class="container">
        <section>
          <h1 property="name" id="wb-cont" class="fgp-h1-top">Visualisateur pour la Plateforme géospatiale fédérale</h1>
          <div id="fgpSignIn" class="row">
            <div class="panel panel-default">
                <div class="panel-body clearfix">
                    <div style="display:flex;">
                        <button onclick="getBookmark()">Obtenir le lien</button>
                        <input type="text" id="bookmarkDisplay" style="width:100%;" />
                        <button onclick="testBackToCart()">Retour au panier</button>
                    </div>
                    <div id="fgpmap" is="rv-map" class="myMap" data-rv-config="config.rcs.[lang].json" data-rv-langs='["fr-CA", "en-CA"]' data-rv-service-endpoint="http://section917.cloudapp.net:8000/" data-rv-wait="true">
                        <noscript>
                            <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                            <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
                        </noscript>
                    </div>
                </div>
            </div>
          </div>
        </section>
    </main>

    <footer role="contentinfo" id="wb-info">
        <nav role="navigation" class="container wb-navcurr">
        <h2 class="wb-inv">Au sujet du gouvernement</h2>
        <ul class="list-unstyled colcount-sm-2 colcount-md-3">
        <li><a href="https://www.canada.ca/fr/contact.html">Contactez-nous</a></li>
        <li><a href="https://www.canada.ca/fr/gouvernement/min.html">Ministères et organismes</a></li>
        <li><a href="https://www.canada.ca/fr/gouvernement/fonctionpublique.html">Fonction publique et force militaire</a></li>
        <li><a href="http://nouvelles.gc.ca/">Nouvelles</a></li>
        <li><a href="https://www.canada.ca/fr/gouvernement/systeme/lois.html">Traités, lois et règlements</a></li>
        <li><a href="https://www.canada.ca/fr/transparence/rapports.html">Rapports à l'échelle du gouvernement</a></li>
        <li><a href="http://pm.gc.ca/fra">Premier ministre</a></li>
        <li><a href="https://www.canada.ca/fr/gouvernement/systeme.html">Comment le gouvernement fonctionne</a></li>
        <li><a href="http://ouvert.canada.ca/">Gouvernement ouvert</a></li>
        </ul>
        </nav>
        <div class="brand">
        <div class="container">
        <div class="row">
        <nav class="col-md-10 ftr-urlt-lnk">
        <h2 class="wb-inv">À propos du site</h2>
        <ul>
        <li><a href="https://www1.canada.ca/fr/contact/retroaction.html">Rétroaction</a></li>
        <li><a href="https://www.canada.ca/fr/sociaux.html">Médias sociaux</a></li>
        <li><a href="https://www.canada.ca/fr/mobile.html">Applications mobiles</a></li>
        <li><a href="http://www1.canada.ca/fr/nouveausite.html">À propos de Canada.ca</a></li>
        <li><a href="https://www.canada.ca/fr/transparence/avis.html">Avis</a></li>
        <li><a href="https://www.canada.ca/fr/transparence/confidentialite.html">Confidentialité</a></li>
        </ul>
        </nav>
        <div class="col-xs-6 visible-sm visible-xs tofpg">
        <a href="#wb-cont">Haut de la page <span class="glyphicon glyphicon-chevron-up"></span></a>
        </div>
        <div class="col-xs-6 col-md-2 text-right">
        <object type="image/svg+xml" tabindex="-1" role="img" data="./GCWeb/assets/wmms-blk.svg" aria-label="Symbole du gouvernement du Canada"></object>
        </div>
        </div>
        </div>
        </div>
    </footer>

    <script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>

    <script>
        // credit: http://stackoverflow.com/a/21903119
        function getUrlParameter(sParam) {
            var sPageURL = decodeURIComponent(window.location.search.substring(1)),
                sURLVariables = sPageURL.split('&'),
                sParameterName,
                i;

            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('=');

                if (sParameterName[0] === sParam) {
                    return sParameterName[1] === undefined ? true : sParameterName[1];
                }
            }
        }

        var testConfig = getUrlParameter('config');
        if (testConfig) {
            document.getElementById("fgpmap").setAttribute("rv-config", testConfig);
        }
    </script>

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

        RV.ready(function() {
            const baseUrl = window.location.href.split('?')[0] + '?keys={RV_LAYER_LIST}';
            RV.getMap('fgpmap').registerPlugin(RV.Plugins.BackToCart, 'backToCart', baseUrl);
            RV.getMap('fgpmap').registerPlugin(RV.Plugins.CoordInfo, 'coordInfo');
        });

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
            RV.getMap('fgpmap').restoreSession(keysArr);
        } else {
            var bookmark = queryStr.rv;
            console.log(bookmark);
            RV.getMap('fgpmap').initialBookmark(bookmark);
        }

        function getBookmark(){
            RV.getMap('fgpmap').getBookmark().then(function (bookmark) {
                document.getElementById("bookmarkDisplay").value = window.location.href.split('?')[0] + '?rv=' + String(bookmark);
            });
        }
        function testBackToCart() {
            const map = RV.getMap('fgpmap');

            map.getBookmark()
                .then(function (bookmark) {
                    sessionStorage.setItem('fgpmap', bookmark);
                    return map.getRcsLayerIDs();
                })
                .then(function (keys) {
                    window.location.href = window.location.href.split('?')[0] + '?keys=' + keys.toString();
                });
        }
    </script>
    <script src="http://wet-boew.github.io/v4.0-ci/wet-boew/js/wet-boew.min.js"></script>
    <script src="http://wet-boew.github.io/themes-dist/GCWeb/GCWeb/js/theme.min.js"></script>

</body>
</html>
