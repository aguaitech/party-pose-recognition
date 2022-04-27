<template>
  <p>{{ fpsCount }} fps, {{ peopleCount }} people</p>
  <!-- <p>
    Choose Camera:
    <el-select v-model="camera" placeholder="Select Camera" size="large">
      <el-option
        v-for="item in cameraOptions"
        :key="item.deviceId"
        :label="item.label"
        :value="item.deviceId"
      />
    </el-select>
  </p> -->
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
  <!-- <p>
    Choose precision:
    <el-radio-group v-model="precision" size="large">
      <el-radio-button label="low" />
      <el-radio-button label="mid" />
      <el-radio-button label="high" />
      <el-radio-button label="ultra" />
    </el-radio-group>
  </p> -->
  <div
    style="
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    "
  >
    <div
      class="output_canvas"
      id="canvas_container"
      style="width: 1083px; position: relative"
    >
      <canvas
        width="1081"
        height="1080"
        style="border: 1px solid red; transform: scaleX(-1)"
      ></canvas>
    </div>
  </div>
</template>

<script>
import loadNet from "./core";
import loadKinect from "./core/kinect";
import debugMode from "./components/debug";
import avatarMode from "./components/avatar";
import driftMode from "./components/drift";
import circlesMode from "./components/circles";
import mixedMode from "./components/mixed";
import liquidMode from "./components/liquid";
import scopeMode from "./components/kaleidoscopev2";

let net = null,
  stop = null;

export default {
  name: "App",
  data() {
    return {
      fpsCount: 0,
      peopleCount: 0,
      mode: "Mixed",
      precision: "mid",
      camera: "",
      cameraOptions: [],
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
    camera() {
      this.mountMode();
    },
  },
  methods: {
    async mountMode() {
      const realVideoElement = document.createElement("video");
      realVideoElement.width = 1081;
      realVideoElement.height = 1080;
      const fakeVideoElement = document.createElement("canvas");
      fakeVideoElement.width = 1081;
      fakeVideoElement.height = 1080;
      const canvasElement = document.createElement("canvas");
      canvasElement.width = 1081;
      canvasElement.height = 1080;
      canvasElement.setAttribute(
        "style",
        // "border: 1px solid red; transform: scaleX(-1)"
        "border: 1px solid red"
      );
      document
        .querySelectorAll(".output_canvas canvas")
        .forEach((n) => n.remove());
      document.querySelector(".output_canvas").appendChild(canvasElement);

      if (stop) {
        await stop();
        stop = null;
      }

      switch (this.mode) {
        case "Debug":
          stop = debugMode(
            fakeVideoElement,
            canvasElement,
            net,
            this,
            this.camera
          );
          break;
        case "Avatar":
          stop = avatarMode(
            realVideoElement,
            canvasElement,
            net,
            this,
            this.camera
          );
          break;
        case "Drift":
          stop = driftMode(
            realVideoElement,
            canvasElement,
            net,
            this,
            this.camera
          );
          break;
        case "Circles":
          stop = circlesMode(
            realVideoElement,
            canvasElement,
            net,
            this,
            this.camera
          );
          break;
        case "Mixed":
          stop = mixedMode(
            realVideoElement,
            // fakeVideoElement,
            canvasElement,
            net,
            this,
            this.camera
          );
          break;
        case "Liquid":
          stop = liquidMode(
            realVideoElement,
            canvasElement,
            net,
            this,
            this.camera
          );
          break;
        case "Scope":
          stop = scopeMode(
            realVideoElement,
            canvasElement,
            net,
            this,
            this.camera
          );
          break;
      }
    },
  },
  async mounted() {
    net = loadKinect();
    net = await loadNet(16, 0.5, 500);

    const devices = await navigator.mediaDevices.enumerateDevices();
    this.cameraOptions = devices.filter(
      (device) => device.kind === "videoinput"
    );
    this.camera = this.cameraOptions[0]?.deviceId || "";

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
