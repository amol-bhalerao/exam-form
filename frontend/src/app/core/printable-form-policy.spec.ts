import { canStudentPrintApplication } from './printable-form-policy';

describe('printable form policy', () => {
  it('allows institute verified applications for student print access', () => {
    expect(canStudentPrintApplication({ status: 'INSTITUTE_VERIFIED', fees: [] })).toBeTrue();
  });

  it('allows submitted paid applications', () => {
    expect(canStudentPrintApplication({
      status: 'SUBMITTED',
      fees: [{ receivedAt: new Date().toISOString(), method: 'SANDBOX_COMPLETE' }]
    })).toBeTrue();
  });

  it('blocks draft and pending-payment applications', () => {
    expect(canStudentPrintApplication({
      status: 'DRAFT',
      fees: [{ receivedAt: new Date().toISOString(), method: 'SANDBOX_COMPLETE' }]
    })).toBeFalse();

    expect(canStudentPrintApplication({
      status: 'SUBMITTED',
      fees: [{ receivedAt: new Date(0).toISOString(), method: 'SANDBOX_PENDING' }]
    })).toBeFalse();
  });
});
