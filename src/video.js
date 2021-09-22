const chunk_array = [
  'http://localhost:8000/test/360p_000.ts',
  'http://localhost:8000/test/360p_001.ts',
  'http://localhost:8000/test/360p_002.ts',
  'http://localhost:8000/test/360p_003.ts',
  'http://localhost:8000/test/360p_004.ts',
  'http://localhost:8000/test/360p_005.ts',
  'http://localhost:8000/test/360p_006.ts',
  'http://localhost:8000/test/360p_007.ts',
];


const request = url => fetch(url).then(response => response.arrayBuffer());

// `urls.reverse()` stops at `.currentTime` : `9`
const files = await Promise.all(chunk_array.map(request));


const video = document.querySelector('video');

if (!window.MediaSource) {
  alert('The MediaSource API is not available on this platform');
}

var mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceended', function() {
  console.log('MediaSource readyState: ' + this.readyState);
}, false);

mediaSource.addEventListener('sourceopen', function() {
  var sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.4d4020"');
  var i = 0;

  (function readChunk_(i) { // eslint-disable-line no-shadow
    var reader = new FileReader();

    // Reads aren't guaranteed to finish in the same order they're started in,
    // so we need to read + append the next chunk after the previous reader
    // is done (onload is fired).
    reader.onload = function(e) {
      console.log('e', e)
      sourceBuffer.appendBuffer(new Uint8Array(e.target.result));
      console.log('Appending chunk: ' + i);
      if (i === files.length - 1) {
        sourceBuffer.addEventListener('updateend', function() {
          if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
            mediaSource.endOfStream();
          }
        });
      } else {
        if (video.paused) {
          video.play(); // Start playing after 1st chunk is appended.
        }
        readChunk_(++i);
      }
    };

    // var startByte = chunkSize * i;
    // var chunk = file.slice(startByte, startByte + chunkSize);

    var file = new Blob([files[i]], {
      type: 'video/mp4'
    });

    console.log('-->', file);
    reader.readAsArrayBuffer(file);
  })(i); // Start the recursive call by self calling.

}, false);