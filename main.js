import meta from "./meta.html";
import form from "./form.html";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Check if we're on a subdomain or root domain
    const isSubdomain = hostname.split(".").length > 2; // e.g., "script.metaworker.evaloncloud.com"

    if (!isSubdomain) {
      // ROOT DOMAIN - Show form or handle /put endpoint

      if (url.pathname === "/put" && request.method === "POST") {
        // Handle script upload
        try {
          const formData = await request.formData();
          const script = formData.get("script");
          const subdomain = formData.get("subdomain");

          if (!script || !subdomain) {
            return new Response("Missing script or subdomain", { status: 400 });
          }

          // Validate subdomain format (basic validation)
          if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
            return new Response("Invalid subdomain format", { status: 400 });
          }

          // Store script in KV with subdomain as key
          await env.SCRIPTS.put(subdomain, script);

          return new Response(
            `
            <html>
              <head><title>Script Uploaded</title></head>
              <body>
                <h1>✅ Script Uploaded Successfully!</h1>
                <p>Your script has been saved for subdomain: <strong>${subdomain}</strong></p>
                <p>Visit: <a href="https://${subdomain}.${hostname}" target="_blank">https://${subdomain}.${hostname}</a></p>
                <br>
                <a href="/">← Back to form</a>
              </body>
            </html>
          `,
            {
              headers: { "Content-Type": "text/html;charset=utf8" },
            },
          );
        } catch (error) {
          return new Response(`Error: ${error.message}`, { status: 500 });
        }
      }

      // Show the form for root domain
      return new Response(form, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    } else {
      // SUBDOMAIN - Load script from KV and render with meta.html

      const subdomain = hostname.split(".")[0]; // Extract subdomain part

      try {
        // Get script from KV
        const workerScript = await env.SCRIPTS.get(subdomain);

        if (!workerScript) {
          return new Response(
            `
            <html>
              <head><title>Script Not Found</title></head>
              <body>
                <h1>❌ Script Not Found</h1>
                <p>No script found for subdomain: <strong>${subdomain}</strong></p>
                <p>Go to <a href="https://${hostname
                  .split(".")
                  .slice(1)
                  .join(".")}">the main domain</a> to upload a script.</p>
              </body>
            </html>
          `,
            {
              status: 404,
              headers: { "Content-Type": "text/html;charset=utf8" },
            },
          );
        }

        // Inject the script into meta.html
        const htmlWithScript = meta.replace(
          "<script>",
          `<script>\nconst workerScript = ${workerScript};\n`,
        );

        return new Response(htmlWithScript, {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
      } catch (error) {
        return new Response(
          `
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>⚠️ Error Loading Script</h1>
              <p>Failed to load script for subdomain: <strong>${subdomain}</strong></p>
              <p>Error: ${error.message}</p>
              <p>Go to <a href="https://${hostname
                .split(".")
                .slice(1)
                .join(".")}">the main domain</a> to manage scripts.</p>
            </body>
          </html>
        `,
          {
            status: 500,
            headers: { "Content-Type": "text/html" },
          },
        );
      }
    }
  },
};
