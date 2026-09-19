export interface BackendConfig {
  apiBaseUrl: string;

  storageBaseUrl: string;

  mlServiceEnabled: boolean;

  videoProcessingEnabled: boolean;

  trainingUploadEnabled: boolean;

  diagnosticsUploadEnabled: boolean;

  environment:
    | "development"
    | "staging"
    | "production";
}

function getEnvironment():
  BackendConfig["environment"] {
  const value =
    import.meta.env
      .VITE_APP_ENV;

  if (
    value === "production" ||
    value === "staging"
  ) {
    return value;
  }

  return "development";
}

export function getBackendConfig():
  BackendConfig {
  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL ??
    "";

  const storageBaseUrl =
    import.meta.env
      .VITE_STORAGE_BASE_URL ??
    "";

  return {
    apiBaseUrl,

    storageBaseUrl,

    mlServiceEnabled:
      import.meta.env
        .VITE_ML_SERVICE_ENABLED ===
      "true",

    videoProcessingEnabled:
      import.meta.env
        .VITE_VIDEO_PROCESSING_ENABLED ===
      "true",

    trainingUploadEnabled:
      import.meta.env
        .VITE_TRAINING_UPLOAD_ENABLED ===
      "true",

    diagnosticsUploadEnabled:
      import.meta.env
        .VITE_DIAGNOSTICS_UPLOAD_ENABLED ===
      "true",

    environment:
      getEnvironment(),
  };
}

export function isBackendConfigured():
  boolean {
  return (
    getBackendConfig()
      .apiBaseUrl.length > 0
  );
}

export function isProduction():
  boolean {
  return (
    getBackendConfig()
      .environment ===
    "production"
  );
}

export function isDevelopment():
  boolean {
  return (
    getBackendConfig()
      .environment ===
    "development"
  );
}

export function getAPIBaseUrl():
  string {
  return getBackendConfig()
    .apiBaseUrl;
}

export function getStorageBaseUrl():
  string {
  return getBackendConfig()
    .storageBaseUrl;
}
