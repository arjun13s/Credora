import type { RecursivePartial } from "@/lib/api-contracts";
import type { ApplicantProfileInput } from "@/lib/types";

function mergeArray<T>(incoming: T[] | undefined, current: T[]): T[] {
  return Array.isArray(incoming) ? incoming : current;
}

export function mergeApplicantProfileInput(
  current: ApplicantProfileInput,
  patch: RecursivePartial<ApplicantProfileInput>,
): ApplicantProfileInput {
  return {
    useCase: patch.useCase ?? current.useCase,
    personalInformation: {
      ...current.personalInformation,
      ...patch.personalInformation,
    },
    identityVerification: {
      ...current.identityVerification,
      ...patch.identityVerification,
      governmentIdFileNames: mergeArray(
        patch.identityVerification?.governmentIdFileNames,
        current.identityVerification.governmentIdFileNames,
      ),
    },
    employmentIncome: {
      ...current.employmentIncome,
      ...patch.employmentIncome,
      payStubFileNames: mergeArray(
        patch.employmentIncome?.payStubFileNames,
        current.employmentIncome.payStubFileNames,
      ),
      contractDocumentFileNames: mergeArray(
        patch.employmentIncome?.contractDocumentFileNames,
        current.employmentIncome.contractDocumentFileNames,
      ),
    },
    housingHistory: {
      ...current.housingHistory,
      ...patch.housingHistory,
      leaseFileNames: mergeArray(
        patch.housingHistory?.leaseFileNames,
        current.housingHistory.leaseFileNames,
      ),
      rentLedgerFileNames: mergeArray(
        patch.housingHistory?.rentLedgerFileNames,
        current.housingHistory.rentLedgerFileNames,
      ),
      receiptsFileNames: mergeArray(
        patch.housingHistory?.receiptsFileNames,
        current.housingHistory.receiptsFileNames,
      ),
    },
    financialStability: {
      ...current.financialStability,
      ...patch.financialStability,
    },
    supportingDocuments: {
      ...current.supportingDocuments,
      ...patch.supportingDocuments,
      additionalFileNames: mergeArray(
        patch.supportingDocuments?.additionalFileNames,
        current.supportingDocuments.additionalFileNames,
      ),
    },
    consents: {
      ...current.consents,
      ...patch.consents,
    },
  };
}
