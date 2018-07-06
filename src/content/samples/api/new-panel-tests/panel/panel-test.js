$.getScript('../../../../rv-main.js', function () {

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
      panel0.setPosition([6, 0], [9, 14]);
      
      closeBtn = new panel0.button('X');
      closeBtn.element.css('float', 'right');
      panel0.controls = [new panel0.button('T'), closeBtn];
      panel0.content = new panel0.container(`<div ng-controller="DemoCtrl" layout="column" ng-cloak class="md-inline-form">`);
      panel0.open();

      //creating Panel + opening
      let panel1 = mapi.createPanel('panel1');
      panel1.setPosition([10, 0], [16, 14]);
      panel1.controls = [new panel1.container(`
          <md-button class="rv-close md-icon-button black rv-button-24">
              <md-icon md-svg-src="navigation:close"></md-icon>
          </md-button>`)];
      panel1.content = new panel1.container(`<div ng-controller="DemoCtrl" layout="column" ng-cloak class="md-inline-form">
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
