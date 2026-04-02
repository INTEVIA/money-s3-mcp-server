/**
 * GraphQL queries for financial documents:
 * cash vouchers, bank statements, internal documents, liabilities, receivables.
 */

// ---------------------------------------------------------------------------
// Cash Vouchers
// ---------------------------------------------------------------------------

export const LIST_CASH_VOUCHERS = /* GraphQL */ `
  query ListCashVouchers(
    $skip: Int
    $take: Int
    $where: ICashVoucherFilterInput
    $order: [ICashVoucherSortInput!]
  ) {
    cashVouchers(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        guid
        year
        documentNumber
        description
        variableSymbol
        pairingSymbol
        cancel
        isExpense
        dateOfIssue
        dateOfPayment
        dateOfAccountingEvent
        dateOfTaxing
        totalWithVatHc
        totalWithVat
        isDeleted
        isNotAccounting
        lastChangeDate
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          address {
            name
            street
            municipality
            postalCode
            country
          }
        }
        cashBox {
          shortCut
          description
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
      }
    }
  }
`;

export const GET_CASH_VOUCHER = /* GraphQL */ `
  query GetCashVoucher(
    $where: ICashVoucherFilterInput
  ) {
    cashVouchers(skip: 0, take: 1, where: $where) {
      items {
        id
        guid
        year
        documentNumber
        registrationNumber
        receivedDocumentNumber
        description
        variableSymbol
        pairingSymbol
        barCode
        cancel
        isExpense
        isSimplifiedTaxReceipt
        dateOfIssue
        dateOfPayment
        dateOfAccountingEvent
        dateOfTaxing
        dateOfVatApplication
        totalWithVatHc
        totalWithVat
        isDeleted
        isLock
        isNotAccounting
        isPriceCorrection
        isFiscal
        note
        documentType
        phoneNumber
        email
        exchangeRate
        exchangeRateAmount
        lastChangeDate
        lastChangeTime
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          vatIdentificationNumberSk
          address {
            name
            street
            municipality
            postalCode
            country
          }
          company {
            id
            guid
          }
        }
        cashBox {
          shortCut
          description
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
        accountAssignment {
          accountAssignmentAcc {
            shortCut
            type
          }
        }
        centre {
          shortCut
          name
        }
        jobOrder {
          shortCut
          name
        }
        operation {
          shortCut
          name
        }
        vatClassification {
          shortCut
          description
        }
        vatRateSummary {
          vatRate
          totalWithoutVat
          totalVat
        }
        vatRateSummaryHc {
          vatRate
          totalWithoutVat
          totalVat
        }
        normalItems {
          sequence
          description
          unitPriceHc
          unitPrice
          priceType
          vatRate
          amountUnit
          amount
          note
          accountAssignment {
            accountAssignmentAcc {
              shortCut
            }
          }
          vatClassification {
            shortCut
          }
          centre {
            shortCut
          }
          jobOrder {
            shortCut
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Bank Statements
// ---------------------------------------------------------------------------

export const LIST_BANK_STATEMENTS = /* GraphQL */ `
  query ListBankStatements(
    $skip: Int
    $take: Int
    $where: IBankStatementFilterInput
    $order: [IBankStatementSortInput!]
  ) {
    bankStatements(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        guid
        year
        documentNumber
        bankStatementNumber
        description
        variableSymbol
        pairingSymbol
        constantSymbol
        specificSymbol
        cancel
        isExpense
        dateOfIssue
        dateOfPayment
        dateOfAccountingEvent
        dateOfTaxing
        totalWithVatHc
        totalWithVat
        isDeleted
        isNotAccounting
        lastChangeDate
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          address {
            name
            street
            municipality
            postalCode
            country
          }
        }
        bankAccount {
          shortCut
          description
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
      }
    }
  }
