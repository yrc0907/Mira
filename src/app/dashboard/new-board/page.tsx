import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function NewBoardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl h-full">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to boards
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create new board</CardTitle>
          <CardDescription>Create a new board for your team to collaborate on.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="board-name">Board name</Label>
                <Input id="board-name" placeholder="Enter board name" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="board-description">Description (optional)</Label>
                <textarea
                  id="board-description"
                  placeholder="Add a description for your board"
                  className="min-h-[100px] resize-y w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <Button>
            Create board
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 