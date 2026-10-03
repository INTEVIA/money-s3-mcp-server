/**
 * GraphQL query strings for order domain:
 * orders, offers, and inquiries (received + issued).
 */

// ── Order document fields (shared across all order document types) ──────────

const ORDER_DOCUMENT_LIST_FIELDS = /* GraphQL */ `
  id
  type
  documentNumber
  description
  dateOfIssue
  dateOfSettleBy
  dateOfSettled
  dateOfSettleFirst
  note
  totalWithVatHc
  totalWithVat
  variableSymbol
  receivedDocumentNumber
  paymentMethod
  shippingMethod
  percentageDiscount
  lastChangeDate
  partnerAddress {
    company { id }
    identificationNumber
    businessAddress { name street municipality }
  }
  numericalSerie { prefix }
  currency { code }
`;

const ORDER_DOCUMENT_DETAIL_FIELDS = /* GraphQL */ `
  id
  type
  documentNumber
  description
  dateOfIssue
  dateOfSettleBy
  dateOfSettled
  dateOfSettleFirst
  note
  phoneNumber
  email
  issuedUser
  textBeforePrices
  textBehindPrices
  documentTitle
  documentType
  totalWithVatHc
  totalWithVat
  percentageDiscount
  numericalSerieSequence
  isNotReserved
  isFixedPrices
  paymentMethod
  shippingMethod
  variableSymbol
  receivedDocumentNumber
  barCode
  lastChangeDate
  lastChangeTime
  partnerAddress {
    company { id }
    identificationNumber
    vatIdentificationNumber
    businessAddress { name street municipality postalCode country }
  }
  deliveryAddress {
    address { name street municipality postalCode country }
  }
  numericalSerie { prefix }
  currency { code }
  centre { shortCut name }
  jobOrder { shortCut name }
  operation { shortCut name }
  items {
    description
    note
    amount
    remainAmount
    unitPriceHc
    unitPrice
    vatRate
    priceType
    discountPercentage
    estimatedPurchasePrice
    dateOfSettleFirst
    dateOfSettleBy
    amountUnit
    shortCut
    catalogue
    barCode
    warehouse { id name code }
    article { id guid description shortcut }
  }
`;

// ── Queries ─────────────────────────────────────────────────────────────────

export const LIST_RECEIVED_ORDERS = /* GraphQL */ `
  query ListReceivedOrders($skip: Int, $take: Int, $where: IOrderDocumentFilterInput, $order: [IOrderDocumentSortInput!]) {
    receivedOrders(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ORDER_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_ISSUED_ORDERS = /* GraphQL */ `
  query ListIssuedOrders($skip: Int, $take: Int, $where: IOrderDocumentFilterInput, $order: [IOrderDocumentSortInput!]) {
    issuedOrders(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ORDER_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_RECEIVED_OFFERS = /* GraphQL */ `
  query ListReceivedOffers($skip: Int, $take: Int, $where: IOrderDocumentFilterInput, $order: [IOrderDocumentSortInput!]) {
    receivedOffers(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ORDER_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_ISSUED_OFFERS = /* GraphQL */ `
  query ListIssuedOffers($skip: Int, $take: Int, $where: IOrderDocumentFilterInput, $order: [IOrderDocumentSortInput!]) {
    issuedOffers(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ORDER_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_RECEIVED_INQUIRIES = /* GraphQL */ `
  query ListReceivedInquiries($skip: Int, $take: Int, $where: IOrderDocumentFilterInput, $order: [IOrderDocumentSortInput!]) {
    receivedInquiries(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ORDER_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_ISSUED_INQUIRIES = /* GraphQL */ `
  query ListIssuedInquiries($skip: Int, $take: Int, $where: IOrderDocumentFilterInput, $order: [IOrderDocumentSortInput!]) {
    issuedInquiries(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ORDER_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_SERVICES = /* GraphQL */ `
  query ListServices($skip: Int, $take: Int, $where: IOrderDocumentFilterInput, $order: [IOrderDocumentSortInput!]) {
    services(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ORDER_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_REPAIRS = /* GraphQL */ `
  query ListRepairs($skip: Int, $take: Int, $where: IOrderDocumentFilterInput, $order: [IOrderDocumentSortInput!]) {
    repairs(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ORDER_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;
