var Spa = function() {
  var spa
    , site

  // Registers the controller and sets the layout
  geddy.spa.registerController(this).config({
    layout : 'peerless'
  });

  // Initializes and createsa Site object
  site = geddy,spa.initializeSite({
    title : 'Single Page Application'
  });

  // Site pages
  site.pages.extend({
    /* Main page layout */
    main : {
      routes    : ['/', 'index'],
      view      : 'main/index',
      wrapper   : 'layouts/peerless'
    },

    /* Static pages */
    404 : {
      routes    : ['404'],
      view      : 'pages/404',
      layout    : false
    }
  });
};

exports.Spa = Spa;