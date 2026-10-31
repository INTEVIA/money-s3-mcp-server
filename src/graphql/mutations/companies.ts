/**
 * GraphQL mutations for companies (address book).
 */

export const CREATE_COMPANY = /* GraphQL */ `
  mutation CreateCompany($company: CompanyInput!) {
    createCompany(company: $company) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_COMPANY = /* GraphQL */ `
  mutation UpdateCompany($company: UpdateCompany!) {
    updateCompany(company: $company) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_COMPANY = /* GraphQL */ `
  mutation DeleteCompany($company: DeleteCompany!) {
    deleteCompany(company: $company) {
      guid
      isSuccess
    }
  }
`;
