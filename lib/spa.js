/*
 * Geddy-SPA (Single Page Application)
 * Copyright 2012 Joseph Werle (joseph.werle@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
  Notes:
    router.get('/(:subject)(/:control)(/:method)(/:data').to('Main.index');
*/
var base          = require('./base.js')
  , Site          = require('./site')
  , utils         = require('utilities')
  , Events        = require('events')
  , fs            = require('fs')
  , noop          = base.noop
  , die           = base.die
  , makeArray     = base.makeArray
  , extend        = base.extend


/**
  @name geddy
  @namespace geddy
  @global
*/
var geddy = geddy || global.geddy || {};

/**
  @name SinglePageApplication
  @constructor
  @description Constructs a new instance of SinglePageApplication
  @param {Object} geddy The global geddy object
  @param {Object} config A configuration object
*/
geddy.SinglePageApplication = function(geddy, config) {
  "use strict";

  var on
    , emit
    , self = this
    , helpers

  /**
    @name SinglePageApplication#root
    @access public
    @type Geddy
    @description The global geddy object.
  */
  this.root = geddy;

  /**
    @name SinglePageApplication#controller
    @access public
    @type BaseController
    @description The main controller for the application
  */
  this.controller = null;

  /**
    @name SinglePageApplication#event
    @access public
    @type EventEmitter
    @description The event emitter object
  */
  this.event = new Events.EventEmitter();

  /**
    @name SinglePageApplication#routes
    @access public
    @type Array
    @description Defined routes
  */  
  this.routes = [];

  /**
    @name SinglePageApplication#routing
    @access public
    @type Object
    @description Routing configuration
  */  
  this.routing = {};

  // Initialize with default configuration
  this.config.set(config);



  on   = this.event.on;
  emit = this.event.emit;
  (function(props){
    var i;

    for (i = 0; i < props.length; i++) {
      this[props[i]] = (function(old){
        return function(){
          var args = makeArray(arguments)
            , i
            , ns
            , subns
            , event
            , index

          // Prevent listening for everything for now
          if (args[0] === '*') {
            return this;
          }

          args[0] = (args[0].length > 1? args[0].replace('/','.') : args[0]);
          ns      = args[0].split('.')[0];
          subns   = args[0].split('').reverse().join('').split('.')[0];

          for (i = args.length - 1; i >= 0; i--) {
            if (typeof args[i] === 'string' && ! args[i].length) {
              delete args[i];
            }
          }

          if (!!~ (index = self.routes.indexOf(args[0]))) {
            delete self.routes[index];
          }

          if (!~ (self.routes.indexOf(ns)) && ns.length) {
            self.routes.push(ns);
          }

          if (args.length && typeof args[0] === 'string' && typeof args[1] === 'function') {
            if (!~ self.routes.indexOf(args[0])) {
              self.routes.push(args[0]);
            }

            old.apply(self.event, args);
          }
          
          event = args.shift();

          if (subns && args.length && typeof args[0] === 'string' && typeof args[1] === 'function') {
            old.apply(self.event, [event.replace(subns, '*')].concat(args));
          }
          
          return this;
        }
      })(this[props[i]]);
    }
  }).apply(this.event, [['on', 'once']]);
}

