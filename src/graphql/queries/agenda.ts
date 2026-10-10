/**
 * GraphQL queries for the agenda domain: agendas, years, job orders, activities.
 */

export const LIST_AGENDAS = /* GraphQL */ `
  query ListAgendas(
    $skip: Int
    $take: Int
    $where: IAgendaFilterInput
    $order: [IAgendaSortInput!]
  ) {
    agendas(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        guid
        folder
        name
        displayName
        code
        identificationNumber
      }
    }
  }
`;

export const LIST_YEARS = /* GraphQL */ `
  query ListYears {
    years {
      id
      year
      dateFrom
      dateTo
    }
  }
`;

export const LIST_JOB_ORDERS = /* GraphQL */ `
  query ListJobOrders(
    $skip: Int
    $take: Int
    $where: IJobOrderFilterInput
    $order: [IJobOrderSortInput!]
  ) {
    jobOrders(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        shortCut
        name
        note
        year
        state
        rating
        companyName
        isBusinessCase
        orderNumber
        responsibleEmployee
        dateOfPlannedStart
        dateOfStart
        dateOfPlannedHandOver
        dateOfHandOver
        isWarranty
        warrantyTo
        lastChange
        jobOrderType {
          shortCut
          name
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

export const GET_JOB_ORDER = /* GraphQL */ `
  query GetJobOrder($where: IJobOrderFilterInput) {
    jobOrders(skip: 0, take: 1, where: $where) {
      items {
        id
        shortCut
        name
        note
        year
        state
        rating
        companyName
        isBusinessCase
        orderNumber
        responsibleEmployee
        dateOfPlannedStart
        dateOfStart
        dateOfPlannedHandOver
        dateOfHandOver
        isWarranty
        warrantyTo
        numericalSerieSequence
        lastChange
        numericalSerie {
          prefix
          name
        }
        jobOrderType {
          shortCut
          name
        }
        company {
          id
          businessAddress {
            name
          }
          identificationNumber
        }
        user {
          name
        }
        activities {
          dateOfStart
          timeOfStart
          description
          activityType
          documentNumber
          activityName
          note
        }
      }
    }
  }
`;

export const LIST_JOB_ORDER_TYPES = /* GraphQL */ `
  query ListJobOrderTypes(
    $skip: Int
    $take: Int
    $where: IJobOrderTypeFilterInput
    $order: [IJobOrderTypeSortInput!]
  ) {
    jobOrderTypes(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        shortCut
        name
        note
        lastChange
      }
    }
  }
`;

export const LIST_ESHOPS = /* GraphQL */ `
  query ListEshops(
    $skip: Int
    $take: Int
    $where: IEshopFilterInput
    $order: [IEshopSortInput!]
  ) {
    eshops(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        guid
        shopId
        shopType
        lastChange
      }
    }
  }
`;

export const LIST_ACTIVITIES = /* GraphQL */ `
  query ListActivities(
    $skip: Int
    $take: Int
    $where: IActivityFilterInput
    $order: [IActivitySortInput!]
  ) {
    activities(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        dateOfStart
        timeOfStart
        description
        activityType
        activityName
        documentNumber
        documentTotalAmount
        documentType
        yearFolder
        user
        note
        lastChange
      }
    }
  }
`;
