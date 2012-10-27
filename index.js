var SinglePageApplication

SinglePageApplication = function(/* Geddy */ geddy) {

  this.root = geddy;
}

SinglePageApplication.prototype = new (function(){
  this.register = function(mainScope) {
    this.scope = mainScope;
  };
});

exports = SinglePageApplication;