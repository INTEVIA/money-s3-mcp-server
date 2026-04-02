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
