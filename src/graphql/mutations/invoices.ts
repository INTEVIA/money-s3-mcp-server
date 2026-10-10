/**
 * GraphQL mutations for issued and received invoices.
 */

// ---------------------------------------------------------------------------
// Issued Invoices
// ---------------------------------------------------------------------------

export const CREATE_ISSUED_INVOICE = /* GraphQL */ `
  mutation CreateIssuedInvoice($issuedInvoice: IssuedInvoiceInput!) {
    createIssuedInvoice(issuedInvoice: $issuedInvoice) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ISSUED_INVOICE = /* GraphQL */ `
  mutation UpdateIssuedInvoice($issuedInvoice: UpdateIssuedInvoice!) {
    updateIssuedInvoice(issuedInvoice: $issuedInvoice) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ISSUED_INVOICE = /* GraphQL */ `
  mutation DeleteIssuedInvoice($issuedInvoice: DeleteIssuedInvoice!) {
    deleteIssuedInvoice(issuedInvoice: $issuedInvoice) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// Received Invoices
// ---------------------------------------------------------------------------

export const CREATE_RECEIVED_INVOICE = /* GraphQL */ `
  mutation CreateReceivedInvoice($receivedInvoice: ReceivedInvoiceInput!) {
    createReceivedInvoice(receivedInvoice: $receivedInvoice) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_RECEIVED_INVOICE = /* GraphQL */ `
  mutation UpdateReceivedInvoice($receivedInvoice: UpdateReceivedInvoice!) {
    updateReceivedInvoice(receivedInvoice: $receivedInvoice) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_RECEIVED_INVOICE = /* GraphQL */ `
  mutation DeleteReceivedInvoice($receivedInvoice: DeleteReceivedInvoice!) {
    deleteReceivedInvoice(receivedInvoice: $receivedInvoice) {
      guid
      isSuccess
    }
  }
`;
