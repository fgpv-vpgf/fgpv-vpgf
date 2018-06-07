# Panel API Demo Outline:

### Creating and Opening the Panel:

- first create a panel on the map -> you pass in an ID and that id and map object get passed to constructor
    `RZ.mapInstances[0].createPanel('panel1');`
    `RZ.mapInstances[0].panelRegistry[0].id;`
    `RZ.mapInstance[0].panelRegistry[0].observableSubscribe(); //[ONLY FOR DEMO PURPOSES]`        

- once the panel gets created, we need to set its position on the map and open it. 
    `RZ.mapInstances[0].panelRegistry[0].setPosition(25, 70);`
    `RZ.mapInstances[0].panelRegistry[0].open();`

- ***Observables:** opening, closing, width changed, height changed, position changed

### Adding Controls and Contents (PanelElems, Btns, and Shortcuts):

- ***PanelElems*** such as Btns, text, pictures etc can be added either as controls or contents: 
    can be string, HTMLElement, JQuery<HTMLElement>
    

    ```

    let htmlInput = $.parseHTML('<input type="text" value="Search..." id="coolInput"></input>');
    let panelElem1 = new RZ.PanelElem("Title");
    let panelElem2 = new RZ.PanelElem($("<div>Contents:</div>"));
    let panelElem3 = new RZ.PanelElem(htmlInput);
    let panelElem4 = new RZ.PanelElem($('<p>Controls:</p>'))
    let imgElem = new RZ.PanelElem($("<img id='coolImg' src='https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg?auto=compress&cs=tinysrgb&h=350'></img>"));

    ```
    
    Btns can be set to SVG, text (uniform sizes)

    ```

    let btn = new RZ.Btn();
    btn.text = "Btn.";
    $(btn.element).click(function () {
        alert('Btn element clicked!')
    });

    let btn2 = new RZ.Btn();
    btn2.icon = $(<svg id='green-rect' width="300" height="200">
        <rect width="100%" height="100%" fill="green" />
    </svg>);

    ```

    Shortcuts are control dividers '|', toggle 'T', close 'x'

    ```

    let closeBtn = new RZ.PanelElem('x');
    $(panelElem2.element).append($("<br>"));
    $(panelElem2.element).append($("<br>"));
    $(panelElem2.element).append(btn.element);
    $(panelElem2.element).append(btn2.element);
    $(panelElem2.element).append($("<br>"));
    $(panelElem2.element).append($("<br>"));
    $(panelElem2.element).append(imgElem.element);

    ```


- ***Set Controls:***  panel controls set as a list of PanelElems
    
    `RZ.mapInstances[0].panelRegistry[0].controls = [closeBtn, new RZ.PanelElem('|'), new RZ.PanelElem('T'), panelElem1, new RZ.PanelElem($('<br>')), panelElem4, panelElem3];`
    `RZ.mapInstances[0].panelRegistry[0].controls;`

- ***Set Content:*** panel contents are a single PanelElem
    
    `RZ.mapInstances[0].panelRegistry[0].content = panelElem2;`
    `RZ.mapInstances[0].panelRegistry[0].content;`

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