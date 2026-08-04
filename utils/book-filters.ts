import type { Book, STEP } from "@prisma/client"

/**
 * The bookshelf filters authors can pick from the sidebar. Kept as a small
 * closed set so the sidebar links and the list can never drift apart.
 */
export type BookshelfStatus = "all" | "draft" | "unpublished" | "published"

/** Read a status off the URL, falling back to "all" for anything unknown. */
export function parseBookshelfStatus(raw: string | null | undefined): BookshelfStatus {
  switch (raw) {
    case "draft":
    case "unpublished":
    case "published":
      return raw
    default:
      return "all"
  }
}

/**
 * A book is "published" once it reaches COMPLETE; everything before that is
 * still in progress, and only the outline stage counts as a draft.
 */
export function matchesStatus(step: STEP, status: BookshelfStatus): boolean {
  switch (status) {
    case "draft":
      return step === "OUTLINE"
    case "published":
      return step === "COMPLETE"
    case "unpublished":
      return step !== "COMPLETE"
    case "all":
    default:
      return true
  }
}

type FilterableBook = Pick<Book, "title" | "description" | "step">

export function filterBooks<T extends FilterableBook>(
  books: T[],
  { status = "all", query = "" }: { status?: BookshelfStatus; query?: string } = {},
): T[] {
  const needle = query.trim().toLowerCase()
  return books.filter((book) => {
    if (!matchesStatus(book.step, status)) return false
    if (!needle) return true
    return (
      book.title.toLowerCase().includes(needle) ||
      (book.description ?? "").toLowerCase().includes(needle)
    )
  })
}
