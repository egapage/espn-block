import "./node_modules/jimp/browser/lib/jimp.js";
import { imageUrlToBase64 } from "./tools.js";

let sourceTabId;
let count = 0;
let b64_1,
  b64_2,
  b64_3,
  b64_4,
  b64_5,
  b64_6,
  b64_7,
  b64_8,
  b64_9,
  b64_10,
  b64_11,
  b64_12;
let image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
  image9,
  image10,
  image11,
  image12;

/**
 * Preload testing images for comparison during stream.
 */
(async () => {
  b64_1 = await imageUrlToBase64("./images/01.png");
  b64_2 = await imageUrlToBase64("./images/02.png");
  b64_3 = await imageUrlToBase64("./images/03.png");
  b64_4 = await imageUrlToBase64("./images/04.png");
  b64_5 = await imageUrlToBase64("./images/05.png");
  b64_6 = await imageUrlToBase64("./images/06.png");
  b64_7 = await imageUrlToBase64("./images/07.png");
  b64_8 = await imageUrlToBase64("./images/08.png");
  b64_9 = await imageUrlToBase64("./images/09.png");
  b64_10 = await imageUrlToBase64("./images/10.png");
  b64_11 = await imageUrlToBase64("./images/11.png");
  b64_12 = await imageUrlToBase64("./images/12.png");

  image1 = await Jimp.read(b64_1);
  image2 = await Jimp.read(b64_2);
  image3 = await Jimp.read(b64_3);
  image4 = await Jimp.read(b64_4);
  image5 = await Jimp.read(b64_5);
  image6 = await Jimp.read(b64_6);
  image7 = await Jimp.read(b64_7);
  image8 = await Jimp.read(b64_8);
  image9 = await Jimp.read(b64_9);
  image10 = await Jimp.read(b64_10);
  image11 = await Jimp.read(b64_11);
  image12 = await Jimp.read(b64_12);
})();

/**
 * Usage guide on installation
 */

chrome.runtime.onInstalled.addListener(_details => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("./guide/index.html"),
    active: true,
  });
});

/**
 * Stop recording by sending message to recorder.
 */
async function stopRecording() {
  let queryOptions = { url: "chrome-extension://*/recorder.html" };
  let [tab] = await chrome.tabs.query(queryOptions);
  await chrome.tabs.sendMessage(tab.id, {
    name: "stopRecording",
    body: {
      tabId: tab.id,
      sourceTabId: sourceTabId,
    },
  });
}

/**
 * Start recording by sending message to recorder.
 */
async function startRecording() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
    currentWindow: true,
  });
  const { id } = await chrome.tabs.create({
    url: chrome.runtime.getURL("recorder.html"),
    pinned: true,
    active: true,
  });

  sourceTabId = tab.id;

  chrome.tabs.onUpdated.addListener(async (_tabId, _info, _tab) => {
    try {
      await chrome.tabs.sendMessage(id, {
        name: "startRecording",
      });
    } catch (err) {
      // ignore error as listener fires before tab is created
    }
  });
}

/**
 * Compares captured image from stream to reference images.
 *
 * @param {string} capturedImage base64 image from stream
 * @return {boolean} whether captured image from stream is a match or not
 */
function diffImages(capturedImage) {
  const arr = [
    image1,
    image2,
    image3,
    image4,
    image5,
    image6,
    image7,
    image8,
    image8,
    image9,
    image10,
    image11,
    image12,
  ];
  const percentages = [];
  for (let i = 0; i < arr.length; i++) {
    const diff = Jimp.diff(capturedImage, arr[i]);
    const percentage = (diff.percent * 100).toFixed(0);
    percentages.push(percentage);
    console.log(percentage + "%");
  }
  const match = percentages.filter((percentage) => percentage < 20);
  return match.length > 0 ? true : false;
}

/**
 * Toggles mute state of streaming tab.
 *
 * @param {boolean} muted State obtained from handleMute function
 */
async function toggleMuteState(muted) {
  try {
    const tab = await chrome.tabs.get(sourceTabId);
    await chrome.tabs.update(sourceTabId, { muted });
    console.log(`Tab ${tab.id} is ${muted ? "muted" : "unmuted"}`);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Determines mute state through image match.
 *
 * @param {boolean} match Last stream image match.
 */
async function handleMute(match) {
  if (match) {
    count = 0;
    toggleMuteState(true);
  }
  if (!match) count++;
  if (count > 4) {
    //unmute tab and reset count
    count = 0;
    toggleMuteState(false);
  }
  console.log("match: ", match);
  console.log("5 falses results in unmute: ", count);
}

/**
 * Message listener for popup and recorder.
 */
chrome.runtime.onMessage.addListener(async (msg) => {
  switch (msg.type) {
    case "start":
      await startRecording();
      break;
    case "stop":
      await stopRecording();
      break;
    case "test": {
      const capturedImage = await Jimp.read(msg.payload);
      const match = diffImages(capturedImage);
      console.log("<><><><><><>");
      await handleMute(match);
      break;
    }
  }
});
