## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

After changing `astro.config.mjs`, the running dev server can serve stale Vite dependencies and every island stops hydrating (console shows `504 (Outdated Optimize Dep)`). Restart it with a clean cache:

```
astro dev stop
Remove-Item -Recurse -Force node_modules\.vite
astro dev --background
```

## Required environment

`npm run build` fails when `PUBLIC_GOOGLE_SHEETS_ENDPOINT` is unset. Copy `.env.example` to `.env` before building. The README lists the full set.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
