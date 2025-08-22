import type { APIRoute } from "astro";
import { Downloader } from "@tobyg74/tiktok-api-dl";

export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  try {
    // Alternative approach - using request.url directly
    const requestUrl = new URL(request.url);
    const urlTik = requestUrl.searchParams.get("url") || "";
    
    // Debug: Log the incoming request
    console.log("Request URL:", request.url);
    console.log("Parsed URL:", requestUrl.href);
    console.log("Search params:", requestUrl.search);
    console.log("All URL params:", Array.from(requestUrl.searchParams.entries()));
    console.log("TikTok URL parameter:", urlTik);

    if (!urlTik) {
      console.log("No URL parameter found");
      return new Response(JSON.stringify({ error: "url is required" }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // Validate TikTok URL format
    if (!urlTik.includes("tiktok.com") && !urlTik.includes("douyin")) {
      return new Response(JSON.stringify({ error: "Invalid TikTok URL" }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // Unshorten douyin links
    if (urlTik.includes("douyin")) {
      try {
        urlTik = await fetch(urlTik, {
          method: "HEAD",
          redirect: "follow",
        }).then((response) => {
          return response.url.replace("douyin", "tiktok");
        });
      } catch (e) {
        console.error("Error processing douyin URL:", e);
      }
    }

    // Call the downloader
    let data = await Downloader(urlTik, {
      version: "v3",
    });

    // Log the response for debugging
    console.log("API Response:", JSON.stringify(data, null, 2));

    // Check if the response is successful
    if (!data || data.status === "error") {
      return new Response(JSON.stringify({ 
        error: data?.message || "Failed to fetch video data",
        status: "error"
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // Validate that we have the required data structure
    if (!data.result) {
      return new Response(JSON.stringify({ 
        error: "Invalid response format - missing result data",
        status: "error"
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // Force set type to 'story' if URL has '/story/'
    const isStory = urlTik.includes("/story/");
    if (isStory && data?.result) {
      data.result.type = "story";
    }

    // Add uploadDate if available
    const createTime = data?.result?.create_time;
    const uploadDate = createTime
      ? new Date(createTime * 1000).toISOString()
      : null;

    // Add uploadDate into the response object
    if (data?.result) {
      data.result.uploadDate = uploadDate;
    }

    // Ensure author object exists with default values
    if (data.result && !data.result.author) {
      data.result.author = {
        avatar: null,
        nickname: "Unknown Author"
      };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch (error) {
    console.error("TikTok API Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error",
      status: "error"
    }), {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
    });
  }
};