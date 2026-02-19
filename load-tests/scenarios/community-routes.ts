/**
 * K6 Load Test: Community Routes
 * Tests social/community endpoints: gallery browsing, posts, profiles, prompt sharing
 * Simulates realistic user behavior patterns for discovery and engagement
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import {
  getBaseOptions,
  getStandardHeaders,
  getAuthToken,
  apiConfig,
  communityRouteThresholds,
  p95LatencyMetric,
  trackError,
} from '../k6-config.ts';

// Route-specific metrics
const galleryBrowseLatency = new Trend('community_gallery_latency_ms');
const postLikeLatency = new Trend('community_post_like_latency_ms');
const userProfileLatency = new Trend('community_user_profile_latency_ms');
const promptCreateLatency = new Trend('community_prompt_create_latency_ms');
const commentLatency = new Trend('community_comment_latency_ms');
const followLatency = new Trend('community_follow_latency_ms');

const likesCreated = new Counter('likes_created');
const commentsCreated = new Counter('comments_created');
const followsCreated = new Counter('follows_created');
const promptsCreated = new Counter('prompts_created');

export const options = {
  ...getBaseOptions(60), // 60 VUs for community routes (social is popular)
  thresholds: communityRouteThresholds,
};

/**
 * Test gallery browsing with pagination
 * GET /api/studio/community/gallery
 * Simulates users browsing curated gallery
 */
function testGalleryBrowse() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/community/gallery`;

  const params = {
    page: Math.floor(Math.random() * 50) + 1,
    limit: 20,
    sortBy: ['trending', 'recent', 'top'][Math.floor(Math.random() * 3)],
    category: ['portraits', 'landscapes', 'abstract', 'creative'][Math.floor(Math.random() * 4)],
  };

  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const startTime = new Date().getTime();
  const response = http.get(`${url}?${queryString}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    timeout: '10s',
  });
  const latency = new Date().getTime() - startTime;

  galleryBrowseLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'gallery-browse status 200': (r) => r.status === 200,
    'gallery-browse has images': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && Array.isArray(body.data.items);
      } catch {
        return false;
      }
    },
    'gallery-browse latency < 1s': (r) => latency < 1000,
  });

  if (!passed) {
    trackError('community');
  }

  return response.status === 200 ? parseResponse(response)?.data?.items?.[0]?.id : null;
}

/**
 * Test liking/reacting to posts
 * POST /api/studio/community/posts/{id}/like
 * Simulates engagement with community content
 */
function testPostLike(postId?: string) {
  if (!postId) {
    postId = `post-${Math.floor(Math.random() * 10000)}`;
  }

  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/community/posts/${postId}/like`;

  const payload = JSON.stringify({
    reactionType: ['like', 'love', 'wow', 'fire'][Math.floor(Math.random() * 4)],
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '5s',
  });
  const latency = new Date().getTime() - startTime;

  postLikeLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'post-like status 200': (r) => r.status === 200,
    'post-like has reaction data': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && 'reactionCount' in body.data;
      } catch {
        return false;
      }
    },
    'post-like latency < 2s': (r) => latency < 2000,
  });

  if (passed) {
    likesCreated.add(1);
  } else {
    trackError('community');
  }
}

/**
 * Test user profile lookup
 * GET /api/studio/community/users/{userId}
 * Simulates profile viewing
 */
function testUserProfile() {
  const userIds = [
    'user-1001',
    'user-1002',
    'user-1003',
    'user-1004',
    'user-1005',
  ];
  const userId = userIds[Math.floor(Math.random() * userIds.length)];
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/community/users/${userId}`;

  const startTime = new Date().getTime();
  const response = http.get(url, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    timeout: '5s',
  });
  const latency = new Date().getTime() - startTime;

  userProfileLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'user-profile status 200': (r) => r.status === 200,
    'user-profile has user data': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && 'username' in body.data;
      } catch {
        return false;
      }
    },
    'user-profile latency < 1s': (r) => latency < 1000,
  });

  if (!passed) {
    trackError('community');
  }

  return response.status === 200 ? parseResponse(response)?.data?.id : null;
}

/**
 * Test sharing/creating prompts in community
 * POST /api/studio/community/prompts
 * Users share their favorite prompts
 */
