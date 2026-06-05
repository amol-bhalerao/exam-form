export function isPaymentCompleted(application: any): boolean {
  const latestPayment = application?.fees?.[0] || null;
  return !!latestPayment
    && !!latestPayment.receivedAt
    && new Date(latestPayment.receivedAt).getTime() > 1000
    && !String(latestPayment.method || '').toUpperCase().includes('PENDING');
}

export function canStudentPrintApplication(application: any): boolean {
  if (!application) return false;

  const status = String(application.status || '').toUpperCase();
  if (['INSTITUTE_VERIFIED', 'BOARD_APPROVED'].includes(status)) {
    return true;
  }

  return status !== 'DRAFT' && isPaymentCompleted(application);
}

export function canStaffPrintApplication(application: any): boolean {
  if (!application) return false;

  const status = String(application.status || '').toUpperCase();
  return ['SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED'].includes(status);
}
