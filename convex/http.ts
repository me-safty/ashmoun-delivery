import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

http.route({
  path: "/pharmacy-requests/upload",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  path: "/pharmacy-requests/upload",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const formData = await req.formData();
    const file = (formData as unknown as { get: (name: string) => unknown }).get("file");
    if (!(file instanceof Blob) || file.size === 0) {
      return new Response(
        JSON.stringify({ error: "يجب إرفاق صورة" }),
        { status: 400, headers: { "content-type": "application/json", ...corsHeaders } },
      );
    }
    const storageId = await ctx.storage.store(file);
    return new Response(
      JSON.stringify({ storageId }),
      { status: 200, headers: { "content-type": "application/json", ...corsHeaders } },
    );
  }),
});

export default http;
