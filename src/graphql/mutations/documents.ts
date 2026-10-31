/**
 * GraphQL mutations for financial documents:
 * cash vouchers, bank statements, internal documents, liabilities, receivables.
 */

// ---------------------------------------------------------------------------
// Cash Vouchers
// ---------------------------------------------------------------------------

export const CREATE_CASH_VOUCHER = /* GraphQL */ `
  mutation CreateCashVoucher($cashVoucher: CashVoucherInput!) {
    createCashVoucher(cashVoucher: $cashVoucher) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_CASH_VOUCHER = /* GraphQL */ `
  mutation UpdateCashVoucher($cashVoucher: UpdateCashVoucher!) {
    updateCashVoucher(cashVoucher: $cashVoucher) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_CASH_VOUCHER = /* GraphQL */ `
  mutation DeleteCashVoucher($cashVoucher: DeleteCashVoucher!) {
    deleteCashVoucher(cashVoucher: $cashVoucher) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// Bank Statements
// ---------------------------------------------------------------------------

export const CREATE_BANK_STATEMENT = /* GraphQL */ `
  mutation CreateBankStatement($bankStatement: BankStatementInput!) {
    createBankStatement(bankStatement: $bankStatement) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_BANK_STATEMENT = /* GraphQL */ `
  mutation UpdateBankStatement($bankStatement: UpdateBankStatement!) {
    updateBankStatement(bankStatement: $bankStatement) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_BANK_STATEMENT = /* GraphQL */ `
  mutation DeleteBankStatement($bankStatement: DeleteBankStatement!) {
    deleteBankStatement(bankStatement: $bankStatement) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// Internal Documents
// ---------------------------------------------------------------------------

export const CREATE_INTERNAL_DOCUMENT = /* GraphQL */ `
  mutation CreateInternalDocument($internalDocument: InternalDocumentInput!) {
    createInternalDocument(internalDocument: $internalDocument) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_INTERNAL_DOCUMENT = /* GraphQL */ `
  mutation UpdateInternalDocument($internalDocument: UpdateInternalDocument!) {
    updateInternalDocument(internalDocument: $internalDocument) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_INTERNAL_DOCUMENT = /* GraphQL */ `
  mutation DeleteInternalDocument($internalDocument: DeleteInternalDocument!) {
    deleteInternalDocument(internalDocument: $internalDocument) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// Liabilities
// ---------------------------------------------------------------------------

export const CREATE_LIABILITY = /* GraphQL */ `
  mutation CreateLiability($liability: LiabilityInput!) {
    createLiability(liability: $liability) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_LIABILITY = /* GraphQL */ `
  mutation UpdateLiability($liability: UpdateLiability!) {
    updateLiability(liability: $liability) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_LIABILITY = /* GraphQL */ `
  mutation DeleteLiability($liability: DeleteLiability!) {
    deleteLiability(liability: $liability) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// Receivables
// ---------------------------------------------------------------------------

export const CREATE_RECEIVABLE = /* GraphQL */ `
  mutation CreateReceivable($receivable: ReceivableInput!) {
    createReceivable(receivable: $receivable) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_RECEIVABLE = /* GraphQL */ `
  mutation UpdateReceivable($receivable: UpdateReceivable!) {
    updateReceivable(receivable: $receivable) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_RECEIVABLE = /* GraphQL */ `
  mutation DeleteReceivable($receivable: DeleteReceivable!) {
    deleteReceivable(receivable: $receivable) {
      guid
      isSuccess
    }
  }
`;
