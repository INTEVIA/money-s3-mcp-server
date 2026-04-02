/**
 * GraphQL query strings for warehouse domain:
 * articles, warehouse stocks, warehouses, and in-store documents (slips, transfers).
 */

// ── Article fields ──────────────────────────────────────────────────────────

const ARTICLE_LIST_FIELDS = /* GraphQL */ `
  id
  guid
  description
  shortcut
  note
  mainMeasureUnit
  plu
  catalogue
  barCode
  barCodeType
  articleItemType
  warehouseStockType
  purchaseVatRate
  salesVatRate
  lastChange
`;

const ARTICLE_DETAIL_FIELDS = /* GraphQL */ `
  id
  guid
  description
  shortcut
  note
  mainMeasureUnit
  minorMeasureUnit1
  minorMeasureUnit2
  coefficientMinorMeasureUnit1
  coefficientMinorMeasureUnit2
  plu
  catalogue
  barCode
  barCodeType
  warrantyType
  warranty
  articleItemType
  isRecordSerialNumber
  decimalPlacesMeasureUnit
  warehouseStockType
  vatSpecialRegime
  eetRegime
  purchaseVatRate
  salesVatRate
  vatRateSpecialRegime
  isCheckMinimumQuantity
  isCheckMaximumQuantity
  minimumQuantity
  maximumQuantity
  lastChange
`;

// ── Warehouse stock fields ──────────────────────────────────────────────────

const WAREHOUSE_STOCK_LIST_FIELDS = /* GraphQL */ `
  id
  articleId
  description
  shortCut
  mainMeasureUnit
  plu
  catalogue
  barCode
  warehouseStockType
  stockQuantity
  reserved
  ordered
  purchasePrice
  lastPurchasePrice
  purchaseVatRate
  salesVatRate
  warehouse {
    id
    name
    code
  }
  article {
    id
    guid
    description
    shortcut
  }
`;

const WAREHOUSE_STOCK_DETAIL_FIELDS = /* GraphQL */ `
  id
  articleId
  description
  shortCut
  mainMeasureUnit
  plu
  catalogue
  barCode
  warehouseStockType
  vatSpecialRegime
  eetRegime
  purchaseVatRate
  salesVatRate
  vatRateSpecialRegime
  stockQuantity
  reserved
  ordered
  isCheckMinimumQuantity
  isCheckMaximumQuantity
  minimumQuantity
  maximumQuantity
  purchasePrice
  lastPurchasePrice
  dateLastPurchase
  dateLastSale
  isPermanentSupllier
  isFixedPurchasePrice
  note
  wwwDescription
  purchaseMeasureUnit
  salesMeasureUnit
  warehouse {
    id
    name
    code
    guid
  }
  article {
    id
    guid
    description
    shortcut
    mainMeasureUnit
  }
`;

// ── Warehouse fields ────────────────────────────────────────────────────────

const WAREHOUSE_LIST_FIELDS = /* GraphQL */ `
  id
  guid
  name
  code
  isPreferred
  lastChange
`;

// ── In-store document fields (shared by slips and transfers) ────────────────

const IN_STORE_DOCUMENT_LIST_FIELDS = /* GraphQL */ `
  id
  documentNumber
  description
  orderNumber
  dateOfIssue
  dateOfStockMovement
  note
  totalPurchasePrice
  totalWithVatHc
  variableSymbol
  receivedDocumentNumber
  lastChangeDate
  partnerAddress {
    company { id }
    identificationNumber
    businessAddress { name street municipality }
  }
  numericalSerie { prefix }
  currency { code }
`;

const IN_STORE_DOCUMENT_DETAIL_FIELDS = /* GraphQL */ `
  id
  documentNumber
  description
  orderNumber
  dateOfIssue
  dateOfStockMovement
  note
  phoneNumber
  email
  issuedUser
  invoiceDocumentNumber
  textBeforePrices
  textBehindPrices
  documentTitle
  documentType
  totalPurchasePrice
  totalWithVatHc
  percentageDiscount
  numericalSerieSequence
  variableSymbol
  receivedDocumentNumber
  pairingSymbol
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
    amountUnit
    unitPriceHc
    unitPrice
    vatRate
    purchasePrice
    stockItemType
    weight
    note
    warehouse { id name code }
    article { id guid description shortcut }
  }
`;

