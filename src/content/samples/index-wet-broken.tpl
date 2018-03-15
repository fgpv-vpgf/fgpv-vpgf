<!DOCTYPE html>
<!--[if lt IE 9]><html class="no-js lt-ie9" lang="en" dir="ltr"><![endif]-->
<!--[if gt IE 8]><!-->
<html class="no-js" lang="en" dir="ltr">
<!--<![endif]-->

<head>
    <meta charset="utf-8">
    <title>Web Experience Toolkit (WET) - Working examples - Web Experience Toolkit</title>
    <meta content="width=device-width,initial-scale=1" name="viewport">
    <meta name="description" content="Web Experience Toolkit (WET) includes reusable components for building and maintaining innovative Web sites that are accessible, usable, and interoperable. These reusable components are open source software and free for use by departments and external Web communities">
    <link href="//fgpv.cloudapp.net/demo/wet4.0.20/theme-wet-boew/assets/favicon.ico" rel="icon" type="image/x-icon">
    <link rel="stylesheet" href="//fgpv.cloudapp.net/demo/wet4.0.20/theme-wet-boew/css/theme.min.css">
    <style>
        .myMap {
            height: 700px;
            border: 1px solid black;
            margin: 50px;
            position: relative;
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

<body vocab="//schema.org/" typeof="WebPage">
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
                        <section id="wb-lng" class="visible-md visible-lg">
                            <h2>Language selection</h2>
                            <ul class="text-right">
                                <li><a onclick="RV.getMap('rv-app-0').setLanguage('fr-CA')" style="cursor: pointer;">Français</a></li>
                                <li><a onclick="RV.getMap('rv-app-0').setLanguage('en-CA')" style="cursor: pointer;">English</a></li>
                            </ul>
                        </section>
                        <section class="wb-mb-links col-xs-12 visible-sm visible-xs" id="wb-glb-mn">
                            <h2>Search and menus</h2>
                            <ul class="pnl-btn list-inline text-right">
                                <li><a href="#mb-pnl" title="Search and menus" aria-controls="mb-pnl" class="overlay-lnk btn btn-sm btn-default"
                                    role="button"><span class="glyphicon glyphicon-search"><span class="glyphicon glyphicon-th-list"><span class="wb-inv">Search and menus</span></span></span></a></li>
                            </ul>
                            <div id="mb-pnl"></div>
                        </section>
                    </div>
                </div>
            </div>
            <div class="container">
                <div class="row">
                    <div id="wb-sttl" class="col-md-8">
                        <a href="./index-en.html">
                            <object type="image/svg+xml" tabindex="-1" data="//fgpv.cloudapp.net/demo/wet4.0.20/theme-wet-boew/assets/logo.svg"></object>
                            <span>Web Experience Toolkit<span class="wb-inv">, </span><small>Collaborative open source project led by the Government of Canada</small></span>
                        </a>
                    </div>
                    <section id="wb-srch" class="col-md-4 visible-md visible-lg">
                        <h2>Search</h2>
                        <form action="//google.ca/search" method="get" role="search" class="form-inline">
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
        <nav role="navigation" id="wb-sm" data-ajax-replace="//fgpv.cloudapp.net/demo/wet4.0.20/ajax/sitemenu-en.html" data-trgt="mb-pnl" class="wb-menu visible-md visible-lg"
        typeof="SiteNavigationElement">
            <div class="container nvbar">
                <h2>Topics menu</h2>
                <div class="row">
                    <ul class="list-inline menu">
                        <li><a href="./index-en.html">WET project</a></li>
                        <li><a href="./docs/start-en.html#implement">Implement WET</a></li>
                        <li><a href="./docs/start-en.html">Contribute to WET</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
    <main role="main" property="mainContentOfPage" class="container">
        <h1 id="wb-cont" property="name">Web Experience Toolkit (WET)</h1>
        <section>
            <details class="alert alert-info" id="alert-info" open="open">
                <summary class="h3">
                    <h3>New quarterly release cycle</h3>
                </summary>
                <p>WET will now be released 4 times a year as opposed to monthly to facilitate application and website maintenance.</p>
            </details>
        </section>
        <section>
            <div class="myMap" is="rv-map" id="rv-app-0" rv-config="config/config-sample-01-structured-visibility-sets.json" rv-langs='["en-CA"]'>
                <noscript>
                    <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

                    <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
                </noscript>
            </div>
        </section>

        <section>
            <table id="example" class="wb-tables display" style="width:100%">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Office</th>
                        <th>Age</th>
                        <th>Start date</th>
                        <th>Salary</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tiger Nixon</td>
                        <td>System Architect</td>
                        <td>Edinburgh</td>
                        <td>61</td>
                        <td>2011/04/25</td>
                        <td>$320,800</td>
                    </tr>
                    <tr>
                        <td>Garrett Winters</td>
                        <td>Accountant</td>
                        <td>Tokyo</td>
                        <td>63</td>
                        <td>2011/07/25</td>
                        <td>$170,750</td>
                    </tr>
                    <tr>
                        <td>Ashton Cox</td>
                        <td>Junior Technical Author</td>
                        <td>San Francisco</td>
                        <td>66</td>
                        <td>2009/01/12</td>
                        <td>$86,000</td>
                    </tr>
                    <tr>
                        <td>Cedric Kelly</td>
                        <td>Senior Javascript Developer</td>
                        <td>Edinburgh</td>
                        <td>22</td>
                        <td>2012/03/29</td>
                        <td>$433,060</td>
                    </tr>
                    <tr>
                        <td>Airi Satou</td>
                        <td>Accountant</td>
                        <td>Tokyo</td>
                        <td>33</td>
                        <td>2008/11/28</td>
                        <td>$162,700</td>
                    </tr>
                    <tr>
                        <td>Brielle Williamson</td>
                        <td>Integration Specialist</td>
                        <td>New York</td>
                        <td>61</td>
                        <td>2012/12/02</td>
                        <td>$372,000</td>
                    </tr>
                    <tr>
                        <td>Herrod Chandler</td>
                        <td>Sales Assistant</td>
                        <td>San Francisco</td>
                        <td>59</td>
                        <td>2012/08/06</td>
                        <td>$137,500</td>
                    </tr>
                    <tr>
                        <td>Rhona Davidson</td>
                        <td>Integration Specialist</td>
                        <td>Tokyo</td>
                        <td>55</td>
                        <td>2010/10/14</td>
                        <td>$327,900</td>
                    </tr>
                    <tr>
                        <td>Colleen Hurst</td>
                        <td>Javascript Developer</td>
                        <td>San Francisco</td>
                        <td>39</td>
                        <td>2009/09/15</td>
                        <td>$205,500</td>
                    </tr>
                    <tr>
                        <td>Sonya Frost</td>
                        <td>Software Engineer</td>
                        <td>Edinburgh</td>
                        <td>23</td>
                        <td>2008/12/13</td>
                        <td>$103,600</td>
                    </tr>
                    <tr>
                        <td>Jena Gaines</td>
                        <td>Office Manager</td>
                        <td>London</td>
                        <td>30</td>
                        <td>2008/12/19</td>
                        <td>$90,560</td>
                    </tr>
                    <tr>
                        <td>Quinn Flynn</td>
                        <td>Support Lead</td>
                        <td>Edinburgh</td>
                        <td>22</td>
                        <td>2013/03/03</td>
                        <td>$342,000</td>
                    </tr>
                    <tr>
                        <td>Charde Marshall</td>
                        <td>Regional Director</td>
                        <td>San Francisco</td>
                        <td>36</td>
                        <td>2008/10/16</td>
                        <td>$470,600</td>
                    </tr>
                    <tr>
                        <td>Haley Kennedy</td>
                        <td>Senior Marketing Designer</td>
                        <td>London</td>
                        <td>43</td>
                        <td>2012/12/18</td>
                        <td>$313,500</td>
                    </tr>
                    <tr>
                        <td>Tatyana Fitzpatrick</td>
                        <td>Regional Director</td>
                        <td>London</td>
                        <td>19</td>
                        <td>2010/03/17</td>
                        <td>$385,750</td>
                    </tr>
                    <tr>
                        <td>Michael Silva</td>
                        <td>Marketing Designer</td>
                        <td>London</td>
                        <td>66</td>
                        <td>2012/11/27</td>
                        <td>$198,500</td>
                    </tr>
                    <tr>
                        <td>Paul Byrd</td>
                        <td>Chief Financial Officer (CFO)</td>
                        <td>New York</td>
                        <td>64</td>
                        <td>2010/06/09</td>
                        <td>$725,000</td>
                    </tr>
                    <tr>
                        <td>Gloria Little</td>
                        <td>Systems Administrator</td>
                        <td>New York</td>
                        <td>59</td>
                        <td>2009/04/10</td>
                        <td>$237,500</td>
                    </tr>
                    <tr>
                        <td>Bradley Greer</td>
                        <td>Software Engineer</td>
                        <td>London</td>
                        <td>41</td>
                        <td>2012/10/13</td>
                        <td>$132,000</td>
                    </tr>
                    <tr>
                        <td>Dai Rios</td>
                        <td>Personnel Lead</td>
                        <td>Edinburgh</td>
                        <td>35</td>
                        <td>2012/09/26</td>
                        <td>$217,500</td>
                    </tr>
                    <tr>
                        <td>Jenette Caldwell</td>
                        <td>Development Lead</td>
                        <td>New York</td>
                        <td>30</td>
                        <td>2011/09/03</td>
                        <td>$345,000</td>
                    </tr>
                    <tr>
                        <td>Yuri Berry</td>
                        <td>Chief Marketing Officer (CMO)</td>
                        <td>New York</td>
                        <td>40</td>
                        <td>2009/06/25</td>
                        <td>$675,000</td>
                    </tr>
                    <tr>
                        <td>Caesar Vance</td>
                        <td>Pre-Sales Support</td>
                        <td>New York</td>
                        <td>21</td>
                        <td>2011/12/12</td>
                        <td>$106,450</td>
                    </tr>
                    <tr>
                        <td>Doris Wilder</td>
                        <td>Sales Assistant</td>
                        <td>Sidney</td>
                        <td>23</td>
                        <td>2010/09/20</td>
                        <td>$85,600</td>
                    </tr>
                    <tr>
                        <td>Angelica Ramos</td>
                        <td>Chief Executive Officer (CEO)</td>
                        <td>London</td>
                        <td>47</td>
                        <td>2009/10/09</td>
                        <td>$1,200,000</td>
                    </tr>
                    <tr>
                        <td>Gavin Joyce</td>
                        <td>Developer</td>
                        <td>Edinburgh</td>
                        <td>42</td>
                        <td>2010/12/22</td>
                        <td>$92,575</td>
                    </tr>
                    <tr>
                        <td>Jennifer Chang</td>
                        <td>Regional Director</td>
                        <td>Singapore</td>
                        <td>28</td>
                        <td>2010/11/14</td>
                        <td>$357,650</td>
                    </tr>
                    <tr>
                        <td>Brenden Wagner</td>
                        <td>Software Engineer</td>
                        <td>San Francisco</td>
                        <td>28</td>
                        <td>2011/06/07</td>
                        <td>$206,850</td>
                    </tr>
                    <tr>
                        <td>Fiona Green</td>
                        <td>Chief Operating Officer (COO)</td>
                        <td>San Francisco</td>
                        <td>48</td>
                        <td>2010/03/11</td>
                        <td>$850,000</td>
                    </tr>
                    <tr>
                        <td>Shou Itou</td>
                        <td>Regional Marketing</td>
                        <td>Tokyo</td>
                        <td>20</td>
                        <td>2011/08/14</td>
                        <td>$163,000</td>
                    </tr>
                    <tr>
                        <td>Michelle House</td>
                        <td>Integration Specialist</td>
                        <td>Sidney</td>
                        <td>37</td>
                        <td>2011/06/02</td>
                        <td>$95,400</td>
                    </tr>
                    <tr>
                        <td>Suki Burks</td>
                        <td>Developer</td>
                        <td>London</td>
                        <td>53</td>
                        <td>2009/10/22</td>
                        <td>$114,500</td>
                    </tr>
                    <tr>
                        <td>Prescott Bartlett</td>
                        <td>Technical Author</td>
                        <td>London</td>
                        <td>27</td>
                        <td>2011/05/07</td>
                        <td>$145,000</td>
                    </tr>
                    <tr>
                        <td>Gavin Cortez</td>
                        <td>Team Leader</td>
                        <td>San Francisco</td>
                        <td>22</td>
                        <td>2008/10/26</td>
                        <td>$235,500</td>
                    </tr>
                    <tr>
                        <td>Martena Mccray</td>
                        <td>Post-Sales support</td>
                        <td>Edinburgh</td>
                        <td>46</td>
                        <td>2011/03/09</td>
                        <td>$324,050</td>
                    </tr>
                    <tr>
                        <td>Unity Butler</td>
                        <td>Marketing Designer</td>
                        <td>San Francisco</td>
                        <td>47</td>
                        <td>2009/12/09</td>
                        <td>$85,675</td>
                    </tr>
                    <tr>
                        <td>Howard Hatfield</td>
                        <td>Office Manager</td>
                        <td>San Francisco</td>
                        <td>51</td>
                        <td>2008/12/16</td>
                        <td>$164,500</td>
                    </tr>
                    <tr>
                        <td>Hope Fuentes</td>
                        <td>Secretary</td>
                        <td>San Francisco</td>
                        <td>41</td>
                        <td>2010/02/12</td>
                        <td>$109,850</td>
                    </tr>
                    <tr>
                        <td>Vivian Harrell</td>
                        <td>Financial Controller</td>
                        <td>San Francisco</td>
                        <td>62</td>
                        <td>2009/02/14</td>
                        <td>$452,500</td>
                    </tr>
                    <tr>
                        <td>Timothy Mooney</td>
                        <td>Office Manager</td>
                        <td>London</td>
                        <td>37</td>
                        <td>2008/12/11</td>
                        <td>$136,200</td>
                    </tr>
                    <tr>
                        <td>Jackson Bradshaw</td>
                        <td>Director</td>
                        <td>New York</td>
                        <td>65</td>
                        <td>2008/09/26</td>
                        <td>$645,750</td>
                    </tr>
                    <tr>
                        <td>Olivia Liang</td>
                        <td>Support Engineer</td>
                        <td>Singapore</td>
                        <td>64</td>
                        <td>2011/02/03</td>
                        <td>$234,500</td>
                    </tr>
                    <tr>
                        <td>Bruno Nash</td>
                        <td>Software Engineer</td>
                        <td>London</td>
                        <td>38</td>
                        <td>2011/05/03</td>
                        <td>$163,500</td>
                    </tr>
                    <tr>
                        <td>Sakura Yamamoto</td>
                        <td>Support Engineer</td>
                        <td>Tokyo</td>
                        <td>37</td>
                        <td>2009/08/19</td>
                        <td>$139,575</td>
                    </tr>
                    <tr>
                        <td>Thor Walton</td>
                        <td>Developer</td>
                        <td>New York</td>
                        <td>61</td>
                        <td>2013/08/11</td>
                        <td>$98,540</td>
                    </tr>
                    <tr>
                        <td>Finn Camacho</td>
                        <td>Support Engineer</td>
                        <td>San Francisco</td>
                        <td>47</td>
                        <td>2009/07/07</td>
                        <td>$87,500</td>
                    </tr>
                    <tr>
                        <td>Serge Baldwin</td>
                        <td>Data Coordinator</td>
                        <td>Singapore</td>
                        <td>64</td>
                        <td>2012/04/09</td>
                        <td>$138,575</td>
                    </tr>
                    <tr>
                        <td>Zenaida Frank</td>
                        <td>Software Engineer</td>
                        <td>New York</td>
                        <td>63</td>
                        <td>2010/01/04</td>
                        <td>$125,250</td>
                    </tr>
                    <tr>
                        <td>Zorita Serrano</td>
                        <td>Software Engineer</td>
                        <td>San Francisco</td>
                        <td>56</td>
                        <td>2012/06/01</td>
                        <td>$115,000</td>
                    </tr>
                    <tr>
                        <td>Jennifer Acosta</td>
                        <td>Junior Javascript Developer</td>
                        <td>Edinburgh</td>
                        <td>43</td>
                        <td>2013/02/01</td>
                        <td>$75,650</td>
                    </tr>
                    <tr>
                        <td>Cara Stevens</td>
                        <td>Sales Assistant</td>
                        <td>New York</td>
                        <td>46</td>
                        <td>2011/12/06</td>
                        <td>$145,600</td>
                    </tr>
                    <tr>
                        <td>Hermione Butler</td>
                        <td>Regional Director</td>
                        <td>London</td>
                        <td>47</td>
                        <td>2011/03/21</td>
                        <td>$356,250</td>
                    </tr>
                    <tr>
                        <td>Lael Greer</td>
                        <td>Systems Administrator</td>
                        <td>London</td>
                        <td>21</td>
                        <td>2009/02/27</td>
                        <td>$103,500</td>
                    </tr>
                    <tr>
                        <td>Jonas Alexander</td>
                        <td>Developer</td>
                        <td>San Francisco</td>
                        <td>30</td>
                        <td>2010/07/14</td>
                        <td>$86,500</td>
                    </tr>
                    <tr>
                        <td>Shad Decker</td>
                        <td>Regional Director</td>
                        <td>Edinburgh</td>
                        <td>51</td>
                        <td>2008/11/13</td>
                        <td>$183,000</td>
                    </tr>
                    <tr>
                        <td>Michael Bruce</td>
                        <td>Javascript Developer</td>
                        <td>Singapore</td>
                        <td>29</td>
                        <td>2011/06/27</td>
                        <td>$183,000</td>
                    </tr>
                    <tr>
                        <td>Donna Snider</td>
                        <td>Customer Support</td>
                        <td>New York</td>
                        <td>27</td>
                        <td>2011/01/25</td>
                        <td>$112,000</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Office</th>
                        <th>Age</th>
                        <th>Start date</th>
                        <th>Salary</th>
                    </tr>
                </tfoot>
            </table>
        </section>
       
        <section>
            <h2 id="key">Key resources</h2>
            <ul>
                <li><a href="docs/index-en.html">Documentation</a></li>
                <li><a href="docs/versions/dwnld-en.html">Downloads</a></li>
                <li><a href="demos/index-en.html">Examples</a></li>
                <li><a href="docs/versions/index-en.html">Version history</a> and <a href="docs/versions/rdmp-en.html">roadmap</a></li>
                <li><a href="docs/index-en.html#wet31">Notice about WET v3.1</a></li>
                <li><a href="License-en.html">Terms and conditions</a> (MIT license)</li>
                <li><a href="//github.com/wet-boew/wet-boew/">Source code repository</a> and <a href="docs/start-en.html#develop">contributing guidelines</a></li>
                <li><a href="docs/comms-en.html">Communications material</a></li>
                <li><a href="docs/ref/wetsites-en.html">Websites using WET</a></li>
            </ul>
        </section>
        <section>
            <h2 id="benefits">Benefits</h2>
            <section>
                <h3 id="accessibility">Accessibility</h3>
                <ul>
                    <li>Conforms to <a href="//www.w3.org/TR/WCAG20/">WCAG 2.0</a> level AA</li>
                    <li>Leverages <a href="//www.w3.org/TR/wai-aria/">WAI-ARIA</a> to further enhance accessibility</li>
                    <li>Assistive technology testing (Access Working Group)</li>
                </ul>
            </section>
            <section>
                <h3 id="usability">Usability</h3>
                <ul>
                    <li>Iterative approach to design</li>
                    <li>Design patterns and usability testing (User Experience Working Group)</li>
                </ul>
            </section>
            <section>
                <h3 id="interoperability">Interoperability</h3>
                <ul>
                    <li><a href="//www.w3.org/TR/html5/">HTML5</a>-first approach (leveraging native HTML5 support and filling
                        support gaps with “polyfills”)</li>
                    <li>Supporting a wide variety of browsers (IE, Firefox, Chrome, Safari, Opera)</li>
                    <li>Building support for HTML data (<a href="//www.w3.org/TR/rdfa-lite/">RDFa 1.1 Lite</a>, <a href="//www.schema.org/">Schema.org</a>)</li>
                </ul>
            </section>
            <section>
                <h3 id="mobile-friendly-responsive-design">Mobile friendly responsive design</h3>
                <ul>
                    <li>Adapts to different screen sizes and device capabilities</li>
                    <li>Touchscreen support</li>
                    <li>Optimized for performance</li>
                    <li>Building support for device-based mobile applications</li>
                </ul>
            </section>
            <section>
                <h3 id="multilingual">Multilingual</h3>
                <ul>
                    <li>Currently supports 33 languages (including right-to-left languages)
                        <ul>
                            <li>English</li>
                            <li>French</li>
                            <li>Afrikaans</li>
                            <li>Albanian</li>
                            <li>Arabic</li>
                            <li>Armenian</li>
                            <li>Bulgarian</li>
                            <li>Chinese</li>
                            <li>Chinese (Simplified)</li>
                            <li>Czech</li>
                            <li>Dutch</li>
                            <li>Estonian</li>
                            <li>German</li>
                            <li>Greek</li>
                            <li>Hindi</li>
                            <li>Hungarian</li>
                            <li>Icelandic</li>
                            <li>Indonesian</li>
                            <li>Italian</li>
                            <li>Japanese</li>
                            <li>Korean</li>
                            <li>Latvian</li>
                            <li>Lithuanian</li>
                            <li>Polish</li>
                            <li>Portuguese</li>
                            <li>Portuguese (Brazilian)</li>
                            <li>Russian</li>
                            <li>Slovak</li>
                            <li>Spanish</li>
                            <li>Thai</li>
                            <li>Turkish</li>
                            <li>Ukranian</li>
                            <li>Vietnamese</li>
                        </ul>
                    </li>
                </ul>
            </section>
            <section>
                <h3 id="themeable-and-reusable">Themeable and reusable</h3>
                <ul>
                    <li>Flexible framework that supports custom themes</li>
                    <li>Includes support for <a href="docs/ref/themesstyle-en.html">5 different themes</a> including a <a href="//wet-boew.github.io/themes-dist/theme-base/docs/ref/theme-base/theme-base-en.html">“Base” theme</a>                        to use as a template</li>
                    <li>Reusable templates, <a href="docs/ref/plugins-en.html">plugins</a> and widgets</li>
                    <li><a href="docs/ref/variants-en.html">Adapted to various CMS and programming frameworks</a> (Drupal, WordPress,
                        SharePoint (in development), DotNetNuke (in development), PHP, SSI and Java/Maven)
                    </li>
                </ul>
            </section>
            <section>
                <h3>Reduces costs by openly sharing and collaborating</h3>
                <ul>
                    <li>Drives down research and development costs</li>
                    <li>Avoids duplication of effort</li>
                    <li>Produces better quality results</li>
                </ul>
            </section>
            <section>
                <h3 id="collaborative-approach">Collaborative approach</h3>
                <ul>
                    <li>Project managed openly on GitHub, including discussion through the issues tracker</li>
                    <li>Encouraging a free flow of ideas, dialogue and innovation including sharing of challenges and ideas</li>
                    <li>External contributions welcome
                        <ul>
                            <li>Pull requests</li>
                            <li>Design patterns</li>
                            <li>Issues and suggestions</li>
                            <li>Documentation</li>
                            <li>Testing</li>
                        </ul>
                    </li>
                    <li>Multi-level review process for contributions to ensure code integrity (combination of automated and manual
                        reviews)
                    </li>
                </ul>
            </section>
        </section>
        <dl id="wb-dtmd">
            <dt>Date modified:&#32;</dt>
            <dd>
                <time property="dateModified">2015-06-30</time>
            </dd>
        </dl>
    </main>
    <footer role="contentinfo" id="wb-info" class="visible-sm visible-md visible-lg wb-navcurr">
        <div class="container">
            <nav role="navigation" class="row">
                <h2>About this site</h2>
                <section class="col-sm-3">
                    <h3>Contact us</h3>
                    <ul class="list-unstyled">
                        <li><a href="//github.com/wet-boew/wet-boew/issues/new">Questions or comments?</a></li>
                    </ul>
                </section>
                <section class="col-sm-3">
                    <h3>About</h3>
                    <ul class="list-unstyled">
                        <li><a href="./index-en.html#about">About the Web Experience Toolkit</a></li>
                        <li><a rel="external" href="//www.tbs-sct.gc.ca/ws-nw/index-eng.asp">About the Web Standards</a></li>
                    </ul>
                </section>
                <section class="col-sm-3">
                    <h3>News</h3>
                    <ul class="list-unstyled">
                        <li><a href="//github.com/wet-boew/wet-boew/pulse">Recent project activity</a></li>
                        <li><a href="//github.com/wet-boew/wet-boew/graphs">Project statistics</a></li>
                    </ul>
                </section>
                <section class="col-sm-3">
                    <h3>Stay connected</h3>
                    <ul class="list-unstyled">
                        <li><a rel="external" href="//twitter.com/WebExpToolkit">Twitter</a></li>
                    </ul>
                </section>
            </nav>
        </div>
    </footer>
    
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="//wet-boew.github.io/themes-dist/GCWeb/wet-boew/js/wet-boew.min.js"></script>
    <script src="//wet-boew.github.io/themes-dist/GCWeb/GCWeb/js/theme.min.js"></script>

    <% for (var index in htmlWebpackPlugin.files.js) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>" integrity="<%= htmlWebpackPlugin.files.jsIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"></script>
        <% } else { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>"></script>
        <% } %>
    <% } %>

    <script>
        wb.add('table');
    </script>
</body>

</html>
