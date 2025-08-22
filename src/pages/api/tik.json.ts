import type { APIRoute } from "astro";
import { Downloader } from "@tobyg74/tiktok-api-dl";

export const prerender = false;

// Handle all HTTP methods
export const GET: APIRoute = async ({ request }) => {
  return handleRequest(request);
};

export const POST: APIRoute = async ({ request }) => {
  return handleRequest(request);
};

async function handleRequest(request: Request) {
  try {
    console.log("=== API HANDLER ===");
    console.log("1. Method:", request.method);
    console.log("2. URL:", request.url);
    
    let urlTik = "";
    
    if (request.method === "POST") {
      // Handle POST with JSON body
      try {
        const body = await request.json();
        urlTik = body?.url || "";
        console.log("3. POST - URL from body:", urlTik);
      } catch (e) {
        console.log("3. POST - Error reading body:", e.message);
        return new Response(JSON.stringify({ 
          error: "Invalid JSON body",
          status: "error" 
        }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    } else if (request.method === "GET") {
      // Handle GET with query params (backup)
      try {
        const url = new URL(request.url);
        urlTik = url.searchParams.get("url") || "";
        console.log("3. GET - URL from query:", urlTik);
      } catch (e) {
        console.log("3. GET - Error reading query:", e.message);
      }
    }
    
    console.log("4. Final URL:", urlTik);

    if (!urlTik) {
      console.log("5. ERROR: No URL provided");
      return new Response(JSON.stringify({ 
        error: "url is required",
        status: "error",
        method: request.method,
        hint: request.method === "POST" ? "Send {\"url\": \"tiktok-url\"} in body" : "Use ?url=tiktok-url"
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Validate TikTok URL
    if (!urlTik.includes("tiktok.com") && !urlTik.includes("douyin")) {
      console.log("6. ERROR: Invalid URL format");
      return new Response(JSON.stringify({ 
        error: "Invalid TikTok URL format",
        status: "error" 
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    console.log("7. Calling TikTok API...");
    
    // Handle douyin URLs
    let processedUrl = urlTik;
    if (urlTik.includes("douyin")) {
      try {
        processedUrl = await fetch(urlTik, {
          method: "HEAD",
          redirect: "follow",
        }).then((response) => {
          return response.url.replace("douyin", "tiktok");
        });
      } catch (e) {
        console.error("Error processing douyin URL:", e);
      }
    }

    // Call TikTok downloader
    const data = await Downloader(processedUrl, {
      version: "v3",
    });

    console.log("8. TikTok API response status:", data?.status);

    if (!data || data.status === "error") {
      console.log("9. ERROR: TikTok API failed");
      return new Response(JSON.stringify({ 
        error: data?.message || "Failed to fetch video data",
        status: "error"
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (!data.result) {
      console.log("10. ERROR: No result data");
      return new Response(JSON.stringify({ 
        error: "No video data found",
        status: "error"
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Process data
    const isStory = processedUrl.includes("/story/");
    if (isStory && data.result) {
      data.result.type = "story";
    }

    // Add upload date
    const createTime = data?.result?.create_time;
    const uploadDate = createTime ? new Date(createTime * 1000).toISOString() : null;
    if (data.result) {
      data.result.uploadDate = uploadDate;
    }

    // Ensure author exists
    if (data.result && !data.result.author) {
      data.result.author = {
        avatar: null,
        nickname: "Unknown Author"
      };
    }

    console.log("11. SUCCESS: Returning data");
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  } catch (error) {
    console.error("=== API ERROR ===", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error",
      status: "error"
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}