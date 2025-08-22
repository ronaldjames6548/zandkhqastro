import type { APIRoute } from "astro";
import { Downloader } from "@tobyg74/tiktok-api-dl";

export const prerender = false;

// Keep GET for backward compatibility but redirect to POST
export const GET: APIRoute = async (context) => {
  return new Response(JSON.stringify({ 
    error: "Please use POST method with request body",
    status: "error",
    hint: "Send {\"url\": \"your-tiktok-url\"} in request body"
  }), {
    status: 400,
    headers: {
      "content-type": "application/json",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("=== POST API DEBUG ===");
    console.log("1. Request method:", request.method);
    console.log("2. Request URL:", request.url);
    
    // Get data from request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log("3. Request body:", requestBody);
    } catch (e) {
      console.log("3. Error parsing JSON body:", e.message);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON in request body",
        status: "error" 
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    const urlTik = requestBody?.url || "";
    console.log("4. Extracted URL:", urlTik);

    if (!urlTik) {
      console.log("5. ERROR: No URL in request body");
      return new Response(JSON.stringify({ 
        error: "url is required in request body",
        status: "error",
        example: { url: "https://www.tiktok.com/@user/video/123" }
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // Validate TikTok URL format
    if (!urlTik.includes("tiktok.com") && !urlTik.includes("douyin")) {
      console.log("6. ERROR: Invalid TikTok URL format");
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

    console.log("7. URL validation passed, calling TikTok API...");

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
        console.log("8. Processed douyin URL:", processedUrl);
      } catch (e) {
        console.error("Error processing douyin URL:", e);
      }
    }

    // Call the TikTok downloader
    console.log("9. Calling Downloader with URL:", processedUrl);
    let data = await Downloader(processedUrl, {
      version: "v3",
    });

    console.log("10. TikTok API response status:", data?.status);

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