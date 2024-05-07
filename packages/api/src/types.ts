import { z } from "zod";

export const PostRating = z.enum([
  "general",
  "safe",
  "sensitive",
  "questionable",
  "explicit",
]);
export type PostRating = z.infer<typeof PostRating>;

export const Post = z.object({
  id: z.string(),

  file_url: z.string(),
  preview_url: z.string(),
  post_url: z.string(),
  unproxied_file_url: z.string(),
  save_url: z.string(),
  source_url: z.string(),
  extension: z.string(),

  rating: PostRating,
  height: z.number(),
  width: z.number(),
  tags: z.array(z.string()),
  score: z.number().int(),

  _data: z.any(),
});
export type Post = z.infer<typeof Post>;

export const PostsListRequest = z.object({
  limit: z.optional(z.number().int().positive()),
  tags: z.optional(z.array(z.string())),
  after: z.optional(z.string()),
});
export type PostsListRequest = z.infer<typeof PostsListRequest>;

export const PostsListResponse = z.object({
  nextKey: z.nullable(z.string()),
  posts: z.array(Post),
});
export type PostsListResponse = z.infer<typeof PostsListResponse>;

export const PostsGetParams = z.object({
  id: z.string(),
});
export type PostsGetParams = z.infer<typeof PostsGetParams>;

export const PostsGetResponse = Post;
export type PostsGetResponse = z.infer<typeof PostsGetResponse>;

export const ProxyParams = z.object({
  encodedUrl: z.string(),
  encodedIv: z.string(),
  save: z.optional(z.string()),
});
