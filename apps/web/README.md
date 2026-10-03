# SoulPrint web app

Vue 3/Vite interface based on the supplied SoulPrint visual references.

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run build
```

The Vite proxy calls the local Python Function API at `http://localhost:7071/api`. If it is unavailable, curated client-side demo data still renders the experience.

Use `VITE_API_BASE_URL=https://your-function-app.azurewebsites.net/api` for a deployed GitHub Pages build. The Pages workflow reads this value from the repository variable named `VITE_API_BASE_URL` and creates a SPA `404.html` fallback for deep links.
