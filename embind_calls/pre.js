var Module = Module || {};

(function() {
    this.someGlobalVariable = function someGlobalVariable() {
    };

    this.getInterfaceImplementation = function getInterfaceImplementation() {
        var implementation = Module.Interface.extend("implementation", {
            call_val: function(v) {},
            call_int: function(i) {},
            call_vec: function(v) {},
            call_mat: function(m) {},
        });
        return new implementation;
    };
})();

// non-fastcomp seems broken?  It generates the _main function but
// doesn't export it into Module.
Module['_main'] = _main;

