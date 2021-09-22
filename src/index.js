console.log('ere');

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




// Create array of TS files to play
const segments = chunk_array;
let sourceBuffer;
// Replace this value with your files codec info
const mime = 'video/mp4; codecs="avc1.4d4020"';

let mediaSource = new MediaSource();
let transmuxer = new muxjs.mp4.Transmuxer();

const video = document.querySelector('video');
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener("sourceopen", appendFirstSegment);
let o;
function appendFirstSegment(){
  if (segments.length == 0){
    return;
  }

  URL.revokeObjectURL(video.src);
  sourceBuffer = mediaSource.addSourceBuffer(mime);
  sourceBuffer.mode = 'sequence';
  sourceBuffer.addEventListener('updateend', appendNextSegment);

  transmuxer.on('data', (segment) => {
    let data = new Uint8Array(segment.initSegment.byteLength + segment.data.byteLength);
    data.set(segment.initSegment, 0);
    data.set(segment.data, segment.initSegment.byteLength);
    o = segment.initSegment.byteLength;
    // console.log(muxjs.mp4.tools.inspect(data));
    sourceBuffer.appendBuffer(data);
  })

  fetch(segments.shift()).then((response)=>{
    return response.arrayBuffer();
  }).then((response)=>{
    transmuxer.push(new Uint8Array(response));
    transmuxer.flush();
  })
}

function appendNextSegment(){
  // console.log('-> appendNextSegment')
  // // reset the 'data' event listener to just append (moof/mdat) boxes to the Source Buffer
  transmuxer.off('data');
  transmuxer.on('data', (segment) =>{
    // sourceBuffer.remove(0, o);
    setTimeout(() => {
      sourceBuffer.appendBuffer(new Uint8Array(segment.data));
    }, (600));
  })

  if (segments.length == 0){
    // notify MSE that we have no more segments to append.
    mediaSource.endOfStream();
  }

  segments.forEach((segment) => {
    // fetch the next segment from the segments array and pass it into the transmuxer.push method
    fetch(segments.shift()).then((response)=>{
      return response.arrayBuffer();
    }).then((response)=>{
      transmuxer.push(new Uint8Array(response));
      transmuxer.flush();
    })
  })
}