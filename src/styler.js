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
    root.styler = factory();
  }
}(this, function() {
  'use strict';

  var noThirdParamterError = 'To use this syntax, you must provide a value as the third paramter';
  var notInitializedError = 'styler.js has not been initialized. Try running inject first.';
  var noStylesError = 'no styles for `{{selector}}` have been added';
  var selectorSplit = /\,\s*/;
  var autoApply = false;
  var autoMinimized = true;
  var initialized = false;
  var stylesheet;
  /*
   * Helper function to create a new array from an object
   * Returns: Array
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
   * Helper function to create a new object from an object
   * Returns: Object
   */
  var mapObject = function(o, c, t) {
    var a = {}, t = t || this, k, keys, obj;
    for (k in o) {
      if (o.hasOwnProperty(k)) {
        obj = c.call(t, o[k], k, o);
        keys = getKeysFromObject(obj);
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

  var StylesObject = function() {};

  /*
   * Override the stylesToInject toString method to return something useful
   */
  Object.defineProperty(StylesObject.prototype, 'toString', {
    value: function(includeBreaks) {
      var separator = includeBreaks ? '\n' : '';
      var tab = includeBreaks ? '  ' : '';
      var space = includeBreaks ? ' ' : '';
      return map(mapObject(mapObject(stylesToInject, function(styles, selector) {
        var obj = {};
        styles.forEach(function(value) {
          var attribute = getKeysFromObject(value, true);
          obj[attribute+':'+value[attribute]] = selector;
        });
        return obj;
      }), function(selectors, style) {
        var obj = {};
        obj[selectors.join(',' + space)] = style;
        return obj;
      }), function(styles, selector) {
        return selector + space +  '{' + separator + tab + styles.join(';' + separator + tab) + ';' + separator + '}';
      }).join(separator + separator);
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
  var stylesToInject = new StylesObject();

  /*
   * Function to intialize styler.js by creating a style element
   * that is appended to the bottom of the body element
   */
  var init = function() {
    var style = document.createElement('style');
    style.id = 'styler';
    document.getElementsByTagName('body')[0].appendChild(style);
    stylesheet = document.getElementById('styler');
    initialized = true;
  };

  /*
   * Get they keys from an object
   * If true is passed as the second argument, only return the first key
   * Returns: Array | String
   */
  var getKeysFromObject = function(obj, one) {
    var keys = Object.keys(obj);
    return !one ? keys : keys[0];
  };

  /*
   * Helper function to convert attribute/style strings into an object
   * Returns: Object
   */
  var convertAttributeAndStyleToObject = function(attribute, style) {
    var styleObject = {};
    styleObject[attribute] = style;
    return styleObject;
  };

  /*
   * Helper function to locate the index of an attribute inside of the stylesToInject object
   * Returns: Integer
   */

  var getIndexForAttribute = function(selector, attribute) {
    var i;
    for (i = 0; i < stylesToInject[selector].length; i++) {
      if (getKeysFromObject(stylesToInject[selector][i], true) === attribute) {
        return i;
      }
    }
    return -1;
  };

  /*
   * Function to insert styles into stylesToInject
   * Returns: Styler
   */
  var inject = function(selector, styles) {
    // If we haven't initialized, do it
    if (!initialized) {
      init();
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
      if (!stylesToInject.hasOwnProperty(selector)) {
        stylesToInject[selector] = [];
      }
    });
    /*
     * If styles is a string, we are dealing with the three parameter syntax
     * so we need to conver styles and the third argument into an object
     */
    if (typeof styles == 'string') {
      if (!arguments[2]) {
        throw new Error('inject(): ' + noThirdParamterError);
      }
      styles = [convertAttributeAndStyleToObject(styles, arguments[2])];
    }
     // For each style, push a copy into each selector
    styles.forEach(function(value) {
      var attribute = getKeysFromObject(value, true);
      selector.forEach(function(selector) {
         // So that we do not create duplicate styles, check to see if it exists
        var index = getIndexForAttribute(selector, attribute);
        if (index !== -1) {
          stylesToInject[selector][index] = value;
        } else {
          stylesToInject[selector].push(value);
        }
      });
    });
    // If the developer has used setAutoApply(true), auto apply the styles
    if (autoApply) {
      stylesheet.innerHTML = stylesToInject.toString(!autoMinimized);
    }
    // Return the Styler object so that we can chain injects/ejects
    return this;
  };

  /*
   * Function to remove styles into stylesToInject
   * Returns: Styler
   */
  var eject = function(selector, attributes) {
    // If we haven't initialized, throw an error
    if (!initialized) {
      throw new Error('eject(): ' + notInitializedError);
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
      if (!stylesToInject.hasOwnProperty(selector)) {
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
        var index = getIndexForAttribute(selector, attribute);
        if (index !== -1) {
          stylesToInject[selector].splice(index, 1);
        }
        // If the selector has no more styles, delete it
        if (stylesToInject[selector].length === 0) {
          delete stylesToInject[selector];
        }
      });
    });
    // If the developer has used setAutoApply(true), auto apply the styles
    if (autoApply) {
      stylesheet.innerHTML = stylesToInject.toString(!autoMinimized);
    }
    // Return the Styler object so that we can chain injects/ejects
    return this;
  };

  var ejectAll = function() {
    stylesToInject = new StylesObject();
    if (autoApply) {
      stylesheet.innerHTML = stylesToInject.toString(!autoMinimized);
    }
    return this;
  };

  /*
   * Function to take all the styles in the stylesToInject object
   * and put them into the the cssInject stylesheet
   * Returns: Styler
   */
  var apply = function(minimize) {
    // Default minimize to true
    if (minimize == null) {
      minimize = true;
    }
    // Put the styles into the stylesheet by using stylesToInject toString method
    stylesheet.innerHTML = stylesToInject.toString(!minimize);
    // Return the Styler object so that we can chain injects/ejects
    return this;
  };

  /*
   * Function to return the stylesToInject object
   */
  var getStyles = function(minimize) {
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
  var setAutoApply = function(auto, minimized) {
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

  var Styler = function() {};
  Styler.prototype = {
    inject: inject,
    eject: eject,
    ejectAll: ejectAll,
    apply: apply,
    getStyles: getStyles,
    setAutoApply: setAutoApply
  };

  return new Styler();
}));