import { Category, Comment, CommentLike, CommunityPost, Faculty, PostLike, User } from "@prisma/client";

export type PostWithDetails = CommunityPost & {
  author: User;
  faculty: Faculty;
  category: Category | null;
  likes: PostLike[];
  comments: (Comment & {
    author: User;
    likes: CommentLike[];
  })[];
  _count: {
    comments: number;
    likes: number;
  };
};

export type CommentWithReplies = Comment & {
  author: User;
  likes: CommentLike[];
  replies?: CommentWithReplies[];
};
