"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CheckinCard } from "@/components/checkin/CheckinCard";
import type { CheckinWithDetails } from "@/types";

interface UserData {
  id: string; username: string; name: string; bio: string | null;
  avatarUrl: string | null; isPrivate: boolean; isOwn: boolean;
  isFollowing: boolean; canViewContent: boolean;
  stats: { checkins: number; following: number; followers: number; itineraries: number; };
}

export default function ProfileClient({ username }: { username: string }) {
  const { data: session } = useSession();
  const [user, setUser]         = useState<UserData | null>(null);
  const [checkins, setCheckins] = useState<CheckinWithDetails[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [following, setFollowing]     = useState(false);

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setFollowing(data.isFollowing);
        setLoadingUser(false);
        if (data.canViewContent) loadCheckins(data.id);
      });
  }, [username]);

  const loadCheckins = async (userId: string) => {
    const res  = await fetch(`/api/checkins?userId=${userId}&limit=20`);
    const data = await res.json();
    setCheckins(data.items ?? []);
  };

  const handleFollow = async () => {
    if (!user) return;
    await fetch(`/api/users/${user.id}/follow`, { method: following ? "DELETE" : "POST" });
    setFollowing(!following);
  };

  if (loadingUser) return <ProfileSkeleton />;
  if (!user) return <div className="p-8 text-center text-stone-400 text-[15px]">User not found</div>;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 bg-stone-50">
      {/* Hero */}
      <div className="bg-white border-b border-stone-100 px-5 pt-12 pb-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-100 to-amber-50 overflow-hidden mb-4 shadow-lg shadow-rose-100/30">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-rose-400">
                {user.name[0]}
              </div>
            )}
          </div>
          <h2 className="text-[22px] font-bold text-stone-900 tracking-tight">{user.name}</h2>
          <p className="text-[13px] text-stone-400 mt-0.5">@{user.username}</p>
          {user.bio && <p className="text-[14px] text-stone-500 mt-2.5 max-w-[260px] leading-relaxed">{user.bio}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-7">
          {[
            { label: "Check-ins",   val: user.stats.checkins },
            { label: "Following",   val: user.stats.following },
            { label: "Followers",   val: user.stats.followers },
            { label: "Trips",       val: user.stats.itineraries },
          ].map(({ label, val }) => (
            <div key={label} className="text-center bg-stone-50 rounded-2xl py-3">
              <p className="text-[20px] font-bold text-stone-900">{val}</p>
              <p className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-wider font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Follow button */}
        {!user.isOwn && (
          <button
            onClick={handleFollow}
            className={`mt-5 w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all duration-200 active:scale-[0.98] ${
              following
                ? "bg-stone-100 text-stone-600"
                : "btn-brand"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}

        {/* Import from Instagram */}
        {user.isOwn && (
          <Link
            href="/import/instagram"
            className="mt-4 w-full py-3.5 rounded-2xl font-semibold text-[14px] text-center block transition-all duration-200 active:scale-[0.98] bg-gradient-to-r from-purple-500 via-rose-500 to-amber-500 text-white shadow-sm"
          >
            Import from Instagram
          </Link>
        )}
      </div>

      {/* Check-ins */}
      <div className="px-5 pt-6">
        <h3 className="section-label mb-4">Check-ins</h3>
        {!user.canViewContent ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="font-semibold text-stone-700 text-[15px]">Private account</p>
            <p className="text-[13px] text-stone-400 mt-1">Follow to see their check-ins</p>
          </div>
        ) : checkins.length === 0 ? (
          <p className="text-[14px] text-stone-300 text-center py-12">No check-ins yet</p>
        ) : (
          <div className="space-y-3 pb-4">
            {checkins.map((c) => (
              <CheckinCard key={c.id} checkin={c} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="bg-white p-5 pt-12 space-y-5">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl skeleton" />
        <div className="h-5 skeleton rounded-full w-32 mt-4" />
        <div className="h-3 skeleton rounded-full w-20 mt-2" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(n => <div key={n} className="h-16 skeleton rounded-2xl" />)}
      </div>
    </div>
  );
}
