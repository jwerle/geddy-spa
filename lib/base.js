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
  @module base
  @requires utilities
  @requires JSONSelect
*/
var utils         = require('utilities')
  , jsonSelect    = require('JSONSelect')

/**
  @name base
  @namespace Base namespace
  @version 0.5
*/
var base = {};

/**
  @name base#extend
  @public
  @static
  @function
  @description Extends an object
  @param {Object} object The main object to extend
  @param {, Object} objectn Any number of objects to extend the main object with
  @return The main object extended
*/
base.extend = function() {
  var object
    , objectCount
    , i        = 0
    , objects  = this.makeArray(arguments);
  
  object      = objects.shift();
  objectCount = objects.length;

  for ( ; i < objectCount; i++) {
    object = utils.mixin(object, objects[i]);
  }

  return object;
};

/**
  @name base#makeArray
  @public
  @static
  @function
  @description Turns an object into a array. Usefule for the conversion of an arguments object
  to an array.
  @param {Object} object The object to be converted
  @return The new array
*/
base.makeArray = function() { 
  return Array.prototype.splice.apply(arguments[0], [0]); 
};

/**
  @name base#die
  @public
  @static
  @function
  @description Exits the process and logs any number of input to the console.
  @param {, Mixed} input Input to be logged to the console before exiting.
*/
base.die = function() { 
  console.log.error.apply(console, arguments); 
  process.exit(); 
};

/**
  @name base#noop
  @public
  @static
  @function
  @description No-opertation. Does nothing.
*/
base.noop = function() {};

/*
  @scope base
*/

/**
  @name base.QueryObject
  @constructor
  @description Constructs a new instance of a QueryObject, using JSONSelect as a default query engine.
  @param {Object} object The object to query
  @param {Object} config The config object
*/
base.QueryObject = function (object, config) {
  /**
    @name base.QueryObject#object
    @public
    @type object
    @description The object all queries are made against.
  */
  this.object = object || {};

  /**
    @name base.QueryObject#config
    @public
    @type object
    @description The config object.
  */
  this.config = config || {};

  /**
    @name base.QueryObject#engine
    @public
    @type object
    @description The engine to use to query the object
  */
  this.engine = config? config.engine : jsonSelect;
};


base.QueryObject.prototype = new function () {
  /*
    @scope base.QueryObject.prototype
  */
  /*
    @name base.QueryObject#query
    @public
    @function
    @description Queries the object for matches and returns the data using the query engine.
    @param {String} query A query used and interpreted by the engine set, defaults to JSONSelect.
    @return The matched results
  */
  this.query = function(query) {
    return this.engine.match(query, this.object);
  };
};


/*
  @exports base
*/
module.exports = base;