import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
	base: "https://AlexErdei73.github.io/fakebook-ainiro",
	plugins: [preact()],
});
