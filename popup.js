/**
 * Starts tab recording and sends message to recorder.
 */
const startRecording = () => {
  chrome.runtime.sendMessage({ type: 'start' });
  
};

/**
 * Stop tab recording and sends message to recorder.
 */
const stopRecording = () => {
  chrome.runtime.sendMessage({ type: 'stop' });
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startRecordingButton').addEventListener('click', startRecording);
  document.getElementById('stopRecordingButton').addEventListener('click', stopRecording);

});
