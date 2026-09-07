/** Shared importStatus query — used by both import-poller and import-status tool. */
export const IMPORT_STATUS_QUERY = /* GraphQL */ `
  query ImportStatus($importGuid: UUID!) {
    importStatus(importGuid: $importGuid) {
      guid
      state
      stateInfo
    }
  }
`;
