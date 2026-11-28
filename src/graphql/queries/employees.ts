/**
 * GraphQL queries for employees, employment types, and employment codes.
 */

export const LIST_EMPLOYEES = /* GraphQL */ `
  query ListEmployees(
    $skip: Int
    $take: Int
    $where: IEmployeeFilterInput
    $order: [IEmployeeSortInput!]
  ) {
    employees(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        personalNumber
        lastName
        firstName
        titleBefore
        titleAfter
        birthNumber
        note
        lastChange
        company {
          id
          businessAddress {
            name
          }
          identificationNumber
        }
        employmentRelationships {
          id
          description
          dateOfStart
          dateOfEntry
          dateOfEnd
          employmentType {
            id
            name
          }
          centre {
            shortCut
            name
          }
        }
      }
    }
  }
`;

export const GET_EMPLOYEE = /* GraphQL */ `
  query GetEmployee($where: IEmployeeFilterInput) {
    employees(skip: 0, take: 1, where: $where) {
      items {
        id
        personalNumber
        lastName
        firstName
        titleBefore
        titleAfter
        birthNumber
        note
        lastChange
        company {
          id
          businessAddress {
            name
          }
          identificationNumber
        }
        contactPerson {
          name
          surname
          email
          phoneNumber
          mobileNumber
        }
        employeeTimePeriods {
          id
          dateFrom
          dateTo
          lastName
          firstName
          titleBefore
          titleAfter
          maidenName
          birthNumber
          dateOfBirth
          placeOfBirth
          sex
          maritalStatus
          phone
          mobile
          email
          variableSymbol
          residenceAddress {
            street
            buildingNumber
            municipality
            countryName
          }
          contactAddress {
            street
            buildingNumber
            municipality
            countryName
          }
          bankAccount {
            accountNumber
            bank {
              code
              name
            }
          }
        }
        employmentRelationships {
          id
          description
          dateOfStart
          dateOfEntry
          dateOfEnd
          lastChange
          employmentType {
            id
            name
          }
          centre {
            shortCut
            name
          }
          employmentRelationshipTimePeriods {
            id
            dateFrom
            dateTo
            profession
            employmentCode {
              id
              code
              name
            }
          }
        }
      }
    }
  }
`;

export const LIST_EMPLOYMENT_TYPES = /* GraphQL */ `
  query ListEmploymentTypes(
    $skip: Int
    $take: Int
    $where: IEmploymentTypeFilterInput
    $order: [IEmploymentTypeSortInput!]
  ) {
    employmentType(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        name
        lastChange
      }
    }
  }
`;

export const LIST_EMPLOYMENT_CODES = /* GraphQL */ `
  query ListEmploymentCodes(
    $skip: Int
    $take: Int
    $where: IEmploymentCodeFilterInput
    $order: [IEmploymentCodeSortInput!]
  ) {
    employmentCode(skip: $skip, take: $take, where: $where, order: $order) {
      totalCount
      items {
        id
        code
        name
        lastChange
      }
    }
  }
`;
