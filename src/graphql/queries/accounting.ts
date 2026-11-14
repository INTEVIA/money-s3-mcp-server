/**
 * GraphQL queries for accounting (journals, account assignments, VAT accounting, etc.).
 */

export const LIST_JOURNAL_ACCS = /* GraphQL */ `
  query ListJournalAccs(
    $skip: Int
    $take: Int
    $where: IJournalAccFilterInput
    $order: [IJournalAccSortInput!]
  ) {
    journalAccs(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        year
        date
        srcDocumentType
        srcDocumentId
        srcDocumentNumber
        description
        amount
        pairingSymbol
        identificationNumber
        isDeleted
        isFree
        note
        amountHc
        exchangeRate
        exchangeRateAmount
        dateOfTaxing
        issuedUser
        accountDebits {
          account
          name
        }
        accountCredits {
          account
          name
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
        currency {
          code
        }
        company {
          id
          businessAddress {
            name
          }
          identificationNumber
        }
      }
    }
  }
`;

export const LIST_JOURNAL_TRS = /* GraphQL */ `
  query ListJournalTrs(
    $skip: Int
    $take: Int
    $where: IJournalTrFilterInput
    $order: [IJournalTrSortInput!]
  ) {
    journalTrs(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        year
        date
        isClosingRepair
        srcDocumentType
        srcDocumentId
        srcDocumentNumber
        paidDocumentType
        paidDocumentId
        paidDocumentYearDirectory
        description
        type
        amount
        variableSymbol
        identificationNumber
        isDeleted
        isFree
        note
        amountHc
        exchangeRate
        exchangeRateAmount
        issuedUser
        accountMovement {
          shortCut
          description
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
        currency {
          code
        }
        company {
          id
          businessAddress {
            name
          }
          identificationNumber
        }
      }
    }
  }
`;

export const LIST_ACCOUNT_ASSIGNMENT_ACCS = /* GraphQL */ `
  query ListAccountAssignmentAccs($skip: Int, $take: Int) {
    accountAssignmentAccs(skip: $skip, take: $take) {
      totalCount
      items {
        shortCut
        type
        description
        note
        year
        lastChangeDate
        accountDebits {
          account
          name
        }
        accountCredits {
          account
          name
        }
        vatAccounting {
          shortCut
          description
        }
        vatClassification {
          shortCut
          description
        }
      }
    }
  }
`;

export const LIST_ACCOUNT_ASSIGNMENT_TRS = /* GraphQL */ `
  query ListAccountAssignmentTrs($skip: Int, $take: Int) {
    accountAssignmentTrs(skip: $skip, take: $take) {
      totalCount
      items {
        shortCut
        type
        description
        note
        year
        lastChangeDate
        accountMovement {
          shortCut
          description
        }
        vatAccountingTr {
          shortCut
          description
        }
        vatClassification {
          shortCut
          description
        }
      }
    }
  }
`;

export const LIST_ACCOUNT_MOVEMENTS = /* GraphQL */ `
  query ListAccountMovements($skip: Int, $take: Int) {
    accountMovements(skip: $skip, take: $take) {
      totalCount
      items {
        shortCut
        description
        type
        column
        note
        year
        lastChangeDate
      }
    }
  }
`;

export const LIST_VAT_ACCOUNTING_ACCS = /* GraphQL */ `
  query ListVatAccountingAccs($skip: Int, $take: Int) {
    vatAccountingAccs(skip: $skip, take: $take) {
      totalCount
      items {
        id
        shortCut
        type
        description
        note
        year
        lastChangeDate
        accountDebitsReduced {
          account
          name
        }
        accountCreditsReduced {
          account
          name
        }
        accountDebitsBasic {
          account
          name
        }
        accountCreditsBasic {
          account
          name
        }
      }
    }
  }
`;

export const LIST_VAT_ACCOUNTING_TRS = /* GraphQL */ `
  query ListVatAccountingTrs($skip: Int, $take: Int) {
    vatAccountingTrs(skip: $skip, take: $take) {
      totalCount
      items {
        id
        shortCut
        type
        description
        note
        year
        lastChangeDate
        accountMovementReduced {
          shortCut
          description
        }
        accountMovementBasic {
          shortCut
          description
        }
      }
    }
  }
`;

export const LIST_NON_MONETARY_PAYMENTS = /* GraphQL */ `
  query ListNonMonetaryPayments($skip: Int, $take: Int) {
    nonMonetaryPayments(skip: $skip, take: $take) {
      totalCount
      items {
        code
        description
        amount
        variableSymbol
        type
        hotKeyNumber
        qrPayment
        lastChange
      }
    }
  }
`;
