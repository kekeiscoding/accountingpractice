# Ask AKO API

The static website sends the question, current worksheet, generated transactions and answer data, Chart of Accounts, and up to two earlier AI exchanges to a Cloudflare Worker. The tutor uses the generated answer data for direct answers when the student asks for one. It does not read answers typed into the worksheet. The Worker calls the [Workers AI API](https://developers.cloudflare.com/workers-ai/configuration/bindings/) with a server binding. The browser needs no API key.

## Deploy

1. Sign in to your Cloudflare account with `npx wrangler login` from the repository root. Make sure the account can use Workers AI and has a `workers.dev` subdomain.
2. If the site uses a custom domain, set `SITE_ORIGIN` in `tutor-api/wrangler.toml` to its origin, with no path or trailing slash.
3. Run `npx wrangler deploy --config tutor-api/wrangler.toml` from the repository root. Append `/api/tutor` to the HTTPS URL printed by Wrangler and put that URL in the `ako-tutor-api` meta tag in the root `index.html`.
4. Push the updated `index.html`. Start a practice set on the published site, open **Ask AKO**, and send a question to check for a reply labeled **AKO AI**.

The Worker limits AI calls to six per minute per IP at each Cloudflare location. Check your [Workers AI usage limits](https://developers.cloudflare.com/workers-ai/platform/limits/) before sharing the site widely. When the service URL is unset or the service cannot respond, the chat labels its replies as guided hints.
