(async() => {


  const mediaSource = new MediaSource();

  const video = document.querySelector("video");

  // video.oncanplay = e => video.play();

  const urls = ["https://nickdesaulniers.github.io/netfix/demo/frag_bunny.mp4", "https://raw.githubusercontent.com/w3c/web-platform-tests/master/media-source/mp4/test.mp4","https://nickdesaulniers.github.io/netfix/demo/frag_bunny.mp4"];

  const request = url => fetch(url).then(response => response.arrayBuffer());

  // `urls.reverse()` stops at `.currentTime` : `9`
  const files = await Promise.all(urls.map(request));

  /*
   `.webm` files
   Uncaught DOMException: Failed to execute 'appendBuffer' on 'SourceBuffer': This SourceBuffer has been removed from the parent media source.
   Uncaught DOMException: Failed to set the 'timestampOffset' property on 'SourceBuffer': This SourceBuffer has been removed from the parent media source.
  */
  // const mimeCodec = "video/webm; codecs=opus";
  // https://stackoverflow.com/questions/14108536/how-do-i-append-two-video-files-data-to-a-source-buffer-using-media-source-api/
  const mimeCodec = "video/mp4; codecs=avc1.42E01E, mp4a.40.2";


  const media = await Promise.all(files.map(file => {
    return new Promise(resolve => {
      let media = document.createElement("video");
      let blobURL = URL.createObjectURL(new Blob([file]));
      media.onloadedmetadata = async e => {
        resolve({
          mediaDuration: media.duration,
          mediaBuffer: file
        })
      }
      media.src = blobURL;
    })
  }));

  console.log(media);

  mediaSource.addEventListener("sourceopen", sourceOpen);

  video.src = URL.createObjectURL(mediaSource);

  async function sourceOpen(event) {

    if (MediaSource.isTypeSupported(mimeCodec)) {
      const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);

      for (let chunk of media) {
        await new Promise(resolve => {
          sourceBuffer.appendBuffer(chunk.mediaBuffer);
          sourceBuffer.onupdateend = e => {
            sourceBuffer.onupdateend = null;
            sourceBuffer.timestampOffset += chunk.mediaDuration;
            console.log(mediaSource.duration);
            resolve()
          }
        })

      }

      mediaSource.endOfStream();

    }  
    else {
      console.warn(mimeCodec + " not supported");
    }
  };

})()