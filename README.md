styl.js
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
Object.defineProperties
```

Injection
=========

Style injecting can be done in one of the following ways ways:

```
// Add styles
styl.inject('body', {
  height: '100px',
  width: '100px'
});

// Add styles into media queries
styl.inject('only screen and (min-width: 800px)', 'body', {
  height: '100px'
});
// Or if you need to apply styles for multiple selectors in a media query
styl.inject('only screen and (min-width: 800px)', {
  body: {
    height: '100px'
  },
  div: {
    height: '10px'
  }
});

// cameCase is automatically converted for you, 
// but you can type it out if you want
styl.inject('body', {
  backgroundColor: 'blue',
  'font-size': '16px'
});
```

Ejection
========

Style ejection can be done in one of the following ways:

```
// Remove styles
styl.eject('body', ['height', 'width']);

// Remove styles from media queries
styl.eject('only screen and (min-width: 800px)', 'body', ['height', 'width']);

// Eject all styles stored by styl
styl.eject()

// Eject all styles on the body element that are stored by styl
styl.ejectAll('body');

// Eject all styles out of a media query
styl.eject('only screen and (min-width: 800px)');

// Eject all styles out of a selector inside a media query
styl.eject('only screen and (min-width: 800px)', 'body');

// Eject all selectors except for body
styl.eject('!body');

// Eject all the attribute from body except background
styl.eject('body', ['!background']);

// Eject all media queries except for only screen and (min-width: 600px)
styl.eject('!only screen and (min-width: 600px)');
```

Applying Styles
===============

Styles are not automatically applied, by default, when ```inject``` or ```eject``` is called. This is to allow minimal writes to the DOM. (See Next Section)

To apply styles:

```
// Apply the styles that have been placed into styl without whitespace
styl.apply()

// Apply the styles that have been placed into styl in with whitespace
styl.apply(true);
```

Automatic Style Application
===========================

It is possible to force styl.js to automatically apply styles when ```inject``` or ```eject``` is called.

```
// Force styles to automatically be applied
styl.setAutoApply({apply: true});

// Force styles ot be automatically applied with whitespace
styl.setAutoApply({apply: true, whitespace: true});

// Force styles to be automatically applied without whitespace again
styl.setAutoApply({whitespace: false});

// Force styles to be manually applied again
style.setAutoApply({apply: false});
```

Get Styles
==========

A method is provided to get a string of all the styles being used by styl as an object

```
// Get styles with minimal whitespace
styl.getStyles();

// Get styles with breaks/spaces added
styles.getStyles(true);
```