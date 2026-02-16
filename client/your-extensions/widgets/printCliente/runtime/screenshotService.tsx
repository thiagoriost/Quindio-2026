import type MapView from "@arcgis/core/views/MapView"

export interface ScreenshotResult {
  dataUrl: string;
  width: number;
  height: number;
}

export const captureMap = async (
  view: MapView
): Promise<ScreenshotResult> => {

  const screenshot = await view.takeScreenshot({
    format: "png",
    quality: 100
  })

  return {
    dataUrl: screenshot.dataUrl,
    width: screenshot.data.width,
    height: screenshot.data.height
  }
}
