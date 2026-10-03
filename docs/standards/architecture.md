# Architecture standard

Use the smallest design with explicit presentation, application, and IO boundaries. Vue components call the API client, not SQLite. Azure Functions stay at the HTTP edge; repositories own SQLite access and providers own external AI calls. Keep provider and persistence implementations replaceable.
