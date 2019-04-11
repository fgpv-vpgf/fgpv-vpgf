# Panel API Tests:

- testing can be done using `panel-test.js`. Tests can be performed in the `RAMP.mapAdded.subscribe` function or in the console if need be.

### Creating and Opening the Panel:

- First we create the panel on a map instance. We can check if it got added by looking at the panel registry.
- For demo purposes, I have subscribed to all of the observables in this API which you can see fire in the console (uncomment method in panel.ts).
    ```javascript

    let panel1 = RAMP.mapInstances[0].createPanel('panel1');
    panel1.id;
    ```

- Once the panel is created, we need to set its position on the map and open it.
    ```javascript

    panel1.setPosition(25, 288); /*panel1.setPosition([5 , 1], [8, 14]);*/
    panel1.open();

    ```

- ***Observables:*** opening, closing, width changed, height changed, position changed

---

### Adding Controls and Contents (PanelElems, Btns, and Shortcuts):

- ***PanelElems*** such as Btns, text, pictures etc can be added either as Panel controls or content.
    - PanelElems can be `string`, `HTMLElement`, `JQuery<HTMLElement>`


    ```javascript

    let panelElem1 = panel1.createPanelElem("Title");
    let panelElem2 = panel1.createPanelElem($("<div>Contents:</div>"));
    let panelElem3 = panel1.createPanelElem($.parseHTML('<input type="text" value="Search..." id="coolInput"></input>'));
    let panelElem4 = panel1.createPanelElem($('<p>Controls:</p>'))
    let imgElem = panel1.createPanelElem($("<img id='coolImg' src='https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg?auto=compress&cs=tinysrgb&h=350'></img>"));

    ```

- ***Btns*** can be set to SVG or text (uniform sizes)

    ```javascript

    let btn = panel1.createBtn();
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

    let btn2 = panel1.createBtn();
    btn2.icon = svg;

    ```

- ***Shortcuts:***  control dividers '|', toggle 'T', close 'x'

    ```javascript

    //content setup
    //as you can see it is up to the user to set linebreaks if needed
    //they don't need to worry about style because elements will auto align

    let closeBtn = panel1.createPanelElem('x');
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


    panel1.controls = [closeBtn, panel1.createPanelElem('|'), panel1.createPanelElem('T'), panelElem1, panel1.createPanelElem($('<br>')), panelElem4,panelElem3];

    panel1.controls;

    ```

- ***Set/Get Content:*** panel contents are a single PanelElem

    ```javascript

    panel1.content = panelElem2;
    panel1.content;
    ```

---

### Available Spaces

- ***Setup:***
    - Hint: first refresh page to clear the previous setup.

    ```javascript
    let panel1 = RAMP.mapInstances[0].createPanel('panel1');
    panel1.setPosition(70, 111);
    panel1.open();
    let panel2 = RAMP.mapInstances[0].createPanel('panel2');
    panel2.setPosition(28, 69);
    panel2.open();
    ```

- ***Static method uses:***

    ```javascript

    let panelRegistry = RAMP.mapInstances[0].panelRegistry;
    panel1.constructor.availableSpaces(panelRegistry, 2,3); //checking dimensions for specific map instance, static
    ```

- ***Non static method uses:*** for a specific panel instance.

    - No height, width or position set (calculations based on 1x1 panel):
        ```javascript
        let panel3 = RAMP.mapInstances[0].createPanel('panel3');
        panel3.availableSpaces();
        ````

    - Position is set:
        ```javascript

        panel2.availableSpaces(); //available spaces for 'panel2'
        ```

    - When checking what would happen if the panel was another width/height:
        ```javascript
        panel2.availableSpaces(3, 4); //available spaces for 'panel2' if it were 3x4
        ```

    - When a min position is set on a panel:
        - 1 represents positions that cause overlap, -1 represents invalid positions
        ```javascript
        panel2.setMinPosition(48,49); /*panel2.setMinPosition([8,2],[9,2]);*/

        panel2.availableSpaces();//available spaces for 'panel2' if it had a min position
        ```

---
### Set Width/ Set Height Tests:

- ***Setup***
    - Hint: first refresh page to clear the previous setup.
    ```javascript
    let panel1 = RAMP.mapInstances[0].createPanel('panel1');
    panel1.setPosition(30, 155);
    panel1.open();
    ```

- ***set width and height:***
    ```js
    panel1.width = "50%";
    panel1.height = 200;
    ```

- ***Available Spaces should remain the same***:
    ```js
    panel1.availableSpaces();  //expect calculation based on a 6 x 7 panel
    ```

- ***Resizing window:*** panel proportions preserved according to set width and height (consistent if px, change if %)

- ***Changing Panel Position:*** updates width and height to match new position on grid (and at 100% of panel's potential)
    ```js
    panel1.setPosition(0, 145);
    ```

- ***Width and height out of bounds of position:***
    ```js
    /*should be ignored,
    panel remains the same on screen*/
    panel1.width = "220%";
    panel1.height = 600;
    ```
---

### Error Handling Examples:

- ***Setup:***
    - Hint: first refresh page to clear the previous setup.
    ```javascript
    let panel1 = RAMP.mapInstances[0].createPanel('panel1');
    let panel2 = RAMP.mapInstances[0].createPanel('panel2');

    panel1.setPosition(20, 105);
    panel2.setPosition(20, 85);

    panel1.open();

    ```

- Setting a min position that is not a subset of actual position:

    ```javascript
    panel1.setMinPosition(20, 125);
    ```

- Opening a panel whose min is within another panel's min:
    ```javascript
    panel2.open() //within 'panel1''s min position
    ```

- Autoshrinking panels when non-min positions overlap:
    -Alert message should pop up telling you which dimension shrunk (might need to wait a bit)
    ```javascript

    panel1.setPosition(0, 105);

    panel2.setPosition(0, 145);
    panel2.setMinPosition(120, 145);
    panel2.open();


    ```

- Setting position out of bounds of grid:
    ```javascript

    panel2.setPosition(-1, 409);
    ```

---

### Documentation page:

---

### Post-Demo:

- ***More Test Cases:***

    - Opening/closing a panel before position is set:
        ```javascript
        let panel4 = RAMP.mapInstances[0].createPanel('panel4');
        panel4.open();
        panel4.close();

        ```

    - Setting a position with invalid values:
        ```javascript

        panel4.setPosition(35, 100); /*panel4.setPosition([15, 1], [0, 5])*/

        ```

    - setMinPosition before setPosition:
        ```javascript

        panel4.setMinPosition(0, 65);/*panel4.setPosition([0, 0], [5, 3])*/

        ```

    - Setting a PanelElem to have multiple top level elements:
        ```javascript

        let panelElem1 = panel4.createPanelElem($.parseHTML('<p>Hello</p><p>there</p>')); //doesn't work

        let panelElem2 = panel4.createPanelElem($.parseHTML('<p>Hello there</p>')); //works

        let panelElem3 = panel4.createPanelElem($.parseHTML('<div>Hello<p>there</p></div>')); //works

        ```

- ***Explanation of Map Grid:***

    - 20 rows x 20 columns
    - Each grid square has a value between 0-399
    - First row: 0-19, Second row: 20-39, Third row: 40-59 and so on.

    - ***Example:*** setPosition(25, 149);
        - Top left corner 25: 2nd row, 6th column
        - Bottom right corner 149: 8th row, 10th column
        - alternatively: setPosition([5,1], [9,7]);
