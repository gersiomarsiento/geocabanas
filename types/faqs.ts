// types/faqs.ts
//
// Shared types for the FAQ feature. Import these from both the API routes
// and the admin components so the shapes never drift apart.

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type FaqCreate = {
  question: string;
  answer: string;
};

export type FaqUpdate = {
  question?: string;
  answer?: string;
  sortOrder?: number;
};
