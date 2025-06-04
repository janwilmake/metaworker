what if I had a generic cloudflare worker that rendered HTML that executes a js-only worker script in-browser to then write the resulting HTML to the browser?

This would be a way to achieve instant backends, safely. All that'd be needed would be to serve the right script on the right subdomain (proper separation), and write env secrets to localStorage with a wrapper script, before running the script. Now it basically allows eval!

The idea would be:

1. the worker serves a HTML that contains a (to be dynamic) js script with (request:Request, env:Env,ctx:ExecutionContext) => Promise<Response>
2. the html automatically executes this script using a request calculated based on the current window.location and env variables coming from localStorage.env (being an object). ctx just has a function waitUntil that simulates that, that's it.
3. the resulting response.text() is awaited and then becomes the new content of the page using `document`
