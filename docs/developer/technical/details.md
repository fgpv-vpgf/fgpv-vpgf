![](./images/technical/details.png) ![](./images/technical/details-alt-open.png) ![](./images/technical/details-alt.png) ![](./images/technical/details-railway.png)

The code source we'll be discussing here can be found in the `src/app/ui/details/` folder.

The details panel displays feature data from an identify result or by clicking on the `detail` button in a data table row. Data is visualized differently depending on the requestors format:
- Key-value list for EsriFeatures
- As plain text with automatic link detection
- As HTML

As you can see in the screenshots above, #3 displays its data differently than #4. In general we want to try supporting a wide range of data types while presenting the data as best we can for the user.

### details-content.directives.js

Responsible for rendering the data in one of three formats as discussed above. See the `details-content.html` file for how different formats are handled.

### details-header.directive.js

Implements the small title section as seen in the #1 yellow box. 

### detail.service.js

Handles the creation of the `$mdDialog` for the popup view of the details panel (activated by pressing the button in #1 green). It also handles the logic when the details panel is closed, switching to the layer list if open beneath it, or closing the panel, and clearing any identify highlighting.

### details.directive.js

This is the central file which handles:
- Watches for display data changes and selects the item for display
- Makes `detailService` helper methods available to the template
- Restores previously selected data if a user returns after closing the panel

### layer-list-slider.directive.js

The `rvLayerListSlider` directive handles the in/out sliding of the details panel. The panel slides open when either any point layer is focused or on mouseover. It closes when no point layers have focus, no mouseover, or the user clicked on a point layer. You can see the slider closed in image #1 and expanded in #2.