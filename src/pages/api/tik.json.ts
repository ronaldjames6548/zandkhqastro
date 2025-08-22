import type { APIRoute } from "astro";
import { Downloader } from "@tobyg74/tiktok-api-dl";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    let url = new URL(request.url);
    let params = url.searchParams;
    let urlTik = params.get("url") || "";
    
    if (!urlTik) {
      return new Response(JSON.stringify({ 
        status: "error", 
        message: "URL is required" 
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Unshorten douyin links
    if (urlTik.includes("douyin")) {
      urlTik = await fetch(urlTik, {
        method: "HEAD",
        redirect: "follow",
      }).then((response) => {
        return response.url.replace("douyin", "tiktok");
      });
    }

    // Call the downloader
    let data = await Downloader(urlTik, {
      version: "v3",
    });

    // Check if the API call was successful
    if (!data || !data.result) {
      throw new Error("Failed to fetch TikTok data");
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

    // Ensure the response has the expected 'status' field
    const response = {
      status: "success",
      ...data
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", 
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (error) {
    console.error("TikTok API Error:", error);
    
    return new Response(JSON.stringify({ 
      status: "error", 
      message: error instanceof Error ? error.message : "Failed to process TikTok URL. Please try again." 
    }), {
      status: 500,
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
};

// Handle OPTIONS request for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};