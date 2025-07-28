"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRoom } from "@/lib/liveblocks";
import { useOrigin } from "@/hooks/use-origin";

export const InviteButton = () => {
  const { id: roomId } = useRoom();
  const origin = useOrigin();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const inviteUrl = `${origin}/invite/${inviteCode}`;

  const onCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const onNew = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${roomId}/invite-code`, {
        method: "POST",
      });
      const { code } = await res.json();
      setInviteCode(code);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Invite</Button>
      </DialogTrigger>
      <DialogContent className="p-4 bg-white border-none max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite link</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {inviteCode && (
            <div className="flex items-center gap-x-2">
              <Input
                value={inviteUrl}
                disabled
                className="flex-1 h-8 bg-muted"
              />
              <Button onClick={onCopy} size="sm">
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
          <Button
            onClick={onNew}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="w-full mt-2"
          >
            {loading ? "Generating..." : "Generate new link"}
            <RefreshCw className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 