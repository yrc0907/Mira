"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";

interface InfoProps {
  boardTitle: string;
}

export function Info({ boardTitle }: InfoProps) {
  return (
    <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md z-10">
      <Button asChild variant="ghost" className="px-2">
        <Link href="/dashboard" className="flex items-center">
          <span className="font-bold text-lg hidden md:block">Board</span>
        </Link>
      </Button>
      <div className="text-neutral-300 mx-2 hidden sm:block">|</div>
      <h1 className="text-base font-semibold truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">{boardTitle}</h1>
      <div className="text-neutral-300 mx-2 hidden sm:block">|</div>
      <Button variant="ghost" size="icon" className="h-auto w-auto p-2">
        <Menu className="h-4 w-4" />
      </Button>
    </div>
  );
} 