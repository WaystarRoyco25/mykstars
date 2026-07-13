// ---------------------------------------------------------------------------
// Content aggregator — the single import surface for the data layer. data.ts
// (the CMS seam) reads through this module, never a content file directly, so
// content can keep splitting into files (or move to a CMS) without touching a
// consumer. The content itself stands in for the CMS during early development;
// see the honesty headers in each src/content/*.ts file.
// ---------------------------------------------------------------------------
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
