import type { ApplicantProfileView, AttestationRecord } from "@/lib/types";

export interface AttestationEmitter {
  emitSignedProfileExport(view: ApplicantProfileView): Promise<AttestationRecord | null>;
}

export class NoopAttestationEmitter implements AttestationEmitter {
  async emitSignedProfileExport(view: ApplicantProfileView): Promise<AttestationRecord | null> {
    void view;
    return null;
  }
}
