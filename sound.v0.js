var slideSound = (function(n_slides) {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  var _sound = {},
      source,
      context = new AudioContext(),
      bufferList = [],// slide number -> buffer sound
      urlList = [];   // slide number -> sound url

  function loadBuffer(url, slide_number) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      context.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            alert('error decoding file data: ' + url);
            return;
          }
          bufferList[slide_number] = buffer;
          console.log('Loaded sound for slide num: ' + slide_number);
        },
        function(error) {
          console.log('No sound for slide num: ' + slide_number);
        }
      );
    };

    request.onerror = function() {
      alert('BufferLoader: XHR error');
    };

    request.send();
  }

  _sound.stop = function() {
    if (source) source.stop(0);
  };

  // Play sound for slide number n
  _sound.play = function(n) {
    if (bufferList[n]) {
      this.stop();
      source = context.createBufferSource();
      source.buffer = bufferList[n];
      source.connect(context.destination);
      source.start(0);
    }
    else
      console.log("Can't play, slide " + n + " has no sound.");
  };

  // Create the list of urls based on the number of slides available
  for (var i = 1; i <= n_slides; ++i) {
    urlList[i] = "sounds/" + i + ".mp3";
    loadBuffer(urlList[i], i);
  }

  return _sound;
});
