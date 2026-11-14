import type { Perfil } from "@/lib/regras";
import type { ReviewReason } from "@/lib/reviewRequests";

export type ReviewRequestDraft = { crossingCode: string; reason: ReviewReason; perfil: Perfil; comment: string };
export type ReviewRequestEdit = Pick<ReviewRequestDraft, "reason" | "perfil" | "comment">;
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
  perfil: Perfil;
  reason: ReviewReason;
  comment: string;
  response?: string;
  updatedAt: string;
};
