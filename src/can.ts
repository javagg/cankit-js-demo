import { CanvasKitJS } from "canvaskit-js";
// import type { CanvasKit } from "canvaskit-wasm";

// declare global {
//   // eslint-disable-next-line no-var
//   var CanvasKit: CanvasKit;
// }

// const CanvasKit = CanvasKitJS.getInstance();
// window.CanvasKit = CanvasKitJS.getInstance();

export const CanvasKit = CanvasKitJS.getInstance();

// import  CanvasKitInit  from "canvaskit-js";
let cankit: CanvasKitJS = null

// export async function initCan() {
//     if (!cankit) {
//         cankit = await CanvasKitInit()
//     }
//     return cankit
// }
