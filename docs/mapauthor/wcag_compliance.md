# WCAG Compliance

RAMP2 is WCAG 2.0 "AA" Compliant. Since we have no control over the content outside of the RAMP2 viewer, it is important for the host page to maintain this WCAG compliance. Below is a list of host page responsibilities to maintain WCAG 2.0 "AA" Compliant.

### "Skip to Content" Link

> The objective of this technique is to provide a mechanism to bypass blocks of material that are repeated on multiple Web pages by skipping directly to the main content of the Web page. The first interactive item in the Web page is a link to the beginning of the main content. Activating the link sets focus beyond the other content to the main content. This technique is most useful when a Web page has one main content area, rather than a set of content areas that are equally important, and when there are not multiple navigation sections on the page.

Link: [Adding a link at the top of each page that goes directly to the main content area](https://www.w3.org/TR/WCAG20-TECHS/G1.html#G1-description)

Example:

```html
<body>
    <ul id="wb-tphp">
        <li class="wb-slc">
            <a class="wb-sl" href="#wb-cont">Skip to main content</a>
        </li>
        <li class="wb-slc visible-sm visible-md visible-lg">
            <a class="wb-sl" href="#wb-info">Skip to "About this site"</a>
        </li>
    </ul>
```

### Page Titled

> The intent is to help users find content and orient themselves within it by ensuring that each Web page has a descriptive title. Titles identify the current location without requiring users to read or interpret page content. When titles appear in site maps or lists of search results, users can more quickly identify the content they need. User agents make the title of the page easily available to the user for identifying the page. For instance, a user agent may display the page title in the window title bar or as the name of the tab containing the page.

Link: [Page Titled](https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-title.html#navigation-mechanisms-title-intent-head)

Example:

```html
<head>
    <title>My Page Title</title>
```
