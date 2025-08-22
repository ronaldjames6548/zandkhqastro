import type { APIRoute } from "astro";
import { Downloader } from "@tobyg74/tiktok-api-dl";

export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  try {
    // Parse the URL to get parameters
    const requestUrl = new URL(request.url);
    const urlTik = requestUrl.searchParams.get("url") || "";
    
    console.log("=== API ROUTE DEBUG ===");
    console.log("1. Full request URL:", request.url);
    console.log("2. TikTok URL parameter:", urlTik);
    console.log("3. All parameters:", Array.from(requestUrl.searchParams.entries()));

    if (!urlTik) {
      console.log("4. ERROR: No URL parameter found");
      return new Response(JSON.stringify({ 
        error: "url is required",
        status: "error" 
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // Validate TikTok URL format
    if (!urlTik.includes("tiktok.com") && !urlTik.includes("douyin")) {
      console.log("5. ERROR: Invalid TikTok URL format");
      return new Response(JSON.stringify({ 
        error: "Invalid TikTok URL format",
        status: "error" 
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    console.log("6. URL validation passed, calling TikTok API...");

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
        console.log("7. Processed douyin URL:", processedUrl);
      } catch (e) {
        console.error("Error processing douyin URL:", e);
      }
    }

    // Call the TikTok downloader
    console.log("8. Calling Downloader with URL:", processedUrl);
    let data = await Downloader(processedUrl, {
      version: "v3",
    });

    console.log("9. TikTok API response status:", data?.status);
    console.log("10. TikTok API response:", JSON.stringify(data, null, 2));

    // Check if the response is successful
    if (!data || data.status === "error") {
      console.log("11. ERROR: TikTok API returned error");
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

    // Validate response structure
    if (!data.result) {
      console.log("12. ERROR: No result data in response");
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

    // Process the data
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

    // Ensure author object exists
    if (data.result && !data.result.author) {
      data.result.author = {
        avatar: null,
        nickname: "Unknown Author"
      };
    }

    console.log("13. SUCCESS: Returning processed data");
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });

  } catch (error) {
    console.error("=== API ERROR ===", error);
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