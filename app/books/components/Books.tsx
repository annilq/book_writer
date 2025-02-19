import Image from "next/image"
import type React from "react" // Import React

function BookCard({ title, metadata, thumbnail }: { title: string; metadata: string; thumbnail: string }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white">
      <div className="aspect-[4/3] overflow-hidden">
        <Image
          src={thumbnail || "/placeholder.svg"}
          alt={title}
          width={400}
          height={300}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{metadata}</p>
      </div>
    </div>
  )
}

export default function Books() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
      <BookCard title="Q4 Sales Deck" metadata="Shared folder • 8 presentations" thumbnail="/placeholder.svg" />
      <BookCard title="Product Videos" metadata="Shared folder • 5 videos" thumbnail="/placeholder.svg" />
      <BookCard title="ROI Calculator" metadata="Shared file • 1 Excel" thumbnail="/placeholder.svg" />
      <BookCard title="ROI Calculator" metadata="Shared file • 1 Excel" thumbnail="/placeholder.svg" />
      <BookCard title="ROI Calculator" metadata="Shared file • 1 Excel" thumbnail="/placeholder.svg" />
      <BookCard title="ROI Calculator" metadata="Shared file • 1 Excel" thumbnail="/placeholder.svg" />
    </div>
  )
}