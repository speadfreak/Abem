import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Abem Restaurant — Ethiopian Fire & Heritage",
    short_name: "Abem",
    description: "Abem is Addis Ababa's flagship Ethiopian dining house. Reserve, order and track — all in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0705",
    theme_color: "#0b0705",
    icons: [
      { src: "/brand/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
