<template>
  <p>{{ fpsCount }} fps, {{ peopleCount }} people</p>
  <p>
    Choose display mode:
    <el-radio-group v-model="mode" size="large">
      <el-radio-button label="Debug" />
      <el-radio-button label="Avatar" />
      <el-radio-button label="Drift" />
      <el-radio-button label="Circles" />
      <el-radio-button label="Mixed" />
      <el-radio-button label="Liquid" />
      <el-radio-button label="Scope" />
    </el-radio-group>
  </p>
  <p>
    Choose precision:
    <el-radio-group v-model="precision" size="large">
      <el-radio-button label="low" />
      <el-radio-button label="mid" />
      <el-radio-button label="high" />
      <el-radio-button label="ultra" />
    </el-radio-group>
  </p>
  <div class="output_canvas">
    <canvas
      width="1081"
      height="1080"
      style="border: 1px solid red; transform: scaleX(-1)"
    ></canvas>
  </div>
</template>

<script>
import loadNet from "./core";
import debugMode from "./components/debug";
import avatarMode from "./components/avatar";
import driftMode from "./components/drift";
import circlesMode from "./components/circles";
import mixedMode from "./components/mixed";
import liquidMode from "./components/liquid";
import scopeMode from "./components/kaleidoscope";

let net = null,
  stop = null;

export default {
  name: "App",
  data() {
    return {
      fpsCount: 0,
      peopleCount: 0,
      mode: "Debug",
      precision: "mid",
    };
  },
  watch: {
    mode() {
      this.mountMode();
    },
    async precision() {
      if (net) {
        net.dispose();
        net = null;
      }

      switch (this.precision) {
        case "low":
          net = await loadNet(16, 0.5, 200);
          break;
        case "mid":
          net = await loadNet(16, 0.5, 500);
          break;
        case "high":
          net = await loadNet(16, 0.75, 1000);
          break;
        case "ultra":
          net = await loadNet(8, 1, 1081);
          break;
      }
      this.mountMode();
    },
  },
  methods: {
    async mountMode() {
      const videoElement = document.createElement("video");
      videoElement.width = 1081;
      videoElement.height = 1080;
      const canvasElement = document.createElement("canvas");
      canvasElement.width = 1081;
      canvasElement.height = 1080;
      canvasElement.setAttribute(
        "style",
        "border: 1px solid red; transform: scaleX(-1)"
      );
      document.querySelector(".output_canvas canvas").remove();
      document.querySelector(".output_canvas").appendChild(canvasElement);

      if (stop) {
        await stop();
        stop = null;
      }

      switch (this.mode) {
        case "Debug":
          stop = debugMode(videoElement, canvasElement, net, this);
          break;
        case "Avatar":
          stop = avatarMode(videoElement, canvasElement, net, this);
          break;
        case "Drift":
          stop = driftMode(videoElement, canvasElement, net, this);
          break;
        case "Circles":
          stop = circlesMode(videoElement, canvasElement, net, this);
          break;
        case "Mixed":
          stop = mixedMode(videoElement, canvasElement, net, this);
          break;
        case "Liquid":
          stop = liquidMode(videoElement, canvasElement, net, this);
          break;
        case "Scope":
          stop = scopeMode(videoElement, canvasElement, net, this);
          break;
      }
    },
  },
  async mounted() {
    net = await loadNet(); // Prevent observation on net properties

    this.mountMode();
  },
  async unmounted() {
    if (stop) {
      await stop();
      stop = null;
    }
    if (net) {
      net.dispose();
      net = null;
    }
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
