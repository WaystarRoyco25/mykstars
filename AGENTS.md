<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Fan Forecast questions

When updating the Fan Forecast (the `predictions` array in `src/lib/seed.ts`), follow the standing brief in [`docs/forecast-playbook.md`](docs/forecast-playbook.md): maximize engagement through stakes, identity, timing, and rivalry — never private lives — and keep every question resolvable against a dated public source. Verify each artist's current status by web search before writing (the site carries an explicit `NOW` date), and reset test votes with `truncate table votes;` in Supabase.
