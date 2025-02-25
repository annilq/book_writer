import { NextRequest } from "next/server";
import { createBook } from "./actions";
import { appResponse } from "@/utils/response";

export const runtime = "edge";


export async function POST(req: NextRequest) {
  return appResponse(async () => {
    const body = await req.json();
    const model = body.model;
    const title = body.title;
    const id = body.id;
    const categories = body.categories;
    const description = body.description;

    const book = await createBook({ id, model, title, description, categories })

    return book;
  });

}
