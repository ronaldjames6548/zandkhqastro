import type { APIRoute } from "astro";
import { Downloader } from "@tobyg74/tiktok-api-dl";

export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  try {
    let url = new URL(request.url);
    let params = url.searchParams;
    let urlTik = params.get("url") || "";
    if (!urlTik) {
      return new Response(JSON.stringify({ error: "url is required" }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }
    //create a where unshorten the url
    console.log(urlTik.includes("douyin"));
    if (urlTik.includes("douyin")) {
      urlTik = await fetch(urlTik, {
        method: "HEAD",
        redirect: "follow",
      }).then((response) => {
        console.log(response.url);
        return response.url.replace("douyin", "tiktok");
      });
    }

    let data = await Downloader(urlTik, {
      version: "v3",
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
    });
  }
};
