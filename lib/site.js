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
var base   = require('./base.js')
  , Page   = require('./page.js')

/**
  @name Site
  @constructor
  @description Constructs a new instance of Site
  @param {object} config A site configuration object
*/
function Site(controller, config){
  /**
    @name Site#controller
    @public
    @type BaseController
    @description The main controller for the application. 
    Needed for internal functions
  */
  this.controller = controller || {};

  /**
    @name Site#cdn
    @public
    @type Object
    @description The CDN configuration
  */
  this.cdn = config.cdn || {};

   /**
    @name Site#app
    @public
    @type SinglePageApplication
    @description The main application
  */
  this.app = this.controller.spa || {};

  /**
    @name Site#scope
    @public
    @type Object
    @description The current scope for the site, a layout or template.
  */
  this.scope = {};

  /**
    @name Site#bindings
    @public
    @type Object
    @description The variable and function bindings inherited from the scope 
  */
  this.bindings = {};

  /**
    @name Site#config
    @public
    @type Object
    @description The site configuration object
  */
  this.config = config || {};

  /**
    @name Site#title
    @public
    @type String
    @description The site title
  */
  this.title = this.config.title || "Untitled";

  // Set a private instance of app to the pages object
  this.pages._app = this.app;
};

/*
  @scope Site.prototype
*/
Site.prototype = Site.fn = new (function(){
  /*
    @name Site#extend
    @public
    @function
    @description Extend the Site object instance
    @param {Object} object An object to extend the Site instance with
    @return The current instance of Site
  */
  this.extend = function(object) {
    return base.extend(this, object);
  }

  /*
    @name Site#init
    @public
    @function
    @description The method used to initialize the layout or template scope with in
    the site object and to provide bindings
    @param {Object} scope The layout or template scope
    @param {Object} bindings The key to value map of bindings
    @param {Object} propagateTo A key as a value to a sub object to an array map of 
    bindings to apply to sub objects. Ex: Site.init({partial : partial}, {partial : ['partial']});
    @return The site instance
  */
  this.init = function(scope, bindings, propagateTo) {
    var prop, i

    this.scope    = scope || {};
    this.bindings = bindings || {};

    if (typeof propagateTo === 'object') {
      for (prop in propagateTo) {
        if (typeof propagateTo[prop] === 'object' && propagateTo[prop].length) {
          for (i = propagateTo[prop].length - 1; i >= 0; i--) {
            if (typeof this[prop].bindings !== 'object') {
              this[prop].bindings = {};
            }

            if (typeof this.bindings[propagateTo[prop][i]] === 'function') {
              this[prop].bindings[propagateTo[prop][i]] = (function(func, scope) {
                return function() {
                  return func.apply(scope, arguments);
                };
              })(this.bindings[propagateTo[prop][i]], this.scope);
            }
            else {
              this[prop].bindings[propagateTo[prop][i]] = this.bindings[propagateTo[prop][i]];
            }
          }
        }
      }
    }

    return this;
  };

  /**
    @name Site#templates
    @public
    @type Object
    @description The templates object
  */
  this.templates = {
    /**
      @name Site#templates#globals
      @public
      @type Object
      @description The global variables for a template
    */
    globals : {}

    /**
      @name Site#templates#path
      @public
      @type String
      @description The default path for a template files
    */
  , path : 'templates/'
    /*
      @name Site#templates#fetch
      @public
      @function
      @description Fetches a templates contents
      @param {String} name The name of the template
      @return The template partial
    */
  , fetch : function(name, data, path) {
      return this.bindings.partial((path || this.path) + name, extend(this.globals, data || {}));
    }

  };

  /**
    @name Site#pages
    @public
    @type Object
    @description The pages object
  */
  this.pages = {
      _app      : null
    , active    : {
        page  : null
      , fetch : function(){
        return page && page.fetch? this.page.fetch() : null;
      }
    }
    , _pages    : {}
    , _helpers  : {}
      /*
        @name Site#pages#create
        @public
        @function
        @description Creates an instance of Site.Page
        @param {String} page The page name to create
        @param {Object} options The options for the new Site.Page instance
        @return The pages object
      */
    , create : function(name, options) {
        var page, i, self = this

        if (typeof name === 'string' && typeof options === 'object' && options.active !== false) {
          page = this._pages[name] = new Page(name, options, this);

          if (typeof page.routes === 'object' && page.routes.length && page.bound === false) {
            for (i = page.routes.length - 1; i >= 0; i--) {
              this._app.event.once(page.routes[i], function(event){
                page.bound = true;

                self.active.page = page;
                event.respond({
                  page : name
                }, {
                  view    : page.view,
                  layout  : (options.layout? options.layout : options.layout === false? 'empty' : false)
                });
              });
            }
          }
        }

        return this;
      }

      /*
        @name Site#pages#extend
        @public
        @function
        @description Extends the Site object's pages object
        @param {Object} pages An object to extend the Site object's pages object with
        @return The pages object
      */
    , extend : function(pages){
        var page

        for (page in pages) {
          this.create(page, pages[page]);
        }

        return this;
      }

      /*
        @name Site#pages#each
        @public
        @function
        @description Enumerates over each page in the pages object
        @param {Function} callback Callback to excute on each iteration on the object
        @return The pages object
      */
    , each : function(selector, callback){
        var page, pages

        callback = (typeof selector === 'function' ? selector : 
                   (typeof callback === 'function' ? callback :
                    false));

        selector = (typeof selector === 'string' ? selector : '*');

        pages = this.query(selector);

        for (page in pages) {
          if (! pages[page] instanceof Site.Page) {
            throw ([page, ' is not a valid instance of SinglePageApplication.Site.Page'].join(''));
          }
          else if (typeof callback === 'function') {
            callback.apply(pages[page], [page, pages[page]]);
          }
        }

        return this;
      }

      /*
        @name Site#pages#get
        @public
        @function
        @description Returns the instance of a page by name
        @param {String} name The name of the page
        @return The page instance if found, else all
      */
    , get  : function(name) {
        if (typeof this._pages[name] !== 'undefined') {
          return this._pages[name];
        }

        return this._pages;
      }

       /*
        @name Site#pages#query
        @public
        @function
        @description Returns the instance of a page by name
        @param {String} query The query to filter results
        @return An array of results
      */
    , query : function(query) {
        var page, pages = this.get(), results = [], container

        if (typeof query !== 'string' && !query.length) {
          throw "Site.pages.query() needs a valid query string!";
        }

        for (page in pages) {
          container = pages[page].container; // cache
          delete pages[page].container; // remove because of circular reference
          
          if (base.QueryObject.engine.match(query, pages[page]).length) {
            results.push(pages[page]);
          }

          pages[page].container = container; // re-attache
        }

        return results;
      }


      /*
        @name Site#pages#fetch
        @public
        @function
        @description Returns the instance of a page by name and the rendered partial
        @param {String} name The name of the page
        @return The page instance
      */
    , fetch  : function(name) {
        var page, tpl
        if (typeof (page = this._pages[name]) !== 'undefined') {
          tpl = (page.template? 'templates/' + page.template : 
                  (page.view? page.view : ''));

          page.partial = this.bindings.partial(tpl, {
              page : name,
              view : page.view,
              data : page.data || {}
          });

          return page;
        }

        return null;
      }
  };


});

Site.Page = Page;
exports   = Site;