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

var utils         = require('utilities')
  , Events        = require('events')
  , noop          = function(){}
  , die           = function(){ geddy.log.error.apply(console, arguments); process.exit(); }
  , makeArray     = function(){ return Array.prototype.splice.apply(arguments[0], [0]); }

/**
  @name controller
  @namespace controller
*/
var geddy = global.geddy || geddy || {};

/**
  @name geddy.SinglePageApplication
  @constructor
*/
geddy.SinglePageApplication = function(/* Geddy */ geddy, /* Object */ config) {
  var oldOn
    , self = this

  /**
    @name geddy.SinglePageApplication#root
    @public
    @type Geddy
    @description The global geddy object.
  */
  this.root = geddy;

  /**
    @name geddy.SinglePageApplication#controller
    @public
    @type BaseController
    @description The main controller for the application
  */
  this.controller = null;

  /**
    @name geddy.SinglePageApplication#events
    @public
    @type EventEmitter
    @description The event emitter object
  */
  this.event = new Events.EventEmitter();
  oldOn = this.event.on;
  this.event.on = function(){
    var args = makeArray(arguments)
      , ns   = args[0].split('.')[0]
      , index

    if (!!~ (index = self.routes.indexOf(args[0]))) {
      delete self.routes[index];
    }

    if (~ (index = self.routes.indexOf(ns))) {
      self.routes.push(ns);
    }

    self.routes.push(args[0]);

    return oldOn.apply(self.event, args);
  }

  /**
    @name geddy.SinglePageApplication#routes
    @public
    @type Array
    @description Defined routes
  */  
  this.routes = [];

  /**
    @name geddy.SinglePageApplication#routing
    @public
    @type Object
    @description Routing configuration
  */  
  this.routing = {};


  // Initialize with default configuration
  this.config(config);
}

geddy.SinglePageApplication.prototype = new (function(){
  var extend
    , init
    , interfaces
    , findRouteEvents

  // Private
  filterRouteEvents = function(string) {
    var events
      , event
      , routeEvents   = []
      , stdEvents     = []

    events = string.split(',');

    for (var i = events.length - 1; i >= 0; i--) {
      if (!!~ (events[i].indexOf('route:'))) {
        routeEvents.push(events[i].split(':')[1]);
      }
    };

    return routeEvents.join(',');
  };

  init = function() {
    var prop
      , oldOn
      , index
      , self       = this
      , controller = this.controller

    if (typeof controller != 'object') {
      this.root.log.error("Invalid controller");
    }

    for (prop in interfaces.controller) {
      controller[prop] = interfaces.controller[prop];
      controller.spa = this;
    }

    oldOn = controller.on;
    controller.on = function(){
      var args  = makeArray(arguments)
        , event = args[0]
        , index
        , i
        , routeEvents

      args.shift();

      if (routeEvents = filterRouteEvents(event)) {
        routeEvents = routeEvents.split(',');
        
        for (i = routeEvents.length - 1; i >= 0; i--) {
          self.event.on.apply(self.event, [routeEvents[i]].concat(args));
        }
      }
      else {
        oldOn.apply(this, args);
      }

      return this;
    }

    controller.respondsWith = ['html', 'json'].concat(this.routing.types || []);

    this.controller = controller;

    return this;
  }

  extend = function() {
    var object
      , objectCount
      , i        = 0
      , objects  = makeArray(arguments);
    
    object      = objects.shift();
    objectCount = objects.length;

    for ( ; i < objectCount; i++) {
      object = utils.mixin(object, objects[i]);
    }

    return object;
  };

  interfaces = {
    // #index, #add, #edit, #create, #update, #destroy 
    //(:subject)(/:control)(/:method)(/:data')
    controller : extend({
      index : function(request, response, params) {
        var eventTypes = []
          , i

        if (params.subject && ~ (this.spa.routes.indexOf(params.subject))) {
          eventTypes.push(params.subject);
        }
        if (params.control) {
          eventTypes.push([params.subject, params.control].join('.'));
        }

        if (params.method) {
          eventTypes.push([params.subject, params.control, params.method].join('.'));
        }

        if (params.data) {
          eventTypes.push([params.subject, params.control, params.method, params.data].join('.'));
        }


        for (i = eventTypes.length - 1; i >= 0; i--) {
           this.spa.event.emit(eventTypes[i], {
              control : this
            , params: params
          });
        }

        if (this.spa.routes.indexOf()) {
          this.spa.event.emit('404',  {
              control : this
            , params: params
          });
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
    @name geddy.SinglePageApplication#registerController
    @public
    @function
    @description Registers the controller for the SPA
    @param {BaseController} An instance of controller.BaseController provided
    by the Geddy Web Framework.
    @return The current instance of SinglePageApplication
  */
  this.registerController = function(/* controller.BaseController */ controller, /* Object */ routing) {
    this.controller = controller || !function(){ die("A SinglePageApplication needs a controller"); }();
    this.routes     = !routing? [] : routing.routes || [];
    this.routing    = routing || {};

    delete this.routing.routes;

    return init.call(this);
  };

  /*
    @name geddy.SinglePageApplication#config
    @public
    @function
    @description Extends the internal configuration object
    @param {BaseController} An instance of controller.BaseController provided
    by the Geddy Web Framework.
    @return The current instance of SinglePageApplication
  */
  this.config = function(/* Object */ config) {
    return extend(this._config, config);
  };

  this._config = {
    path : {
        views       : 'app/views'
      , templates   : 'app/views/templates'
      , layouts     : 'app/views/layouts'
      , controllers : 'app/controllers'
      , models      : 'app/models'
    }
  };
});

exports.SinglePageApplication = module.exports.SinglePageApplication = geddy.SinglePageApplication;