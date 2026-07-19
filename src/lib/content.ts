import "server-only";

// Compatibility facade for integration tests and legacy consumers. Production
// server reads use one feature store under src/lib/stores, then the matching
// async CMS seam under src/lib/data.
export { NOW } from "../content/now";
export { artists } from "../content/profiles";
export { galleries } from "../content/galleries";
export { articles } from "../content/articles";
export { rankings } from "../content/rankings";
export { events } from "../content/events";
export { predictions } from "../content/predictions";
export { clips } from "../content/clips";
export { mediaAssets } from "../content/media-assets";
export { pulses } from "../content/pulses";
export { editions } from "../content/editions";
