# Panel API Demo Outline:

### Creating and Opening the Panel:

- First we create the panel on a map instance. We can check if it got added by looking at the panel registry.
- For demo purposes, I have subscribed to all of the observables in this API which you can see fire in the console.
    ```javascript

    RZ.mapInstances[0].createPanel('panel1');
    RZ.mapInstances[0].panelRegistry[0].id;
    RZ.mapInstances[0].panelRegistry[0].observableSubscribe(); //[ONLY FOR DEMO PURPOSES]
    
    ```        

- Once the panel is created, we need to set its position on the map and open it. 
    ```javascript

    RZ.mapInstances[0].panelRegistry[0].setPosition(25, 288);
    RZ.mapInstances[0].panelRegistry[0].open();

    ```

- ***Observables:*** opening, closing, width changed, height changed, position changed

---

### Adding Controls and Contents (PanelElems, Btns, and Shortcuts):

- ***PanelElems*** such as Btns, text, pictures etc can be added either as Panel controls or content.
    - PanelElems can be `string`, `HTMLElement`, `JQuery<HTMLElement>`
    

    ```javascript

    let panelElem1 = new RZ.PanelElem("Title");
    let panelElem2 = new RZ.PanelElem($("<div>Contents:</div>"));
    let panelElem3 = new RZ.PanelElem($.parseHTML('<input type="text" value="Search..." id="coolInput"></input>'));
    let panelElem4 = new RZ.PanelElem($('<p>Controls:</p>'))
    let imgElem = new RZ.PanelElem($("<img id='coolImg' src='https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg?auto=compress&cs=tinysrgb&h=350'></img>"));

    ```
    
- ***Btns*** can be set to SVG or text (uniform sizes)

    ```javascript

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

    ```javascript

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
    - Hint: copy/paste the following only after the previous setup has been copy/pasted into the console
    
    ```javascript

    
    RZ.mapInstances[0].panelRegistry[0].controls = [closeBtn, new RZ.PanelElem('|'), new RZ.PanelElem('T'), panelElem1, new RZ.PanelElem($('<br>')), panelElem4,panelElem3];

    RZ.mapInstances[0].panelRegistry[0].controls;

    ```

- ***Set/Get Content:*** panel contents are a single PanelElem
    
    ```javascript
    
    RZ.mapInstances[0].panelRegistry[0].content = panelElem2;
    RZ.mapInstances[0].panelRegistry[0].content;
    ```

---

### Available Spaces 

- ***Setup:***
    - Hint: first refresh page to clear the previous setup.

    ```javascript

    RZ.mapInstances[0].createPanel('panel1').setPosition(64, 105);
    RZ.mapInstances[0].panelRegistry[0].open();
    RZ.mapInstances[0].createPanel('panel2');
    RZ.mapInstances[0].panelRegistry[1].setPosition(22, 63);
    RZ.mapInstances[0].panelRegistry[1].open();

    ```

- ***Static method uses:***

    ```javascript

    let panelRegistry = RZ.mapInstances[0].panelRegistry;
    RZ.Panel.availableSpaces(panelRegistry, 2,3); //checking dimensions for specific map instance
    ```

    ```javascript
    RZ.mapInstances[0].mapGrid; //compare to map grid representation (mapGrid only for debugging purposes)

    ```

- ***Non static method uses:*** for a specific panel instance. 

    - No height, width or position set (calculations based on 1x1 panel): 
        ```javascript
        RZ.mapInstances[0].createPanel('panel3');
        RZ.mapInstances[0].panelRegistry[2].availableSpaces(); //
        ````
    
    - Position is set: 
        ```javascript

        RZ.mapInstances[0].panelRegistry[1].availableSpaces(); //available spaces for 'panel2'
        ```
    
    - When checking what would happen if the panel was another width/height: 
        ```javascript
        RZ.mapInstances[0].panelRegistry[1].availableSpaces(3, 4); //available spaces for 'panel2' if it were 3x4
        ```
    
    - When a min position is set on a panel: 
        - 1 represents positions that cause overlap, -1 represents invalid positions
        ```javascript
        RZ.mapInstances[0].panelRegistry[1].setMinPosition(42,43); 

        RZ.mapInstances[0].panelRegistry[1].availableSpaces();//available spaces for 'panel2' if it had a min position
        ```

---

### Error Handling Examples:

- **Setup:**
    - Hint: first refresh page to clear the previous setup.
    ```javascript 
    RZ.mapInstances[0].createPanel('panel1');
    RZ.mapInstances[0].createPanel('panel2');
    RZ.mapInstances[0].createPanel('panel3');

    RZ.mapInstances[0].panelRegistry[0].setPosition(20, 105);
    RZ.mapInstances[0].panelRegistry[1].setPosition(20, 85);
    
    RZ.mapInstances[0].panelRegistry[0].open();

    ```

- Setting a min position that is not a subset of actual position: 

    ```javascript        
    RZ.mapInstances[0].panelRegistry[0].setMinPosition(20, 125);
    ```

- Opening a panel whose min is within another panel's min: 
    ```javascript
    RZ.mapInstances[0].panelRegistry[1].open() //within 'panel1''s min position
    ```

- Autoshrinking panels when non-min positions overlap: 
    -Alert message should pop up telling you which dimension shrunk (might need to wait a bit)
    ```javascript
    
    RZ.mapInstances[0].panelRegistry[0].setPosition(0, 105);

    RZ.mapInstances[0].panelRegistry[1].setPosition(0, 145);
    RZ.mapInstances[0].panelRegistry[1].setMinPosition(120, 145);
    RZ.mapInstances[0].panelRegistry[1].open();
    

    ```

- Setting position out of bounds of grid:
    ```javascript

    RZ.mapInstances[0].panelRegistry[1].setPosition(-1, 409);
    ```

---

### Documentation page: 

---

### Post-Demo:

- ***More Test Cases:*** 

    - Opening/closing a panel before position is set:
        ```javascript    
        RZ.mapInstances[0].createPanel('panel4');
        RZ.mapInstances[0].panelRegistry[3].open();
        RZ.mapInstances[0].panelRegistry[3].close();

        ```
    
    - Setting a position with invalid values:
        ```javascript

        RZ.mapInstances[0].panelRegistry[3].setPosition(35, 100);  //topLeft is at 6th column, bottomRight is at 1st column!

        ```

    - setMinPosition before setPosition: 
        ```javascript

        RZ.mapInstances[0].panelRegistry[3].setMinPosition(0, 65);

        ```
    
    - Setting a PanelElem to have multiple top level elements:
        ```javascript

        let panelElem1 = new RZ.PanelElem($.parseHTML('<p>Hello</p><p>there</p>')); //doesn't work

        let panelElem2 = new RZ.PanelElem($.parseHTML('<p>Hello there</p>')); //works

        let panelElem3 = new RZ.PanelElem($.parseHTML('<div>Hello<p>there</p></div>')); //works

        ```
    
- ***Explanation of Map Grid:***
    
    - 20 rows x 20 columns
    - Each grid square has a value between 0-399
    - First row: 0-19, Second row: 20-39, Third row: 40-59 and so on. 

    - ***Example:*** setPosition(25, 149); 
        - Top left corner 25: 2nd row, 6th column
        - Bottom right corner 149: 8th row, 10th column