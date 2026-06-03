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
function formatAmapLoadError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/INVALID_USER_DOMAIN/i.test(msg)) {
    const host = typeof window !== "undefined" ? window.location.host : "当前域名";
    return `高德 Key 域名白名单未包含「${host}」，请在高德开放平台 Web端(JS API) Key 中添加该域名或清空白名单后重试`;
  }
  return msg || "地图加载失败";
}

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
    }).catch((e) => {
      loadPromise = null;
      throw new Error(formatAmapLoadError(e));
    });
  }
  return loadPromise;
}
