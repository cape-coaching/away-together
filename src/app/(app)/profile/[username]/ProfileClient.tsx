"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckinCard } from "@/components/checkin/CheckinCard";
import type { CheckinWithDetails } from "@/types";

interface UserData {
  id:             string;
  username:       string;
  name:           string;
  bio:            string | null;
  avatarUrl:      string | null;
  isPrivate:      boolean;
  isOwn:          boolean;
  isFollowing:    boolean;
  canViewContent: boolean;
  stats: {
    checkins:    number;
    following:   number;
    followers:   number;
    itineraries: number;
  };
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
    const method = following ? "DELETE" : "POST";
    await fetch(`/api/users/${user.id}/follow`, { method });
    setFollowing(!following);
  };

  if (loadingUser) return <ProfileSkeleton />;
  if (!user)       return <div className="p-6 text-center text-gray-500">User not found</div>;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-b from-sky-50 to-white px-4 pt-10 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-3xl bg-sky-100 overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                {user.name[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{user.name}</h2>
            <p className="text-sm text-gray-500">@{user.username}</p>
            {user.bio && <p className="text-sm text-gray-700 mt-1">{user.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          {[
            { label: "Check-ins",   val: user.stats.checkins },
            { label: "Following",   val: user.stats.following },
            { label: "Followers",   val: user.stats.followers },
            { label: "Itineraries", val: user.stats.itineraries },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold text-gray-900">{val}</p>
              <p className="text-[10px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Follow button */}
        {!user.isOwn && (
          <button
            onClick={handleFollow}
            className={`mt-4 w-full py-2.5 rounded-2xl font-medium text-sm transition-all active:scale-95 ${
              following
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-sky-500 text-white shadow-sm"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Check-ins */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Check-ins
        </h3>
        {!user.canViewContent ? (
          <PrivateAccountNotice />
        ) : checkins.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No check-ins yet</p>
        ) : (
          <div className="space-y-3">
            {checkins.map((c) => (
              <CheckinCard key={c.id} checkin={c} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PrivateAccountNotice() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="text-4xl mb-3">🔒</span>
      <p className="font-medium text-gray-700">This account is private</p>
      <p className="text-sm text-gray-400 mt-1">Follow to see their check-ins</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-3xl bg-gray-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 bg-gray-200 rounded-full w-1/2" />
          <div className="h-3 bg-gray-200 rounded-full w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(n => <div key={n} className="h-10 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}
