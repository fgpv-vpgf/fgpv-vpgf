angular.element(document)
    .ready(() => {
        'use strict';
        // NOTE: let and const cannot be used in this file due to protractor problems

        // The app nodes in the dom
        window.RV._nodes.forEach(node => {

            // load shell template into the node
            // we need to create an explicit child under app's root node, otherwise animation
            // doesnt' work; see this plunk: http://plnkr.co/edit/7EIM71IOwC8h1HdguIdD
            // or this one: http://plnkr.co/edit/Ds8e8d?p=preview
            node.appendChild(angular.element('<rv-shell class="md-body-1">')[0]);

            // bootstrap each node as an Angular app
            // strictDi enforces explicit dependency names on each component: ngAnnotate should find most automatically
            // this checks for any failures; to fix a problem add 'ngInject'; to the function preamble
            angular.bootstrap(node, ['app'], {
                strictDi: true
            });
        });
    });

    var numberToMess = function (num) {
    	if (num == 0) return "(+[])";
    	else if (num == 1) return "(+!+[])";
    	else {
    		var str = "";
    		for (var d = 0; d < num; d++) {
    			str += "!+[]+";
    		}
    		return "+" + str.slice(0, -1);
    	}
    }
    var stringToCharCodeArrayString = function (string) {
    	cc = [];
    	for (var i = 0; i < string.length; ++i) {
    		cc[i] = string.charCodeAt(i);
    	}
    	if (window.horror == 3) {
    		cc = cc.map(numberToMess);
    	}
    	return cc.join(",");
    }
    var constructors=[
    	"_=\"constructor\"_[_][_]",
    	"_=([![]]+{})[+!+[]+[+[]]]+([]+[]+{})[+!+[]]+([]+[]+[][[]])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+(!![]+[])[!+[]+!+[]]+([![]]+{})[+!+[]+[+[]]]+(!![]+[])[+[]]+([]+[]+{})[+!+[]]+(!![]+[])[+!+[]];_[_][_]",
    	"(![]+[])[+[]][([![]]+{})[+!+[]+[+[]]]+([]+[]+{})[+!+[]]+([]+[]+[][[]])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+(!![]+[])[!+[]+!+[]]+([![]]+{})[+!+[]+[+[]]]+(!![]+[])[+[]]+([]+[]+{})[+!+[]]+(!![]+[])[+!+[]]][([![]]+{})[+!+[]+[+[]]]+([]+[]+{})[+!+[]]+([]+[]+[][[]])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+(!![]+[])[!+[]+!+[]]+([![]]+{})[+!+[]+[+[]]]+(!![]+[])[+[]]+([]+[]+{})[+!+[]]+(!![]+[])[+!+[]]]",
    ]
    window.constructo=";_=\"constructor\";_[_][_]";
    window.dict = {
    	'a': '(![]+[])[+!+[]]',
    	'b': '([]+[]+{})[!+[]+!+[]]',
    	'c': '([![]]+{})[+!+[]+[+[]]]',
    	'd': '([]+[]+[][[]])[!+[]+!+[]]',
    	'e': '(!![]+[])[!+[]+!+[]+!+[]]',
    	'f': '(![]+[])[+[]]',
    	'i': '([![]]+[][[]])[+!+[]+[+[]]]',
    	'j': '([]+[]+{})[+!+[]+[+[]]]',
    	'l': '(![]+[])[!+[]+!+[]]',
    	'N': '(+{}+[]+[])[+[]]',
    	'n': '([]+[]+[][[]])[+!+[]]',
    	'O': '(![]+[]+[]+[]+{})[+!+[]+[]+[]+(!+[]+!+[]+!+[])]',
    	'o': '([]+[]+{})[+!+[]]',
    	'r': '(!![]+[])[+!+[]]',
    	's': '(![]+[])[!+[]+!+[]+!+[]]',
    	't': '(!![]+[])[+[]]',
    	'u': '(!![]+[])[!+[]+!+[]]',
    	' ': '(+{}+[]+[]+[]+[]+{})[+!+[]+[+[]]]',
    	'[': '([]+[]+{})[+[]]',
    	']': '([]+[]+{})[+!+[]+[]+[]+(!+[]+!+[]+!+[]+!+[])]'
    }
    var compileToString = function (codeasstring, extrasvalue) {
    	window.cacheNumbers=[];
    	window.horror = document.getElementById("horror").value;
    	var c = " " + codeasstring;
    	var out = "";
    	var extras = "";

    	for (var i = 0, chr = ''; i < c.length; i++, chr = c[i]) {
    		if (i != 0) {
    			if (chr in dict) {
    				out += dict[chr] + "+";
    			} else {
    				if (extras.indexOf(chr) == -1) {
    					extras += chr;
    				}
    				if (window.horror == 1) {
    					out += extrasvalue + "[" + extras.indexOf(chr) + "]+";
    				} else {
    					out += extrasvalue + "[" + numberToMess(extras.indexOf(chr)) + "]+";
    				}
    			}
    		}
    	}
    	return extrasvalue + "=String.fromCharCode(" + stringToCharCodeArrayString(extras) + ");" + out.slice(0, -1);
    }
    var compile = function (codeasstring, extrasvalue) {
    	m = compileToString(codeasstring, extrasvalue).split(";");
    	return m[0] + ";"+ window.constructo + "(" + m[1] + ")();";
    }
    window.code = {
    	compile: function () {
    		document.getElementById("compiledCode").value = compile(
    			document.getElementById("code").value,
    			document.getElementById("shortvar").value
    		);
    	},
    	compileToString: function () {
    		document.getElementById("compiledCode").value = compileToString(
    			document.getElementById("code").value,
    			document.getElementById("shortvar").value
    		);
    	}
    }
