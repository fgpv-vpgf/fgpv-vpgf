$('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css') );

$.getScript('../../../../rv-main.js', function () {

  angular
  .module('app')
  .controller('BasicDemoCtrl', function DemoCtrl($mdDialog) {
    var originatorEv;

    this.openMenu = function($mdMenu, ev) {
      originatorEv = ev;
      $mdMenu.open(ev);
    };

    this.notificationsEnabled = true;
    this.toggleNotifications = function() {
      this.notificationsEnabled = !this.notificationsEnabled;
    };

    this.importFile = function() {
      $mdDialog.show(
        $mdDialog.alert()
          .targetEvent(originatorEv)
          .clickOutsideToClose(true)
          .parent('body')
          .title('Ok, importing a file')
          .textContent('Not really, just a test :)')
          .ok('Great, thanks')
      );

      originatorEv = null;
    };

    this.importService = function() {
      $mdDialog.show(
        $mdDialog.alert()
          .targetEvent(originatorEv)
          .clickOutsideToClose(true)
          .parent('body')
          .title('Ok, importing a service')
          .textContent('Not really, just a test :)')
          .ok('Great, thanks')
      );
    };
  });

    angular
        .module('app')
        .controller('DemoCtrl', function($scope) {
            $scope.user = {
                title: 'Developer',
                email: 'ipsum@lorem.com',
                firstName: '',
                lastName: '',
                company: 'Google',
                address: '1600 Amphitheatre Pkwy',
                city: 'Mountain View',
                state: 'CA',
                biography: 'Loves kittens, snowboarding, and can type at 130 WPM.\n\nAnd rumor has it she bouldered up Castle Craig!',
                postalCode: '94043'
            };
            
            $scope.states = ('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY').split(' ').map(function(state) {
                return {abbrev: state};
            });
        });

    //first append map to body
    $('body').append(`
        <div id="fgpmap" style="height: 700px; display:flex;" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-extensions="../../hello-world.js"></div>
    `);

    //this is the mapInstance
    new RZ.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');

    //once map is added
    RZ.mapAdded.subscribe(mapi => {

      //creating Panel + opening
      let panel0 = mapi.createPanel('panel0');
      panel0.position([432, 0], [700, 500]);

      $(`<style>
          .rv-medium #panel0 { 
            width: 100% !important;
            height: 100% !important;
            top: -10px !important;
            left: -10px !important;
            z-index: 2;
          }

          #panel1 {
            top: 0px;
            left: 710px;
            right: 0px;
            width: auto;
          }
        </style>
      `).appendTo("head");
      
      closeBtn = new panel0.button('X');
      closeBtn.element.css('float', 'right');
      closeBtn.element.on('click', function(evt) {
        console.error('close btn clicked', evt);
      });

      menuButton = new panel0.container(`
  <div ng-controller="BasicDemoCtrl as ctrl" class="menu-demo-container" style="display: inline;" layout-align="center center" layout="column">
    <md-menu>
      <md-button aria-label="Open phone interactions menu" class="md-icon-button" ng-click="ctrl.openMenu($mdMenu, $event)">
        <md-icon md-menu-origin md-svg-icon="maps:layers"></md-icon>
      </md-button>
      <md-menu-content width="4">
        <md-menu-item>
          <md-button ng-click="ctrl.importFile($event)">
            <md-icon md-svg-icon="editor:insert_drive_file" md-menu-align-target></md-icon>
            Import File
          </md-button>
        </md-menu-item>
        <md-menu-item>
          <md-button ng-click="ctrl.importService()">
            <md-icon md-svg-icon="file:cloud"></md-icon>
            Import Service
          </md-button>
        </md-menu-item>
      </md-menu-content>
    </md-menu>
  </div>

      `);

      panel0.controls = [new panel0.button('T'), menuButton, new panel0.container('<h2 style="font-weight: normal;display:inline;vertical-align: middle;">Hello, World!</h2>'), closeBtn];
      panel0.content = new panel0.container(`<div ng-controller="DemoCtrl" layout="column" class="md-inline-form">`);
      panel0.open();

      //creating Panel + opening
      let panel1 = mapi.createPanel('panel1');
      panel1.position([710, 0], [1200, 500]);

      panel1.controls = [new panel1.button('X')];
      panel1.content = new panel1.container(`<div ng-controller="DemoCtrl" layout="column" class="md-inline-form">
          <div>
            <md-input-container>
              <label>Title</label>
              <input ng-model="user.title">
            </md-input-container>
      
            <md-input-container>
              <label>Email</label>
              <input ng-model="user.email" type="email">
            </md-input-container>
          </div>

      

          <div>
            <form name="userForm">
      
              <div layout-gt-xs="row">
                <md-input-container class="md-block" flex-gt-xs>
                  <label>Company (Disabled)</label>
                  <input ng-model="user.company" disabled>
                </md-input-container>
      
                <md-input-container>
                  <label>Enter date</label>
                  <md-datepicker ng-model="user.submissionDate"></md-datepicker>
                </md-input-container>
              </div>
      
              <div layout-gt-sm="row">
                <md-input-container class="md-block" flex-gt-sm>
                  <label>First name</label>
                  <input ng-model="user.firstName">
                </md-input-container>
      
                <md-input-container class="md-block" flex-gt-sm>
                  <label>Long Last Name That Will Be Truncated And 3 Dots (Ellipsis) Will Appear At The End</label>
                  <input ng-model="theMax">
                </md-input-container>
              </div>
      
              <md-input-container class="md-block">
                <label>Address</label>
                <input ng-model="user.address">
              </md-input-container>
      
              <md-input-container md-no-float class="md-block">
                <input ng-model="user.address2" placeholder="Address 2">
              </md-input-container>
      
              <div layout-gt-sm="row">
                <md-input-container class="md-block" flex-gt-sm>
                  <label>City</label>
                  <input ng-model="user.city">
                </md-input-container>
      
                <md-input-container class="md-block" flex-gt-sm>
                  <label>State</label>
                  <md-select ng-model="user.state">
                    <md-option ng-repeat="state in states" value="{{state.abbrev}}">
                      {{state.abbrev}}
                    </md-option>
                  </md-select>
                </md-input-container>
      
                <md-input-container class="md-block" flex-gt-sm>
                  <label>Postal Code</label>
                  <input name="postalCode" ng-model="user.postalCode" placeholder="12345"
                         required ng-pattern="/^[0-9]{5}$/" md-maxlength="5">
      
                  <div ng-messages="userForm.postalCode.$error" role="alert" multiple>
                    <div ng-message="required" class="my-message">You must supply a postal code.</div>
                    <div ng-message="pattern" class="my-message">That doesn't look like a valid postal
                      code.
                    </div>
                    <div ng-message="md-maxlength" class="my-message">
                      Don't use the long version silly...we don't need to be that specific...
                    </div>
                  </div>
                </md-input-container>
              </div>
      
              <md-input-container class="md-block">
                <label>Biography</label>
                <textarea ng-model="user.biography" md-maxlength="150" rows="5" md-select-on-focus></textarea>
              </md-input-container>
      
            </form>
          </div>
      
      </div>`);
        panel1.open();
    });
});
