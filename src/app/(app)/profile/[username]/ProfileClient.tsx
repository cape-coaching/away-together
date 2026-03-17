"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
  if (!user) return <div className="p-8 text-center text-gray-400 text-[15px]">User not found</div>;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 bg-white">
      {/* Hero */}
      <div className="px-5 pt-12 pb-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 overflow-hidden mb-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-sky-600">
                {user.name[0]}
              </div>
            )}
          </div>
          <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight">{user.name}</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">@{user.username}</p>
          {user.bio && <p className="text-[14px] text-gray-500 mt-2 max-w-[260px] leading-relaxed">{user.bio}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-6 bg-gray-50/70 rounded-2xl p-4">
          {[
            { label: "Check-ins",   val: user.stats.checkins },
            { label: "Following",   val: user.stats.following },
            { label: "Followers",   val: user.stats.followers },
            { label: "Trips",       val: user.stats.itineraries },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-[18px] font-semibold text-gray-900">{val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Follow button */}
        {!user.isOwn && (
          <button
            onClick={handleFollow}
            className={`mt-5 w-full py-3 rounded-xl font-medium text-[14px] transition-all duration-200 active:scale-[0.98] ${
              following
                ? "bg-gray-50 text-gray-600 border border-gray-100"
                : "bg-gray-900 text-white"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-[6px] bg-gray-50" />

      {/* Check-ins */}
      <div className="px-5 pt-5">
        <h3 className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-4">
          Check-ins
        </h3>
        {!user.canViewContent ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
              <span className="text-xl">🔒</span>
            </div>
            <p className="font-medium text-gray-700 text-[15px]">Private account</p>
            <p className="text-[13px] text-gray-400 mt-1">Follow to see their check-ins</p>
          </div>
        ) : checkins.length === 0 ? (
          <p className="text-[14px] text-gray-300 text-center py-12">No check-ins yet</p>
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
    <div className="p-5 pt-12 space-y-5">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl skeleton" />
        <div className="h-5 skeleton rounded-full w-32 mt-4" />
        <div className="h-3 skeleton rounded-full w-20 mt-2" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(n => <div key={n} className="h-14 skeleton rounded-xl" />)}
      </div>
    </div>
  );
}
