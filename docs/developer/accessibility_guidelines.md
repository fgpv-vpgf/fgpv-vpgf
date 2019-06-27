# RAMP Accessibility Guidelines

## Intro

This guide is intended to be followed by:

**1. RAMP's core developers**
- when creating new features
- when making changes to existing features
- when migrating existing features
- when testing for accessibility

**2. Plugin Authors**:
- when creating plugins
- when testing plugins in order to make sure they are consistent with the rest of RAMP.

This guide is designed to make following the [WCAG 2.0 AA guidelines](https://www.w3.org/TR/WCAG20/) easier. Referring to this guide when designing, implementing and testing UI components will automatically take care of accessibility and ensure stylistic consistency throughout RAMP.

---
## 1. Keyboard Navigation and Focus - Map Components


#### Clarification of Terminology

A `Map Component` is any focusable part of RAMP that is **not**:
- part of the `Basemap` (i.e. everything [here](https://camo.githubusercontent.com/69d4a5aa2b3a61bfb7b588ff9570e373764b872a/68747470733a2f2f692e696d6775722e636f6d2f6b78687061575a2e706e67) except the `Main Application Bar`)
- part of the [`Side Menu`](https://gist.github.com/AleksueiR/03a27c47af53a51692645cef3eed171b#3-side-menu)
- a child of a `list` (see [Within Component Navigation](#_1-2-within-component-navigation))
- a [Dropdown Menu](#_2-dropdown-menus)

#### Overview

According to **Guideline 2.4.3** in the [Summary Matrix](#_9-summary-matrix):

> focusable components receive focus in an order that preserves meaning and operability

According to **Guideline 1.3.2** in the [Summary Matrix](#_9-summary-matrix):

> When the sequence in which content is presented affects its meaning, a correct reading sequence can be programmatically determined.

This points to setting tab order for RAMP to mimic reading a newspaper or comic book. In other words left to right, top to bottom, panel by panel. When needed, this also means that hierarchies within components are respected and addressed to not disrupt flow through the components as well as through the greater map.

---

### 1.1 Between Component Navigation

RAMP's default between-component tabbing order is:
1. [App Bar](/../ui-overview#_2-1-main-application-bar) and Main Panel ([layers panel](/../ui-overview#_5-layers-panel), [details](/../ui-overview#_7-details-panel)...) since they are visually attached
2. [Settings](/../ui-overview#_5-18-layer-settings-panel) or [Metadata](/../ui-overview#_5-19-layer-metadata-panel) or [Datagrid](/../ui-overview#_6-enhanced-table) (if open)
3. [Overview Map](/../ui-overview#_2-3-overview-map)
4. [Map navigation cluster](/../ui-overview#_2-5-map-navigation-cluster) (zoom, fullscreen, scalebar, etc.)

Developers should ensure that any newly added features work with this tabbing order.

When adding a new component to the features listed above (e.g. a new button in the Settings Panel), the tabbing order *within* the feature should be respected.

The following sections describe `app-focus` and `component-focus` which are two focus management systems used in between-component navigation. Both these services automatically register all components added to RAMP.

These focus management systems ensures that focus is not trapped on any one component at any time since focus can be shifted using either `Tab` or `Shift` + `Tab`. This meets **Guideline 2.1.2** in the [Summary Matrix](#_9-summary-matrix).

#### 1.1.1 Keeping Track of Focus History

`app-focus` is a simple service keeping track of the focus history of map components.

It does so by subscribing to the focus events on the map container. It keeps track of:
- currently focused elements
- focusable elements
- persistently focused elements

#### 1.1.2 Keeping Track of Triggering Elements
`component-focus` is a Panel mixin which handles:
- pulling in focus to the *triggered* element on the `open` event
- restoring focus to the *triggering* (or last focused) element on the `close` event

When the panel opens, it receives a reference to the *triggering* element from the `app-focus`. This is how it restores focus on panel close.

If the triggering element no longer exists when the panel is closed, the focus will be set to the root of the application.

---

### 1.2 Within Component Navigation

**Note:** This explanation will be using the Visual Studio Code editor as an example. For an implementation of this functionality on  RAMP,  feel free to look at the [Data Grid](/../ui-overview#_6-enhanced-table).

For a more interactive Proof of Concept, look [here](https://jsfiddle.net/ouroborosDragon/dae1h5nb/).

#### 1.2.1 Usecase

In some cases, components have nested hierarchies of focusable elements where it would not make sense to `Tab` through each element individually.

![](https://i.imgur.com/K4zFOX0.png)

For instance, in the picture above, imagine using `Tab` to go through each of the side buttons, folders, subfolders, and files until you get to your desired destination in the Visual Studio Code editor. Navigating this way would be tedious and inefficient.

#### 1.2.2 Tabbing through top-level components

Instead it would make more sense to only be able to `Tab` through top level components like so:
![](https://camo.githubusercontent.com/5c3eed1ca276eb11be2e7cee9ce1c9e2f56c9f26/68747470733a2f2f692e696d6775722e636f6d2f71426e716131342e676966)

Child elements are excluded from tabbing order with `tabindex='-1'`

#### 1.2.3 Navigating through child elements

We introduce a third focus management system here called `list-focus` to take care of navigation through child elements. In this system:
- List (`rv-focus-list`): the parent (top level) component
- Item (`rv-focus-item`): each child component is an `rv-focus-item`

To implement this system on your component simply add the `rv-focus-list` class to the parent component and the `rv-focus-item` class to all the immediate child components that you want highlighted. RAMP will take care of the rest.

Lists can be either horizontal or vertical.
- *Horizontal Lists:* navigate through child elements using the `Right` and `Left` arrow keys
- *Vertical Lists:* navigate through child elements using the `Up` and `Down` arrow keys

When navigating through child elements, child elements are *highlighted*, mimicking focus for the sighted user. For screenreaders to mimic focus, the [`aria-activedescendant`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-activedescendant_attribute) attribute is added to the highlighted item, and removed when it is unhighlighted.

**Example**

![](https://camo.githubusercontent.com/b80e526c5f3ad1b251087dcc4780a855945a5955/68747470733a2f2f692e696d6775722e636f6d2f59775145786b662e676966)

In the GIF above,

The `rv-focus-list` (top level component) is the list of changed files. It is focused on a `Tab`.

![](https://i.imgur.com/wlYSrfl.png)

An `rv-focus-item` would be a changed file along with its controls. Each item is highlighted on an `Up`/`Down` arrow since the `list` is vertical.

![](https://i.imgur.com/AkLZaYc.png)

#### 1.2.4 Navigating Within Child Elements

When a child element is highlighted, its controls are made to be tab-able by being assigned `tabindex='0'`. Thus, when an item is highlighted, a user should be able to tab through its controls.

**Example**

![](https://camo.githubusercontent.com/b80e526c5f3ad1b251087dcc4780a855945a5955/68747470733a2f2f692e696d6775722e636f6d2f59775145786b662e676966)

For the following `rv-focus-item`:

![](https://i.imgur.com/AkLZaYc.png)

the user was simply able to `Tab` through the controls (e.g. the `+` button) when the `rv-focus-item` highlighted as shown in the GIF.

#### 1.2.5 Exiting out of list navigation

There are three scenarios where a user might want to exit list focus (outlined below). RAMP allows a user to do so in all three scenarios, ensuring compliance with **Guideline 2.1.2** in the [Summary Matrix](#_9-summary-matrix).

**1. When the `rv-focus-list` is focused:**

- Simply press `Tab` or `Shift` + `Tab` to navigate from the focused `rv-focus-list`.

**2. When an `rv-focus-item` is highlighted:**

- Simply press `Tab` or `Shift` + `Tab` to navigate from the focused `rv-focus-list` and unhighlight the highlighted `rv-focus-item`.
- This works because the highlight simply mocks focus so the `rv-focus-list` still has focus in the DOM.

**3. When an `rv-focus-item`'s control is focused:**

- This refers to a scenario like [1.2.4](#_1-2-4-navigating-within-child-elements). Simply `Tab` through all the controls until you reach the last

---

## 2. Dropdown Menus

Angular Material dropdown menus do not behave as `rv-focus-lists` since their menu items are focusable elements. Thus `list-focus` should not be applied to track them.

Angular Material dropdown menus also do not behave as `Map Components` since they  are not permanently present in the DOM. Thus they need to be excluded from being tracked by `app-focus`. This can be done by adding a special attribute to the menu container. `app-focus` checks if the focused element is a descendant of the marked container and discards it if it is.

---

## 3. Keyboard Navigation - Map Identify

When the map gains focus, a crosshairs marker is displayed in the center of the map. Arrow keys are used to move the map and `+` / `-` keys to zoom in and out. On `Enter`, if a feature is present under the crosshairs, it is selected and its associated data is displayed in the Details panel.

![](https://i.imgur.com/2NNQPGo.png)

Tooltips will be shown for supported features when the crosshairs marker is positioned over them.

![](https://i.imgur.com/l4CGukb.png)

---

## 4. Text

RAMP is a highly visual application. In order to be accessible, text is used throughout RAMP when necessary as an alternative means of communication.

### 4.1 Guiding Text for Controls and Inputs

#### 4.1.1 Tooltips for Buttons

![](https://i.imgur.com/IswwNMp.png)

Buttons on RAMP that do not have button text should have tooltips with their name / purpose. Tooltips use the [`mdTooltip`](https://material.angularjs.org/1.1.1/api/directive/mdTooltip) directive and have an `aria-label` attribute on the `md-button`. This ensures that **Guideline 1.1.1 (Controls, Input)** in the [Summary Matrix](#_9-summary-matrix) is followed.

#### 4.1.2 Input Placeholders and Instructions

![](https://i.imgur.com/5Oj5xnY.png)

All input fields on RAMP should have descriptive placeholder text (in the above example this would be `File URL*`). Additionally, instructions can be used to make the purpose of the input field clearer (in the above example this would be `GeoJSON, CSV or zipped Shapefile` ).

This ensures that **Guideline 1.1.1 (Controls, Input)** as well as **Guideline 3.3.2** in the [Summary Matrix](#_9-summary-matrix) is followed.


#### 4.1.3 Error Identification and Suggestions

All input fields and other submissions of data (e.g. a file upload) on RAMP should display an error to the user in text. If known, alternate input suggestions in order to correct the error should be displayed.

This ensures that **Guideline 3.3.1** as well as **Guideline 3.3.3** in the [Summary Matrix](#_9-summary-matrix) is followed.


![](https://i.imgur.com/ZD3OQur.png)

In the above example, a URL for a `CSV ` file is supplied but the `GeoJSON` file format is selected. The error `Incorrect file format` is displayed in text. The File Format selector has alternate input suggestions built in so the user is able to correct the error easily.


#### 4.1.4 Complicated Controls - Help Docs

Some controls are more complicated than an input field or a button. They cannot be described with labels and brief instructional text. In these instances, the user can be given instructions using the [RAMP Help Docs](/../ui-overview#_3-10-help-information) which show up as a pop up dialog accessible from the [Side Menu](/../ui-overview#_3-side-menu). An example of a control that is described in this way is the [Keyboard Accessible Map Identify](#_3-keyboard-navigation-map-identify).

---

### 4.2 Text alternatives for Sensory Characteristics

For all RAMP content and information that is sensory (i.e not text-based in nature) there should be a text-based alternative. This ensures that **Guideline 1.3.3** in the [Summary Matrix](#_9-summary-matrix) is followed.

#### 4.2.1 Example - Map Points

Map Points convey a lot of information visually. A sighted user could determine their geographical location and map their symbology to the legend with a glance.

To make them more accessible, both the [Datagrid](/../ui-overview#_6-enhanced-table) as well as the [Details Panel](/../ui-overview#_7-details-panel) provide text-based information (including their name and latitude/longitude data).

#### 4.2.2 Example - Image Text Alternatives

All non-decorative RAMP images need the [`alt`](https://www.w3schools.com/tags/att_img_alt.asp) attribute with descriptive text for the image.

Basemap images automatically do this through the config with the `altText` attribute.

#### 4.2.3 Example - Images of Text

In addition to this, images of text should be avoided when conveying content in order to comply with **Guideline 1.4.5** in the [Summary Matrix](#_9-summary-matrix).
- **Note:** images of text are fine when conveying non-content information (e.g. a logo)

WMS layers usually have images of text on the [Legend / Layers Panel](/../ui-overview#_5-layers-panel) by default.

<figure style="border: thin #c0c0c0 solid;
    display: flex;
    flex-flow: column;
    padding: 5px;
    max-width: 400px;
    margin: auto;">
  <img src="https://user-images.githubusercontent.com/25359812/59787939-9391c900-9298-11e9-900f-cd35c71286a1.png" alt="Trulli">
  <figcaption style="    background-color: #222;
    color: #fff;
    font: italic sans-serif;
    padding: 5px;
    text-align: center;">e.g. the legend images here contain text that has important information about different types of railway tracks</figcaption>
</figure>
<br><br>
This should be avoided by replacing the default legend with a with a custom layer legend through the config if possible. This way you can control the icons and text that show up on the legend for each entry, ensuring accessibility.

See `map/properties/legend/1/all_props/root/properties/children/items/2` in the [config schema](https://fgpv-vpgf.github.io/schema-to-docs/).

#### 4.2.4 Exception - Decoration, Formatting, Invisible

For content that is purely decorative, developers should find a way for assistive technology to *ignore* it, NOT use text to explain it. RAMP does this by using CSS for all decoration and formatting where possible. Following this would ensure compliance with **Guideline 1.1.1 (Decoration, Formatting, Invisible)** in the [Summary Matrix](#_9-summary-matrix).

---

### 4.3 Links

> The purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined link context, except where the purpose of the link would be ambiguous to users in general

#### 4.3.1 Example - Side Menu Github Link

![](https://i.imgur.com/PyPFgKM.png)

The [Side Menu](/../ui-overview#_3-side-menu) has a link to the `fgpv-vpgf` Github repository. The purpose of the link can easily be determined by the Github icon next to it.


Following this would ensure compliance with **Guideline 2.4.4** in the [Summary Matrix](#_9-summary-matrix).

---

### 4.4 Headings

All panels should have a Heading / Title. If the content of panels is text heavy, subheadings are advised. Following this would ensure compliance with **Guideline 2.4.6** in the [Summary Matrix](#_9-summary-matrix).


#### 4.4.1 Example - Legend (Heading)

![](https://i.imgur.com/eFtwQBu.png)

The content of the Legend is not text-heavy, but it still has a title (`Layers`) to help describe the information within it.


#### 4.4.2 Example - Help Dialog (Heading and Subheadings)

![](https://i.imgur.com/lLTeMpt.png)

The content of the help dialog is text heavy and has subheadings to make it more readable.

---

### 4.5 Text Formatting

#### 4.5.1 Contrast

RAMP complies with **Guideline 1.4.3** by ensuring that `text color:background color` is at least `4.5:1` for ALL text on RAMP using [this tool](https://webaim.org/resources/contrastchecker/).

If either your background/your text has an opacity of less than 1, use the RGB color values, [convert values to HSLA](http://hslpicker.com/#f200ff) and then check the contrast ratio using [this tool](https://contrast-ratio.com/).

#### 4.5.2 Resize Text

RAMP complies with **Guideline 1.4.4** by meeting the following success criterion:

> Except for captions and images of text, text can be resized without assistive technology up to 200 percent without loss of content or functionality.

Since all major browsers support a zoom feature now, meeting this criterion is as simple as checking if a newly added piece of text to RAMP resizes on each zoom level up to a zoom level of `200%`. This guideline applies to ALL text on RAMP (including but not limited to
panels, the map, tooltips, hovertips, and input placeholder text).


### 4.6 Text Alternatives for Color Indicators

This section is very similar to [4.2](#_4-2-text-alternatives-for-sensory-characteristics). If there is information being conveyed to a sighted user through the use of colour, RAMP ensures that this information is also conveyed through text. Following this ensures compliance with **Guideline 1.4.1** in the [Summary Matrix](#_9-summary-matrix).

#### 4.6.1 Example - Wrong File Type

![](https://i.imgur.com/ZD3OQur.png)

Errors in RAMP are conveyed to sighted users through a red colour. They are also conveyed through text (e.g. `Incorrect file format`) for non-sighted users.

---

## 5. Predictable Triggers of Change

When implementing features with focusable components and inputs make sure to follow **Guideline 3.2.1** and **Guideline 3.2.2** in the [Summary Matrix](#_9-summary-matrix).

RAMP takes care of this by ensuring everything that triggers a change of context is a button ensuring predictability.

### 5.1 Submit Buttons

Submit buttons are best used when settings are changed via an input field. File or service uploads (e.g.the [Layer Import Wizard](/../ui-overview#_5-1-add-layer-layer-import-wizard)) are also a good use case for Submit buttons because layer uploads trigger a change of context on the map.

#### 5.1.1 Example 1 - Apply to Map

When the datagrid is filtered, the map is not automatically filtered (this would be a change of context). The apply to map button on the [Datagrid](/../ui-overview#_6-enhanced-table) is used to ask the user permission to apply the Datagrid's changes to the table ensuring predictability.

#### 5.1.2 Example 2 - Reload Button

When the refresh interval on the [Settings Panel](/../ui-overview#_5-18-layer-settings-panel) is changed via input, the map points are not automatically reloaded at a new interval until the user presses the `Reload` button. The `Reload` button acts as a predictable trigger to activate a new reload frequency.

---

### 5.2 Toggle Buttons and Sliders

Toggle buttons are best used when there are two options for a setting (e.g. visibility). Sliders are best used when all the options fall within a numerical range (e.g. opacity).

#### 5.2.1 Example - Visibility Toggles

Visibility toggles are used on the [Legend / Layers Panel](/../ui-overview#_5-layers-panel) in order to change the visibility of a layer or symbology. The use of a toggle button here is intuitive and works as a predictable trigger.

If this were implemented as an input field or as a dropdown menu, it would need an additional `Submit` button in order to be predictable.

#### 5.2.2 Example - Settings Slider

The Opacity Settings slider is used on the [Settings Panel](/../ui-overview#_5-18-layer-settings-panel) in order to change the opacity of a layer or symbology. The use of a slider here is intuitive and works as a predictable trigger.

If this were implemented as an input field, it would need an additional `Submit` button in order to be predictable.

---

### 5.3 Exceptions

If your feature is such that context changes need to be triggered on focus or input (i.e. no version of a `Submit` button or `Toggle` button can trigger a change), make sure there is some text describing the behaviour of the trigger.

If applicable, the [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-describedby_attribute) attribute should be used to indicate the `id` of the element that describes the object.
---

## 6. Time Based Features

If you are implementing a Time Based feature, make sure that they follow **Guideline 2.2** and **Guideline 2.3** in the [Summary Matrix](#_9-summary-matrix).

As an example, there are currently two time based features on RAMP:
- Refresh Intervals
- Toasts

---

### 6.1 Refresh Intervals

[Refresh Intervals](/../ui-overview#_-5-18-7-layer-refresh-interval) comply with WCAG 2.0 AA guidelines for time based features because their timing is adjustable and can be stopped.

Additionally, since the interval is determined by the user, RAMP itself would comply with **Guideline 2.3** even if the user sets the interval to be `0.05` (3 seconds) or less.

---

### 6.2 Toasts

Toasts are notifications that pop up on an error or as a warning.

![](https://i.imgur.com/VeJqqCh.png)

RAMP uses the [`md-toast`](https://material.angularjs.org/1.1.10/demo/toast) to implement this. When implementing toasts, make sure they have a `Close` button so that they comply with the WCAG 2.0 AA guidelines.

---

## 7. HTML Components

### 7.1 Parsing

**Guideline 4.1.1** in the [Summary Matrix](#_9-summary-matrix) states that:

> In content implemented using markup languages, elements have complete start and end tags, elements are nested according to their specifications, elements do not contain duplicate attributes, and any IDs are unique, except where the specifications allow these features.

#### 7.1.1 Unique ID generation:

If multiple `HTMLElements` are generated for the same type of component and each of these elements need a unique `id`, RAMP uses random numbers to generate unique `ids`.

##### 7.1.1.1 Example - Panels

RAMP generates a minimum of 8 `Panels` per `mapInstance`. Each `Panel`'s `HTMLElement` needs a unique ID in order to be easily accessible by users of the RAMP API.

To meet this requirement while still maintaining unique `ids`, an `id` is randomly generated like so:
```javascript
'PanelElem' + Math.round(Math.random() * 100000000).toString()
```
and is assigned to each `Panel`'s `HTMLElement`.

---

### 7.2 Making Visual Information and Relationships Accessible

Following this section will ensure compliance with **Guideline 1.3.1** as well as **Guideline 4.1.2** in the [Summary Matrix](#_9-summary-matrix).

Feel free to look at [HTML and accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML) as well as [WAI-ARIA basics](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/WAI-ARIA_basics) as a supplement to this section.


#### 7.2.1 Automatically Determined -  Good Semantics

The easiest way to make sure your UIs are presented accessibly is to use the correct HTML tag for your use case. Here are some common UI components with tips and resources for implementation.

| UI Component     | Tips & Resources                                                                               |
|------------------|------------------------------------------------------------------------------------------------|
| Links            | Use the HTML [`a`](https://www.w3schools.com/tags/tag_a.asp) element.  If you are linking via a button, use the [`button`](https://www.w3schools.com/tags/tag_button.asp) element instead.  |
| Headings         | Use the HTML  `<h1>`-`<h6>` for all headings.                                                                                             |
| Paragraphs       | Use the HTML [`p`](https://www.w3schools.com/html/html_paragraphs.asp) element instead of relying solely on a combination of `<br>` and `<div>` elements.                                                                                                |
| Lists            | Use [HTML lists](https://www.w3schools.com/html/html_lists.asp). Follow these [tips](https://webaim.org/techniques/semanticstructure/#correctly) to use them correctly.                                                                                               |
| Bolded and Italicized Text |  Use `<strong>` and `<em>` according to [these tips](https://webaim.org/techniques/semanticstructure/#correctly)

Using the correct HTML tag [takes care](https://squizlabs.github.io/HTML_CodeSniffer/Standards/WCAG2/4_1_2#html-elements) of having to specify the name of your UI as well as its `role`, `value` and `state` (if any) automatically.

However, if following these tips is not possible for your particular use case, look at [`WAI-ARIA roles`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles) for alternate ways to achieve accessibility. (e.g. the [aria heading role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/heading_role) for headings).


#### 7.2.2 Custom UI Components - WAI-ARIA

More complicated UIs and/or custom UIs often need one or more of their *name*, *role*, *value*, *state* defined explicitly upon implementation.

**Hint:** This is is often the case for UIs implemented with multiple nested `divs` defining visual groupings.

##### 7.2.2.1 Example - Tables

Following the default markup for tables actually [leads to *bad* semantics](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML#Accessible_data_tables). In order to achieve accessibility for tables use [`WAI-ARIA roles`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles) (i.e. `table`, `gridcell`, `row`, `rowgroup`).

- [Example Table](https://www.w3.org/TR/wai-aria-practices/examples/table/table.html#ex_label)


#### 7.2.3 Text Indicators

If UI Elements and/or relationships are impossible to define programatically (i.e. via the correct HTML elements or `WAI-ARIA Roles`), use text to label the UI element or to indicate the relationship.

Example:
> A form contains several required fields. The labels for the required fields are displayed in red. In addition, at the end of each label is an asterisk character, \*. The instructions for completing the form indicate that "all required fields are displayed in red and marked with an asterisk \*", followed by an example.

[Source](https://www.w3.org/TR/UNDERSTANDING-WCAG20/content-structure-separation-programmatic.html#content-structure-separation-programmatic-examples-head)

---

### 7.3 Language of Parts

#### 7.3.1 Default RAMP Coverage

In order to meet **Guideline 3.1.2** RAMP has:
- a `lang` attribute on the map container specifying the current map language at all times
- a `lang` attribute on the [Side Menu's](/../ui-overview#_3-side-menu)  English/French toggle buttons

#### 7.3.2 Coverage for Future Features and Plugins

Authors of new features and plugins should ensure that any text on their feature/plugin either has:
- English / French translations that change on toggle
- a `lang` attribute for each piece of text that does not change on toggle
    - **e.g.** Text that is always in English
    - **e.g.** Text that is always in another language, for example Spanish.


#### 7.3.3 Map Author Responsibilities

RAMP does NOT cover accessibility if the Map Author adds a service via the `config` that is in a different language from RAMP. It is their responsibility to add the appropriate English/French services to the `config`.

#### 7.3.4 User Responsibilities

RAMP does NOT cover accessibility if  the user loads a service or file via the [Layer Import Wizard](/../ui-overview#_5-1-add-layer-layer-import-wizard) that is in a different language from RAMP. It is their responsibility to load the appropriate English/French services or files.

---

## 8. Focus Indicators

All user interfaces on RAMP are keyboard operable, thus they should all have a keyboard focus indicator in order to comply with **Guideline 2.4.7** in the [Summary Matrix](#_9-summary-matrix).

Here are some common focus indicators when a keyboard user changes focus on RAMP.

### 8.1 Buttons

Focused buttons usually display a tooltip as well as a ripple effect. This is automatically taken care of if your button is an [`<md-button>`](https://material.angularjs.org/1.1.2/api/directive/mdButton) with an [`<md-tooltip>`](https://material.angularjs.org/1.1.1/api/directive/mdTooltip) nested inside it.

![](https://i.imgur.com/o0AwMsR.png)

---

### 8.2 Inputs

Inputs on RAMP turn from their default light grey to RAMP's primary color `#607D8B` on focus like so:

![](https://i.imgur.com/lQHBujC.png)
![](https://i.imgur.com/ycStCMv.png)

---

### 8.3 Lists and Large Section Focuses

#### 8.3.1 Lists

[More on List Navigation](#_1-2-within-component-navigation)

Simply add the `list` class to the component you want `list-focus` to take care of. On focus, this is how the `list` will appear. (In this case the list is the header row of the [Datagrid](
/../ui-overview#_6-enhanced-table))

![](https://i.imgur.com/UWS4Ncb.png)

#### 8.3.2 Non-Lists

Sometimes you'll want non-lists (e.g. large sections) that you want focused to have a similar focus ring.

This can be achieved with `border: 1px solid #607d8b` CSS for that component.

---

### 8.4 List Items (Highlights)

[More on List Navigation](#_1-2-within-component-navigation)

Simply add the `rv-focus-item` class to the children of `rv-focus-list` that you want arrow keys to highlight. `list-focus` The`aria-activedescendant` attribute is automatically added so that screenreaders can pick up on the highlights.

Over here, the OBJECTID header cell (**i.e.** the `rv-focus-item`) has been highlighted.

![](https://i.imgur.com/6KrCUMD.png)

---

### 8.5 Drop Down Menus

Dropdown menus throughout RAMP use the [mdMenu](https://material.angularjs.org/1.1.2/api/directive/mdMenu) directive. Focuses for dropdown menus will stay consistent if you use this.

![](https://i.imgur.com/ZdFYyZA.png)

---

### 8.6 Exceptions / Within Feature Consistency

There are exceptions throughout the app. For instance, pictured below is a Basemap Selector button from the [Side Menu](
/../ui-overview#_3-side-menu) that is focused using a focus ring as described in [8.3](#_8-3-lists-and-large-section-focuses) instead of a ripple as described in [8.1](#_8-1-buttons).

![](https://i.imgur.com/Ka9MZX3.png)

If a feature you are developing for has similar exceptions, prioritize staying consistent within the feature first.

---

## 9. Summary Matrix

<style type="text/css">
.tg  {border-collapse:collapse;border-spacing:0;}
.tg td{font-family:Arial, sans-serif;font-size:14px;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}
.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}
.tg .tg-c3ow{border-color:inherit;text-align:center;vertical-align:top}
.tg .tg-85yz{font-weight:bold;font-size:16px;background-color:#9b9b9b;border-color:#333333;text-align:left;vertical-align:top}
.tg .tg-gekp{font-weight:bold;font-size:16px;background-color:#9b9b9b;border-color:#333333;text-align:center;vertical-align:top}
.tg .tg-6e8n{font-weight:bold;background-color:#c0c0c0;border-color:inherit;text-align:left;vertical-align:top}
.tg .tg-y698{background-color:#efefef;border-color:inherit;text-align:left;vertical-align:top}
.tg .tg-0pky{border-color:inherit;text-align:left;vertical-align:top}
.tg .tg-c6of{background-color:#ffffff;border-color:inherit;text-align:left;vertical-align:top}
.tg .tg-3xi5{background-color:#ffffff;border-color:inherit;text-align:center;vertical-align:top}
</style>
<table class="tg" style="undefined;table-layout: fixed; width: 984px">
<colgroup>
<col style="width: 419px">
<col style="width: 258px">
<col style="width: 307px">
</colgroup>
  <tr>
    <th class="tg-85yz">WCAG 2.0 AA Accessibility Checkpoint</th>
    <th class="tg-gekp">RAMP Responsibility?<br></th>
    <th class="tg-gekp">Host Page / Map Author Responsibility?</th>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 1.1 Text Alternatives</td>
  </tr>
  <tr>
    <td class="tg-y698" colspan="3"><a href="http://www.w3.org/TR/WCAG20/#text-equiv-all">1.1.1 Non-text content</a></td>
  </tr>
  <tr>
    <td class="tg-0pky"><br>Controls, Input</td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 4.1.1 and  4.1.2</td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky">Time-Based Media</td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky">Test</td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky">Sensory</td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky">CAPTCHA</td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky">Decoration, Formatting, Invisible</td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 4.2.4<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 1.2 Time-based Media<br></td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#media-equiv-av-only-alt">1.2.1 Audio-only and Video-only (Prerecorded)</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#media-equiv-captions">1.2.2 Captions (Prerecorded)</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#media-equiv-audio-desc">1.2.3 Audio Description or Media Alternative (Prerecorded)</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#media-equiv-real-time-captions">1.2.4 Captions (Live)</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#media-equiv-audio-desc-only">1.2.5 Audio Description (Prerecorded)</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 1.3 Adaptable</td>
  </tr>
  <tr>
    <td class="tg-c6of"><a href="http://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic">1.3.1 Info and Relationships</a></td>
    <td class="tg-3xi5">✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>7.2<br></td>
    <td class="tg-3xi5">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#content-structure-separation-sequence">1.3.2 Meaningful Sequence</a></td>
    <td class="tg-c3ow"><br>✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>1<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#content-structure-separation-understanding">1.3.3 Sensory Characteristics</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 4.2<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 1.4 Distinguishable</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-without-color">1.4.1 Use of Color</a></td>
    <td class="tg-c3ow"><br>✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>4.6</td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-dis-audio">1.4.2 Audio Control</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-c6of"><a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast">1.4.3 Contrast (Minimum)</a></td>
    <td class="tg-3xi5">✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>4.5.1</td>
    <td class="tg-3xi5">❌</td>
  </tr>
  <tr>
    <td class="tg-c6of"><a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-scale">1.4.4 Resize text</a></td>
    <td class="tg-3xi5">✔️<br><span style="font-weight:bold">RAMP Guidelines: </span>4.5.2</td>
    <td class="tg-3xi5">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-text-presentation">1.4.5 Images of Text</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 4.2.3<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 2.1 Keyboard Accessible</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#keyboard-operation-keyboard-operable">2.1.1 Keyboard</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 1, 2, 3<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#keyboard-operation-trapping">2.1.2 No Keyboard Trap</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>1.1 and 1.2.5<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 2.2 Enough Time</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#time-limits-required-behaviors">2.2.1 Timing Adjustable</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>6<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><br><a href="http://www.w3.org/TR/WCAG20/#time-limits-pause">2.2.2 Pause, Stop, Hide</a><br></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>6<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 2.3 Seizures</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#seizure-does-not-violate">2.3.1 Three Flashes or Below Threshold</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>6<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 2.4 Navigable</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-skip">2.4.1 Bypass Blocks</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-title">2.4.2 Page Titled</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-order">2.4.3 Focus Order</a></td>
    <td class="tg-c3ow"><br>✔️<br><span style="font-weight:bold">RAMP Guidelines:</span> 1</td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-refs">2.4.4 Link Purpose (In Context)</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 4.3<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-mult-loc">2.4.5 Multiple ways</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-descriptive">2.4.6 Headings and Labels</a></td>
    <td class="tg-c3ow"><br>✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span> 4.4</td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-visible">2.4.7 Focus Visible</a></td>
    <td class="tg-c3ow"><br>✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>8</td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 3.1 Readable</td>
  </tr>
  <tr>
    <td class="tg-c6of"><a href="http://www.w3.org/TR/WCAG20/#meaning-doc-lang-id">3.1.1 Language of Page</a></td>
    <td class="tg-3xi5">❌</td>
    <td class="tg-3xi5">❌</td>
  </tr>
  <tr>
    <td class="tg-c6of"><a href="http://www.w3.org/TR/WCAG20/#meaning-other-lang-id">3.1.2 Language of Parts</a></td>
    <td class="tg-3xi5">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 7.3</td>
    <td class="tg-3xi5">❌</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 3.2 Predictable</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-receive-focus">3.2.1 On Focus</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>5<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-unpredictable-change">3.2.2 On Input</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines: </span>5<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-locations">3.2.3 Consistent Navigation</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-functionality">3.2.4 Consistent Identification</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 3.3 Input Assistance</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#minimize-error-identified">3.3.1 Error Identification</a></td>
    <td class="tg-c3ow">✔️<br><span style="font-weight:bold">RAMP Guidelines:</span> 4.1.3<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#minimize-error-cues">3.3.2 Labels or Instructions</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 4.1.2</td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#minimize-error-suggestions">3.3.3 Error Suggestion</a></td>
    <td class="tg-c3ow">✔️<br><span style="font-weight:bold">RAMP Guidelines:</span> 4.1.3<br></td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#minimize-error-reversible">3.3.4 Error Prevention (Legal, Financial, Data)</a></td>
    <td class="tg-c3ow">❌</td>
    <td class="tg-c3ow">✔️</td>
  </tr>
  <tr>
    <td class="tg-6e8n" colspan="3">Guideline 4.1 Compatible</td>
  </tr>
  <tr>
    <td class="tg-0pky"><a href="http://www.w3.org/TR/WCAG20/#ensure-compat-parses">4.1.1 Parsing</a></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 7.1</td>
    <td class="tg-c3ow">❌</td>
  </tr>
  <tr>
    <td class="tg-0pky"><br><a href="http://www.w3.org/TR/WCAG20/#ensure-compat-rsv">4.1.2 Name, Role, Value</a><br></td>
    <td class="tg-c3ow">✔️<br><br><span style="font-weight:bold">RAMP Guidelines:</span> 7.2</td>
    <td class="tg-c3ow">❌</td>
  </tr>
</table>
