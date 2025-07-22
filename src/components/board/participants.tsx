"use client";

// import { useOthers, useSelf } from "@/liveblocks.config";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Participants() {
  // const users = useOthers();
  // const currentUser = useSelf();

  return (
    <div className="absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md z-10">
      {/* <div className="flex gap-x-2">
        {users.slice(0, 3).map(({ connectionId, info }) => (
          <Avatar key={connectionId} className="h-8 w-8 border-2 border-neutral-200">
            <AvatarImage src={info?.picture as string} />
            <AvatarFallback>{info?.name?.[0] || "T"}</AvatarFallback>
          </Avatar>
        ))}

        {currentUser && (
          <Avatar className="h-8 w-8 border-2 border-blue-500">
            <AvatarImage src={currentUser.info?.picture as string} />
            <AvatarFallback>{currentUser.info?.name?.[0]}</AvatarFallback>
          </Avatar>
        )}

        {users.length > 3 && (
          <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold">
            +{users.length - 3}
          </div>
        )}
      </div> */}
    </div>
  );
} 