import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	esbuild: {
		target: "es2022"
	},
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			reporter: ['text', 'json', 'html'],
			all: false,
			exclude: ['**/node_modules/**', '**/tests/helpers/**'],
		},
		projects: [
			{
				extends: true,
				test: {
					name: 'client',
					environment: 'jsdom',
					globals: true,
					include: [
						'src/**/*.svelte.{test,spec}.{js,ts}',
						'src/**/*.{test,spec}.{js,ts}',
					],
					exclude: ['src/**/(*.server).test.{js,ts}', 'src/**/(server).test.{js,ts}'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: true,
				test: {
					name: 'server',
					environment: 'node',
					include: [
						'src/**/*.server.test.{js,ts}',
						'src/**/server.test.{js,ts}'
					],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				}
			}
		]
	},
	resolve: {
		conditions: process.env.NODE_ENV === 'test' ? ['browser', 'module', 'import'] : undefined
	}
});