`;

export const GET_BANK_STATEMENT = /* GraphQL */ `
  query GetBankStatement(
    $where: IBankStatementFilterInput
  ) {
    bankStatements(skip: 0, take: 1, where: $where) {
      items {
        id
        guid
        year
        documentNumber
        registrationNumber
        receivedDocumentNumber
        bankStatementNumber
        bankStatementId
        description
        variableSymbol
        pairingSymbol
        constantSymbol
        specificSymbol
        cancel
        isExpense
        dateOfIssue
        dateOfPayment
        dateOfAccountingEvent
        dateOfTaxing
        dateOfVatApplication
        totalWithVatHc
        totalWithVat
        isDeleted
        isLock
        isNotAccounting
        isPriceCorrection
        issuedUser
        note
        documentType
        phoneNumber
        email
        exchangeRate
        exchangeRateAmount
        lastChangeDate
        lastChangeTime
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          vatIdentificationNumberSk
          address {
            name
            street
            municipality
            postalCode
            country
          }
          company {
            id
            guid
          }
        }
        bankAccount {
          shortCut
          description
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
        accountAssignment {
          accountAssignmentAcc {
            shortCut
            type
          }
        }
        centre {
          shortCut
          name
        }
        jobOrder {
          shortCut
          name
        }
        operation {
          shortCut
          name
        }
        vatClassification {
          shortCut
          description
        }
        vatRateSummary {
          vatRate
          totalWithoutVat
          totalVat
        }
        vatRateSummaryHc {
          vatRate
          totalWithoutVat
          totalVat
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Internal Documents
// ---------------------------------------------------------------------------

export const LIST_INTERNAL_DOCUMENTS = /* GraphQL */ `
  query ListInternalDocuments(
    $skip: Int
    $take: Int
    $where: IInternalDocumentFilterInput
    $order: [IInternalDocumentSortInput!]
  ) {
    internalDocuments(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        guid
        year
        documentNumber
        description
        variableSymbol
        pairingSymbol
        cancel
        dateOfAccountingEvent
        dateOfTaxing
        dateOfVatApplication
        creditNumber
        totalWithVatHc
        totalWithVat
        isDeleted
        isNotAccounting
        lastChangeDate
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          address {
            name
            street
            municipality
            postalCode
            country
          }
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
      }
    }
  }
`;

export const GET_INTERNAL_DOCUMENT = /* GraphQL */ `
  query GetInternalDocument(
    $where: IInternalDocumentFilterInput
  ) {
    internalDocuments(skip: 0, take: 1, where: $where) {
      items {
        id
        guid
        year
        documentNumber
        receivedDocumentNumber
        description
        variableSymbol
        pairingSymbol
        cancel
        dateOfAccountingEvent
        dateOfTaxing
        dateOfControlReport
        dateOfVatApplication
        creditNumber
        totalWithVatHc
        totalWithVat
        isDeleted
        isLock
        isNotAccounting
        isPriceCorrection
        issuedUser
        note
        documentType
        wagePostingDocument
        wagePostingYear
        wagePostingMonth
        phoneNumber
        email
        exchangeRate
        exchangeRateAmount
        lastChangeDate
        lastChangeTime
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          vatIdentificationNumberSk
          address {
            name
            street
            municipality
            postalCode
            country
          }
          company {
            id
            guid
          }
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
        accountAssignment {
          accountAssignmentAcc {
            shortCut
            type
          }
        }
        centre {
          shortCut
          name
        }
        jobOrder {
          shortCut
          name
        }
        operation {
          shortCut
          name
        }
        vatClassification {
          shortCut
          description
        }
        vatRateSummary {
          vatRate
          totalWithoutVat
          totalVat
        }
        vatRateSummaryHc {
          vatRate
          totalWithoutVat
          totalVat
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Liabilities
// ---------------------------------------------------------------------------

export const LIST_LIABILITIES = /* GraphQL */ `
  query ListLiabilities(
    $skip: Int
    $take: Int
    $where: ILiabilityFilterInput
    $order: [ILiabilitySortInput!]
  ) {
    liabilities(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        guid
        year
        documentNumber
        description
        variableSymbol
        pairingSymbol
        constantSymbol
        specificSymbol
        cancel
        isCreditNote
        dateOfIssue
        dateOfMaturity
        dateOfPayment
        dateOfAccountingEvent
        dateOfTaxing
        totalWithVatHc
        totalWithVat
        remainingAmountToPayHc
        remainingAmountToPay
        isDeleted
        isNotAccounting
        lastChangeDate
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          address {
            name
            street
            municipality
            postalCode
            country
          }
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
      }
    }
  }
`;

export const GET_LIABILITY = /* GraphQL */ `
  query GetLiability(
    $where: ILiabilityFilterInput
  ) {
    liabilities(skip: 0, take: 1, where: $where) {
      items {
        id
        guid
        year
        documentNumber
        receivedDocumentNumber
        description
        variableSymbol
        pairingSymbol
        constantSymbol
        specificSymbol
        barCode
        cancel
        isCreditNote
        dateOfIssue
        dateOfMaturity
        dateOfPayment
        dateOfAccountingEvent
        dateOfTaxing
        dateOfVatApplication
        dateOfCreditNote
        totalWithVatHc
        totalWithVat
        remainingAmountToPayHc
        remainingAmountToPay
        paymentDocumentNumber
        isDeleted
        isLock
        isNotAccounting
        isPriceCorrection
        issuedUser
        note
        documentType
        phoneNumber
        email
        exchangeRate
        exchangeRateAmount
        originalDocumentNumber
        lastChangeDate
        lastChangeTime
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          vatIdentificationNumberSk
          address {
            name
            street
            municipality
            postalCode
            country
          }
          company {
            id
            guid
          }
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
        accountAssignment {
          accountAssignmentAcc {
            shortCut
            type
          }
        }
        centre {
          shortCut
          name
        }
        jobOrder {
          shortCut
          name
        }
        operation {
          shortCut
          name
        }
        vatClassification {
          shortCut
          description
        }
        vatRateSummary {
          vatRate
          totalWithoutVat
          totalVat
        }
        vatRateSummaryHc {
          vatRate
          totalWithoutVat
          totalVat
        }
        payments {
          paidDocumentId
          paidDocumentType
          paidDocumentYear
          paymentDocumentId
          paymentDocumentType
          paymentDocumentYear
          paymentMovement
          paymentDocumentAmountHc
          paymentDocumentAmount
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Receivables
// ---------------------------------------------------------------------------

export const LIST_RECEIVABLES = /* GraphQL */ `
  query ListReceivables(
    $skip: Int
    $take: Int
    $where: IReceivableFilterInput
    $order: [IReceivableSortInput!]
  ) {
    receivables(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        guid
        year
        documentNumber
        description
        variableSymbol
        pairingSymbol
        constantSymbol
        specificSymbol
        orderNumber
        cancel
        isCreditNote
        dateOfIssue
        dateOfMaturity
        dateOfPayment
        dateOfAccountingEvent
        dateOfTaxing
        totalWithVatHc
        totalWithVat
        remainingAmountToPayHc
        remainingAmountToPay
        isDeleted
        isNotAccounting
        lastChangeDate
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          address {
            name
            street
            municipality
            postalCode
            country
          }
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
      }
    }
  }
`;

export const GET_RECEIVABLE = /* GraphQL */ `
  query GetReceivable(
    $where: IReceivableFilterInput
  ) {
    receivables(skip: 0, take: 1, where: $where) {
      items {
        id
        guid
        year
        documentNumber
        description
        variableSymbol
        pairingSymbol
        constantSymbol
        specificSymbol
        orderNumber
        barCode
        cancel
        isCreditNote
        dateOfIssue
        dateOfMaturity
        dateOfPayment
        dateOfAccountingEvent
        dateOfTaxing
        dateOfVatApplication
        dateOfCreditNote
        totalWithVatHc
        totalWithVat
        remainingAmountToPayHc
        remainingAmountToPay
        paymentDocumentNumber
        isDeleted
        isLock
        isNotAccounting
        isPriceCorrection
        issuedUser
        note
        documentType
        phoneNumber
        email
        exchangeRate
        exchangeRateAmount
        originalDocumentNumber
        lastChangeDate
        lastChangeTime
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          vatIdentificationNumberSk
          address {
            name
            street
            municipality
            postalCode
            country
          }
          company {
            id
            guid
          }
        }
        currency {
          code
          exchangeRateAmount
        }
        numericalSerie {
          prefix
          number
        }
        accountAssignment {
          accountAssignmentAcc {
            shortCut
            type
          }
        }
        centre {
          shortCut
          name
        }
        jobOrder {
          shortCut
          name
        }
        operation {
          shortCut
          name
        }
        vatClassification {
          shortCut
          description
        }
        vatRateSummary {
          vatRate
          totalWithoutVat
          totalVat
        }
        vatRateSummaryHc {
          vatRate
          totalWithoutVat
          totalVat
        }
        payments {
          paidDocumentId
          paidDocumentType
          paidDocumentYear
          paymentDocumentId
          paymentDocumentType
          paymentDocumentYear
          paymentMovement
          paymentDocumentAmountHc
          paymentDocumentAmount
        }
      }
    }
  }
`;
