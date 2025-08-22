import { toast, Toaster } from "solid-toast";
import { createSignal } from "solid-js";

interface TikTokData {
  status: string | null;
  result: {
    type: string | null;
    author?: {
      avatar?: string | null;
      nickname?: string | null;
    };
    desc?: string | null;
    videoSD?: string | null;
    videoHD?: string | null;
    video_hd?: string | null;
    videoWatermark?: string | null;
    video?: string[] | null; // Sometimes it's an array
    music?: string | null;
    uploadDate?: string | null;
    // Additional possible properties from the API
    title?: string | null;
    create_time?: number | null;
  };
}

type Props = {};

function InputScreen({}: Props) {
  const [url, setUrl] = createSignal("");
  const [data, setData] = createSignal<TikTokData | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const fetchData = async () => {
    setLoading(true);
    try {
      let res = await fetch(`/api/tik.json?url=${encodeURIComponent(url())}`);
      let json = await res.json();
      
      // Debug: log the response to see what we're getting
      console.log("API Response:", json);
      
      // Check for error property (not status)
      if (json.error) {
        throw new Error(json.error);
      }
      
      // Check for status field indicating error
      if (json.status === "error") {
        throw new Error(json.message || "API returned an error");
      }
      
      // Validate response structure - be more flexible
      if (!json.result) {
        throw new Error("Invalid response: missing result data");
      }
      
      // Don't require author - some videos might not have complete data
      // if (!json.result.author) {
      //   throw new Error("Invalid response: missing author data");
      // }
      
      setData(json);
      setError("");
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to fetch video data", {
        duration: 3000,
        position: "bottom-center",
        style: {
          "font-size": "16px",
        },
      });
      setData(null);
    }
    setLoading(false);
  };

  const handlePaste = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' as any });
      if (permission.state === 'granted' || permission.state === 'prompt') {
        const text = await navigator.clipboard.readText();
        setUrl(text);
      }
    } catch (err) {
      toast.error("Clipboard access denied");
    }
  };

  return (
    <div class="max-w-6xl mx-auto mt-8 px-4">
      <Toaster />

      {/* Input Form Section */}
      <div class="max-w-6xl mx-auto">
        <div class="download-box rounded-2xl">
          <div class="bg-cyan-800/80 rounded-xl backdrop-blur-md p-4">
            <form class="flex flex-col md:flex-row items-stretch md:items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!url()) {
                  toast.error("Please enter a valid URL");
                } else {
                  fetchData();
                }
              }}
            >
              <div class="relative flex-grow">
                <input type="text"
                  value={url()}
                  onInput={(e) => setUrl(e.currentTarget.value)}
                  placeholder="Paste TikTok or Douyin video link here"
                  class="w-full h-14 border-gray-700 text-black rounded-xl px-5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 flex-1 px-4 py-3 rounded-md focus:ring-2 focus:ring-blue-600"
                />
                <button type="button" 
                  onClick={handlePaste} 
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-700/80 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  Paste
                </button>
              </div>
              <button type="submit" class="h-14 px-8 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg> 
                Download
              </button>
            </form>
            <p class="text-sm text-gray-500 mt-2">Supports TikTok (tiktok.com) and Douyin (douyin.com)</p>
          </div>
        </div>
      </div>

      {loading() && (
        <div class="flex justify-center mt-4">
          <svg class="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}

      {/* Show when we have data but invalid structure */}
      {data() && !data()?.result && (
        <div class="mt-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700">
          <h3 class="font-medium text-red-800 dark:text-red-300 mb-2">⚠️ Invalid API Response</h3>
          <p class="text-red-700 dark:text-red-400 text-sm">
            The API returned data but it's missing the expected 'result' field. Please check the API endpoint or try a different TikTok URL.
          </p>
        </div>
      )}

      {/* Show when we have result but missing author */}
      {data() && data()?.result && !data()?.result?.author && (
        <div class="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
          <h3 class="font-medium text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Incomplete Data</h3>
          <p class="text-yellow-700 dark:text-yellow-400 text-sm">
            Video data was found but author information is missing. Some features may not work properly.
          </p>
        </div>
      )}

      {/* Debug section - remove this in production */}
      {data() && (
        <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <details class="cursor-pointer">
            <summary class="font-medium text-gray-700 dark:text-gray-300 mb-2">Debug: API Response</summary>
            <pre class="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(data(), null, 2)}
            </pre>
          </details>
        </div>
      )}

      {data() && data()?.result && (
        <div class="mt-6">
          <div class="mt-4 max-w-6xl mx-auto">
            <div class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg overflow-hidden backdrop-blur-sm border border-white/10 p-4">
              <div class="flex flex-col md:flex-row gap-4">
                <div class="md:w-1/3 flex-shrink-0">
                  <div class="relative rounded-lg overflow-hidden max-h-[430px]">
                    <video 
                      controls 
                      src={
                        data()?.result?.videoSD || 
                        data()?.result?.videoHD || 
                        data()?.result?.video_hd ||
                        (Array.isArray(data()?.result?.video) ? data()?.result?.video[0] : data()?.result?.video) ||
                        data()?.result?.videoWatermark || 
                        data()?.result?.music || 
                        ""
                      } 
                      class="w-full h-full object-cover" 
                      referrerpolicy="no-referrer"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>

                <div class="md:w-2/3 flex flex-col justify-between">
                  <div class="mb-3">
                    <div class="flex items-center gap-3 justify-between mb-1">
                      {data()?.result?.author?.avatar && (
                        <img 
                          src={data()?.result?.author?.avatar} 
                          alt={data()?.result?.author?.nickname || "Author"}
                          class="rounded-full w-24 h-24"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        {data()?.result?.author?.nickname || "Unknown Author"}
                      </h2>
                      <div class="text-gray-400 text-xs px-2 py-1 bg-white/10 rounded-full"></div>
                    </div>
                    <div class="text-gray-400 text-xs mb-2">
                      {data()?.result?.desc || "No description available"}
                    </div>
                  </div>

                  <div class="space-y-2">
                    {data()?.result?.videoSD && (
                      <button class="download-button bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg> 
                        <a href={`https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data()!.result.videoSD)}&type=.mp4&title=${encodeURIComponent(data()?.result?.author?.nickname || 'video')}`} class="btn">
                          Download SD (No Watermark)
                        </a>
                      </button>
                    )}
                    
                    {data()?.result?.videoHD && (
                      <button class="download-button bg-gradient-to-r from-pink-600 to-pink-400 hover:from-pink-500 hover:to-pink-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg> 
                        <a href={`https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data()!.result.videoHD)}&type=.mp4&title=${encodeURIComponent(data()?.result?.author?.nickname || 'video')}`} class="btn">
                          Download HD (No Watermark)
                        </a>
                      </button>
                    )}
                    
                    {data()?.result?.videoWatermark && (
                      <button class="download-button bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                        </svg> 
                        <a href={`https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data()!.result.videoWatermark)}&type=.mp4&title=${encodeURIComponent(data()?.result?.author?.nickname || 'video')}`} class="btn">
                          Download (With Watermark)
                        </a>
                      </button>
                    )}
                    
                    <button class="download-button bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300">
                      <a href="/" class="btn">Download Another Video</a> 
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InputScreen;