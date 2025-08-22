import type { APIRoute } from "astro";
import { Downloader } from "@tobyg74/tiktok-api-dl";

export const prerender = false;
export const GET: APIRoute = async ({ request, url }) => {
  try {
    console.log("=== DIAGNOSTIC API ROUTE ===");
    console.log("1. request.url:", request.url);
    console.log("2. url object:", url);
    console.log("3. url.href:", url.href);
    console.log("4. url.search:", url.search);
    console.log("5. url.searchParams:", url.searchParams);
    
    // Try multiple ways to get the URL parameter
    const method1 = new URL(request.url).searchParams.get("url");
    const method2 = url.searchParams.get("url");
    const method3 = new URLSearchParams(url.search).get("url");
    
    console.log("6. Method 1 (new URL(request.url)):", method1);
    console.log("7. Method 2 (url.searchParams):", method2);
    console.log("8. Method 3 (URLSearchParams):", method3);
    
    // Get all search params to debug
    console.log("9. All params (method 1):", Array.from(new URL(request.url).searchParams.entries()));
    console.log("10. All params (method 2):", Array.from(url.searchParams.entries()));
    
    // Use the first method that works
    const urlTik = method1 || method2 || method3 || "";
    
    console.log("11. Final urlTik:", urlTik);

    if (!urlTik) {
      console.log("12. ERROR: No URL parameter found with any method");
      return new Response(JSON.stringify({ 
        error: "url is required",
        status: "error",
        debug: {
          requestUrl: request.url,
          urlHref: url.href,
          urlSearch: url.search,
          method1,
          method2,
          method3,
          allParams1: Array.from(new URL(request.url).searchParams.entries()),
          allParams2: Array.from(url.searchParams.entries())
        }
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // Validate TikTok URL format
    if (!urlTik.includes("tiktok.com") && !urlTik.includes("douyin")) {
      console.log("13. ERROR: Invalid TikTok URL format");
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

    console.log("14. URL validation passed, calling TikTok API...");

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
        console.log("15. Processed douyin URL:", processedUrl);
      } catch (e) {
        console.error("Error processing douyin URL:", e);
      }
    }

    // Call the TikTok downloader
    console.log("16. Calling Downloader with URL:", processedUrl);
    let data = await Downloader(processedUrl, {
      version: "v3",
    });

    console.log("17. TikTok API response status:", data?.status);
    console.log("18. TikTok API response:", JSON.stringify(data, null, 2));

    // Check if the response is successful
    if (!data || data.status === "error") {
      console.log("19. ERROR: TikTok API returned error");
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
      console.log("20. ERROR: No result data in response");
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

    console.log("21. SUCCESS: Returning processed data");
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
      status: "error",
      stack: error.stack
    }), {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
    });
  }
};