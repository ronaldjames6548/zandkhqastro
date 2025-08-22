// src/pages/api/tiktok.ts
import type { APIRoute } from 'astro';
import Tiktok from '@tobyg74/tiktok-api-dl';

interface TikTokRequest {
  action: 'download' | 'profile' | 'search' | 'comments' | 'posts' | 'liked';
  url?: string;
  username?: string;
  query?: string;
  version?: 'v1' | 'v2' | 'v3';
  type?: 'user' | 'live' | 'video';
  page?: number;
  cookie?: string;
  commentLimit?: number;
  postLimit?: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: TikTokRequest = await request.json();
    const { action } = body;

    switch (action) {
      case 'download':
        return await handleDownload(body);
      
      case 'profile':
        return await handleProfile(body);
      
      case 'search':
        return await handleSearch(body);
      
      case 'comments':
        return await handleComments(body);
      
      case 'posts':
        return await handlePosts(body);
      
      case 'liked':
        return await handleLiked(body);
      
      default:
        return createErrorResponse('Invalid action specified', 400);
    }
  } catch (error) {
    console.error('TikTok API error:', error);
    return createErrorResponse('Invalid request format', 400);
  }
};

// Download video/image/music
async function handleDownload(body: TikTokRequest) {
  try {
    const { url, version = 'v1' } = body;
    
    if (!url) {
      return createErrorResponse('URL is required for download action', 400);
    }

    const result = await Tiktok.Downloader(url, {
      version: version as "v1" | "v2" | "v3"
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Download error:', error);
    return createErrorResponse('Failed to download TikTok content');
  }
}

// Get user profile information
async function handleProfile(body: TikTokRequest) {
  try {
    const { username } = body;
    
    if (!username) {
      return createErrorResponse('Username is required for profile action', 400);
    }

    const result = await Tiktok.StalkUser(username);
    return createSuccessResponse(result);
  } catch (error) {
    console.error('Profile error:', error);
    return createErrorResponse('Failed to fetch user profile');
  }
}

// Search for users, videos, or live streams
async function handleSearch(body: TikTokRequest) {
  try {
    const { query, type = 'user', page = 1, cookie } = body;
    
    if (!query) {
      return createErrorResponse('Search query is required for search action', 400);
    }

    const result = await Tiktok.Search(query, {
      type: type as "user" | "live" | "video",
      page,
      cookie
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Search error:', error);
    return createErrorResponse('Failed to search TikTok content');
  }
}

// Get video comments
async function handleComments(body: TikTokRequest) {
  try {
    const { url, commentLimit = 30 } = body;
    
    if (!url) {
      return createErrorResponse('URL is required for comments action', 400);
    }

    const result = await Tiktok.GetVideoComments(url, {
      commentLimit
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Comments error:', error);
    return createErrorResponse('Failed to fetch video comments');
  }
}

// Get user posts
async function handlePosts(body: TikTokRequest) {
  try {
    const { username, postLimit = 30 } = body;
    
    if (!username) {
      return createErrorResponse('Username is required for posts action', 400);
    }

    const result = await Tiktok.GetUserPosts(username, {
      postLimit
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Posts error:', error);
    return createErrorResponse('Failed to fetch user posts');
  }
}

// Get user liked videos (requires cookie)
async function handleLiked(body: TikTokRequest) {
  try {
    const { username, postLimit = 30, cookie } = body;
    
    if (!username) {
      return createErrorResponse('Username is required for liked action', 400);
    }

    if (!cookie) {
      return createErrorResponse('Cookie is required for liked videos', 400);
    }

    const result = await Tiktok.GetUserLiked(username, {
      postLimit,
      cookie
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Liked videos error:', error);
    return createErrorResponse('Failed to fetch liked videos');
  }
}

// Helper functions
function createSuccessResponse(data: any) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function createErrorResponse(message: string, status: number = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Optional: GET method for health check
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: true,
    message: 'TikTok API endpoint is running',
    availableActions: [
      'download - Download video/image/music from URL',
      'profile - Get user profile information',
      'search - Search users, videos, or live streams',
      'comments - Get video comments',
      'posts - Get user posts',
      'liked - Get user liked videos (requires cookie)'
    ]
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};