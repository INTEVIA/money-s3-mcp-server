/**
 * GraphQL mutations for the agenda domain: job orders.
 */

export const CREATE_JOB_ORDER = /* GraphQL */ `
  mutation CreateJobOrder($jobOrder: JobOrderInput!) {
    createJobOrder(jobOrder: $jobOrder) {
      guid
      isSuccess
    }
  }
`;

export const UPDATE_JOB_ORDER = /* GraphQL */ `
  mutation UpdateJobOrder($jobOrder: UpdateJobOrder!) {
    updateJobOrder(jobOrder: $jobOrder) {
      guid
      isSuccess
    }
  }
`;

export const DELETE_JOB_ORDER = /* GraphQL */ `
  mutation DeleteJobOrder($jobOrder: DeleteJobOrder!) {
    deleteJobOrder(jobOrder: $jobOrder) {
      guid
      isSuccess
    }
  }
`;
