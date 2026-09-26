/**
 * GraphQL queries for issued and received invoices.
 */

// ---------------------------------------------------------------------------
// Issued Invoices
// ---------------------------------------------------------------------------

export const LIST_ISSUED_INVOICES = /* GraphQL */ `
  query ListIssuedInvoices(
    $skip: Int
    $take: Int
    $where: IIssuedInvoiceFilterInput
    $order: [IIssuedInvoiceSortInput!]
  ) {
    issuedInvoices(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        guid
        documentNumber
        description
        variableSymbol
        invoiceType
        isCreditNote
        cancel
        dateOfIssue
        dateOfMaturity
        dateOfPayment
        totalWithVatHc
        remainingAmountToPayHc
        isBilled
        year
        partnerAddress {
          identificationNumber
          businessAddress {
            name
          }
        }
        currency {
          code
        }
      }
    }
  }
`;

export const GET_ISSUED_INVOICE = /* GraphQL */ `
  query GetIssuedInvoice(
    $where: IIssuedInvoiceFilterInput
  ) {
    issuedInvoices(skip: 0, take: 1, where: $where) {
      items {
        id
        guid
        documentNumber
        registrationNumber
        description
        variableSymbol
        specificSymbol
        pairingSymbol
        orderNumber
        invoiceType
        isCreditNote
        cancel
        dateOfIssue
        dateOfTaxing
        dateOfMaturity
        dateOfPayment
        dateOfAccountingEvent
        dateOfVatApplication
        dateOfCreditNote
        dateOfStockMovement
        totalWithVatHc
        amountToPayHc
        remainingAmountToPayHc
        amountToPay
        remainingAmountToPay
        exchangeRate
        exchangeRateAmount
        isBilled
        isDeleted
        isLock
        isSimplifiedTaxReceipt
        isPriceCorrection
        isNotAccounting
        percentageDiscount
        paymentMethod
        shippingMethod
        paymentDocumentNumber
        phoneNumber
        email
        barCode
        documentType
        issuedUser
        year
        lastChangeDate
        lastChangeTime
        invoiceTextBeforePrices
        invoiceTextBehindPrices
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          vatIdentificationNumberSk
          contactPersonName
          businessAddress {
            name
            street
            municipality
            postalCode
            country
          }
          billingAddress {
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
        deliveryAddress {
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
          country
        }
        numericalSerie {
          prefix
          number
          isNonSignificantZeros
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
        constantSymbol {
          code
          description
        }
        payOn {
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
        items {
          type
          description
          note
          catalogue
          amountUnit
          amount
          vatRate
          unitPriceHc
          unitPrice
          priceType
          discountPercentage
          sequence
          warrantyType
          warranty
          isDeposit
          isTaxed
          isInverse
          barCode
          shortCut
          plu
          weight
          serialNumber
          accountAssignment {
            accountAssignmentAcc {
              shortCut
            }
          }
          vatClassification {
            shortCut
            description
          }
          centre {
            shortCut
          }
          jobOrder {
            shortCut
          }
          operation {
            shortCut
          }
          stockItem {
            description
          }
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
// Received Invoices
// ---------------------------------------------------------------------------

export const LIST_RECEIVED_INVOICES = /* GraphQL */ `
  query ListReceivedInvoices(
    $skip: Int
    $take: Int
    $where: IReceivedInvoiceFilterInput
    $order: [IReceivedInvoiceSortInput!]
  ) {
    receivedInvoices(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        guid
        documentNumber
        description
        variableSymbol
        receivedDocumentNumber
        invoiceType
        isCreditNote
        cancel
        dateOfIssue
        dateOfMaturity
        dateOfPayment
        totalWithVatHc
        remainingAmountToPayHc
        isBilled
        year
        partnerAddress {
          identificationNumber
          businessAddress {
            name
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

export const GET_RECEIVED_INVOICE = /* GraphQL */ `
  query GetReceivedInvoice(
    $where: IReceivedInvoiceFilterInput
  ) {
    receivedInvoices(skip: 0, take: 1, where: $where) {
      items {
        id
        guid
        documentNumber
        description
        variableSymbol
        specificSymbol
        receivedDocumentNumber
        pairingSymbol
        invoiceType
        isCreditNote
        cancel
        dateOfIssue
        dateOfTaxing
        dateOfMaturity
        dateOfPayment
        dateOfAccountingEvent
        dateOfVatApplication
        dateOfCreditNote
        dateOfStockMovement
        totalWithVatHc
        amountToPayHc
        remainingAmountToPayHc
        amountToPay
        remainingAmountToPay
        exchangeRate
        exchangeRateAmount
        isBilled
        isDeleted
        isLock
        isSimplifiedTaxReceipt
        isPriceCorrection
        isNotAccounting
        percentageDiscount
        paymentMethod
        paymentDocumentNumber
        note
        phoneNumber
        email
        barCode
        documentType
        issuedUser
        year
        lastChangeDate
        lastChangeTime
        partnerAddress {
          identificationNumber
          vatIdentificationNumber
          vatIdentificationNumberSk
          contactPersonName
          businessAddress {
            name
            street
            municipality
            postalCode
            country
          }
          billingAddress {
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
          country
        }
        numericalSerie {
          prefix
          number
          isNonSignificantZeros
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
        constantSymbol {
          code
          description
        }
        vatPurpose {
          shortCut
          description
        }
        payFrom {
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
        items {
          type
          description
          note
          catalogue
          amountUnit
          amount
          vatRate
          unitPriceHc
          unitPrice
          priceType
          discountPercentage
          sequence
          warrantyType
          warranty
          isDeposit
          isTaxed
          isInverse
          barCode
          shortCut
          plu
          weight
          serialNumber
          accountAssignment {
            accountAssignmentAcc {
              shortCut
            }
          }
          vatClassification {
            shortCut
            description
          }
          centre {
            shortCut
          }
          jobOrder {
            shortCut
          }
          operation {
            shortCut
          }
          stockItem {
            description
          }
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
