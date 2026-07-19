import "server-only";

// Compatibility facade for the catalog CMS seam. New code imports the narrow
// feature module it owns while legacy consumers keep their stable import path.
export * from "./articles";
export * from "./artists";
export * from "./clips";
export * from "./events";
export * from "./galleries";
export * from "./home-fill";
export * from "./page-data";
export * from "./pulses";
export * from "./rankings";