function testCreatePrompt() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/community/prompts`;

  const prompts = [
    'detailed portrait of a person',
    'abstract artwork with vibrant colors',
    'landscape with mountains and river',
    'futuristic city scene',
    'underwater fantasy world',
  ];

  const payload = JSON.stringify({
    title: `Prompt ${Math.floor(Math.random() * 10000)}`,
    description: prompts[Math.floor(Math.random() * prompts.length)],
    promptText: prompts[Math.floor(Math.random() * prompts.length)],
    tags: ['creative', 'portrait', 'landscape', 'abstract'].slice(0, Math.floor(Math.random() * 3) + 1),
    isPublic: true,
    category: 'general',
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '5s',
  });
  const latency = new Date().getTime() - startTime;

  promptCreateLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'prompt-create status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'prompt-create has id': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && 'id' in body.data;
      } catch {
        return false;
      }
    },
    'prompt-create latency < 2s': (r) => latency < 2000,
  });

  if (passed) {
    promptsCreated.add(1);
  } else {
    trackError('community');
  }
}

/**
 * Test commenting on posts
 * POST /api/studio/community/posts/{id}/comments
 * Users comment on community content
 */
function testAddComment(postId?: string) {
  if (!postId) {
    postId = `post-${Math.floor(Math.random() * 10000)}`;
  }

  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/community/posts/${postId}/comments`;

  const comments = [
    'This looks amazing!',
    'Great work, love the details',
    'Very creative approach',
    'The colors are beautiful',
    'I would love to learn your technique',
  ];

  const payload = JSON.stringify({
    text: comments[Math.floor(Math.random() * comments.length)],
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '5s',
  });
  const latency = new Date().getTime() - startTime;

  commentLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'comment status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'comment has id': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && 'id' in body.data;
      } catch {
        return false;
      }
    },
    'comment latency < 2s': (r) => latency < 2000,
  });

  if (passed) {
    commentsCreated.add(1);
  } else {
    trackError('community');
  }
}

/**
 * Test following users
 * POST /api/studio/community/users/{userId}/follow
 * Users follow creators they like
 */
function testFollowUser(userId?: string) {
  if (!userId) {
    userId = `user-${Math.floor(Math.random() * 10000)}`;
  }

  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/community/users/${userId}/follow`;

  const payload = JSON.stringify({
    action: Math.random() > 0.5 ? 'follow' : 'unfollow',
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '5s',
  });
  const latency = new Date().getTime() - startTime;

  followLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'follow status 200': (r) => r.status === 200,
    'follow has follower count': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && 'followerCount' in body.data;
      } catch {
        return false;
      }
    },
    'follow latency < 1s': (r) => latency < 1000,
  });

  if (passed) {
    followsCreated.add(1);
  } else {
    trackError('community');
  }
}

/**
 * Helper to parse response safely
 */
function parseResponse(response: any) {
  try {
    return JSON.parse(response.body as string);
  } catch {
    return null;
  }
}

/**
 * Main test function simulating realistic user behavior
 * Majority reads (gallery, profiles), minority writes (likes, comments, prompts)
 */
export default function () {
  const rand = Math.random();

  if (rand < 0.40) {
    // 40% gallery browsing (read-heavy, most common)
    const postId = testGalleryBrowse();
    sleep(0.5 + Math.random() * 1); // Browse time
  } else if (rand < 0.60) {
    // 20% like posts (write, but lightweight)
    testPostLike();
    sleep(0.2 + Math.random() * 0.3);
  } else if (rand < 0.75) {
    // 15% view user profiles (read)
    const userId = testUserProfile();
    sleep(0.5 + Math.random() * 0.5);
  } else if (rand < 0.85) {
    // 10% add comments (write)
    testAddComment();
    sleep(0.3 + Math.random() * 0.3);
  } else if (rand < 0.93) {
    // 8% follow users (write, lightweight)
    testFollowUser();
    sleep(0.2 + Math.random() * 0.2);
  } else {
    // 7% create/share prompts (write, heavier)
    testCreatePrompt();
    sleep(0.5 + Math.random() * 0.5);
  }

  sleep(0.2 + Math.random() * 0.3); // Small delay between operations
}
