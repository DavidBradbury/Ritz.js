/*
 * Ritz.js — A clean and portable speed-reading tool
 * CC BY NC 2015 David Bradbury — http://davidbradbury.us
 */

"use strict";

(function (window, document, undefined) {

  var Ritz, ritz,
      defaultOptions = {
        target  : ".ritz-module",
        callback: null,
        minDelay: 20,
        wpmDelay: 150, // 400wpm
        position: 0,
        status  : null
      };

  /* ----------------------------------------------------------------------- */

  // Returns: Array with all empty/false elements removed
  function cleanArray(arrayIn) {
    var arrayOut = [];

    for ( var i = 0; i < arrayIn.length; i++ ) {
      if ( arrayIn[ i ] ) {
        arrayOut.push( arrayIn[ i ] );
      }
    }

    return arrayOut;
  }

  // Process the source text for reading and returns an array
  function processText(stringIn) {
    var arraySplit, cleanSplit;

    // Replace tabs and new-lines with spaces.
    // If the space is redundant, it will be removed.
    // Make sure decimals aren't treated like periods.
    stringIn = stringIn
      .replace( /(\r\n|\n|\r)/gm, " \n " )
      .replace( /\.\.\./gm, "… " )
      .replace( /(\.[^0-9])/gm, ". " )
      .replace( /\t/gm, " " );


    arraySplit = stringIn.split( " " );
    cleanSplit = cleanArray( arraySplit );

    return cleanSplit;
  }

  // ORP: Optimal Recognition Point - Knicked from Squirt for now
  function getORPIndex(stringIn) {
    var length = stringIn.length,
        lastChar = stringIn[ stringIn.length - 1 ];

    if ( lastChar == "\n" ) {
      lastChar = stringIn[ stringIn.length - 2 ];
      length--;
    }

    if ( ",.?!:;\"…".indexOf( lastChar ) != -1 ) length--;

    return length <= 1 ? 0 :
      (length == 2 ? 1 :
        (length == 3 ? 1 :
        Math.floor( length / 2 ) - 1));
  }

  // Returns a string wit the ORP wrapped in <em>
  function applyORP(stringIn, orp) {
    var result = "";

    stringIn.split( "" ).map( function (char, i) {
      if ( i == orp ) {
        result += "<em>" + char + "</em>";
      }
      else {
        result += char;
      }
    } );

    return result;
  }

  // Centers the text based on the ORP
  function centerORP(that) {
    var options = that.module.options;
    var reticle = document.querySelectorAll( options.target + " .ritz-reticle" )[ 0 ],
        orp = document.querySelectorAll( options.target + " .ritz-text em" )[ 0 ],
        ritzText = document.querySelectorAll( options.target + " .ritz-text" )[ 0 ],
        reticleOffset, orpOffset, offset;

    // TODO: default without reticle

    ritzText.style.setProperty( "padding-left", "0px", "" );

    reticleOffset = reticle.offsetLeft + ( 0.5 * reticle.offsetWidth );
    orpOffset = orp.offsetLeft + ( 0.5 * orp.offsetWidth );
    offset = reticleOffset - orpOffset;

    ritzText.style.setProperty( "padding-left", offset + "px", "" );
  }

  // Returns the modified delay based on different aspects of the word
  function modifyDelay(stringIn, delay) {
    var originalDelay = delay;

    // Hard punctuation
    if ( stringIn.match( /[\.\?!]/i ) ) {
      delay *= 3;
    }

    // Soft punctuation
    if ( stringIn.match( /[,;]/i ) ) {
      delay *= 1.6;
    }

    // Ellipsis …
    if ( stringIn.match( /…/i ) ) {
      delay *= 4;
    }

    // Long words
    if ( stringIn.length > 11 ) {
      delay *= 1.2;
    }

    // Short words
    if ( stringIn.length < 4 ) {
      delay *= 0.8;
    }

    // Paragraph break
    if ( stringIn == "<em>\n</em>" ) {
      delay = originalDelay * 0.8;
    }

    return delay;
  }

  // Main, yo
  function mainLoop(that) {

    var passageArray = that.module.processed,
        options = that.module.options,
        lastPeriod = "&#9679;",
        currentWord, orp, finalWord,
        timer, lastChar, i,
        progress;

    i = options.position;
    if ( typeof i == "undefined" ) i = 0;
    if ( i < 0 ) i = 0;

    currentWord = passageArray[ i ];
    orp = getORPIndex( currentWord );
    finalWord = applyORP( currentWord, orp );

    // Timer mods
    timer = options.wpmDelay;
    if ( typeof timer == "undefined" || timer < options.minDelay ) {
      timer = options.minDelay;
    }

    timer = modifyDelay( finalWord, timer );

    // If it ends with a period, make it stand out with a middle dot
    lastChar = finalWord[ finalWord.length - 1 ];

    if ( lastChar == "." ) {
      finalWord = finalWord.slice( 0, -1 );
      finalWord += lastPeriod;
    }

    if ( finalWord != "<em>\n</em>" ) {
      document.querySelectorAll( options.target + " .ritz-text" )[ 0 ].innerHTML = finalWord;
    }
    else {
      // Paragraph break
    }
    //console.log([currentWord, finalWord, orp]);

    // Now that we have the word and the ORP, center it
    centerORP( that );

    if ( that.module.options.status != "pause" ) {

      i++;
      that.module.options.position = i;

      // Update progress if it exists
      progress = document.querySelectorAll( options.target + " .ritz-progress-bar" )[ 0 ];

      if ( typeof progress != "undefined" ) {
        progress.style.setProperty( "width", (i / passageArray.length * 100) + "%", "" );
      }

      if ( passageArray.length == i ) {

        finished( that );

      }
      else {

        window.setTimeout( function () {
          mainLoop( that );
        }, timer );

      }
    }
  }

  // We"ve finished!
  function finished(that) {
    var options = that.module.options;
    options.status = "finished";
    if ( options.callback != null ) options.callback();
  }

  function updateInfo(that, selector, options) {
    var source;

    if ( typeof selector == "undefined" ) selector = that.selector;

    // If selector is a string, then use the chosen node
    // Otherwise, use the current selection
    if ( typeof selector == "string" ) {
      var sourceText, temp = "";
      // Get text from selector
      source = document.querySelectorAll( selector );

      for ( var i = 0; i < source.length; i++ ) {
        temp += source[ i ].textContent + " ";
      }
      sourceText = temp;

    }
    else {
      // Get text from selection
      sourceText = document.getSelection().toString();
      options = selector;
      selector = "{selection}";
    }

    that.selector = selector;
    that.module = [];

    // Store everything for reference
    that.module = {
      selector : selector,
      processed: processText( sourceText ),
      options  : defaultOptions
    };

    if ( typeof options != "undefined" ) {
      for ( var key in options ) {
        that.module.options[ key ] = options[ key ];
      }
    }
  }

  function updateWPM(that, val) {
    var wpm = parseInt( val );
    if ( wpm ) that.module.options.wpmDelay = 60 * 1000 / parseInt( wpm );
  }

  /* ----------------------------------------------------------------------- */

  /* MAIN */
  Ritz = function (selector, options) {
    updateInfo( this, selector, options );
    this.module.options.status = "init";
    return true;
  };

  Ritz.fn = {
    play     : function (update) {

      if ( typeof update == "undefined" ) update = false;

      if ( update ) {
        updateInfo( this );
        this.module.options.position = 0;
      }

      var options = this.module.options;

      if ( options.status != "play" ) {
        options.status = "play";
        mainLoop( this );
      }
      else {
        options.posistion = 0;
      }

    },
    update   : function () {
      updateInfo( this );
    },
    pause    : function () {
      this.module.options.status = "pause";
    },
    scrub    : function (val) {
      this.module.options.position += parseInt( val );
    },
    restart  : function () {
      this.module.options.position = 0;
      mainLoop( this );
      this.pause();
    },
    updateWPM: function (val) {
      updateWPM( this, val );
    },
    updateWpm: function (val) {
      updateWPM( this, val );
    }
  };

  // Assign Ritz.fn to the prototype
  for ( var key in Ritz.fn ) {
    Ritz.prototype[ key ] = Ritz.fn[ key ];
  }

  ritz = function (selector, options) {
    return new Ritz( selector, options );
  };

  // If for some weird reason ritz is taken, take _ritz
  if ( typeof window.ritz === "undefined" ) {
    window.ritz = ritz;
  }
  else {
    window._ritz = ritz;
  }

})( window, window.document );