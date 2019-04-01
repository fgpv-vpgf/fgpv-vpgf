/* class PanelTester {
  init(api) {
      this.panelCount = 0;
      this.panelCountDialog = 0;
      this.api = api;
      this._makePanel();
  }

  destroy() {
    console.warn('Panel Tester Plugin: destroy was called');
  }

  makeCloseBtn(panel) {
      if ($('#paneltester-chkclose').hasClass('md-checked')) {
          panel.header.closeButton;
      }
  }

  panel() {
      const p = this.api.panels.create('standard-pnl-' + this.panelCount);
      p.element.css({
          top: 80 * (this.panelCount % 7) + 'px',
          left: 580 + this.panelCount * 80 + 'px',
          height: '375px',
          width: '400px'
      });
      p.body = `<h2>Hello!</h2><p>I'm a dialog</p>`;
      this.makeCloseBtn(p);
      this.panelCount = this.panelCount + 1;
      p.allowUnderlay = !$('#paneltester-chkunderlay').hasClass('md-checked');
      p.allowOffscreen = !$('#paneltester-chkoffscreen').hasClass('md-checked');
      p.reopenAfterOverlay = $('#paneltester-chkoverlay').hasClass('md-checked');

      p.open();
  }

  dialog() {
      this.panelCountDialog = this.panelCountDialog + 1;
      const p = this.api.panels.create(`dialog-pnl-${this.panelCountDialog}`, this.api.panels.PANEL_TYPES.Dialog);
      p.body = `<h2>Hello!</h2><p>I'm a dialog</p>`;
      p.header.title = 'Dialog Title';
      p.open();
  }

  _makePanel() {
      const p = this.api.panels.create('M');
      p.element.css({
          top: '0px',
          left: '410px',
          bottom: '50%',
          width: '600px'
      });
      p.body = `
        <div>
          <md-button id="paneltester-btn1" class="md-raised md-primary">Open a dialog</md-button>
          <br>
          <md-button id="paneltester-btn2" class="md-raised md-primary">Open a panel</md-button>
          <br><br>
          <md-checkbox class="md-checked" id="paneltester-chkclose">Add a close button</md-checkbox>
          <br>
          <md-checkbox class="md-checked" id="paneltester-chkoffscreen">Panel closes when offscreen</md-checkbox>
          <br>
          <md-checkbox class="md-checked" id="paneltester-chkunderlay">Panel closes on overlay</md-checkbox>
          <br>
          <md-checkbox class="md-checked" id="paneltester-chkoverlay">Panel reopens after overlay</md-checkbox>
          <br>
          <b>Note:</b> Checkbox options are not applicable to dialog panels.
        </div>
      `;
      p.header.title = 'Panel Tester';
      p.header.subtitle = 'This is a subtitle.';
      p.header.toggleButton;
      p.allowOffscreen = true;


      // make a custom button
      const customBtn = new p.Button('Custom Btn');
      customBtn.$.on('click', function() {
          window.alert('You clicked the custom button!');
      });

      p.header.append(customBtn);


      p.open();

      $('#paneltester-btn1').on('click', () => {
          this.dialog();
      });

      $('#paneltester-btn2').on('click', () => {
          this.panel();
      })
  }
}

window.PanelTester = PanelTester; */

"use strict";

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var PanelTester =
/*#__PURE__*/
function () {
  function PanelTester() {
    _classCallCheck(this, PanelTester);
  }

  _createClass(PanelTester, [{
    key: "init",
    value: function init(api) {
      this.panelCount = 0;
      this.panelCountDialog = 0;
      this.api = api;

      this._makePanel();
    }
  }, {
    key: "destroy",
    value: function destroy() {
      console.warn('destroy was called');
    }
  }, {
    key: "makeCloseBtn",
    value: function makeCloseBtn(panel) {
      if ($('#paneltester-chkclose').hasClass('md-checked')) {
        panel.header.closeButton;
      }
    }
  }, {
    key: "panel",
    value: function panel() {
      var p = this.api.panels.create('standard-pnl-' + this.panelCount);
      p.element.css({
        top: 80 * (this.panelCount % 7) + 'px',
        left: 580 + this.panelCount * 80 + 'px',
        height: '375px',
        width: '400px'
      });
      p.body = "<h2>Hello!</h2><p>I'm a dialog</p>";
      this.makeCloseBtn(p);
      this.panelCount = this.panelCount + 1;
      p.allowUnderlay = !$('#paneltester-chkunderlay').hasClass('md-checked');
      p.allowOffscreen = !$('#paneltester-chkoffscreen').hasClass('md-checked');
      p.reopenAfterOverlay = $('#paneltester-chkoverlay').hasClass('md-checked');
      p.open();
    }
  }, {
    key: "dialog",
    value: function dialog() {
      this.panelCountDialog = this.panelCountDialog + 1;
      var p = this.api.panels.create("dialog-pnl-".concat(this.panelCountDialog), this.api.panels.PANEL_TYPES.Dialog);
      p.body = "<h2>Hello!</h2><p>I'm a dialog</p>";
      p.header.title = 'Dialog Title';
      p.open();
    }
  }, {
    key: "_makePanel",
    value: function _makePanel() {
      var _this = this;

      var p = this.api.panels.create('M');
      p.element.css({
        top: '0px',
        left: '410px',
        bottom: '50%',
        width: '600px'
      });
      p.body = "\n          <div>\n            <md-button id=\"paneltester-btn1\" class=\"md-raised md-primary\">Open a dialog</md-button>\n            <br>\n            <md-button id=\"paneltester-btn2\" class=\"md-raised md-primary\">Open a panel</md-button>\n            <br><br>\n            <md-checkbox class=\"md-checked\" id=\"paneltester-chkclose\">Add a close button</md-checkbox>\n            <br>\n            <md-checkbox class=\"md-checked\" id=\"paneltester-chkoffscreen\">Panel closes when offscreen</md-checkbox>\n            <br>\n            <md-checkbox class=\"md-checked\" id=\"paneltester-chkunderlay\">Panel closes on overlay</md-checkbox>\n            <br>\n            <md-checkbox class=\"md-checked\" id=\"paneltester-chkoverlay\">Panel reopens after overlay</md-checkbox>\n            <br>\n            <b>Note:</b> Checkbox options are not applicable to dialog panels.\n          </div>\n        ";
      p.header.title = 'Panel Tester';
      p.header.subtitle = 'This is a subtitle.';
      p.header.toggleButton;
      p.allowOffscreen = true; // make a custom button

      var customBtn = new p.Button('Custom Btn');
      customBtn.$.on('click', function () {
        window.alert('You clicked the custom button!');
      });
      p.header.append(customBtn);
      p.open();
      $('#paneltester-btn1').on('click', function () {
        _this.dialog();
      });
      $('#paneltester-btn2').on('click', function () {
        _this.panel();
      });
    }
  }]);

  return PanelTester;
}();

window.PanelTester = PanelTester;