what if I had a generic cloudflare worker that rendered HTML that executes a js-only worker script in-browser to then write the resulting HTML to the browser?

This would be a way to achieve instant backends, safely. All that'd be needed would be to serve the right script on the right subdomain (proper separation), and write env secrets to localStorage with a wrapper script, before running the script. Now it basically allows eval!

The idea would be:

1. the worker serves a HTML that contains a (to be dynamic) js script with (request:Request, env:Env,ctx:ExecutionContext) => Promise<Response>
2. the html automatically executes this script using a request calculated based on the current window.location and env variables coming from localStorage.env (being an object). ctx just has a function waitUntil that simulates that, that's it.
3. the resulting response.text() is awaited and then becomes the new content of the page using `document`

Limitations:

- Although this is great for HTML, this wouldn't yet allow returning anything else as a direct response from an endpoint. JSON gets loaded in a `<pre>` tag now, and this is obviously not great! However, when provided with proper instructions this could give a way to create simple workers that output HTML on a specific path structure. This is already quite useful because it allows for instant testing of your worker!
- I also found that a submited `</script>` turns into EOF so we need a way to escape that

Subdomain setup:

besides the setup in wrangler toml, we needed a `AAAA` DNS record for `*` leading to `100::` to make subdomains all loead to the worker.
