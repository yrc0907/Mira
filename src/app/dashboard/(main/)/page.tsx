"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'

interface Board {
  id: string
  title: string
  coverImage: string
}

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBoards = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/boards')
        if (!response.ok) {
          throw new Error('Failed to fetch boards')
        }
        const data = await response.json()
        setBoards(data)
      } catch (error) {
        console.error('Error fetching boards:', error)
        toast({
          title: 'Error',
          description: 'Could not fetch your boards. Please try again later.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoards()
  }, [toast])

  return (
    <div className="container mx-auto px-4 py-8 h-full">
      <h1 className="text-2xl font-bold mb-6">Team boards</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading boards...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* New Board Card */}
          <Link href="/board/new">
            <Card className="h-full cursor-pointer border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors group">
              <CardContent className="flex flex-col items-center justify-center h-[240px] p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4 text-center">New board</CardTitle>
              </CardContent>
            </Card>
          </Link>

          {/* Existing Boards */}
          {boards.map((board) => (
            <Link href={`/dashboard/board/${board.id}`} key={board.id}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary/20">
                <CardContent className="p-0 overflow-hidden">
                  <div className="h-[180px] relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                    <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                      {board.coverImage ? (
                        <Image
                          src={board.coverImage}
                          alt={board.title}
                          fill
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <span className="text-xl font-medium text-primary/60">{board.title.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <CardTitle className="text-center truncate">{board.title}</CardTitle>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
