// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide'
import starlightImageZoom from 'starlight-image-zoom'
import { rehypeLinks } from './plugins/rehype-links';
import { updateFrontmatter } from './plugins/update-frontmatter';
import getSidebar from "./tools/get-sidebar.js"

const base = 'easyquery/docs';
const site = 'https://korzh.com';
const outDir = './dist/easyquery/docs';

// https://astro.build/config
export default defineConfig({
	site,
	base,
	outDir,
	trailingSlash: "never",
	integrations: [
		starlight({
			title: 'Component.Name',
			favicon: '/favicon.ico',
			social: {
				github: 'https://github.com/korzhcom-content/easyquery.net-docs-astro',
				discord: 'https://discord.gg',
			},
			sidebar: [
				{ label: "Introduction", slug: "introduction" },
				...getSidebar("./src/content/docs/getting-started", true),
			],
			customCss: [
				'./src/styles/index.css',
			],
			components: {
				Footer: './src/components/Footer.astro',
				SocialIcons: './src/components/SocialIcons.astro',
				Sidebar: './src/components/Sidebar.astro',
			},
			lastUpdated: true,
			plugins: [
				starlightThemeRapide(),
				starlightImageZoom(),
			],
			tableOfContents: {
				minHeadingLevel: 2,
				maxHeadingLevel: 4,
			},
			credits: false,
		}),
	],
	markdown: {
		rehypePlugins: [[rehypeLinks, { base }]],
		remarkPlugins: [updateFrontmatter]
	}
});