/**
  @this SinglePageApplication.prototype
*/
geddy.SinglePageApplication.prototype = geddy.SinglePageApplication.fn = new (function(){
  "use strict";

  var init
    , interfaces
    , filterRouteEvents
    , CallbackInterface

  // Private
  filterRouteEvents = function(string, returnStd) {
    var routeEvents   = []
      , stdEvents     = []
      , i
      , event
      , events

    events = string.split(',');

    for (i = events.length - 1; i >= 0; i--) {
      if (!!~ (events[i].indexOf('route:'))) {
        routeEvents.push(events[i].split(':')[1]);
      }
      else {
        stdEvents.push(events[i]);
      }
    }

    return returnStd === true? stdEvents : routeEvents.join(',');
  };

  init = function() {
    var self       = this
      , controller = this.controller 
      , prop
      , on
      , once
      , index


    if (typeof controller != 'object') {
      this.root.log.error("Invalid controller");
    }

    for (prop in interfaces.controller) {
      controller[prop]  = interfaces.controller[prop];
      controller.spa    = this;
    }

    once = self.event.once;
    controller.on = function(){
      var args  = makeArray(arguments)
        , event = args[0]
        , index
        , i
        , routeEvents

      if ((routeEvents = filterRouteEvents(event)).length) {
        args.shift();
        routeEvents = routeEvents.split(',');
        
        for (i = routeEvents.length - 1; i >= 0; i--) {
          self.event.once.apply(self.event, [routeEvents[i]].concat(args));
        }
      }
      else {
        once.apply(this, args);
      }

      return this;
    }

    controller.view = this.view;

    controller.respondsWith = ['html', 'json'].concat(this.routing.types || []);

    this.controller = controller;

    return this;
  }

  /**
    @name CallbackInterface
    @constructor
    @param {BaseController} controller The main controller receiving the event
    @param {Object} data Data to be sent with the callback
    @param {String} type The event type or route
    @return An instance of the CallbackInterface extended by the data Object
  */
  CallbackInterface = function(controller, data, type) {
    /**
      @name CallbackInterface#type
      @public
      @type String
      @description The event type or route
    */ 
    this.type    = type;

    /**
      @name CallbackInterface#respond
      @public
      @function
      @type Object
      @description The respond callback that directly calls controller.respond();
    */ 
    this.respond = function(data, options) {
      data    = data || {};
      options = options || {};

      var format    = (options.format? options.forma || controller.spa.config.defaultFormat || 'html' : 'html')
        , viewPath  = (options.path? options.path.views || controller.spa.config.path.views || 'app/views/' : 'app/views/')
        , viewArgs  = extend(data || {}, {})
        , options   = extend(options || {}, {
            format    : format
          , template  : viewPath + (options.view || 'index')
          , layout    : viewPath + 'layouts/' + (options.layout || controller.spa.config.layout || 'empty')
        });

      delete options.view;

      controller.app.viewHelpers = controller.spa.site.pages._helpers = extend(controller.app.viewHelpers, controller.spa.view.helpers.get());

      return controller.respond.apply(controller, [viewArgs, options]);
    };

    return extend(this, data);
  };



  interfaces = {
    /* 
      Standard overrides index, add, edit, create, update, destroy 
      Routing variables - (/)(/:subject)(/:control)(/:action)(/:data)(/:$1)(/:$2)(/:$3)(/:$4)(/:$5)
    */
    controller : extend({
      index : function(request, response, params) {
        var self = this
          , eventType
          , i
      
        //console.log(params.subject, params.control, params.actvitity, params.data);

        if (params.data) {
          eventType = [params.subject, params.control, params.actvitity, params.data].join('.');
        }
        else if (params.actvitity) {
          eventType = [params.subject, params.control, params.actvitity].join('.');
        }
        else if (params.control) {
          eventType = [params.subject, params.control].join('.');
        }
        else if (params.subject && !!~ (this.spa.routes.indexOf(params.subject))) {
          eventType = params.subject;
        }
        else if (!params.subject) {
          eventType = this.spa.config.defaultSubject || '/';
        }

        if (!!~ this.spa.routes.indexOf(eventType)) {
          this.spa.event.emit(eventType, new CallbackInterface(this, params, eventType));

          if (!!~ this.spa.routes.indexOf(params.subject + '.*')) {
            this.spa.event.emit(params.subject + '.*', new CallbackInterface(this, params, eventType));
          }
        }
        else {
          this.spa.event.emit('404',  new CallbackInterface(this, params, eventType));
        }
      }
    }, new (function(){
        var props = ['add', 'edit', 'create', 'update', 'destroy'];

        while(props.length)
          this[props.shift()] = noop;

        return this;
    }))
  };



  // Public
  /*
    @name SinglePageApplication#registerController
    @public
    @function
    @description Registers the controller for the SPA
    @param {BaseController} controller An instance of controller.BaseController provided
    by the Geddy Web Framework.
    @param {Object} routing Rating configuration and route definitions
    @return The current instance of SinglePageApplication
  */
  this.registerController = function(controller, routing) {
    this.controller = controller || !function(){ throw "A SinglePageApplication needs a controller"; die(); }();
    this.routes     = !routing? [] : routing.routes || [];
    this.routing    = routing || {};

    delete this.routing.routes;

    return init.call(this);
  };

  /*
    @name SinglePageApplication#extend
    @public
    @function
    @description Extend the SPA object instance
    @param {Object} object An object to extend the SPA instance with
    @return The current instance of SinglePageApplication
  */
  this.extend = function(object) {
    return extend(this, object);
  };

  /*
    @name SinglePageApplication#view
    @public
    @object
    @description View settings and methods
  */
  this.view = {
    /*
      @name SinglePageApplication#view#helpers
      @public
      @object
      @description View helpers
    */
    helpers : {
        _helpers    : {}
        /*
          @name SinglePageApplication#view#helpers#add
          @public
          @function
          @description Adds a view helper for the view
          @param {String} alias An alias to the view helper
          @param {Function|String} value The view helper value
          @return The view helper object
        */
      , add : function(alias, value) {
          var prop;

          if (typeof alias === 'string' && typeof value !== 'undefined') {
            this._helpers[alias] = value;
          }
          else if (typeof alias === 'object') {
            for (prop in alias) {
              this.add(prop, alias[prop]);
            }
          }

          return this;
        }

        /*
          @name SinglePageApplication#view#helpers#remove
          @public
          @function
          @description Removes a view helper for the view
          @param {String} alias An alias to the view helper value
          @return The view helper object
        */
      , remove : function(alias) {
          if (typeof alias === 'string') {
            delete this._helpers[alias];
          }

          return this;
        }

       /*
          @name SinglePageApplication#view#helpers#get
          @public
          @function
          @description Gets a view helpers value
          @param {String} alias An alias to the view helper value
          @return The view helper if found, else the whole object
        */
      , get : function(alias) {
          if (typeof alias === 'string' && this._helpers[alias]) {
            return this._helpers[alias];
          }

          return this._helpers;
        }
    }
  };

  /*
    @name SinglePageApplication#initializeSite
    @public
    @function
    @description Initializes a new Site object
    @param {Object} config Site configuration
    @return The an instance of new Site object
  */
  this.initializeSite = function(config){
    this.site = new Site(this.controller, config || {})
    // Set up the default helpers
    this.view.helpers.add({
      Site : this.site
    });

    return this.site;
  };

  /*
    @name SinglePageApplication.config
    @public
    @type Object
    @description The config object
  */
  this.config = {};

  /*
    @name SinglePageApplication.config#set
    @public
    @function
    @description Sets the internal configuration object
    @param {Object} config Configuration object to extend internal configuration
    @return The current instance of SinglePageApplication
  */
  this.config.set = function(config) {
    this.config = extend(this.config, config);

    return this.config;
  };

  /**
    @name SinglePageApplication.config#layout
    @public
    @type String
    @description Layout used by the SPA
  */  
  this.config.layout = 'application';

  /**
    @name SinglePageApplication.config#path
    @public
    @type Object
    @description Defined paths
  */  
  this.config.path = {
      views       : 'app/views'
    , templates   : 'templates'
    , layouts     : 'layouts'
    , controllers : 'app/controllers'
    , models      : 'app/models'
  };
});



// Attach
geddy.SinglePageApplication.Site = Site;

// Export
exports = geddy.SinglePageApplication;