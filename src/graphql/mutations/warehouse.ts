/**
 * GraphQL mutation strings for warehouse domain:
 * articles, warehouse stocks, and in-store documents (slips, transfers).
 */

export const CREATE_ARTICLE = /* GraphQL */ `
  mutation CreateArticle($article: ArticleInput!) {
    createArticle(article: $article) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ARTICLE = /* GraphQL */ `
  mutation UpdateArticle($article: UpdateArticle!) {
    updateArticle(article: $article) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ARTICLE = /* GraphQL */ `
  mutation DeleteArticle($article: DeleteArticle!) {
    deleteArticle(article: $article) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_WAREHOUSE_STOCK = /* GraphQL */ `
  mutation CreateWarehouseStock($warehouseStock: WarehouseStockInput!) {
    createWarehouseStock(warehouseStock: $warehouseStock) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_WAREHOUSE_STOCK = /* GraphQL */ `
  mutation UpdateWarehouseStock($warehouseStock: UpdateWarehouseStock!) {
    updateWarehouseStock(warehouseStock: $warehouseStock) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_WAREHOUSE_STOCK = /* GraphQL */ `
  mutation DeleteWarehouseStock($warehouseStock: DeleteWarehouseStock!) {
    deleteWarehouseStock(warehouseStock: $warehouseStock) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_RECEIVED_SLIP = /* GraphQL */ `
  mutation CreateReceivedSlip($receivedSlip: InStoreDocumentInput!) {
    createReceivedSlip(receivedSlip: $receivedSlip) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_ISSUED_SLIP = /* GraphQL */ `
  mutation CreateIssuedSlip($issuedSlip: InStoreDocumentInput!) {
    createIssuedSlip(issuedSlip: $issuedSlip) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_SALE_SLIP = /* GraphQL */ `
  mutation CreateSaleSlip($saleSlip: InStoreDocumentInput!) {
    createSaleSlip(saleSlip: $saleSlip) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_TRANSFER_NOTE = /* GraphQL */ `
  mutation CreateTransferNote($transferNote: InStoreDocumentInput!) {
    createTransferNote(transferNote: $transferNote) {
      guid
      isSuccess
    }
  }
`;

// --- In-store document updates (UpdateInStoreDocument) ---

export const UPDATE_RECEIVED_SLIP = /* GraphQL */ `
  mutation UpdateReceivedSlip($receivedSlip: UpdateInStoreDocument!) {
    updateReceivedSlip(receivedSlip: $receivedSlip) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ISSUED_SLIP = /* GraphQL */ `
  mutation UpdateIssuedSlip($issuedSlip: UpdateInStoreDocument!) {
    updateIssuedSlip(issuedSlip: $issuedSlip) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_SALE_SLIP = /* GraphQL */ `
  mutation UpdateSaleSlip($saleSlip: UpdateInStoreDocument!) {
    updateSaleSlip(saleSlip: $saleSlip) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_TRANSFER_NOTE = /* GraphQL */ `
  mutation UpdateTransferNote($transferNote: UpdateInStoreDocument!) {
    updateTransferNote(transferNote: $transferNote) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_RECEIVED_DELIVERY_NOTE = /* GraphQL */ `
  mutation UpdateReceivedDeliveryNote($receivedDeliveryNote: UpdateInStoreDocument!) {
    updateReceivedDeliveryNote(receivedDeliveryNote: $receivedDeliveryNote) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ISSUED_DELIVERY_NOTE = /* GraphQL */ `
  mutation UpdateIssuedDeliveryNote($issuedDeliveryNote: UpdateInStoreDocument!) {
    updateIssuedDeliveryNote(issuedDeliveryNote: $issuedDeliveryNote) {
      guid
      isSuccess
    }
  }
`;

// --- In-store document deletes (DeleteInStoreDocument) ---

export const DELETE_RECEIVED_SLIP = /* GraphQL */ `
  mutation DeleteReceivedSlip($receivedSlip: DeleteInStoreDocument!) {
    deleteReceivedSlip(receivedSlip: $receivedSlip) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ISSUED_SLIP = /* GraphQL */ `
  mutation DeleteIssuedSlip($issuedSlip: DeleteInStoreDocument!) {
    deleteIssuedSlip(issuedSlip: $issuedSlip) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_SALE_SLIP = /* GraphQL */ `
  mutation DeleteSaleSlip($saleSlip: DeleteInStoreDocument!) {
    deleteSaleSlip(saleSlip: $saleSlip) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_TRANSFER_NOTE = /* GraphQL */ `
  mutation DeleteTransferNote($transferNote: DeleteInStoreDocument!) {
    deleteTransferNote(transferNote: $transferNote) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_RECEIVED_DELIVERY_NOTE = /* GraphQL */ `
  mutation DeleteReceivedDeliveryNote($receivedDeliveryNote: DeleteInStoreDocument!) {
    deleteReceivedDeliveryNote(receivedDeliveryNote: $receivedDeliveryNote) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ISSUED_DELIVERY_NOTE = /* GraphQL */ `
  mutation DeleteIssuedDeliveryNote($issuedDeliveryNote: DeleteInStoreDocument!) {
    deleteIssuedDeliveryNote(issuedDeliveryNote: $issuedDeliveryNote) {
      guid
      isSuccess
    }
  }
`;

// --- Delivery note creates (InStoreDocumentInput) ---

export const CREATE_RECEIVED_DELIVERY_NOTE = /* GraphQL */ `
  mutation CreateReceivedDeliveryNote($receivedDeliveryNote: InStoreDocumentInput!) {
    createReceivedDeliveryNote(receivedDeliveryNote: $receivedDeliveryNote) {
      guid
      isSuccess
    }
  }
`;

export const CREATE_ISSUED_DELIVERY_NOTE = /* GraphQL */ `
  mutation CreateIssuedDeliveryNote($issuedDeliveryNote: InStoreDocumentInput!) {
    createIssuedDeliveryNote(issuedDeliveryNote: $issuedDeliveryNote) {
      guid
      isSuccess
    }
  }
`;

// --- Stock taking document CRUD ---

export const CREATE_STOCK_TAKING_DOCUMENT = /* GraphQL */ `
  mutation CreateStockTakingDocument($stockTakingDocument: StockTakingDocumentInput!) {
    createStockTakingDocument(stockTakingDocument: $stockTakingDocument) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_STOCK_TAKING_DOCUMENT = /* GraphQL */ `
  mutation UpdateStockTakingDocument($stockTakingDocument: UpdateStockTakingDocument!) {
    updateStockTakingDocument(stockTakingDocument: $stockTakingDocument) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_STOCK_TAKING_DOCUMENT = /* GraphQL */ `
  mutation DeleteStockTakingDocument($stockTakingDocument: DeleteStockTakingDocument!) {
    deleteStockTakingDocument(stockTakingDocument: $stockTakingDocument) {
      guid
      isSuccess
    }
  }
`;
