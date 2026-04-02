/**
 * GraphQL queries for codebooks (currencies, centres, operations, etc.).
 */

export const LIST_CURRENCIES = /* GraphQL */ `
  query ListCurrencies($skip: Int, $take: Int, $where: ICurrencyFilterInput, $order: [ICurrencySortInput!]) {
    currencies(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        code
        country
        exchangeRateAmount
        lastChange
      }
    }
  }
`;

export const LIST_CENTRES = /* GraphQL */ `
  query ListCentres($skip: Int, $take: Int, $where: ICentreFilterInput, $order: [ICentreSortInput!]) {
    centres(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        shortCut
        name
        note
        year
        lastChange
      }
    }
  }
`;

export const LIST_OPERATIONS = /* GraphQL */ `
  query ListOperations($skip: Int, $take: Int, $where: IOperationFilterInput, $order: [IOperationSortInput!]) {
    operations(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        shortCut
        name
        note
        year
        lastChange
      }
    }
  }
`;

export const LIST_NUMERICAL_SERIES = /* GraphQL */ `
  query ListNumericalSeries($skip: Int, $take: Int, $where: INumericalSerieFilterInput, $order: [INumericalSerieSortInput!]) {
    numericalSeries(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        prefix
        number
        isNonSignificantZeros
        numberOfPlaces
        name
        isInvoicesIssued
        isInvoicesReceived
        isCashVouchersReceived
        isCashVouchersIssued
        isBankStatementsReceived
        isBankStatementsIssued
        isLiabilities
        isReceivables
        isInternalDocuments
        isSaleSlips
        isIssueSlips
        isIssuedDeliveryNotes
        isReceivedSlips
        isReceivedDeliveryNotes
        isTransferNotes
      }
    }
  }
`;

export const LIST_BANK_ACCOUNT_CASH_BOXES = /* GraphQL */ `
  query ListBankAccountCashBoxes($skip: Int, $take: Int, $where: IBankAccountCashBoxFilterInput, $order: [IBankAccountCashBoxSortInput!]) {
    bankAccountCashBoxes(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        shortCut
        description
        type
        initialStatus
        accountNumber
        bankName
        alphanumericBankCode
        isCredit
        homebankingShortCut
        homebankingName
      }
    }
  }
`;

export const LIST_VAT_CLASSIFICATIONS = /* GraphQL */ `
  query ListVatClassifications($skip: Int, $take: Int, $where: IVatClassificationFilterInput, $order: [IVatClassificationSortInput!]) {
    vatClassifications(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        shortCut
        description
        type
        dateFrom
        isCsw
        vatReturnRow
      }
    }
  }
`;

export const LIST_ACCOUNT_CHARTS = /* GraphQL */ `
  query ListAccountCharts($skip: Int, $take: Int, $where: IAccountChartFilterInput, $order: [IAccountChartSortInput!]) {
    accountCharts(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        account
        name
        type
        subtype1
        note
        transferAccount
        rowFullStatement
        rowSummaryStatement
      }
    }
  }
`;

export const LIST_COUNTRIES = /* GraphQL */ `
  query ListCountries($skip: Int, $take: Int, $where: ICountryFilterInput, $order: [ICountrySortInput!]) {
    countries(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        code
        name
        nameCzech
        isEuMember
        codeVat
        sepa
        isCsw
      }
    }
  }
`;

export const LIST_CONSTANT_SYMBOLS = /* GraphQL */ `
  query ListConstantSymbols($skip: Int, $take: Int, $where: IConstantSymbolFilterInput, $order: [IConstantSymbolSortInput!]) {
    constantSymbols(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        code
        description
        note
      }
    }
  }
`;

export const LIST_EXCHANGE_LISTS = /* GraphQL */ `
  query ListExchangeLists($skip: Int, $take: Int, $where: IExchangeListFilterInput, $order: [IExchangeListSortInput!]) {
    exchangeLists(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        sequence
        date
        bank {
          name
          shortCut
          code
        }
        exchangeRates {
          country
          exchangeRateAmount
          foreignExchangeAverage
          currency {
            code
          }
        }
      }
    }
  }
`;

export const LIST_PRICE_LEVELS = /* GraphQL */ `
  query ListPriceLevels($skip: Int, $take: Int, $where: IPriceLevelFilterInput, $order: [IPriceLevelSortInput!]) {
    priceLevels(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        shortCut
        name
        note
        isGroupPrices
        lastChange
      }
    }
  }
`;

export const LIST_VAT_PURPOSES = /* GraphQL */ `
  query ListVatPurposes($skip: Int, $take: Int, $where: IVatPurposeFilterInput, $order: [IVatPurposeSortInput!]) {
    vatPurposes(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        shortCut
        description
        coefficient
        note
      }
    }
  }
`;

export const LIST_ADDRESS_KEYS = /* GraphQL */ `
  query ListAddressKeys($skip: Int, $take: Int, $where: IAddressKeyFilterInput, $order: [IAddressKeySortInput!]) {
    addressKeys(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        shortCut
        description
        note
        isPreferred
        lastChange
      }
    }
  }
`;

export const LIST_SHIPPINGS = /* GraphQL */ `
  query ListShippings($skip: Int, $take: Int, $where: IShippingFilterInput, $order: [IShippingSortInput!]) {
    shippings(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        shortCut
        name
        note
        shippingCode
      }
    }
  }
`;

export const LIST_PARAMETERS = /* GraphQL */ `
  query ListParameters($skip: Int, $take: Int, $where: IParameterFilterInput, $order: [IParameterSortInput!]) {
    parameters(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        name
        type
        userType
        measureUnit
        userCode
        values
      }
    }
  }
`;
