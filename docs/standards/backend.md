# Backend standard

HTTP triggers validate inputs and delegate behavior to application helpers. SQLite access is isolated in repositories, and AI providers are isolated behind an adapter. Return safe error payloads; never return keys, provider internals, or untrusted provider HTML.
