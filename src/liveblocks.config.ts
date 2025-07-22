import { createClient, LiveList, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: "pk_dev_YOUR_PUBLIC_KEY",
});

export type Presence = {
  cursor: { x: number, y: number } | null,
};

export type Storage = {
  layers: LiveList<LiveObject<{
    type: "Rectangle" | "Note" | "Text" | "Path";
    x: number;
    y: number;
    height: number;
    width: number;
    fill: string;
    value?: string;
  }>>,
};

export const {
  suspense: {
    RoomProvider,
    useOthers,
    useSelf,
    useStorage,
    useMutation,
  },
} = createRoomContext<Presence, Storage>(client); 