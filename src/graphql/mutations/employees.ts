/**
 * GraphQL mutations for employee wages.
 */

export const CREATE_WAGE = /* GraphQL */ `
  mutation CreateWage($wage: WageInput!) {
    createWage(wage: $wage) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_WAGE = /* GraphQL */ `
  mutation UpdateWage($wage: UpdateWage!) {
    updateWage(wage: $wage) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_WAGE = /* GraphQL */ `
  mutation DeleteWage($wage: DeleteWage!) {
    deleteWage(wage: $wage) {
      guid
      isSuccess
    }
  }
`;
