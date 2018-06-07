# Panel API Demo:

### Creating and Opening the Panel:

- first create a panel on the map -> you pass in an ID and that id and map object get passed to constructor
    - `RZ.mapInstances[0].createPanel('panel1');`
    - `RZ.mapInstances[0].panelRegistry[0].id;`
    - `RZ.mapInstance[0].panelRegistry[0].observableSubscribe(); //[ONLY FOR DEMO PURPOSES]`        

- once the panel gets created, we need to set its position on the map and open it. 
    - `RZ.mapInstances[0].panelRegistry[0].setPosition(25, 70);`
    - `RZ.mapInstances[0].panelRegistry[0].open();`

- show of the opening and set position observables
- resize window show observables firing upon resize to show width/height of grid square

### Adding Controls and Contents (PanelElems, Btns, and Shortcuts):

- panel elements such as buttons, text, pictures etc can be added either as controls or contents
- set controls: controls are added by making a list (drop a list with some text, shortcuts, search bar)
    
    ```
    //Setting up Btns and PanelElems
    let closeBtn = new RZ.PanelElem('x');
    let panelElem4 = new RZ.PanelElem($('<p>Controls:</p>'))

    ```


        RZ.mapInstances[0].panelRegistry[0].controls = [closeBtn, new RZ.PanelElem('|'), new RZ.PanelElem('T'), panelElem1, new RZ.PanelElem($('<br>')), panelElem4, panelElem3];
        

    -set content: contents are added by creating a single PanelElement -> usually an HTMLElement/JQuery element (unless title or shortcut) that scopes
    other elements --> drop relatively complex panel element
    -briefly explain Btns (SVG and text) and how they are uniform
    -of course you can get the contents and controls (getters in console)

-Available spaces: 
    -when no position call to availableSpaces() and user doesn't supply anything
    -if user wants to compute available spaces for a supplied width and height
    -when position is defined 
    -when min position is set
    -Have values memorized so explanation flows
    -available spaces marks all position invalid where setting that grid square as a panel's top left corner would put it 
        -out of bounds of map
        -have the panels min position conflicting with another panel


-If we try to mess with things: 
    -Setting a min that's not a subset of actual position
    -Opening a panel whose min is within another panel's min
    -If a panel overlaps, autoshrinking to adjust
    -Setting position out of bounds of grid
    -I made a list of user errors that it detects

-Lastly here's the documentation page I have so far 