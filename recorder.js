let stream = null;

/**
 * Chrome listener for messages from popup.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.name == "startRecording") {
    startRecording();
  }
  if (message.name == "stopRecording") {
    stopRecording(message.body.tabId);
  }
});

/**
 * Returns base64 from blob.
 *
 * @param {object} blob image blob.
 * @return {string} base64 version of blob.
 */
const convertBlobToBase64 = async (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  });

/**
 * Show screenshot download links
 */
function createScreenshotLink(blob) {
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  const d = new Date();
  const dd = Math.floor(d.getTime() / 1000) + "-screen.png";
  const linkText = document.createTextNode(dd);
  downloadLink.appendChild(linkText);
  downloadLink.download = dd;
  return;
}
/**
 * Captures images from stream, converts to base64 and sends message to service worker when complete.
 * Needs to be split up to be more functional/dry.
 * @param {object} track track from stream
 */
async function createImage(track) {

  // get image
  const imageCapture = new ImageCapture(track);
  const bitmap = await imageCapture.grabFrame();

  // create canvas
  const canvas = document.createElement("canvas");
  const aspectRatio = bitmap.height / bitmap.width;
  canvas.width = 720;
  canvas.height = 720 * aspectRatio;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const image = canvas.toDataURL("image/png");

  // set image src on recorder.html
  document.getElementById("screen").src = image;

  // create blob and image link
  const blob = await new Promise((res) => canvas.toBlob(res));
  const base64 = await convertBlobToBase64(blob);

  //screenshot link
  createScreenshotLink(blob);
  
  chrome.runtime.sendMessage({ type: "test", payload: base64 });
  return;
}

/**
 * Starts tab recording.  Uses a loop to capture image from stream every 3 seconds.
 */
async function startRecording() {
  async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function loop() {
    while (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) createImage(track);
      await delay(3000);
    }
  }
  try {
    if (!stream) {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
      });
      await loop();
    }
  } catch (err) {
    console.log("Error starting recording:", err);
  }
}

/**
 * Stop tab recording.  Can be used for cleanup.
 * @param {string} tabId identifier of this tab being closed
 */
async function stopRecording(tabId) {
  chrome.tabs.remove(tabId);
  if (stream) stream.getTracks().forEach((track) => track.stop());
  console.log("Stream stopped and tab closed.");
}
