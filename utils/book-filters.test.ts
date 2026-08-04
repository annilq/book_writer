import { describe, expect, it } from "vitest"

import { filterBooks, matchesStatus, parseBookshelfStatus } from "./book-filters"

type TestBook = { title: string; description: string | null; step: "OUTLINE" | "CHAPTER" | "COMPLETE" }

const books: TestBook[] = [
  { title: "Roman Roads", description: "How the empire moved", step: "OUTLINE" },
  { title: "Teaching Kids to Code", description: "A practical guide", step: "CHAPTER" },
  { title: "The Salt Trade", description: null, step: "COMPLETE" },
]

describe("parseBookshelfStatus", () => {
  it("accepts the known statuses", () => {
    expect(parseBookshelfStatus("draft")).toBe("draft")
    expect(parseBookshelfStatus("unpublished")).toBe("unpublished")
    expect(parseBookshelfStatus("published")).toBe("published")
  })

  it("falls back to all for anything else", () => {
    expect(parseBookshelfStatus(null)).toBe("all")
    expect(parseBookshelfStatus(undefined)).toBe("all")
    expect(parseBookshelfStatus("")).toBe("all")
    expect(parseBookshelfStatus("nonsense")).toBe("all")
  })
})

describe("matchesStatus", () => {
  it("treats only COMPLETE as published", () => {
    expect(matchesStatus("COMPLETE", "published")).toBe(true)
    expect(matchesStatus("CHAPTER", "published")).toBe(false)
    expect(matchesStatus("OUTLINE", "published")).toBe(false)
  })

  it("treats everything before COMPLETE as unpublished", () => {
    expect(matchesStatus("OUTLINE", "unpublished")).toBe(true)
    expect(matchesStatus("CHAPTER", "unpublished")).toBe(true)
    expect(matchesStatus("COMPLETE", "unpublished")).toBe(false)
  })

  it("treats only the outline stage as a draft", () => {
    expect(matchesStatus("OUTLINE", "draft")).toBe(true)
    expect(matchesStatus("CHAPTER", "draft")).toBe(false)
  })
})

describe("filterBooks", () => {
  it("returns everything by default", () => {
    expect(filterBooks(books)).toHaveLength(3)
  })

  it("filters by status", () => {
    expect(filterBooks(books, { status: "published" }).map((b) => b.title)).toEqual(["The Salt Trade"])
    expect(filterBooks(books, { status: "unpublished" })).toHaveLength(2)
  })

  it("matches the query against title and description, case-insensitively", () => {
    expect(filterBooks(books, { query: "roman" }).map((b) => b.title)).toEqual(["Roman Roads"])
    expect(filterBooks(books, { query: "PRACTICAL" }).map((b) => b.title)).toEqual([
      "Teaching Kids to Code",
    ])
  })

  it("tolerates a missing description", () => {
    expect(filterBooks(books, { query: "salt" }).map((b) => b.title)).toEqual(["The Salt Trade"])
  })

  it("ignores surrounding whitespace in the query", () => {
    expect(filterBooks(books, { query: "   " })).toHaveLength(3)
    expect(filterBooks(books, { query: "  roman  " })).toHaveLength(1)
  })

  it("combines status and query", () => {
    expect(filterBooks(books, { status: "draft", query: "roman" })).toHaveLength(1)
    expect(filterBooks(books, { status: "published", query: "roman" })).toHaveLength(0)
  })
})
