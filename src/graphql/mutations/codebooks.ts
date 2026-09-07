/** GraphQL mutations for codebook entities (CRUD). */

// ---------------------------------------------------------------------------
// Operation
// ---------------------------------------------------------------------------

export const CREATE_OPERATION = /* GraphQL */ `
  mutation CreateOperation($operation: OperationInput!) {
    createOperation(operation: $operation) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_OPERATION = /* GraphQL */ `
  mutation UpdateOperation($operation: UpdateOperation!) {
    updateOperation(operation: $operation) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_OPERATION = /* GraphQL */ `
  mutation DeleteOperation($operation: DeleteOperation!) {
    deleteOperation(operation: $operation) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// VatClassification
// ---------------------------------------------------------------------------

export const CREATE_VAT_CLASSIFICATION = /* GraphQL */ `
  mutation CreateVatClassification($vatClassification: VatClassificationInput!) {
    createVatClassification(vatClassification: $vatClassification) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_VAT_CLASSIFICATION = /* GraphQL */ `
  mutation UpdateVatClassification($vatClassification: UpdateVatClassification!) {
    updateVatClassification(vatClassification: $vatClassification) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_VAT_CLASSIFICATION = /* GraphQL */ `
  mutation DeleteVatClassification($vatClassification: DeleteVatClassification!) {
    deleteVatClassification(vatClassification: $vatClassification) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// VatAccountingAcc
// ---------------------------------------------------------------------------

export const CREATE_VAT_ACCOUNTING_ACC = /* GraphQL */ `
  mutation CreateVatAccountingAcc($vatAccountingAcc: VatAccountingAccInput!) {
    createVatAccountingAcc(vatAccountingAcc: $vatAccountingAcc) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_VAT_ACCOUNTING_ACC = /* GraphQL */ `
  mutation UpdateVatAccountingAcc($vatAccountingAcc: UpdateVatAccountingAcc!) {
    updateVatAccountingAcc(vatAccountingAcc: $vatAccountingAcc) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_VAT_ACCOUNTING_ACC = /* GraphQL */ `
  mutation DeleteVatAccountingAcc($vatAccountingAcc: DeleteVatAccountingAcc!) {
    deleteVatAccountingAcc(vatAccountingAcc: $vatAccountingAcc) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// VatAccountingTr
// ---------------------------------------------------------------------------

export const CREATE_VAT_ACCOUNTING_TR = /* GraphQL */ `
  mutation CreateVatAccountingTr($vatAccountingTr: VatAccountingTrInput!) {
    createVatAccountingTr(vatAccountingTr: $vatAccountingTr) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_VAT_ACCOUNTING_TR = /* GraphQL */ `
  mutation UpdateVatAccountingTr($vatAccountingTr: UpdateVatAccountingTr!) {
    updateVatAccountingTr(vatAccountingTr: $vatAccountingTr) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_VAT_ACCOUNTING_TR = /* GraphQL */ `
  mutation DeleteVatAccountingTr($vatAccountingTr: DeleteVatAccountingTr!) {
    deleteVatAccountingTr(vatAccountingTr: $vatAccountingTr) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// AccountAssignmentAcc
// ---------------------------------------------------------------------------

export const CREATE_ACCOUNT_ASSIGNMENT_ACC = /* GraphQL */ `
  mutation CreateAccountAssignmentAcc($accountAssignmentAcc: AccountAssignmentAccInput!) {
    createAccountAssignmentAcc(accountAssignmentAcc: $accountAssignmentAcc) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ACCOUNT_ASSIGNMENT_ACC = /* GraphQL */ `
  mutation UpdateAccountAssignmentAcc($accountAssignmentAcc: UpdateAccountAssignmentAcc!) {
    updateAccountAssignmentAcc(accountAssignmentAcc: $accountAssignmentAcc) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ACCOUNT_ASSIGNMENT_ACC = /* GraphQL */ `
  mutation DeleteAccountAssignmentAcc($accountAssignmentAcc: DeleteAccountAssignmentAcc!) {
    deleteAccountAssignmentAcc(accountAssignmentAcc: $accountAssignmentAcc) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// AccountAssignmentTr
// ---------------------------------------------------------------------------

export const CREATE_ACCOUNT_ASSIGNMENT_TR = /* GraphQL */ `
  mutation CreateAccountAssignmentTr($accountAssignmentTr: AccountAssignmentTrInput!) {
    createAccountAssignmentTr(accountAssignmentTr: $accountAssignmentTr) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ACCOUNT_ASSIGNMENT_TR = /* GraphQL */ `
  mutation UpdateAccountAssignmentTr($accountAssignmentTr: UpdateAccountAssignmentTr!) {
    updateAccountAssignmentTr(accountAssignmentTr: $accountAssignmentTr) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ACCOUNT_ASSIGNMENT_TR = /* GraphQL */ `
  mutation DeleteAccountAssignmentTr($accountAssignmentTr: DeleteAccountAssignmentTr!) {
    deleteAccountAssignmentTr(accountAssignmentTr: $accountAssignmentTr) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// AccountChart
// ---------------------------------------------------------------------------

export const CREATE_ACCOUNT_CHART = /* GraphQL */ `
  mutation CreateAccountChart($accountChart: AccountChartInput!) {
    createAccountChart(accountChart: $accountChart) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ACCOUNT_CHART = /* GraphQL */ `
  mutation UpdateAccountChart($accountChart: UpdateAccountChart!) {
    updateAccountChart(accountChart: $accountChart) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ACCOUNT_CHART = /* GraphQL */ `
  mutation DeleteAccountChart($accountChart: DeleteAccountChart!) {
    deleteAccountChart(accountChart: $accountChart) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// AccountMovement
// ---------------------------------------------------------------------------

export const CREATE_ACCOUNT_MOVEMENT = /* GraphQL */ `
  mutation CreateAccountMovement($accountMovement: AccountMovementInput!) {
    createAccountMovement(accountMovement: $accountMovement) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_ACCOUNT_MOVEMENT = /* GraphQL */ `
  mutation UpdateAccountMovement($accountMovement: UpdateAccountMovement!) {
    updateAccountMovement(accountMovement: $accountMovement) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_ACCOUNT_MOVEMENT = /* GraphQL */ `
  mutation DeleteAccountMovement($accountMovement: DeleteAccountMovement!) {
    deleteAccountMovement(accountMovement: $accountMovement) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// Centre
// ---------------------------------------------------------------------------

export const CREATE_CENTRE = /* GraphQL */ `
  mutation CreateCentre($centre: CentreInput!) {
    createCentre(centre: $centre) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_CENTRE = /* GraphQL */ `
  mutation UpdateCentre($centre: UpdateCentre!) {
    updateCentre(centre: $centre) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_CENTRE = /* GraphQL */ `
  mutation DeleteCentre($centre: DeleteCentre!) {
    deleteCentre(centre: $centre) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// BankAccountCashBox
// ---------------------------------------------------------------------------

export const CREATE_BANK_ACCOUNT_CASH_BOX = /* GraphQL */ `
  mutation CreateBankAccountCashBox($bankAccountCashBox: BankAccountCashBoxInput!) {
    createBankAccountCashBox(bankAccountCashBox: $bankAccountCashBox) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_BANK_ACCOUNT_CASH_BOX = /* GraphQL */ `
  mutation UpdateBankAccountCashBox($bankAccountCashBox: UpdateBankAccountCashBox!) {
    updateBankAccountCashBox(bankAccountCashBox: $bankAccountCashBox) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_BANK_ACCOUNT_CASH_BOX = /* GraphQL */ `
  mutation DeleteBankAccountCashBox($bankAccountCashBox: DeleteBankAccountCashBox!) {
    deleteBankAccountCashBox(bankAccountCashBox: $bankAccountCashBox) {
      guid
      isSuccess
    }
  }
`;

// ---------------------------------------------------------------------------
// Parameter
// ---------------------------------------------------------------------------

export const CREATE_PARAMETER = /* GraphQL */ `
  mutation CreateParameter($parameter: ParameterInput!) {
    createParameter(parameter: $parameter) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_PARAMETER = /* GraphQL */ `
  mutation UpdateParameter($parameter: UpdateParameter!) {
    updateParameter(parameter: $parameter) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_PARAMETER = /* GraphQL */ `
  mutation DeleteParameter($parameter: DeleteParameter!) {
    deleteParameter(parameter: $parameter) {
      guid
      isSuccess
    }
  }
`;
