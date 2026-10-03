# SoulPrint web app

Vue 3/Vite interface based on the supplied SoulPrint visual references.

```powershell
npm install
npm run dev
npm run typecheck
npm run build
```

The Vite proxy calls the local Python Function API at `http://localhost:7071/api`. If it is unavailable, curated client-side demo data still renders the experience.
