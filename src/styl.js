/*
 * styl.js
 *
 * Copyright 2014 Jeffrey E. Shaver II
 * Released under the MIT license

 * https://github.com/jeffshaver/styl.js/blob/master/LICENSE
 */

/*
 * UMD (Universal Module Definition)
 * see https://github.com/umdjs/umd/blob/master/returnExports.js
 */
(function(root, factory) {
  'use strict';
  if (typeof define == 'function' && define.amd) {
    /*
     * AMD. Register as an anonymous module.
     */
    define([], factory);
  } else if (typeof exports == 'object') {
    /*
     * Node and stuff
     */
    module.exports = factory();
  } else {
    /*
     * Browser globals (root is window)
     */
    root.styl = factory();
  }
}(this, function() {
  'use strict';

  var parameterCountError = 'You have passed %d parameters. This is not a correct syntax.';
  var notInitializedError = 'styl.js has not been initialized. Try running inject first.';
  var noStylesError = 'no styles for `%s` have been added';
  var selectorSplit = /\,\s*/;
  var cssPropSplit = /([a-z])([A-Z])/g;
  var vendorSelector = /::(-webkit|-ms|-moz|-o)/i;
  /*
   * From my understanding media queries have to start with a media type or an open parenthesis
   * so that is my test to determine if a string is a media query
   */
  var mediaQueryTest = /^(((only|all|braille|embossed|handheld|print|projection|screen|speech|tty|tv)\s{1})|\()/;
  var autoApply = false;
  var autoWithWhitespace = false;
  var initialized = false;
  var stylesheet = null;
  var stylesToInject = null;

  /**** Constructors ****/

  /*
   * StyleObject:
   *   Object that will hold attribute/value pairs
   */
  var StyleObject = function() {};
  StyleObject.prototype = {};
  Object.defineProperties(StyleObject.prototype, {
    count: {
      value: function() {
        return Object.keys(this).length;
      },
      enumerable: false,
      configurable: false
    }
  });

  /*
   * SelectorObject
   *   Object that will hold selector/StyleObject pairs
   */
  var SelectorObject = function() {};
  SelectorObject.prototype = {};
  /*
   * This toString method will be the main method used when applying styles
   * and when calling the getStyles() method
   */
  Object.defineProperties(SelectorObject.prototype, {
    toString: {
      value: function(withWhitespace, isMediaQuery) {
        var separator = withWhitespace ? '\n' : '';
        var tab = withWhitespace ? '  ' : '';
        var space = withWhitespace ? ' ' : '';
        if (isMediaQuery == null) {
          isMediaQuery = false;
        }
        return _map(_mapObject(_mapObject(this, function(styleObject, selector) {
          var obj = {};
          var attribute;
          for (attribute in styleObject) {
            if (styleObject.hasOwnProperty(attribute)) {
              obj[attribute + ':' + space + styleObject[attribute]] = selector;
            }
          }
          return obj;
        }), function(selectors, style) {
          var obj = {}, i;
          for (i = 0; i < selectors.length; i++) {
            if (vendorSelector.test(selectors[i])) {
              obj[selectors[i] + space] = style;
              selectors.splice(i--, 1);
            }
          }
          if (selectors.length === 0) {
            return obj;
          }
          obj[selectors.join(',' + space)] = style;
          return obj;
        }), function(styles, selector) {
          return (isMediaQuery ? tab : '') + selector + space + '{' +
            separator + tab + (isMediaQuery ? tab : '') +
            styles.join(';' + separator + tab + (isMediaQuery ? tab : '')) + ';' +
            separator + (isMediaQuery ? tab : '') + '}';
        }).join(separator + separator);
      },
      enumerable: false,
      configurable: false
    },
    /*
     * This method ensures that a selector exists in the object
     */
    generateSelector: {
      value: function(selector) {
        if (!this[selector]) {
          this[selector] = new StyleObject(false);
        }
        return this[selector];
      },
      enumerable: false,
      configurable: false
    },
    count: {
      value: function() {
        return Object.keys(this).length;
      },
      enumerable: false,
      configurable: false
    },
    injectStyles: {
      value: function(selectors, styleObject) {
        selectors = _splitSelectors(selectors);
        selectors.forEach(function(selector) {
          _extend(this.generateSelector(selector), styleObject);
        }, this);
        return this;
      },
      enumerable: false,
      configurable: false
    },
    ejectStyles: {
      value: function(selectors, attributes) {
        selectors = _splitSelectors(selectors);
        selectors.forEach(function(selector) {
          if (!this.hasOwnProperty(selector)) {
            console.error('eject(): ' + noStylesError, selector);
            return;
          }
          if (!attributes) {
            delete this[selector];
            return;
          }
          attributes.forEach(function(attribute) {
            delete this[selector][attribute];
          });
        }, this);
        return this;
      },
      enumerable: false,
      configurable: false
    }
  });

  /*
   * MediaQueryObject:
   *   Object that will hold mediaQuery/SelectorObject pairs
   */
  var MediaQueryObject = function() {};
  MediaQueryObject.prototype = {};
  Object.defineProperties(MediaQueryObject.prototype, {
    toString: {
      value: function(withWhitespace) {
        var separator = withWhitespace ? '\n' : '';
        var space = withWhitespace ? ' ' : '';
        return _map(this, function(selectorObject, mediaQuery) {
          return '@media ' + mediaQuery + space + '{' +
            separator + selectorObject.toString(withWhitespace, true) + separator +
            '}';
        });
      },
      enumerable: false,
      configurable: false
    },
    generateMediaQuery: {
      value: function(mediaQuery) {
        if (!this[mediaQuery]) {
          this[mediaQuery] = new SelectorObject();
        }
        return this[mediaQuery];
      },
      enumerable: false,
      configurable: false
    },
    ejectMediaQuery: {
      value: function(mediaQuery) {
        delete this[mediaQuery];
      },
      enumerable: false,
      configurable: false
    },
    ejectMediaQueryIfEmpty: {
      value: function(mediaQuery) {
        if (this[mediaQuery].count() === 0) {
          delete this[mediaQuery];
        }
      },
      enumerable: false,
      configurable: false
    }
  });

  /*
   * StylesToInject
   *   Object that will hold universal (SelectorObject) styles and mediaQueries (MediaQueryObject)
   */

  var StylesToInject = function() {
    this.universal = new SelectorObject();
    this.mediaQueries = new MediaQueryObject();
  };
  StylesToInject.prototype = {};
  Object.defineProperty(StylesToInject.prototype, 'toString', {
    value: function(withWhitespace) {
      if (withWhitespace == null) {
        withWhitespace = true;
      }
      return this.universal.toString(withWhitespace) +
             this.mediaQueries.toString(withWhitespace);
    },
    enumerable: false,
    configurable: false
  });

  /*
   * We will only be merging flat objects so this should do
   * Returns Object
   */
  var _extend = function(into, from) {
    var key;
    for (key in from) {
      into[key] = from[key];
    }
    return into;
  };

  /*
   * Easier to use than typeof
   * Returns: String
   */
  var _getVarType = function(v) {
    return Object.prototype.toString.call(v).replace(/^\[\w*\s|\]/g,'').toLowerCase();
  };

  /*
   * Helper function to create a new array from an object
   * Returns: Array
   */
  var _map = function(o, c, t) {
    var a = [], k;
    t = t || this;
    for (k in o) {
      if (o.hasOwnProperty(k)) {
        a.push(c.call(t, o[k], k, o));
      }
    }
    return a;
  };

  var _getKeysFromObject = function(obj, one) {
    var keys = Object.keys(obj);
    return !one ? keys : keys[0];
  };

  /*
   * Helper function to create a new object from an object
   * Returns: Object
   */
  var _mapObject = function(o, c, t) {
    var a = {}, k, keys, obj;
    t = t || this;
    for (k in o) {
      if (o.hasOwnProperty(k)) {
        obj = c.call(t, o[k], k, o);
        keys = _getKeysFromObject(obj);
        keys.forEach(function(key) {
          if (!a[key]) {
            a[key] = [];
          }
          a[key].push(obj[key]);
        });
      }
    }
    return a;
  };

  /*
   * Function to intialize styl.js by creating a style element
   * that is appended to the bottom of the body element
   */
  var _init = function() {
    var style = document.createElement('style');
    style.id = 'styl';
    stylesToInject = new StylesToInject();
    document.getElementsByTagName('body')[0].appendChild(style);
    stylesheet = document.getElementById('styl');
    initialized = true;
  };

  /*
   * Function that checks if a string is a media query
   * Returns: Boolean
   */
  var _isMediaQuery = function(mediaQuery) {
    return mediaQueryTest.test(mediaQuery);
  };

  /*
   * Check to see if the correct amount of arguments were passed in
   * Returns: Boolean
   */
  var _checkArgumentsLength = function(args) {
    return args.length === 2 || args.length === 3;
  };

  /*
   * Split a string of selectors by comma
   * Returns: Array
   */
  var _splitSelectors = function(selectors) {
    if (_getVarType(selectors) === 'array') {
      return selectors;
    }
    return selectors.split(selectorSplit);
  };

  /*
   * Turn a camel-case attribute into a hyphenated one
   * Returns: String
   */
  var _normalizeAttribute = function(attribute) {
    return attribute.replace(cssPropSplit, '$1-$2').toLowerCase();
  };

  /*
   * Create a style object based on styles that were passed in
   * Returns: StyleObject
   */
  var _createStyleObject = function(isMediaQuery, styles) {
    var styleObject = new StyleObject(isMediaQuery);
    var attribute;
    Object.defineProperty(styleObject, 'isMediaQuery', {
      value: isMediaQuery,
      enumerable: false,
      configurable: false
    });
    for (attribute in styles) {
      if (styles.hasOwnProperty(attribute)) {
        styleObject[_normalizeAttribute(attribute)] = styles[attribute];
      }
    }
    return styleObject;
  };

  /*
   * Inject styles into stylesToInject
   * Returns: Styl
   */
  var _inject = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    var isMediaQuery = _isMediaQuery(args[0]);
    var selectors = args[0];
    var styles = args[1];
    var selectorObject, mediaQuery;
    if (!initialized) {
      _init();
    }
    selectorObject = stylesToInject.universal;
    if (!_checkArgumentsLength(args)) {
      console.error('inject(): ' + parameterCountError, args.length);
      return;
    }
    if (isMediaQuery) {
      mediaQuery = args[0];
      selectors = args[1];
      styles = args[2];
      selectorObject = stylesToInject.mediaQueries.generateMediaQuery(mediaQuery);
      if (styles === undefined) {
        return _injectMediaQuery.call(this, mediaQuery, selectors);
      }
    }
    selectorObject.injectStyles(selectors, _createStyleObject(isMediaQuery, styles));
    return this;
  };

  /*
   * Convenience method to allow this syntax:
   *   styl.inject('media query string', {
   *     selector: {
   *       attribute: value
   *     }
   *   });
   * Returns: Styl
   */
  var _injectMediaQuery = function(mediaQuery, styles) {
    var selector;
    for (selector in styles) {
      _inject(mediaQuery, selector, styles[selector]);
    }
    return this;
  };

  /*
   * Eject styles from stylesToInject
   * Returns: Styl
   */
  var _eject = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    var isMediaQuery = _isMediaQuery(args[0]);
    var selectors = args[0];
    var attributes = args[1];
    var selectorObject, mediaQuery;
    if (!initialized) {
      console.error('eject(): ' + notInitializedError);
      return;
    }
    selectorObject = stylesToInject.universal;
    if (isMediaQuery) {
      mediaQuery = args[0];
      selectors = args[1];
      attributes = args[2];
      if (selectors === undefined && attributes === undefined) {
        stylesToInject.mediaQueries.ejectMediaQuery(mediaQuery);
        return this;
      }
      selectorObject = stylesToInject.mediaQueries[mediaQuery];
    }
    if (selectors === undefined && attributes === undefined) {
      stylesToInject = new StylesToInject();
      return this;
    }
    selectorObject.ejectStyles(selectors, attributes);
    if (isMediaQuery) {
      stylesToInject.mediaQueries.ejectMediaQueryIfEmpty(mediaQuery);
    }
    return this;
  };

  /*
   * Push styles in stylesToInject into the stylesheet
   * Returns: Styl
   */
  var _apply = function(withWhitespace) {
    if (withWhitespace === undefined) {
      withWhitespace = false;
    }
    stylesheet.innerHTML = stylesToInject.toString(withWhitespace);
    return this;
  };

  /*
   * Sets variable to allow styles to automatically be applied when injecting/ejecting
   * Returns: Styl
   */
  var _setAutoApply = function(settings) {
    autoApply = settings.apply || autoApply;
    autoWithWhitespace = settings.whitespace || autoWithWhitespace;
    return this;
  };

  /*
   * Generates string represenation of all the styles in stylesToInject
   * Returns: String
   */
  var _getStyles = function(withWhitespace) {
    if (withWhitespace === undefined) {
      withWhitespace = false;
    }
    // If we haven't initialized, throw an error
    if (!initialized) {
      console.error('getStyles(): ' + notInitializedError);
      return;
    }
    return stylesToInject.toString(withWhitespace);
  };

  /*
   * Define our main object and create its public methods
   */
  var Styl = function() {};
  Styl.prototype = {};
  Object.defineProperties(Styl.prototype, {
    inject: {
      value: _inject,
      enumerable: false,
      configurable: false
    },
    eject: {
      value: _eject,
      enumerable: false,
      configurable: false
    },
    getStyles: {
      value: _getStyles,
      enumerable: false,
      configurable: false
    },
    apply: {
      value: _apply,
      enumerable: false,
      configurable: false
    },
    setAutoApply: {
      value: _setAutoApply,
      enumerable: false,
      configurable: false
    }
  });

  return new Styl();
}));