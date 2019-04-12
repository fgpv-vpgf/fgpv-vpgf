let ifm: any;
let disabledArrows: boolean;

import { Observable, Subject } from 'rxjs';

export class InternalsFocusManager {

    constructor(list: JQuery<HTMLElement>) {
        ifm = this;
        this.list = list;
        this.items = list.find('.item');
        this.buttonsAndInputs = list.find('button, input');
        this.inputs = list.find('input');

        // on.keydown for arrow keys can be disabled here if we want to preserve default behaviour
        // this is the case for enhancedTable ag-grid cells
        disabledArrows = this.list.hasClass('disabled-arrows');

        this.initFocus();

        this.list.on('keydown', this.onKeydown);
        this.items.on('click', this.onClick);
        this._focusOut = new Subject();
    }

    get returnToFM(): Observable<HTMLElement> {
        return this._focusOut.asObservable();
    }

    private initFocus() {
        this.list.attr('tabindex', 0);
        const focusExempt = document.createAttribute('rv-focus-exempt');
        this.list[0].setAttributeNode(focusExempt);
        this.list[0].focus();
        this.list[0].classList.add('element-focused');
        this.focusedItem = this.list;
        this.childrenFocus();
    }

    /**Sets focus to appropriate item on keydown*/
    onKeydown(event: any) {
        let focusOut = false;
        let backtab = false;
        switch (event.keyCode) {
            case 38:
                // if arrow keys are not disabled for this list,
                // navigate through list, hightlighting items
                if (disabledArrows === false) {
                    event.preventDefault();
                    ifm.deFocusItem();
                    ifm.setPrevItem();
                    ifm.focusItem();
                }
                break;
            case 40:
                // if arrow keys are not disabled for this list,
                // navigate through list, hightlighting items
                if (disabledArrows === false) {
                    event.preventDefault();
                    ifm.deFocusItem();
                    ifm.setNextItem();
                    ifm.focusItem();
                }
                break;
            case 27:
                // esc: focus on list
                event.preventDefault();
                ifm.deFocusItem();
                ifm.focusList();
                break;
            case 9:
                // tab: if focused on list, focus out to next viewer element
                // if foused on item, tab through its objects
                if (ifm.focusedItem === ifm.list) {
                    if (event.shiftKey) {
                        backtab = true;
                    }
                    event.preventDefault();
                    focusOut = true;
                }
                break;
        }

        if (ifm.focusedItem === ifm.list && !focusOut) {
            ifm.list[0].classList.add('element-focused');
        } else {
            ifm.list[0].classList.remove('element-focused');

            if (focusOut) {
                // tell focus manager to resume managing focus
                ifm._focusOut.next({ list: ifm.list[0], backtab: backtab });
            }
        }
    }


    /**
     * Sets focus to the clicked item
     * */
    onClick(event: any) {
        if (!disabledArrows) {
            // only execute if arrow keys are disabled
            // if arrow keys aren't disabled, we don't want to be highlighting list items
            // (eg: ag-grid cells)
            // remove focus from list
            ifm.list[0].classList.remove('element-focused');
            ifm.list[0].blur();

            if (ifm.focusedItem !== $(event.currentTarget)) {
                // remove focus from any previously focused items
                ifm.deFocusItem();

                // focus on current item
                ifm.focusedItem = $(event.currentTarget);
            }
            ifm.focusItem();
        }
    }

    /**
     * Mimics removing focus on element by unhighlighting list item and setting button tab indices to -1.
     */
    private deFocusItem() {
        const item = this.focusedItem;
        if (item === this.list) {
            return;
        }
        item[0].classList.remove('focused');
        this.buttonInputFocus(-1);
    }

    /**
     * Mimics focus on element by highlighting list item and setting button tab indices to 0.
     */
    private focusItem() {
        const item = this.focusedItem;
        item[0].classList.add('focused');
        this.buttonInputFocus(0);

    }

    /**Focus on this list, removing any focuses/highlights from list items. */
    private focusList() {
        this.focusedItem[0].classList.remove('focused');
        this.focusedItem = this.list;
        this.list[0].origfocus();
        this.buttonInputFocus(-1);
    }

    /**
     * Set focus on next item in the list.
     * If the list is currently focused on, move the focus down to the first list item.
     */
    private setNextItem() {
        if (this.focusedItem === this.list) {
            this.focusedItem = $(this.items[0]);
        } else {
            const indexOfNext = this.items.index(this.focusedItem) + 1;
            if (this.items[indexOfNext] !== undefined) {
                this.focusedItem = $(this.items[indexOfNext]);
            }
        }
    }

    /**
     * Set focus on previous item in the list.
     * */
    private setPrevItem() {
        const indexOfPrev = this.items.index(this.focusedItem) - 1;
        if (indexOfPrev >= 0) {
            this.focusedItem = $(this.items[indexOfPrev]);
        }
    }

    /**
     * Makes item's immediate children focusable or not focusable
     */
    private childrenFocus(tabindex = 0) {
        this.items.each((index: any, item: any) => {
            item.setAttribute('tabindex', tabindex);
        });
        this.buttonInputFocus(-1);
    }

    /**
     * Sets tab index of button and input objects contained within items.
     * Focused items should have their objects tabindex set to 0.
     * @param tabindex
     */
    private buttonInputFocus(tabindex: number) {
        this.buttonsAndInputs = this.focusedItem.find('button, input');
        this.inputs = this.focusedItem.find('input');

        this.buttonsAndInputs.each((index: any, item: any) => {
            item.setAttribute('tabindex', tabindex);
        });

        if (tabindex === -1) {
            this.inputs.each((index: any, input: any) => {
                input.disabled = true;
            });
        } else {
            this.inputs.each((index: any, input: any) => {
                input.disabled = false;
            });
        }

        // when the user presses tab on the last button/input
        // or backtab on the first button/input
        // focus highlight should be taken out of the element
        $(this.buttonsAndInputs[0]).on('keydown', this.onLastKeyTab);
        $(this.buttonsAndInputs.slice(-1)).on('keydown', this.onLastKeyTab);
    }

    /** Makes sure that the item highlight is taken away when its last object is tabbed.*/
    private onLastKeyTab(event: any) {
        switch (event.keyCode) {
            case 9:
                if (!event.shiftKey && event.currentTarget !== ifm.buttonsAndInputs[0] ||
                    event.shiftKey && event.currentTarget === ifm.buttonsAndInputs[0] ||
                    ifm.buttonsAndInputs.length === 1) {
                    // make sure this doesn't exit out on a backtab for last button
                    // or forward tab for first button
                    ifm.focusOut();
                    ifm._focusOut.next(ifm.list[0]);
                }
                break;
        }
    }

    /**
     * Used on keypress/click on another part of the viewer.
     * Also used when tabbing out of the list.
     */
    focusOut() {
        this.deFocusItem();
        this.list[0].classList.remove('element-focused');
        this.list[0].blur();
        this.list.off('keydown');
        this.childrenFocus(-1);
    }
}

export interface InternalsFocusManager {
    list: any;
    focusedItem: JQuery<HTMLElement>;
    items: any;
    buttonsAndInputs: any;
    _focusOut: Subject<any>;
    inputs: any;
}
