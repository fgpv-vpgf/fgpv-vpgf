# Panel API Demo Outline:

### Creating and Opening the Panel:

- First we create the panel on a map instance. We can check if it got added by looking at the panel registry.
- For demo purposes, I have subscribed to all of the observables in this API which you can see fire in the console.
    ```

    RZ.mapInstances[0].createPanel('panel1');
    RZ.mapInstances[0].panelRegistry[0].id;
    RZ.mapInstances[0].panelRegistry[0].observableSubscribe(); //[ONLY FOR DEMO PURPOSES]
    
    ```        

- Once the panel is created, we need to set its position on the map and open it. 
    ```

    RZ.mapInstances[0].panelRegistry[0].setPosition(25, 288);
    RZ.mapInstances[0].panelRegistry[0].open();

    ```

- ***Observables:*** opening, closing, width changed, height changed, position changed

### Adding Controls and Contents (PanelElems, Btns, and Shortcuts):

- ***PanelElems*** such as Btns, text, pictures etc can be added either as Panel controls or content.
    - PanelElems can be `string`, `HTMLElement`, `JQuery<HTMLElement>`
    

    ```

    let panelElem1 = new RZ.PanelElem("Title");
    let panelElem2 = new RZ.PanelElem($("<div>Contents:</div>"));
    let panelElem3 = new RZ.PanelElem($.parseHTML('<input type="text" value="Search..." id="coolInput"></input>'));
    let panelElem4 = new RZ.PanelElem($('<p>Controls:</p>'))
    let imgElem = new RZ.PanelElem($("<img id='coolImg' src='https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg?auto=compress&cs=tinysrgb&h=350'></img>"));

    ```
    
- ***Btns*** can be set to SVG or text (uniform sizes)

    ```

    let btn = new RZ.Btn();
    btn.text = "Btn.";
    $(btn.element).click(function () {
        alert('Btn element clicked!')
    });

    
    //setting up the SVG icon
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let svgNS = svg.namespaceURI;
    var rect = document.createElementNS(svgNS,'rect');
    rect.setAttribute('x',5);
    rect.setAttribute('y',5);
    rect.setAttribute('width',500);
    rect.setAttribute('height',500);
    rect.setAttribute('fill','#ff0000');
    svg.appendChild(rect);

    //assigning it to the btn2
    let btn2 = new RZ.Btn();
    btn2.icon = svg;

    ```

- ***Shortcuts:***  control dividers '|', toggle 'T', close 'x'

    ```
    //content setup
    let closeBtn = new RZ.PanelElem('x');
    $(panelElem2.element).append($("<br>"));
    $(panelElem2.element).append($("<br>"));
    $(panelElem2.element).append(btn.element);
    $(panelElem2.element).append(btn2.element);
    $(panelElem2.element).append($("<br>"));
    $(panelElem2.element).append($("<br>"));
    $(panelElem2.element).append(imgElem.element);

    ```


- ***Set/Get Controls:***  panel controls set as a list of PanelElems
    
    `RZ.mapInstances[0].panelRegistry[0].controls = [closeBtn, new RZ.PanelElem('|'), new RZ.PanelElem('T'), panelElem1, new RZ.PanelElem($('<br>')), panelElem4, panelElem3];`

    `RZ.mapInstances[0].panelRegistry[0].controls;`

- ***Set/Get Content:*** panel contents are a single PanelElem
    
    `RZ.mapInstances[0].panelRegistry[0].content = panelElem2;`

    `RZ.mapInstances[0].panelRegistry[0].content;`

### Available Spaces 

- ***Setup:*** 

    ```

    RZ.mapInstances[0].createPanel('panel2');
    RZ.mapInstances[0].panelRegistry[1].setPosition(0, 105);
    RZ.mapInstances[0].panelRegistry[1].setMinPosition(20, 85);
    RZ.mapInstances[0].panelRegistry[1].open();

    RZ.mapInstances[0].createPanel('panel3');


    ```

- ***Static method uses:***

    ```

    let panelRegistry = RZ.mapInstances[0].panelRegistry;

    RZ.Panel.availableSpaces(2,3);    
    RZ.Panel.availableSpaces(2,3, panelRegistry); //checking dimensions for specific map instance

    ```

- ***Non static method use:*** for a specific panel instance. 

    - no height, width or position set: 
        `RZ.mapInstances[0].panelRegistry[2].availableSpaces();`
    
    - position is set: 
        `RZ.mapInstances[0].panelRegistry[0].availableSpaces();`
    
    - when checking if panel instance is another dimension: 
        `RZ.mapInstances[0].panelRegistry[0].availableSpaces(2, 3);`
    
    -when min position is set: 
        `RZ.mapInstances[0].panelRegistry[1].availableSpaces();`

### Conflict Detection and Error Handling
- If we try to mess with things: 
    - Setting a min that's not a subset of actual position
    - Opening a panel whose min is within another panel's min
    - If a panel overlaps, autoshrinking to adjust
    - Setting position out of bounds of grid
    - I made a list of user errors that it detects

-Lastly here's the documentation page I have so far 