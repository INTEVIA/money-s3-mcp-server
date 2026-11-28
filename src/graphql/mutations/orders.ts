/**
 * GraphQL mutation strings for order domain:
 * orders, offers, and inquiries (received + issued).
 */

// ── Orders ──────────────────────────────────────────────────────────────────

export const CREATE_RECEIVED_ORDER = /* GraphQL */ `
  mutation CreateReceivedOrder($receivedOrder: ReceivedOrderInput!) {
    createReceivedOrder(receivedOrder: $receivedOrder) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_RECEIVED_ORDER = /* GraphQL */ `
  mutation UpdateReceivedOrder($receivedOrder: UpdateReceivedOrder!) {
    updateReceivedOrder(receivedOrder: $receivedOrder) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_RECEIVED_ORDER = /* GraphQL */ `
  mutation DeleteReceivedOrder($receivedOrder: DeleteReceivedOrder!) {
    deleteReceivedOrder(receivedOrder: $receivedOrder) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_ISSUED_ORDER = /* GraphQL */ `
  mutation CreateIssuedOrder($issuedOrder: IssuedOrderInput!) {
    createIssuedOrder(issuedOrder: $issuedOrder) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ISSUED_ORDER = /* GraphQL */ `
  mutation UpdateIssuedOrder($issuedOrder: UpdateIssuedOrder!) {
    updateIssuedOrder(issuedOrder: $issuedOrder) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ISSUED_ORDER = /* GraphQL */ `
  mutation DeleteIssuedOrder($issuedOrder: DeleteIssuedOrder!) {
    deleteIssuedOrder(issuedOrder: $issuedOrder) {
      guid
      isSuccess
    }
  }
`;

// ── Offers ──────────────────────────────────────────────────────────────────

export const CREATE_RECEIVED_OFFER = /* GraphQL */ `
  mutation CreateReceivedOffer($receivedOffer: ReceivedOfferInput!) {
    createReceivedOffer(receivedOffer: $receivedOffer) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_RECEIVED_OFFER = /* GraphQL */ `
  mutation UpdateReceivedOffer($receivedOffer: UpdateReceivedOffer!) {
    updateReceivedOffer(receivedOffer: $receivedOffer) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_RECEIVED_OFFER = /* GraphQL */ `
  mutation DeleteReceivedOffer($receivedOffer: DeleteReceivedOffer!) {
    deleteReceivedOffer(receivedOffer: $receivedOffer) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_ISSUED_OFFER = /* GraphQL */ `
  mutation CreateIssuedOffer($issuedOffer: IssuedOfferInput!) {
    createIssuedOffer(issuedOffer: $issuedOffer) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ISSUED_OFFER = /* GraphQL */ `
  mutation UpdateIssuedOffer($issuedOffer: UpdateIssuedOffer!) {
    updateIssuedOffer(issuedOffer: $issuedOffer) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ISSUED_OFFER = /* GraphQL */ `
  mutation DeleteIssuedOffer($issuedOffer: DeleteIssuedOffer!) {
    deleteIssuedOffer(issuedOffer: $issuedOffer) {
      guid
      isSuccess
    }
  }
`;

// ── Inquiries ───────────────────────────────────────────────────────────────

export const CREATE_RECEIVED_INQUIRY = /* GraphQL */ `
  mutation CreateReceivedInquiry($receivedInquiry: ReceivedInquiryInput!) {
    createReceivedInquiry(receivedInquiry: $receivedInquiry) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_RECEIVED_INQUIRY = /* GraphQL */ `
  mutation UpdateReceivedInquiry($receivedInquiry: UpdateReceivedInquiry!) {
    updateReceivedInquiry(receivedInquiry: $receivedInquiry) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_RECEIVED_INQUIRY = /* GraphQL */ `
  mutation DeleteReceivedInquiry($receivedInquiry: DeleteReceivedInquiry!) {
    deleteReceivedInquiry(receivedInquiry: $receivedInquiry) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_ISSUED_INQUIRY = /* GraphQL */ `
  mutation CreateIssuedInquiry($issuedInquiry: IssuedInquiryInput!) {
    createIssuedInquiry(issuedInquiry: $issuedInquiry) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ISSUED_INQUIRY = /* GraphQL */ `
  mutation UpdateIssuedInquiry($issuedInquiry: UpdateIssuedInquiry!) {
    updateIssuedInquiry(issuedInquiry: $issuedInquiry) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ISSUED_INQUIRY = /* GraphQL */ `
  mutation DeleteIssuedInquiry($issuedInquiry: DeleteIssuedInquiry!) {
    deleteIssuedInquiry(issuedInquiry: $issuedInquiry) {
      guid
      isSuccess
    }
  }
`;
