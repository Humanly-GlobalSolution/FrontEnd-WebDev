import type { ReviewReason } from "@/lib/reviewRequests";

export type ReviewRequestDraft = { crossingCode: string; reason: ReviewReason; comment: string };
export type ReviewRequestEdit = Pick<ReviewRequestDraft, "reason" | "comment">;
export type CreatedReviewRequest = {
  protocol: string;
  crossingCode: string;
  status: "enviado";
  createdAt: string;
};

export type ReviewRequestStatus = "enviado" | "em_analise" | "respondido";
export type ReviewRequestDetails = Omit<CreatedReviewRequest, "status"> & {
  status: ReviewRequestStatus;
  address: string;
  reason: ReviewReason;
  comment: string;
  response?: string;
  reviewedAt?: string;
  answeredAt?: string;
};
