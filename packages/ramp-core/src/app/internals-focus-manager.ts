let ifm: any;
let disabledArrows: boolean;

import { Observable, Subject } from 'rxjs';

export class InternalsFocusManager {

    constructor(list: JQuery<HTMLElement>, clicked: boolean = false) {
        ifm = this;
        this.list = list;
        this.items = list.find('.rv-focus-item');
        this.buttonsAndInputs = list.find('button, input');
        this.isHorizontal = this.areItemsHorizontal();
        this.scrollableParent = $('.ag-body-viewport'); // TODO: change to be a more generalized parent
        // on.keydown for arrow keys can be disabled here if we want to preserve default behaviour
        // this is the case for enhancedTable ag-grid cells
        disabledArrows = this.list.hasClass('disabled-arrows');

        this.initFocus(clicked);

        this.list.on('keydown', this.onKeydown);
        this.items.on('mousedown', this.onClick);

        this._focusOut = new Subject();
    }

    /**
     * Returns whether list items are arranged pefectly horizontally.
     * If so, left/right arrow keys are used to navigate between list items.
     * Default: up/down arrows.
     */
    private areItemsHorizontal(): boolean {
        this.items.each((index: any, item: any) => {
            if (index > 0) {
                const currPosition = $(item).position();
                const prevPosition = $(this.items[index - 1]).position();
                if (currPosition.top !== prevPosition.top || currPosition.left <= prevPosition.left) {
                    // if vertical position isn't the same or the left position isn't increasing
                    // probably not a horizontal enough list to justify using left/right arrows for navigation
                    return false;
                }
            }
        });
        return true;
    }

    private initFocus(clicked: boolean) {
        const focusExempt = document.createAttribute('rv-focus-exempt');
        this.list[0].setAttributeNode(focusExempt);

        if (!clicked) {
            // don't want to focus if list was created on click
            // else list steals focus
            this.list.attr('tabindex', 0);
            this.list[0].focus();
            this.list[0].classList.add('element-focused');
        }

        this.highlightedItem = this.list;
        this.setAriaActiveDescendant();
        this.childrenFocus();
    }

    get returnToFM(): Observable<HTMLElement> {
        return this._focusOut.asObservable();
    }


