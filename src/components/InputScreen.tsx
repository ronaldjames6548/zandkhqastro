import { toast, Toaster } from "solid-toast";
import { createSignal, onCleanup } from "solid-js";

interface TikTokData {
  status: string | null;
  result: {
    type: string | null;
    author: {
      avatar: string | null;
      nickname: string | null;
    };
    desc: string | null;
    videoSD: string | null;
    videoHD: string | null;
    video_hd: string | null;
    videoWatermark: string | null;
    music: string | null;
    uploadDate?: string | null;
  };
}

type Props = {};

function InputScreen({}: Props) {
  const [url, setUrl] = createSignal("");
  const [data, setData] = createSignal<TikTokData | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [adLoaded, setAdLoaded] = createSignal(false);

  // 🔧 IMPROVED fetchData function with better error handling and debugging
  const fetchData = async () => {
    console.log("🔍 fetchData called");
    
    setLoading(true);
    setError("");
    
    try {
      const currentUrl = url().trim();
      console.log("🔍 Current URL:", currentUrl);
      
      if (!currentUrl) {
        throw new Error("Please enter a TikTok URL");
      }
      
      if (!currentUrl.includes('tiktok.com')) {
        throw new Error("Please enter a valid TikTok URL");
      }
      
      // Construct API URL
      const apiUrl = `/api/tik.json?url=${encodeURIComponent(currentUrl)}`;
      console.log("🔍 API URL:", apiUrl);
      
      // Make the request
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response OK:", response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log("🔍 Response data:", responseData);
      
      if (responseData.status === "error") {
        throw new Error(responseData.message || "Failed to fetch TikTok data");
      }
      
      if (!responseData.result) {
        throw new Error("No video data found");
      }
      
      setData(responseData);
      loadAd();
      
      toast.success("Video loaded successfully!", {
        duration: 2000,
        position: "bottom-center",
      });
      
    } catch (error) {
      console.error("❌ fetchData error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to load TikTok video";
      
      toast.error(errorMessage, {
        duration: 4000,
        position: "bottom-center",
        style: {
          "font-size": "16px",
        },
      });
      
      setData(null);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' as any });
      if (permission.state === 'granted' || permission.state === 'prompt') {
        const text = await navigator.clipboard.readText();
        setUrl(text);
        console.log("🔍 Pasted URL:", text);
      }
    } catch (err) {
      toast.error("Clipboard access denied");
    }
  };

  const loadAd = () => {
    const adContainer = document.getElementById("ad-banner");
    if (!adContainer) return;

    // Clear previous content
    adContainer.innerHTML = '';

    // Create the AC script if it doesn't exist
    if (!document.getElementById("aclib")) {
      const script = document.createElement("script");
      script.id = "aclib";
      script.src = "https://acscdn.com/script/aclib.js";
      script.async = true;
      script.onload = () => {
        if (typeof aclib !== 'undefined') {
          runAdcashBanner();
        } else {
          showFallbackAd();
        }
      };
      script.onerror = () => {
        showFallbackAd();
      };
      document.body.appendChild(script);
    } else {
      // Script already exists, just run the banner
      if (typeof aclib !== 'undefined') {
        runAdcashBanner();
      } else {
        showFallbackAd();
      }
    }
  };

  const runAdcashBanner = () => {
    const adContainer = document.getElementById("ad-banner");
    if (!adContainer) return;

    try {
      adContainer.innerHTML = '<div id="ac-banner"></div>';
      aclib.runBanner({
        zoneId: '9480206',
        width: 336,
        height: 280,
        container: document.getElementById("ac-banner")
      });
      setAdLoaded(true);
    } catch (e) {
      console.error("Adcash error:", e);
      showFallbackAd();
    }
  };

  const showFallbackAd = () => {
    const adContainer = document.getElementById("ad-banner");
    if (!adContainer) return;
    
    adContainer.innerHTML = `
      <div style="width:336px;height:280px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px dashed #ddd;">
        <div style="text-align:center;color:#666;">
          <p>Advertisement</p>
          <p style="font-size:12px;margin-top:8px;">Ad failed to load.. Please wait</p>
        </div>
      </div>
    `;
  };

  onCleanup(() => {
    const script = document.getElementById("aclib");
    if (script) script.remove();
  });

  return (
    <div class="max-w-6xl mx-auto mt-8 px-4">
      <Toaster />

      {/* Input Form Section */}
      <div class="max-w-6xl mx-auto">
        <div class="download-box rounded-2xl">
          <div class="bg-cyan-800/80 rounded-xl backdrop-blur-md p-4">
            {/* 🔧 IMPROVED form submission with better validation */}
            <form class="flex flex-col md:flex-row items-stretch md:items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                
                // Get the URL value directly from the input element as backup
                const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                const urlFromInput = inputElement?.value?.trim() || "";
                const urlFromSignal = url().trim();
                
                // Use whichever URL value is available
                const finalUrl = urlFromSignal || urlFromInput;
                
                console.log("🔍 URL from signal:", urlFromSignal);
                console.log("🔍 URL from input:", urlFromInput);
                console.log("🔍 Final URL:", finalUrl);
                
                if (!finalUrl) {
                  toast.error("Please enter a valid TikTok URL");
                  return;
                }
                
                if (!finalUrl.includes('tiktok.com')) {
                  toast.error("Please enter a valid TikTok URL");
                  return;
                }
                
                // Update the signal with the final URL
                setUrl(finalUrl);
                
                // Call fetchData
                fetchData();
              }}
            >
              <div class="relative flex-grow">
                <input 
                  type="text"
                  value={url()}
                  onInput={(e) => {
                    const newValue = e.currentTarget.value;
                    console.log("🔍 Input changed:", newValue);
                    setUrl(newValue);
                  }}
                  placeholder="Paste TikTok video link here"
                  class="w-full h-14 border-gray-700 text-black rounded-xl px-5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 flex-1 px-4 py-3 rounded-md focus:ring-2 focus:ring-blue-600"
                />
                <button type="button" 
                  onClick={() => {
                    handlePaste().then(() => {
                      // After pasting, log the URL
                      setTimeout(() => {
                        console.log("🔍 URL after paste:", url());
                      }, 100);
                    });
                  }} 
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-700/80 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2"></path>
                  </svg>
                  Paste
                </button>
              </div>
              <button type="submit" 
                disabled={loading()}
                class={`h-14 px-8 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {loading() ? (
                  <svg class="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                )}
                {loading() ? 'Processing...' : 'Download'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {loading() && (
        <div class="flex justify-center mt-4">
          <div class="text-center">
            <svg class="animate-spin h-10 w-10 text-blue-600 mx-auto mb-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p class="text-gray-600 dark:text-gray-400">Processing TikTok video...</p>
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {error() && !loading() && (
        <div class="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 rounded-lg text-center">
          <p>{error()}</p>
        </div>
      )}

      {data() && (
        <div class="mt-6">
          <div class="mt-4 max-w-6xl mx-auto">
            <div class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg overflow-hidden backdrop-blur-sm border border-white/10 p-4">
              <div class="flex flex-col md:flex-row gap-4">
                <div class="md:w-1/3 flex-shrink-0">
                  <div class="relative rounded-lg overflow-hidden max-h-[430px]">
                    <video controls src={data()!.result.videoSD || data()!.result.videoHD || data()!.result.videoWatermark || data()!.result.music || ""} class="w-full h-full object-cover" referrerpolicy="no-referrer"></video>
                  </div>
                </div>

                <div class="md:w-2/3 flex flex-col justify-between">
                  <div class="mb-3">
                    <div class="flex items-center gap-3 justify-between mb-1">
                      <img src={data()!.result.author.avatar || ""}
                        alt={data()!.result.author.nickname || ""}
                        class="rounded-full w-24 h-24"
                      />
                      <h2 class="text-xl font-bold text-gray-900 dark:text-white">{data()!.result.author.nickname}</h2>
                      <div class="text-gray-400 text-xs px-2 py-1 bg-white/10 rounded-full"></div>
                    </div>
                    <div class="text-gray-400 text-xs mb-2">{data()!.result.desc}</div>
                    
                    {/* Ad Banner Container */}
                    <div class="flex justify-center my-4">
                      <div id="ad-banner" style="min-height:280px;width:336px;margin:0 auto;">
                        {!adLoaded() && (
                          <div style="width:336px;height:280px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;border-radius:8px;">
                            <div class="animate-pulse text-gray-400">Loading advertisement...</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div class="space-y-2">
                    {data()!.result.videoSD && (
                      <a href={`https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data()!.result.videoSD)}&type=.mp4&title=${encodeURIComponent(data()!.result.author.nickname || 'tiktok-video')}`} 
                         class="download-button bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 w-full px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 no-underline">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg> 
                        Download SD (No Watermark)
                      </a>
                    )}
                    
                    {data()!.result.videoHD && (
                      <a href={`https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data()!.result.videoHD)}&type=.mp4&title=${encodeURIComponent(data()!.result.author.nickname || 'tiktok-video')}`} 
                         class="download-button bg-gradient-to-r from-pink-600 to-pink-400 hover:from-pink-500 hover:to-pink-300 w-full px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 no-underline">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg> 
                        Download HD (No Watermark)
                      </a>
                    )}
                    
                    {data()!.result.videoWatermark && (
                      <a href={`https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data()!.result.videoWatermark)}&type=.mp4&title=${encodeURIComponent(data()!.result.author.nickname || 'tiktok-video')}`} 
                         class="download-button bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300 w-full px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 no-underline">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                        </svg> 
                        Download (With Watermark)
                      </a>
                    )}
                    
                    <a href="/" class="download-button bg-gradient-to-r from-gray-600 to-gray-400 hover:from-gray-500 hover:to-gray-300 w-full px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 no-underline">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Download Another Video
                    </a>
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