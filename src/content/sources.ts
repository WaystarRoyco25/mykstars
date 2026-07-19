import type { Source } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared sources — outlets referenced from more than one content file
// (galleries, articles, predictions, events). Sources used by a single file
// stay local to that file; the clip channel maps live in clips.ts.
// ---------------------------------------------------------------------------
export const OSEN: Source = { name: "OSEN", url: "https://osen.mt.co.kr", kind: "press" };
export const NEWSEN: Source = { name: "Newsen", url: "https://www.newsen.com", kind: "press" };
export const STAR_NEWS: Source = { name: "Star News", url: "https://www.starnewskorea.com/en", kind: "press" };
export const NEWS1: Source = { name: "News1", url: "https://www.news1.kr", kind: "wire" };
export const W_KOREA: Source = { name: "W Korea", url: "https://www.wkorea.com", kind: "magazine" };
export const VOGUE_KOREA: Source = { name: "Vogue Korea", url: "https://www.vogue.co.kr", kind: "magazine" };
export const STUDIO: Source = { name: "Studio press kit", url: "https://www.cjenm.com", kind: "official" };
export const FESTIVAL: Source = { name: "Festival photo pool", url: "https://www.biff.kr", kind: "press" };
export const ELLE_KOREA: Source = { name: "Elle Korea", url: "https://www.elle.co.kr", kind: "magazine" };
export const ALLURE_KOREA: Source = { name: "Allure Korea", url: "https://www.allurekorea.com", kind: "magazine" };
export const BILLBOARD: Source = { name: "Billboard", url: "https://www.billboard.com/culture/product-recommendations/current-k-pop-concerts-1236234463/", kind: "press" };
export const TEN_ASIA: Source = { name: "Ten Asia", url: "https://www.tenasia.co.kr", kind: "press" };
export const DAVID_LEE: Source = { name: "David Lee", url: "https://www.flickr.com/photos/davidjlee/", kind: "licensed" };
