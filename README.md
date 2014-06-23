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
``

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
styler.eject('body', 'height', '100px');

// Multiple styles to be removed
styler.eject('body', [{height: '100px'}, {width: '100px'}]);
```

Get Styles
==========

A method is provided to get all the styles being used by styler as an object

```
styler.getStyles();
```

The object that is returned by this method has had its toString() method overridden so that it returns a useful string of all the styles.