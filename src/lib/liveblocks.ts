import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Presence represents the properties that exist on every user in the Room
// and that will be automatically shared with every other user in the Room.
// Examples of properties for a white-boarding app would be current effective
// cursor position, color, pencil info, etc.
type Presence = {
  cursor: { x: number, y: number } | null,
  // ...
};

// Storage represents the durable data that's stored in the Room.
type Storage = {
  // ...
};

// UserMeta represents the data that's associated with each user in the Room
// and shared with every other user.
type UserMeta = {
  id?: string;
  info?: {
    name?: string;
    picture?: string;
  };
};

// RoomEvent represents the events that can be broadcasted to everyone in the Room.
type RoomEvent = {
  // type: "NOTIFICATION",
  // ...
};

// Optionally, UserMeta is used for interactive features.
// All of these overrideable hooks will be inside your component.
// They are passed into createRoomContext here to give them access
// to Liveblocks hooks.
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useBroadcastEvent,
  useEventListener,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useMutation,
  useStorage,
  useStatus,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client); 