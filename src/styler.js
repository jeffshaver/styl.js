/*
 * styler.js
 *
 * Copyright 2014 Jeffrey E. Shaver II
 * Released under the MIT license

 * https://github.com/jeffshaver/styler.js/blob/master/LICENSE
 */

/*
 * UMD (Universal Module Definition)
 * see https://github.com/umdjs/umd/blob/master/returnExports.js
 */
(function(root, factory) {
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
    root.styler = factory();
  }
}(this, function() {
  'use strict';
  var noThirdParamterError = 'To use this syntax, you must provide a value as the third paramter';
  var notInitializedError = 'styler.js has not been initialized. Try running inject first.';
  var noStylesError = 'no styles for this selector have been added';
  /*
   * Helper function to create a new array from an object
   */
  var map = function(o, c, t) {
    var a = [], t = t || this, k;
    for (k in o) {
      if (o.hasOwnProperty(k)) {
        a.push(c.call(t, o[k], k, o));
      }
    }
    return a;
  };

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
  var cssInjectStyles = {};
  /*
   * Override the cssInjectStyles toString method to return something useful
   */
  Object.defineProperty(cssInjectStyles, 'toString', {
    value: function(includeBreaks) {
      var separator = includeBreaks ? '\n' : '';
      var tab = includeBreaks ? '  ' : '';
      return map(cssInjectStyles, function(styles, selector) {
        return selector + '{' + separator +
        styles.map(function(value) {
          return map(value, function(value, key) {
            return tab + key + ':' + value;
          });
        }).join(';' + separator) + separator + '}';
      }).join(separator);
    }
  });
  var initialized = false;

  /*
   * Function to intialize styler.js by creating a style element
   * that is appended to the bottom of the body element
   */
  var init = function() {
    var style = document.createElement('style');
    style.id = 'cssInject';
    document.getElementsByTagName('body')[0].appendChild(style);
    initialized = true;
  };

  var getKeyFromObject = function(obj) {
    return Object.keys(obj)[0];
  };

  var convertAttributeAndStyleToObject = function(attribute, style) {
    var styleObject = {};
    styleObject[attribute] = style;
    return styleObject;
  };

  var getIndexForAttribute = function(selector, attribute) {
    var i;
    for (i = 0; i < cssInjectStyles[selector].length; i++) {
      if (getKeyFromObject(cssInjectStyles[selector][i]) === attribute) {
        return i;
      }
    }
    return -1;
  };

  var inject = function(selector, styles) {
    if (!initialized) {
      init();
    }
    if (!cssInjectStyles.hasOwnProperty(selector)) {
      cssInjectStyles[selector] = [];
    }
    if (typeof styles == 'string') {
      if (!arguments[2]) {
        throw new Error('inject(): ' + noThirdParamterError);
      }
      styles = [convertAttributeAndStyleToObject(styles, arguments[2])];
    }
    styles.forEach(function(value) {
      var attribute = getKeyFromObject(value);
      var index = getIndexForAttribute(selector, attribute);
      if (index !== -1) {
        cssInjectStyles[selector][index] = value;
      } else {
        cssInjectStyles[selector].push(value);
      }
    });
    document.getElementById('cssInject').innerHTML = cssInjectStyles.toString();
    return this;
  };

  var eject = function(selector, attributes) {
    if (!initialized) {
      throw new Error('eject(): ' + notInitializedError);
    }
    if (!cssInjectStyles.hasOwnProperty(selector)) {
      throw new Error('eject(): ' + noStylesError);
    }
    if (typeof attributes == 'string') {
      attributes = [attributes];
    }
    attributes.forEach(function(attribute) {
      var index = getIndexForAttribute(selector, attribute);
      if (index !== -1) {
        cssInjectStyles[selector].splice(index, 1)  
      }
    });
    if (cssInjectStyles[selector].length === 0) {
      delete cssInjectStyles[selector];
    }
    document.getElementById('cssInject').innerHTML = cssInjectStyles.toString();
    return this;
  };

  var getStyles = function() {
    if (!initialized) {
      throw new Error('getStyles(): ' + notInitializedError);
    }
    return cssInjectStyles;
  };

  var Styler = function() {};
  Styler.prototype = {
    inject: inject,
    eject: eject,
    getStyles: getStyles
  };

  return new Styler();
}));