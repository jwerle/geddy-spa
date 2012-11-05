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
var base          = require('./base.js')
  , Site          = require('./site.js')
/**
  @name Page
  @constructor
  @description Constructs a new instance of Page
  @param {String} name The name of the page
  @param {Object} options Options for the page construction
*/
Page = function(name, options, container) {
  options = options || {};

  /*
    @name Page#name
    @public
    @type String
    @description The page name
  */
  this.name = name;

  /*
    @name Page#routes
    @public
    @type String
    @description The page routes to be captured
  */
  this.routes = options.routes || [];

  /*
    @name Page#view
    @public
    @type String
    @description The page view
  */
  this.view = options.view || "";

   /*
    @name Page#layout
    @public
    @type String
    @description The page layout
  */
  this.layout = options.layout || "";

  /*
    @name Page#template
    @public
    @type String
    @description The page template
  */
  this.template = options.template || "";

  /*
    @name Page#partial
    @public
    @type String
    @description The page partial
  */
  this.partial = null;

  /*
    @name Page#bound
    @public
    @type String
    @description The page bound state
  */
  this.bound = false;

  /*
    @name Page#data
    @public
    @type String
    @description The page data
  */
  this.data = options.data || {};

  /*
    @name Page#owner
    @public
    @type String
    @description The page container
  */
  this.container = container || {};

};

/*
  @scope Page.prototype
*/
Page.prototype = Page.fn = new (function(){
  /*
    @name Page.Page#fetch
    @public
    @function
    @description Returns the instance of the page by name and the rendered partial attached
    @return The page instance
  */
  this.fetch = function () {
    return this.container.fetch(this.name);
  }
});

exports = Page;