// ── Queries ─────────────────────────────────────────────────────────────────

export const LIST_ARTICLES = /* GraphQL */ `
  query ListArticles($skip: Int, $take: Int, $where: IArticleFilterInput, $order: [IArticleSortInput!]) {
    articles(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${ARTICLE_LIST_FIELDS}
      }
    }
  }
`;

export const GET_ARTICLE = /* GraphQL */ `
  query GetArticle($where: IArticleFilterInput) {
    articles(skip: 0, take: 1, where: $where) {
      items {
        ${ARTICLE_DETAIL_FIELDS}
      }
    }
  }
`;

export const LIST_WAREHOUSE_STOCKS = /* GraphQL */ `
  query ListWarehouseStocks($skip: Int, $take: Int, $where: IWarehouseStockFilterInput, $order: [IWarehouseStockSortInput!]) {
    warehouseStocks(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${WAREHOUSE_STOCK_LIST_FIELDS}
      }
    }
  }
`;

export const GET_WAREHOUSE_STOCK = /* GraphQL */ `
  query GetWarehouseStock($where: IWarehouseStockFilterInput) {
    warehouseStocks(skip: 0, take: 1, where: $where) {
      items {
        ${WAREHOUSE_STOCK_DETAIL_FIELDS}
      }
    }
  }
`;

export const LIST_WAREHOUSES = /* GraphQL */ `
  query ListWarehouses($skip: Int, $take: Int, $where: IWarehouseFilterInput, $order: [IWarehouseSortInput!]) {
    warehouses(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${WAREHOUSE_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_RECEIVED_SLIPS = /* GraphQL */ `
  query ListReceivedSlips($skip: Int, $take: Int, $where: IInStoreDocumentFilterInput, $order: [IInStoreDocumentSortInput!]) {
    receivedSlips(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${IN_STORE_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_ISSUED_SLIPS = /* GraphQL */ `
  query ListIssuedSlips($skip: Int, $take: Int, $where: IInStoreDocumentFilterInput, $order: [IInStoreDocumentSortInput!]) {
    issuedSlips(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${IN_STORE_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_SALE_SLIPS = /* GraphQL */ `
  query ListSaleSlips($skip: Int, $take: Int, $where: IInStoreDocumentFilterInput, $order: [IInStoreDocumentSortInput!]) {
    saleSlips(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${IN_STORE_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_TRANSFER_NOTES = /* GraphQL */ `
  query ListTransferNotes($skip: Int, $take: Int, $where: IInStoreDocumentFilterInput, $order: [IInStoreDocumentSortInput!]) {
    transferNotes(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${IN_STORE_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_RECEIVED_DELIVERY_NOTES = /* GraphQL */ `
  query ListReceivedDeliveryNotes($skip: Int, $take: Int, $where: IInStoreDocumentFilterInput, $order: [IInStoreDocumentSortInput!]) {
    receivedDeliveryNotes(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${IN_STORE_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_ISSUED_DELIVERY_NOTES = /* GraphQL */ `
  query ListIssuedDeliveryNotes($skip: Int, $take: Int, $where: IInStoreDocumentFilterInput, $order: [IInStoreDocumentSortInput!]) {
    issuedDeliveryNotes(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        ${IN_STORE_DOCUMENT_LIST_FIELDS}
      }
    }
  }
`;

export const LIST_STOCK_TAKINGS = /* GraphQL */ `
  query ListStockTakings($skip: Int, $take: Int, $where: IStockTakingFilterInput, $order: [IStockTakingSortInput!]) {
    stockTakings(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage }
      items {
        id
        year
        stockTakingNumber
        description
        state
        dateOfStockTaking
      }
    }
  }
`;

/** Detail query for any in-store document type (slips, delivery notes, transfers). */
export const GET_IN_STORE_DOCUMENT = /* GraphQL */ `
  query GetInStoreDocument($skip: Int, $take: Int, $where: IInStoreDocumentFilterInput) {
    receivedSlips(skip: $skip, take: $take, where: $where) {
      items {
        ${IN_STORE_DOCUMENT_DETAIL_FIELDS}
      }
    }
  }
`;
