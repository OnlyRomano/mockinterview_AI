import Vapi from "@vapi-ai/web";

export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY);

// Set audio constraints for echo cancellation
if (navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }).catch((error) => {
    console.warn("Audio constraints not fully supported:", error);
  });
}
