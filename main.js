"use strict";

function $(selector) {
  return document.querySelectorAll( selector );
}

function yay() {
  console.log( 'Ritz Callback is a go' )
}

function init() {

  var ritzModule = ritz( '.passage', {
    callback: yay
  } );

  var $play = $( '.ritz-play' )[ 0 ];
  var $pause = $( '.ritz-pause' )[ 0 ];
  var $rewind = $( '.ritz-rewind' )[ 0 ];
  var $restart = $( '.ritz-restart' )[ 0 ];
  var $wpm = $( '.ritz-wpm' )[ 0 ];

  function getWPM() {
    var wpm = document.querySelectorAll( '.ritz-wpm' )[ 0 ];

    if ( typeof wpm !== "undefined" ) {
      wpm = parseInt( wpm.value );
      if ( parseInt( wpm ) ) return wpm;
    }
  }

  var ctrlEvents = {
    play   : function () {

      // Passing true forces it to update any changes
      ritzModule.updateWPM( getWPM() );
      ritzModule.play( true );
      $pause.innerHTML = "Pause";

    },
    pause  : function () {

      var status = this.innerHTML;

      if ( status == "Pause" ) {
        ritzModule.pause();
        this.innerHTML = "Resume";
      }
      else {
        ritzModule.play();
        this.innerHTML = "Pause";
      }
    },
    rewind : function () {
      ritzModule.scrub( -10 );
    },
    restart: function () {
      ritzModule.restart();
    },
    wpm    : function () {
      ritzModule.updateWPM( getWPM() );
    }
  };

  $play.addEventListener( 'click', ctrlEvents.play, false );
  $pause.addEventListener( 'click', ctrlEvents.pause, false );
  $rewind.addEventListener( 'click', ctrlEvents.rewind, false );
  $restart.addEventListener( 'click', ctrlEvents.restart, false );
  $wpm.addEventListener( 'change', ctrlEvents.wpm, false );

}

document.addEventListener( 'DOMContentLoaded', function () {

  var loadTitle = ritz( '.title' );
  loadTitle.play();

  init();
}, true );