import "server-only";

// Compatibility facade for legacy consumers. Static catalog queries,
// edition resolution, and live forecast persistence live in separate modules so
// the async CMS seam stays stable without mixing request-scoped and live data.
export * from "./data/catalog";
export * from "./data/editions";
export * from "./data/forecasts";
