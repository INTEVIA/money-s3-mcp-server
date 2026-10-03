/**
 * GraphQL queries for companies (address book).
 */

export const LIST_COMPANIES = /* GraphQL */ `
  query ListCompanies(
    $skip: Int
    $take: Int
    $where: ICompanyFilterInput
    $order: [ICompanySortInput!]
  ) {
    companies(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        guid
        identificationNumber
        vatIdentificationNumber
        isVatPayer
        isPerson
        email
        phoneNumber
        mobileNumber
        www
        code
        bankName
        accountNumber
        bankCode
        variableSymbol
        specificSymbol
        discount
        isDiscount
        isCredit
        creditValue
        lastChangeDate
        lastDocumentDateOfIssue
        lastDocumentNumber
        businessAddress {
          name
          street
          municipality
          countryName
        }
        deliveryAddress {
          name
          street
          municipality
          countryName
        }
        addressGroup {
          shortCut
          name
        }
      }
    }
  }
`;

export const GET_COMPANY = /* GraphQL */ `
  query GetCompany(
    $where: ICompanyFilterInput
  ) {
    companies(skip: 0, take: 1, where: $where) {
      items {
        id
        guid
        identificationNumber
        vatIdentificationNumber
        vatIdentificationNumberSk
        isVatPayer
        isPerson
        email
        emailCopy
        emailHidden
        phonePrefix
        phoneNumber
        phoneClapper
        faxPrefix
        faxNumber
        faxClapper
        mobilePrefix
        mobileNumber
        www
        contact
        code
        bankName
        accountNumber
        bankCode
        variableSymbol
        specificSymbol
        isCredit
        creditValue
        isMaturityReceivables
        isMaturityLiabilities
        maturityReceivablesDays
        maturityLiabilitiesDays
        discount
        isDiscount
        isSendMail
        isSendReminders
        isPaymentMethod
        paymentMethod
        isShippingMethod
        shippingMethod
        isShipping
        insured
        message
        note
        contactPerson
        type
        lastChangeDate
        lastChangeTime
        lastDocumentDateOfIssue
        lastDocumentNumber
        lastSendMail
        dataBoxName
        dataBoxId
        isdocDocumentDesignation
        isdocProductIdentifier
        isdocCatalogue
        isdocPlu
        businessAddress {
          name
          street
          municipality
          countryName
        }
        deliveryAddress {
          name
          street
          municipality
          countryName
        }
        billingAddress {
          name
          street
          municipality
        }
        addressGroup {
          shortCut
          name
        }
        bankAccounts {
          accountNumber
          purpose
        }
        operations {
          shortCut
          name
        }
        priceLevels {
          shortCut
          name
        }
        contactPersons {
          guid
          name
          surname
          position
          email
          phoneNumber
          mobileNumber
        }
        branches {
          guid
          code
        }
      }
    }
  }
`;
