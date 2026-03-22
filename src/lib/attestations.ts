import type {
  ApplicantProfileView,
  AttestationRecord,
  PublishedSnapshotView,
} from "@/lib/types";

export interface AttestationEmitter {
  emitSignedProfileExport(view: ApplicantProfileView): Promise<AttestationRecord | null>;
  emitPublishedSnapshotAttestation(
    snapshot: PublishedSnapshotView,
  ): Promise<AttestationRecord | null>;
}

export class NoopAttestationEmitter implements AttestationEmitter {
  async emitSignedProfileExport(view: ApplicantProfileView): Promise<AttestationRecord | null> {
    void view;
    return null;
  }

  async emitPublishedSnapshotAttestation(
    snapshot: PublishedSnapshotView,
  ): Promise<AttestationRecord | null> {
    void snapshot;
    return null;
  }
}
