// Compatibility facade for UI, content, and generated files. Backend modules
// should import the narrow domain contract that owns the feature they change.
export * from "./domain/artists";
export * from "./domain/editions";
export * from "./domain/events";
export * from "./domain/forecasts";
export * from "./domain/media";
export * from "./domain/stories";
export * from "./domain/taxonomy";
