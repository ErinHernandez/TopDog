/**
 * Idesaign — User Profile Page
 *
 * Public user profile with:
 * - Profile header: avatar, name, bio, join date, follower/following counts
 * - Follow button (if logged in and not own profile)
 * - Tab bar: Posts, Collections, Likes
 * - Content grid with user's gallery posts
 * - Same card style as main gallery
 * - Empty states for each tab
 */

import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthProvider';
import { UserProfile, GalleryPost } from '@/lib/studio/community/types';
import styles from '@/styles/profile.module.css';

/* ================================================================
   Types
   ================================================================ */

type TabType = 'posts' | 'collections' | 'likes';

/* ================================================================
   Component: User Profile Page
   ================================================================ */

export default function UserProfilePage() {
  const router = useRouter();
  const { userId } = router.query;
  const { user: currentUser, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.uid === userId;

  /* ---- Load profile data ---- */
  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        const { UserProfileService, GalleryService, FollowService } = await import(
          '@/lib/studio/community/firestore'
        );

        // Fetch user profile from Firestore
        const userProfile = await UserProfileService.getProfile(userId as string);
        if (!userProfile) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(userProfile);

        // Fetch user's posts from Firestore
        const userPosts = await GalleryService.getUserPosts(userId as string);
        setPosts(userPosts);

        // Check if current user is following this user
        if (currentUser && !isOwnProfile) {
          const isFollowingUser = await FollowService.isFollowing(currentUser.uid, userId as string);
          setIsFollowing(isFollowingUser);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser, isOwnProfile]);

  /* ---- Handle follow ---- */
  const handleFollow = useCallback(async () => {
    if (!currentUser || !profile) return;

    const previousFollowState = isFollowing;
    try {
      // Optimistic UI update
      setIsFollowing(!previousFollowState);

      const { FollowService } = await import('@/lib/studio/community/firestore');

      if (previousFollowState) {
        await FollowService.unfollow(currentUser.uid, profile.userId);
      } else {
        await FollowService.follow(currentUser.uid, profile.userId);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      setIsFollowing(previousFollowState); // Revert on error
    }
  }, [currentUser, profile, isFollowing]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Profile — Idesaign</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Head>
          <title>Profile Not Found — Idesaign</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h1>Profile Not Found</h1>
            <p>The user profile you're looking for doesn't exist.</p>
            <Link href="/gallery" className={styles.backLink}>
              Back to Gallery
            </Link>
          </div>
        </div>
      </>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        if (posts.length === 0) {
          return <div className={styles.emptyState}>No posts yet</div>;
        }
        return (
          <div className={styles.grid}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        );
      case 'collections':
        return <div className={styles.emptyState}>Collections coming soon</div>;
      case 'likes':
        return <div className={styles.emptyState}>Liked posts coming soon</div>;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>{profile.username} — Idesaign</title>
        <meta name="description" content={profile.bio || profile.username} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        {/* ---- Back Button ---- */}
        <div className={styles.backNav}>
          <Link href="/gallery" className={styles.backButton}>
            ← Back to Gallery
          </Link>
        </div>

        {/* ---- Profile Header ---- */}
        <section className={styles.profileHeader}>
          <div className={styles.coverImage} />

          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              {profile.avatar && (
                <Image
                  src={profile.avatar}
                  alt={profile.username}
                  width={120}
                  height={120}
                  className={styles.avatar}
                />
              )}
              {!profile.avatar && (
                <div className={styles.avatarPlaceholder}>
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className={styles.profileInfo}>
              <h1 className={styles.displayName}>{profile.username}</h1>
              <p className={styles.username}>@{profile.username}</p>

              {profile.bio && (
                <p className={styles.bio}>{profile.bio}</p>
              )}

              <div className={styles.metadata}>
                <span className={styles.metaItem}>
                  📅 Joined {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              {isOwnProfile && (
                <Link href="/profile/settings" className={styles.editButton}>
                  Edit Profile
                </Link>
              )}

              {!isOwnProfile && currentUser && !authLoading && (
                <button
                  className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              )}

              {!currentUser && !authLoading && (
                <Link href="/login" className={styles.signInButton}>
                  Sign In to Follow
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ---- Stats ---- */}
        <section className={styles.statsSection}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatNumber(profile.stats.creationsCount)}</span>
            <span className={styles.statLabel}>Posts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatNumber(profile.stats.followersCount)}</span>
            <span className={styles.statLabel}>Followers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatNumber(profile.stats.followingCount)}</span>
            <span className={styles.statLabel}>Following</span>
          </div>
        </section>

        {/* ---- Tab Navigation ---- */}
        <nav className={styles.tabNav}>
          <button
            className={`${styles.tabButton} ${activeTab === 'posts' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'collections' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('collections')}
          >
            Collections
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'likes' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            Likes
          </button>
        </nav>

        {/* ---- Content Section ---- */}
        <section className={styles.contentSection}>
          {renderContent()}
        </section>
      </div>
    </>
  );
}

/* ================================================================
   Component: Post Card
   ================================================================ */

interface PostCardProps {
  post: GalleryPost;
}

function PostCard({ post }: PostCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/gallery/${post.id}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className={styles.postCard} onClick={handleClick}>
      <div className={styles.postImageContainer}>
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={styles.postImage}
          priority={false}
        />
        <div className={styles.postOverlay}>
          <button className={styles.postViewButton}>View</button>
        </div>
      </div>

      <div className={styles.postCardContent}>
        <h3 className={styles.postTitle}>{post.title}</h3>
        <div className={styles.postStats}>
          <span className={styles.postStat}>
            <span className={styles.postIcon}>♥</span>
            {formatNumber(post.likesCount)}
          </span>
          {post.remixesCount !== undefined && (
            <span className={styles.postStat}>
              <span className={styles.postIcon}>↻</span>
              {formatNumber(post.remixesCount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
