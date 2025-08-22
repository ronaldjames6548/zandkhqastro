import type { APIRoute } from "astro";
import { Downloader } from "@tobyg74/tiktok-api-dl";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    let urlTik = params.get("url") || "";

    // Validate URL parameter
    if (!urlTik) {
      return new Response(JSON.stringify({ 
        error: "URL parameter is required" 
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Validate TikTok/Douyin URL format
    if (!urlTik.includes('tiktok.com') && !urlTik.includes('douyin.com')) {
      return new Response(JSON.stringify({ 
        error: "Invalid URL. Please provide a valid TikTok or Douyin URL" 
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    console.log("Processing URL:", urlTik);

    // Handle Douyin URLs by converting to TikTok
    if (urlTik.includes("douyin")) {
      try {
        const response = await fetch(urlTik, {
          method: "HEAD",
          redirect: "follow",
        });
        urlTik = response.url.replace("douyin", "tiktok");
        console.log("Converted Douyin URL to:", urlTik);
      } catch (conversionError) {
        console.error("Douyin URL conversion failed:", conversionError);
        // Continue with original URL if conversion fails
      }
    }

    // Call the TikTok downloader
    console.log("Calling Downloader with URL:", urlTik);
    const data = await Downloader(urlTik, {
      version: "v3",
    });

    console.log("Downloader response:", JSON.stringify(data, null, 2));

    // Check if the downloader returned an error
    if (!data || data.status === "error") {
      return new Response(JSON.stringify({ 
        error: data?.message || "Failed to fetch video data. Please check the URL and try again." 
      }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Ensure we have result data
    if (!data.result) {
      return new Response(JSON.stringify({ 
        error: "No video data found. The URL might be invalid or the video might be private." 
      }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Force set type to 'story' if URL contains '/story/'
    const isStory = urlTik.includes("/story/");
    if (isStory && data.result) {
      data.result.type = "story";
    }

    // Add uploadDate if available
    const createTime = data?.result?.create_time;
    const uploadDate = createTime
      ? new Date(createTime * 1000).toISOString()
      : null;

    if (data.result) {
      data.result.uploadDate = uploadDate;
    }

    // Ensure the response has the expected structure
    const response = {
      status: "success",
      result: {
        type: data.result.type || "video",
        author: {
          avatar: data.result.author?.avatar || null,
          nickname: data.result.author?.nickname || "Unknown",
        },
        desc: data.result.desc || data.result.title || "No description",
        videoSD: data.result.videoSD || null,
        videoHD: data.result.videoHD || data.result.video_hd || null,
        video_hd: data.result.video_hd || null,
        videoWatermark: data.result.videoWatermark || null,
        video: data.result.video || null,
        music: data.result.music || null,
        uploadDate: uploadDate,
        ...data.result // Include any other properties
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  } catch (error) {
    console.error("API Error:", error);
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : "An unexpected error occurred while processing the video.";

    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};