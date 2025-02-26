"use client"

import type React from "react"

import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SettingsModal() {
  const [open, setOpen] = useState(false)

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    // TODO: Implement settings save logic
    console.log("Saving settings...")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="absolute bottom-0 left-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Generation Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="genre" className="text-right">
                Genre
              </Label>
              <Input id="genre" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="length" className="text-right">
                Length
              </Label>
              <Input id="length" className="col-span-3" type="number" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="style" className="text-right">
                Writing Style
              </Label>
              <Input id="style" className="col-span-3" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

