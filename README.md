styler.js
=========

CSS Injection

Requirements
============

IE9+ / Modern Browsers

Need to support:
```
Array.prototype.map
Object.keys
Object.defineProperty
```

Injection
=========

Style injecting can be done in one of two ways:

```
// Only one style to be added
styler.inject('body', 'height', '100px');

// Multiple styles to be added
styler.inject('body', [{height: '100px'}, {width: '100px'}]);
```

Ejection
========

Style ejection can be done in one of two ways:

```
// Only one style to be removed
styler.eject('body', 'height');

// Multiple styles to be removed
styler.eject('body', ['height', 'width']);
```

Applying Styles
===============

Styles are not automatically applied, by default, when ```inject``` or ```eject``` is called. This is to allow minimal writes to the DOM. (See Next Section)

To apply styles:

```
// Apply the styles that have been placed into styler without whitespace
styler.apply()

// Apply the styles that have been placed into styler in with whitespace
```

Automatic Style Application
===========================

It is possible to force styler.js to automatically apply styles when ```inject``` or ```eject``` is called.

```
// Force styles to automatically be applied
styler.setAutoApply(true);

// Force styles ot be automatically applied with whitespace
styler.setAutoApply(true, false);

// Force styles to be automatically applied without whitespace again
styler.setAutoApply(true, true);

// Force styles to be manually applied again
styler.setAutoApply(false);


```

Get Styles
==========

A method is provided to get all the styles being used by styler as an object

```
// Get styles with minimal whitespace
styler.getStyles();

// Get styles with breaks/spaces added
styles.getStyles(true);
```

The object that is returned by this method has had its toString() method overridden so that it returns a useful string of all the styles.