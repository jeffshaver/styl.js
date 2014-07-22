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

  var parameterCountError = 'You have passed {{count}} parameters. This is not a correct syntax.';
  var notInitializedError = 'styl.js has not been initialized. Try running inject first.';
  var noStylesError = 'no styles for `{{selector}}` have been added';
  var selectorSplit = /\,\s*/;
  var cssPropSplit = /([a-z])([A-Z])/g;
  var autoApply = false;
  var autoMinimized = true;
  var initialized = false;
  var stylesheet = null;
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

  var StylesToInject = function() {
    this.universal = new StylesObject();
    this.mediaQueries = new MediaQueriesObject();
  };
  var StylesObject = function() {};
  var MediaQueriesObject = function() {};

  var _toString = function(obj, includeBreaks, isMQObject) {
    var separator = includeBreaks ? '\n' : '';
    var tab = includeBreaks ? '  ' : '';
    var space = includeBreaks ? ' ' : '';
    return _map(_mapObject(_mapObject(obj, function(styles, selector) {
      var obj = {};
      styles.forEach(function(value) {
        var attribute = _getKeysFromObject(value, true);
        obj[attribute.replace(cssPropSplit, '$1-$2').toLowerCase()+':'+value[attribute]] = selector;
      });
      return obj;
    }), function(selectors, style) {
      var obj = {};
      obj[selectors.join(',' + space)] = style;
      return obj;
    }), function(styles, selector) {
      return (isMQObject ? tab : '') + selector + space + '{' + separator + tab + (isMQObject ? tab : '') + styles.join(';' + separator + tab + (isMQObject ? tab : '')) + ';' + separator + (isMQObject ? tab : '') + '}';
    }).join(separator + separator);
  };

  /*
   * Override the stylesToInject toString method to return something useful
   */
  Object.defineProperty(StylesToInject.prototype, 'toString', {
    value: function(includeBreaks) {
      var separator = includeBreaks ? '\n' : '';
      var space = includeBreaks ? ' ' : '';
      return _toString(stylesToInject.universal, includeBreaks) + separator + _map(stylesToInject.mediaQueries, function(obj, key) {
        return '@media ' + key + space + '{' + separator + _toString(obj, includeBreaks, true) + separator + '}';
      }).join(separator);
    }
  });

  /*
   * Structure
   *
   * {
   *   body: [
   *     {height: '100px'},
   *     {width: '100px'}
   *   ]
   * }
   */
  var stylesToInject = new StylesToInject();

  /*
   * Function to intialize styl.js by creating a style element
   * that is appended to the bottom of the body element
   */
  var _init = function() {
    var style = document.createElement('style');
    style.id = 'styl';
    document.getElementsByTagName('body')[0].appendChild(style);
    stylesheet = document.getElementById('styl');
    initialized = true;
  };

  /*
   * Get they keys from an object
   * If true is passed as the second argument, only return the first key
   * Returns: Array | String
   */
  var _getKeysFromObject = function(obj, one) {
    var keys = Object.keys(obj);
    return !one ? keys : keys[0];
  };

  /*
   * Helper function to locate the index of an attribute inside of the stylesToInject object
   * Returns: Integer
   */

  var _getIndexForAttribute = function(selector, attribute, obj) {
    var i;
    for (i = 0; i < obj[selector].length; i++) {
      if (_getKeysFromObject(obj[selector][i], true) === attribute) {
        return i;
      }
    }
    return -1;
  };

  var _injectMQ = function(mediaQuery, styles) {
    var selector;
    for (selector in styles) {
      _inject(mediaQuery, selector, styles[selector]);
    }
    return this;
  };

  /*
   * Function to insert styles into stylesToInject
   * Returns: Styl
   * Parameters: mqString, selector, styles, isMQ
   * It is possible to exclude both the first and last parameter
   */
  var _inject = function() {
    var isMQ = arguments.length === 3;
    var obj = stylesToInject.universal;
    var selector, styles, mqString;
    // If we haven't initialized, do it
    if (!initialized) {
      _init();
    }

    if (arguments.length !== 2 && arguments.length !== 3) {
      throw new Error('inject(): ' + parameterCountError.replace('{{count}}', arguments.length));
    }

    // If we are adding to a media query
    if (isMQ) {
      mqString = arguments[0];
      selector = arguments[1];
      styles = arguments[2];
      if (!stylesToInject.mediaQueries[mqString]) {
        stylesToInject.mediaQueries[mqString] = new StylesObject();
      }
      obj = stylesToInject.mediaQueries[mqString];
    // If we are adding universal styles
    } else {
      selector = arguments[0];
      styles = arguments[1];
    }

    /*
     * Split up the selector to make an array.
     * This is so we can support comma separated selector strings
     */
    if (typeof selector == 'string') {
      selector = selector.split(selectorSplit);
    }

    // For each selector, create a key inside of stylesToInject if it doesn't exist
    selector.forEach(function(selector) {
      if (!obj.hasOwnProperty(selector)) {
        obj[selector] = [];
      }
    });

    // For each style, push a copy into each selector
    styles.forEach(function(value) {
      var attribute = _getKeysFromObject(value, true);
      selector.forEach(function(selector) {
         // So that we do not create duplicate styles, check to see if it exists
        var index = _getIndexForAttribute(selector, attribute, obj);
        if (index !== -1) {
          obj[selector][index] = value;
        } else {
          obj[selector].push(value);
        }
      });
    });
    // If the developer has used setAutoApply(true), auto apply the styles
    if (autoApply) {
      stylesheet.innerHTML = stylesToInject.toString(!autoMinimized);
    }
    // Return the Styl object so that we can chain injects/ejects
    return this;
  };

  /*
   * Function to remove styles into stylesToInject
   * Returns: Styl
   */
  var _eject = function() {
    var isMQ = arguments.length === 3;
    var obj = stylesToInject.universal;
    var mqString, selector, attributes;
    // If we haven't initialized, throw an error
    if (!initialized) {
      throw new Error('eject(): ' + notInitializedError);
    }

    if (arguments.length !== 2 && arguments.length !== 3) {
      throw new Error('eject(): ' + parameterCountError.replace('{{count}}', arguments.length));
    }

    if (isMQ) {
      mqString = arguments[0];
      selector = arguments[1];
      attributes = arguments[2];
      obj = stylesToInject.mediaQueries[mqString];
    } else {
      selector = arguments[0];
      attributes = arguments[1];
    }

    /*
     * Force selector to be an arry.
     * This is so we can support comma separated selector strings
     */
    if (typeof selector == 'string') {
      selector = selector.split(selectorSplit);
    }
    // For each selector, if it doesn't exist in the stylesToInject object, throw an error
    selector.forEach(function(selector) {
      if (!obj.hasOwnProperty(selector)) {
        throw new Error('eject(): ' + noStylesError.replace('{{selector}}', selector));
      }
    });
    /*
     * Force attributes to be an array
     * This is so we can support comma separated selector strings
     */
    if (typeof attributes == 'string') {
      attributes = attributes.split(selectorSplit);
    }
    // For each attribute, remove the corresponding style from the selector in the stylesToInject object
    attributes.forEach(function(attribute) {
      selector.forEach(function(selector) {
        // So that we know where to splice, get the attributes position
        var index = _getIndexForAttribute(selector, attribute, obj);
        if (index !== -1) {
          obj[selector].splice(index, 1);
        }
        // If the selector has no more styles, delete it
        if (obj[selector].length === 0) {
          delete obj[selector];
        }
      });
    });
    if (isMQ && _getKeysFromObject(obj).length === 0) {
      delete stylesToInject.mediaQueries[mqString];
    }
    // If the developer has used setAutoApply(true), auto apply the styles
    if (autoApply) {
      stylesheet.innerHTML = stylesToInject.toString(!autoMinimized);
    }
    // Return the Styl object so that we can chain injects/ejects
    return this;
  };

  var _ejectAll = function() {
    var isMQ = arguments.length === 3;
    var obj = stylesToInject.universal;
    var mqString, selectors;
    if (isMQ) {
      mqString = arguments[0];
      selectors = arguments[1];
      obj = stylesToInject.mediaQueries[mqString];
    } else {
      selectors = arguments[0];
    }

    if (selectors) {
      if (typeof selectors == 'string') {
        selectors = selectors.split(selectorSplit);
      }
      selectors.forEach(function(e) {
        delete obj[e];
      });
      if (isMQ && _getKeysFromObject(obj).length === 0) {
        delete stylesToInject.mediaQueries[mqString];
      }
      return this;
    }
    stylesToInject = new StylesToInject();
    if (autoApply) {
      stylesheet.innerHTML = stylesToInject.toString(!autoMinimized);
    }
    return this;
  };

  /*
   * Function to take all the styles in the stylesToInject object
   * and put them into the the cssInject stylesheet
   * Returns: Styl
   */
  var _apply = function(minimize) {
    // Default minimize to true
    if (minimize == null) {
      minimize = true;
    }
    // Put the styles into the stylesheet by using stylesToInject toString method
    stylesheet.innerHTML = stylesToInject.toString(!minimize);
    // Return the Styl object so that we can chain injects/ejects
    return this;
  };

  /*
   * Function to return the stylesToInject object
   */
  var _getStyles = function(minimize) {
    if (minimize == null) {
      minimize = true;
    }
    // If we haven't initialized, throw an error
    if (!initialized) {
      throw new Error('getStyles(): ' + notInitializedError);
    }
    return stylesToInject.toString(!minimize);
  };

  /*
   * Function to set the autoApply variable
   */
  var _setAutoApply = function(auto, minimized) {
    // If the passed in value, isn't a boolean, throw an error
    if (typeof auto !== 'boolean') {
      throw new Error('setAutoApply(): value must be a boolean');
    }
    autoApply = auto;
    // Only set autoMinimized if minimized was passed in.
    if (minimized != null) {
      autoMinimized = minimized;
    }
    return this;
  };

  var Styl = function() {};
  Styl.prototype = {
    inject: _inject,
    eject: _eject,
    ejectAll: _ejectAll,
    injectMQ: _injectMQ,
    apply: _apply,
    getStyles: _getStyles,
    setAutoApply: _setAutoApply
  };

  return new Styl();
}));