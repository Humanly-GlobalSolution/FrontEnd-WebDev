import type { ReviewReason } from "@/lib/reviewRequests";

export type ReviewRequestDraft = { crossingCode: string; reason: ReviewReason; comment: string };
export type CreatedReviewRequest = {
  protocol: string;
  crossingCode: string;
  status: "enviado";
  createdAt: string;
};
