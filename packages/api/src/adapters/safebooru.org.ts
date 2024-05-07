import { extname, basename } from "node:path";
import { z } from "zod";
import * as htmlEntities from "html-entities";
import {
  PostsListRequest,
  PostsListResponse,
  PostsGetParams,
  Post,
  PostRating,
} from "../types";
import { fileProxyUrl } from "../proxy";

const LIST_LIMIT_MAX = 100;

const ExternalPost = z.object({
  id: z.coerce.string(),
  rating: z.string(),
  tags: z.string(),
  height: z.coerce.number().positive(),
  width: z.coerce.number().positive(),
  score: z.coerce.number(),

  directory: z.string(),
  image: z.string(),
});
const ExternalPostsListResponse = z.nullable(z.array(ExternalPost));

function endpoint(path: string): string {
  return `https://safebooru.org/${path}`;
}

function postViewUrl(id: string): string {
  return `https://safebooru.org/index.php?page=post&s=view&id=${id}`;
}

function toImageUrl(id: string, image: string, directory: string): string {
  return `https://safebooru.org/images/${directory}/${image}?${id}`;
}

function toThumbnailUrl(id: string, image: string, directory: string): string {
  const ext = extname(image);
  const base = basename(image, ext);
  return `https://safebooru.org/thumbnails/${directory}/thumbnail_${base}.jpg?${id}`;
}

function normalizeRating(rawRating: string): PostRating {
  const result = PostRating.safeParse(rawRating);
  if (result.success) return result.data;
  // TODO: logging
  console.warn(`[safebooru.org] unknown rating: ${rawRating}`);
  return "explicit";
}

function normalizeTags(rawTags: string): string[] {
  // tags may contain empties and duplicates
  const rawTagList = htmlEntities
    .decode(rawTags)
    .split(" ")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")
    // we also want the tags sorted
    .sort((a, b) => a.localeCompare(b));
  return [...new Set(rawTagList)];
}

export async function postsList(
  listRequest: PostsListRequest,
): Promise<PostsListResponse> {
  const urlParams = new URLSearchParams();
  urlParams.set("page", "dapi");
  urlParams.set("s", "post");
  urlParams.set("q", "index");
  urlParams.set("json", "1");

  if (listRequest.limit != null) {
    if (listRequest.limit > LIST_LIMIT_MAX) {
      // TODO: logging; exposing all the different adapters and their info
      throw new Error(
        `Post limit (${listRequest.limit}) higher than max (${LIST_LIMIT_MAX})`,
      );
    }
    urlParams.set("limit", String(listRequest.limit));
  }

  let pageNum = 0;
  if (listRequest.after != null) {
    const afterNum = +listRequest.after;
    if (!Number.isNaN(afterNum) && afterNum >= 0) {
      pageNum = afterNum;
    }
  }
  urlParams.set("pid", String(pageNum));

  if (listRequest.tags != null) {
    urlParams.set("tags", listRequest.tags.join(" "));
  }

  const url = endpoint(`index.php?${urlParams.toString()}`);
  const res = await fetch(url);
  const rawData = await res.json();
  // TODO: logging when parsing fails
  const data = ExternalPostsListResponse.parse(rawData);

  if (data == null) {
    return {
      nextKey: null,
      posts: [],
    };
  }

  const posts = data.map((item, idx) => {
    const imageUrl = toImageUrl(item.id, item.image, item.directory);
    const previewUrl = toImageUrl(item.id, item.image, item.directory);

    return {
      id: item.id,

      file_url: fileProxyUrl(imageUrl),
      preview_url: fileProxyUrl(previewUrl),
      post_url: postViewUrl(item.id),
      save_url: fileProxyUrl(imageUrl, true),
      unproxied_file_url: imageUrl,
      extension: extname(item.image),
      // safebooru doesn't provide sources,
      // they just downstream from other boorus
      source_url: "",

      rating: normalizeRating(item.rating),
      height: item.height,
      width: item.width,
      score: item.score,

      tags: normalizeTags(item.tags),

      _data: rawData[idx],
    };
  });

  return {
    nextKey: posts.length ? String(pageNum + 1) : null,
    posts,
  };
}

// HACK: There is no existing controller for getting a specific post,
// so we piggy-back on top of the post list functionality
export async function postsGet(
  params: PostsGetParams,
): Promise<undefined | Post> {
  const posts = await postsList({ tags: [`id:${params.id}`], limit: 1 });
  return posts.posts[0];
}