    /**Sets focus to appropriate item on keydown*/
    onKeydown(event: any) {
        let focusOut = false;
        let backtab = false;
        const activeElement = <any>document.activeElement;
        const length = $(activeElement).val().length;
        const isInputActive = activeElement.nodeName === 'INPUT' && length > 0;
        const selectionStart = activeElement.selectionStart;

        function unhighlightItem() {
            ifm.scrollableParent[0].style.position = 'absolute';
            if (isInputActive) {
                (<any>document.activeElement).blur();
                ifm.list[0].tabIndex = -1;
            }
            ifm.list[0].origfocus();
            ifm.unHighlightItem();
            ifm.scrollableParent[0].style.position = 'initial';
        }

        function highlightPrev() {
            unhighlightItem();
            ifm.setPrevItem();
            ifm.highlightItem();
        }


        function highlightNext() {
            unhighlightItem();
            ifm.setNextItem();
            ifm.highlightItem();
        }

        switch (event.keyCode) {
            case 37:
                // if arrow keys are not disabled for this list, and list IS horizontal
                // navigate through list, hightlighting items
                event.preventDefault();
                if (disabledArrows === false &&
                    ifm.isHorizontal &&
                    ((isInputActive &&
                        selectionStart === 0) || !isInputActive)) {
                    highlightPrev();
                }
                break;
            case 38:
                // if arrow keys are not disabled for this list, and list is NOT horizontal
                // navigate through list, hightlighting items
                event.preventDefault();
                if (disabledArrows === false &&
                    !ifm.isHorizontal &&
                    ((isInputActive &&
                        selectionStart === 0) || !isInputActive)) {
                    highlightPrev();
                }
                break;
            case 39:
                // if arrow keys are not disabled for this list, and list IS horizontal
                // navigate through list, hightlighting items
                event.preventDefault();
                if (disabledArrows === false &&
                    ifm.isHorizontal &&
                    ((isInputActive &&
                        selectionStart === length) || !isInputActive)) {
                    highlightNext();
                }
                break;
            case 40:
                // if arrow keys are not disabled for this list, and list is NOT horizontal
                // navigate through list, hightlighting items
                event.preventDefault();
                if (disabledArrows === false &&
                    !ifm.isHorizontal &&
                    ((isInputActive &&
                        selectionStart === length) || !isInputActive)) {
                    highlightNext();
                }
                break;
            case 27:
                // esc: focus on list
                event.preventDefault();
                ifm.unHighlightItem();
                ifm.focusList();
                break;
            case 9:
                // tab: if focused on list, focus out to next viewer element
                // if foused on item, tab through its objects
                event.preventDefault();
                const activeElement = document.activeElement !== null ? document.activeElement.nodeName : null
                if (event.shiftKey && activeElement !== "BUTTON" && activeElement !== "INPUT") {
                    backtab = true;
                    focusOut = true;
                } else if (ifm.highlightedItem === ifm.list) {
                    focusOut = true;
                }
                break;
            case 13:
                ifm.scrollItemIntoView();
        }

        if (ifm.highlightedItem === ifm.list && !focusOut) {
            ifm.list[0].classList.add('element-focused');
        } else {
            ifm.list[0].classList.remove('element-focused');

            if (focusOut) {
                // tell focus manager to resume managing focus
                ifm.focusOut();
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
            // remove focus from list
            ifm.list[0].classList.remove('element-focused');
            ifm.list[0].blur();

            if (ifm.highlightedItem[0] !== $(event.currentTarget)[0]) {
                // remove focus from any previously focused items
                ifm.unHighlightItem();

                // focus on current item
                ifm.highlightedItem = $(event.currentTarget);
                ifm.setAriaActiveDescendant();
            }
            ifm.highlightItem();
        }
    }

    /**
     * Mimics removing focus on element by unhighlighting list item and setting button tab indices to -1.
     */
    private unHighlightItem() {
        const item = this.highlightedItem;
        if (item === this.list) {
            return;
        }
        item[0].classList.remove('highlighted');
        this.buttonInputFocus(-1);
    }

    /**
     * Mimics focus on element by highlighting list item and setting button tab indices to 0.
     */
    private highlightItem() {
        const item = this.highlightedItem;
        item[0].classList.add('highlighted');
        this.buttonInputFocus(0);

    }

    /**Focus on this list, removing any focuses/highlights from list items.*/
    private focusList() {
        this.highlightedItem[0].classList.remove('highlighted');
        this.highlightedItem = this.list;
        this.setAriaActiveDescendant();
        this.list[0].origfocus();
        this.buttonInputFocus(-1);
    }

    /**
     * Set focus on next item in the list.
     * If the list is currently focused on, move the focus down to the first list item.
     */
    private setNextItem() {
        this.items = this.list.find('.rv-focus-item');
        if (this.highlightedItem === this.list) {
            this.highlightedItem = $(this.items[0]);
            this.setAriaActiveDescendant();
        } else {
            const indexOfNext = this.items.index(this.highlightedItem) + 1;
            if (this.items[indexOfNext] !== undefined) {
                this.highlightedItem = $(this.items[indexOfNext]);
                this.setAriaActiveDescendant();
            }
        }

        this.scrollItemIntoView();
    }

    /**
     * Set focus on previous item in the list.
     * */
    private setPrevItem() {
        this.items = this.list.find('.rv-focus-item');
        const indexOfPrev = this.items.index(this.highlightedItem) - 1;
        if (indexOfPrev >= 0) {
            this.highlightedItem = $(this.items[indexOfPrev]);
            this.setAriaActiveDescendant();
            this.scrollItemIntoView(true);
        }
    }

    /**
     * Sets aria-activedescendant whenever a new item is focused on.
     * This is so that screenreaders know when a list item is highlighted.
     */
    private setAriaActiveDescendant() {
        $('#highlightedItem').removeAttr('id');
        if (this.highlightedItem === this.list) {
            this.highlightedItem.removeAttr('aria-activedescendant');
        } else {
            this.highlightedItem.attr('id', 'highlightedItem');
            this.list.attr('aria-activedescendant', 'highlightedItem');
        }
    }

    /**
     * Makes item's immediate children focusable or not focusable
     */
    private childrenFocus(tabindex?: number) {
        if (tabindex === -1) {
            this.items.each((index: any, item: any) => {
                item.setAttribute('tabindex', tabindex);
            });
        }
        this.buttonInputFocus(-1);
    }

    /**
     * Sets tab index of button and input objects contained within items.
     * Focused items should have their objects tabindex set to 0.
     * @param tabindex
     */
    private buttonInputFocus(tabindex: number) {
        this.buttonsAndInputs = this.highlightedItem.find('button, input');

        let activeFirst: any, activeLast: any;
        this.buttonsAndInputs.each((index: any, item: any) => {
            item.setAttribute('tabindex', tabindex);
            // find the first and last active elements for this item
            activeFirst = activeFirst === undefined ? item : activeFirst;
            activeLast = item.disabled === false ? item : activeLast;
        });

        // when the user presses tab on the last button/input
        // or backtab on the first button/input
        // focus highlight should be taken out of the element
        $(activeFirst).on('keydown', this.onLastKeyTab);
        $(activeLast).on('keydown', this.onLastKeyTab);
    }

    /** Makes sure that the item highlight is taken away when its last object is tabbed.*/
    private onLastKeyTab(event: any) {
        switch (event.keyCode) {
            case 9:
                event.preventDefault();
                if (!event.shiftKey && event.currentTarget !== ifm.buttonsAndInputs[0] ||
                    event.shiftKey && event.currentTarget === ifm.buttonsAndInputs[0] ||
                    ifm.buttonsAndInputs.length === 1) {
                    // make sure this doesn't exit out on a backtab for last button
                    // or forward tab for first button
                    ifm.focusOut();
                    const list = $(event.currentTarget).parents('.rv-focus-list')[0];
                    ifm._focusOut.next({ list: list, backtab: event.shiftKey });
                }
                break;
        }
    }

    /**Scrolls the currently focused item into view */
    private scrollItemIntoView(prev = false) {
        this.items = this.list.find('.rv-focus-item');
        if (this.isHorizontal) {
            const childOffsetRight = (<any>this.highlightedItem).offset().left + this.highlightedItem.width();
            const childOffsetLeft = (<any>this.highlightedItem).offset().left;
            const parentOffsetRight = this.scrollableParent.offset().left + this.scrollableParent.width();
            const parentOffsetLeft = this.scrollableParent.offset().left;
            const childLeft = this.highlightedItem.position().left;

            if (childOffsetRight !== undefined && (childOffsetRight > parentOffsetRight || childOffsetLeft < parentOffsetLeft)) {

                if (prev === true && this.highlightedItem[0] === this.items[0]) {
                    this.scrollableParent.scrollLeft(0);
                } else {
                    this.scrollableParent.scrollLeft(childLeft);
                }
            }
        } else {
            const currTop = this.highlightedItem[0] === this.items[0] ? 0 : this.highlightedItem.position().top;
            this.scrollableParent.scrollTop(currTop);
        }
    }

    /**
     * Used on keypress/click on another part of the viewer.
     * Also used when tabbing out of the list.
     */
    focusOut() {
        this.unHighlightItem();
        this.list[0].classList.remove('element-focused');
        this.list[0].blur();
        this.list.off('keydown');
        this.childrenFocus(-1);
    }
}

export interface InternalsFocusManager {
    list: any;
    highlightedItem: JQuery<HTMLElement>;
    items: any;
    buttonsAndInputs: any;
    _focusOut: Subject<any>;
    inputs: any;
    isHorizontal: boolean;
    scrollableParent: any;
}
