import { load } from "@tensorflow-models/posenet";
import { ready } from "@tensorflow/tfjs";

export default (stride = 16, multiplier = 0.5, resolution = 500) => ready().then(() => load({
  architecture: "MobileNetV1",
  outputStride: stride,
  multiplier,
  inputResolution: { width: resolution, height: resolution / 2 },
  quantBytes: 4,
}))