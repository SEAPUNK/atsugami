import uri from "uri-tag";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  PostsListResponse,
  PostsListRequest,
  PostsGetResponse,
  PostsGetParams,
} from "@atsugami/common/types";

const apiBaseUrl = new URL("/api/", window.location.href);

export const atsugamiApi = createApi({
  reducerPath: "atsugamiApi",
  baseQuery: fetchBaseQuery({ baseUrl: apiBaseUrl.toString() }),
  endpoints: (builder) => ({
    postsList: builder.query<PostsListResponse, PostsListRequest>({
      query: (request) => ({
        url: "posts/list",
        method: "POST",
        body: request,
      }),
      transformResponse: (response) => PostsListResponse.parse(response),
    }),
    postsGet: builder.query<PostsGetResponse, PostsGetParams>({
      query: ({ id }) => uri`posts/get/${id}`,
      transformResponse: (response) => PostsGetResponse.parse(response),
    }),
  }),
});
