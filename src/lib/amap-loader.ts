import AMapLoader from "@amap/amap-jsapi-loader";

export interface AmapClientConfig {
  enabled: boolean;
  apiKey?: string;
  securityJsCode?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadPromise: Promise<any> | null = null;
let currentKey = "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadAmapMap(config: AmapClientConfig): Promise<any> {
  if (!config.enabled || !config.apiKey?.trim()) {
    throw new Error("高德地图未配置");
  }
  const key = config.apiKey.trim();
  const security = config.securityJsCode?.trim();
  if (key !== currentKey) {
    loadPromise = null;
    currentKey = key;
  }
  if (!loadPromise) {
    if (security) {
      (window as unknown as { _AMapSecurityConfig?: { securityJsCode: string } })._AMapSecurityConfig =
        { securityJsCode: security };
    }
    loadPromise = AMapLoader.load({
      key,
      version: "2.0",
      plugins: ["AMap.Scale", "AMap.ToolBar"],
    });
  }
  return loadPromise;
}
