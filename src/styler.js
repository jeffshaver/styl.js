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
     * We need a document to use brief, so throw an error if we
     * are in environments likes node
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
    value: function() {
      return map(cssInjectStyles, function(styles, selector) {
        return selector + '{' +
        styles.map(function(value) {
          return map(value, function(value, key) {
            return key + ':' + value;
          });
        }).join(';') + '}';
      }).join('');
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


  var getKeyFromObject = function(style) {
    return Object.keys(style).join('');
  };

  var convertAttributeAndStyleToObject = function(attribute, style) {
    var styleObject = {};
    styleObject[attribute] = style;
    return styleObject;
  };

  var getKeysForStyles = function(selector, attributes) {
    return cssInjectStyles[selector].map(function(value, key) {
      if (Object.keys(value).filter(function(v) {
        return attributes.indexOf(v) !== -1;
      }).length > 0) {
        return key;
      }
    }).filter(function(value) {
      return value !== undefined;
    });
  };

  var inject = function(selector, styles) {
    if (!initialized) {
      init();
    }
    if (!cssInjectStyles.hasOwnProperty(selector)) {
      cssInjectStyles[selector] = [];
    }
    if (typeof styles == 'string') {
      styles = [convertAttributeAndStyleToObject(styles, arguments[2])];
    }
    styles.forEach(function(value) {
      var attribute = getKeyFromObject(value);
      var index = getKeysForStyles(selector, [attribute]);
      if (index.length > 0) {
        cssInjectStyles[selector][index[0]] = value;
      } else {
        cssInjectStyles[selector].push(value);
      }
    });
    document.getElementById('cssInject').innerHTML = cssInjectStyles.toString();
  };

  var eject = function(selector, styles) {
    if (!initialized) {
      throw new Error('styler.js has not been initialized. Try running inject first.');
    }
    if (!cssInjectStyles.hasOwnProperty(selector)) {
      throw new Error('no styles for this selector have been added');
    }
    if (typeof styles == 'string') {
      styles = [convertAttributeAndStyleToObject(styles, arguments[2])];
    }
    getKeysForStyles(selector, styles.map(function(value) {
      return getKeyFromObject(value);
    })).forEach(function(value) {
      cssInjectStyles[selector].splice(value, 1);
    });
    if (cssInjectStyles[selector].length === 0) {
      delete cssInjectStyles[selector];
    }
    document.getElementById('cssInject').innerHTML = cssInjectStyles.toString();
  };

  var getStyles = function() {
    if (!initialized) {
      throw new Error('styler.js has not been initialized. Try running inject first.');
    }
    return cssInjectStyles;
  };

  return {
    inject: inject,
    eject: eject,
    getStyles: getStyles
  };
}));