# SoulPrint web app

Vue 3/Vite interface based on the supplied SoulPrint visual references.

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run build
```

By default the app runs entirely in the browser on mock data (`src/services/mockApi.ts`): no backend is needed, and likes, plans, settings, messages and onboarding are kept in `localStorage`. This is what the GitHub Pages build ships.

To connect the Python Function API instead, build or run with `VITE_USE_API=true`. Locally the Vite proxy then calls `http://localhost:7071/api`; for a deployed build also set `VITE_API_BASE_URL=https://your-function-app.azurewebsites.net/api`. The Pages workflow reads both values from repository variables of the same names and creates a SPA `404.html` fallback for deep links.

`scripts/generate-portraits.mjs` and `scripts/generate-places.mjs` regenerate the fictional illustrations in `public/images`.
