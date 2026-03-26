# Cashfree Payment Integration Guide

## Overview
The HSC Exam application uses Cashfree as the payment gateway for exam application fees. This guide explains the integration, setup, and testing procedures.

---

## Current Status

✓ **Backend:** Cashfree endpoints configured (Ready)  
✓ **Frontend:** Payment components created (Awaiting Cashfree keys)  
⚠️ **Integration:** Sandbox mode (Requires Cashfree API keys)

---

## Required Cashfree Credentials

To enable payment processing, provide the following from your Cashfree account:

### 1. **Sandbox Keys** (for Development/Testing)
- `CASHFREE_APP_ID` - Sandbox App ID
- `CASHFREE_SECRET_KEY` - Sandbox Secret Key  
- `CASHFREE_SANDBOX_URL` - https://sandbox.cashfree.com

### 2. **Production Keys** (for Live)
- `CASHFREE_APP_ID_PROD` - Production App ID
- `CASHFREE_SECRET_KEY_PROD` - Production Secret Key
- `CASHFREE_PROD_URL` - https://api.cashfree.com

### Where to Find Keys:
1. Login to [Cashfree Dashboard](https://dashboard.cashfree.com)
2. Navigate: **Settings → API Keys**
3. Copy **App ID** and **Secret Key** (both Sandbox and Production)
4. Test with Sandbox first, then migrate to Production

---

## Configuration

### Backend Setup (.env.development)

Add these keys to `backend/.env.development`:

```bash
# Cashfree Configuration
CASHFREE_APP_ID=your_sandbox_app_id_here
CASHFREE_SECRET_KEY=your_sandbox_secret_key_here
CASHFREE_ENVIRONMENT=SANDBOX

# For production, also add:
CASHFREE_APP_ID_PROD=your_prod_app_id_here
CASHFREE_SECRET_KEY_PROD=your_prod_secret_key_here
```

### Frontend Setup (app.config.ts)

No additional configuration needed - frontend uses backend API endpoints.

### Environment Variables (Production)

For `.env.production`:
```bash
CASHFREE_APP_ID=your_prod_app_id_here
CASHFREE_SECRET_KEY=your_prod_secret_key_here
CASHFREE_ENVIRONMENT=PRODUCTION
```

---

## API Endpoints

###  1. **Initiate Payment**

**Endpoint:** `POST /api/payments/initiate`  
**Auth:** Required (Student, Institute, or Admin)

**Request Body:**
```json
{
  "applicationId": 123,
  "amount": 500,
  "studentEmail": "student@example.com",
  "studentName": "John Doe",
  "studentPhone": "9876543210",
  "description": "HSC Exam 2026 - Application Fee"
}
```

**Response (Success):**
```json
{
  "paymentLink": "https://link.cashfree.com/pay/...",
  "orderId": "order_123456789",
  "amount": 500,
  "currency": "INR",
  "status": "PENDING"
}
```

**Response (Error):**
```json
{
  "error": "PAYMENT_INITIATION_FAILED",
  "message": "Invalid amount or student details",
  "code": "400"
}
```

### 2. **Verify Payment**

**Endpoint:** `POST /api/payments/verify`  
**Auth:** Required

**Request Body:**
```json
{
  "orderId": "order_123456789",
  "paymentId": "payment_7b7f9e1234567890"
}
```

**Response (Success):**
```json
{
  "verified": true,
  "orderId": "order_123456789",
  "paymentId": "payment_7b7f9e1234567890",
  "amount": 500,
  "status": "PAID",
  "timestamp": "2026-03-26T10:30:00Z",
  "receipt": {
    "receiptNumber": "RCP-2026-001",
    "receiptUrl": "/receipts/RCP-2026-001.pdf"
  }
}
```

### 3. **Get Payment Status**

**Endpoint:** `GET /api/payments/order/:orderId`  
**Auth:** Required

**Response:**
```json
{
  "orderId": "order_123456789",
  "amount": 500,
  "status": "PAID",
  "paymentMethod": "NETBANKING",
  "paymentId": "payment_7b7f9e1234567890",
  "createdAt": "2026-03-26T10:15:00Z",
  "paidAt": "2026-03-26T10:25:00Z"
}
```

### 4. **Generate Receipt**

**Endpoint:** `GET /api/payments/receipt/:receiptNumber`  
**Auth:** Required

**Response:** PDF File (application/pdf)

---

## Payment Flow (User Perspective)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Student fills exam application form                      │
│    (app/pages/student/student-application-edit/)            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Application status: DRAFT                                │
│    Requires: Payment processing before submission            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Student clicks "Proceed to Payment"                      │
│    Calls: POST /api/payments/initiate                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend initiates Cashfree payment                       │
│    Returns: Payment link (Cashfree-hosted checkout)         │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Student redirected to Cashfree checkout page             │
│    (Secure payment processing - PCI DSS compliant)          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Cashfree processes payment                               │
│    (Credit Card, Debit Card, NetBanking, UPI, Wallet)      │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Cashfree webhook notifies backend                        │
│    (Async payment status update)                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Backend verifies payment                                 │
│    Updates: Application status to SUBMITTED                 │
│    Generates: Receipt                                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Student sees success page                                │
│    Can download receipt                                     │
│    Application sent to institute for verification           │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Payment Integration

### Test Scenario 1: Successful Payment (Sandbox)

**Steps:**
1. Navigate to Student Application form
2. Fill all fields and click "Proceed to Payment"
3. Get redirected to Cashfree test checkout
4. Use Test Card Details:
   - **Card Number:** 6011111111111111
   - **CVV:** 123
   - **Expiry:** 12/30
5. Complete payment
6. Backend should verify and generate receipt

**Expected Result:** ✓ Payment successful, receipt generated

### Test Scenario 2: Payment Failure (Sandbox)

**Using Failing Test Card:**
- **Card Number:** 4111111111111127
- **CVV:** 123
- **Expiry:** 12/30

**Expected Result:** Payment fails, application remains in DRAFT

### Test Scenario 3: Refund (Sandbox)

**Process:**
1. Make successful payment
2. Call: `POST /api/payments/refund`
   ```json
   {
     "paymentId": "payment_7b7f9e1234567890",
     "reason": "Student requested cancellation"
   }
   ```
3. Verify refund status
4. Application reverts to DRAFT

---

## Webhook Configuration

### What is a Webhook?

A webhook is a callback mechanism that Cashfree uses to notify your backend of payment status changes asynchronously.

### Setup Webhook in Cashfree Dashboard

1. Login to Cashfree Dashboard
2. Navigate: **Settings → Webhooks**
3. Add Webhook URL:
   ```
   https://yourdomain.com/api/payments/webhook
   ```
4. Select Events:
   - Order Paid
   - Order Refunded
   - Order Expired
5. Click **Save**

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `PAYMENT_SUCCESS` | Application moved to SUBMITTED, receipt generated |
| `PAYMENT_FAILED` | Application stays in DRAFT, user notified |
| `REFUND_INITIATED` | Refund tracked, email sent to student |
| `REFUND_COMPLETED` | Refund completed, application reset to DRAFT |

### Webhook Security

All webhooks include a signature header for verification:
```
X-Cashfree-Signature: SHA256(raw_body + SECRET_KEY)
```

The backend validates this signature before processing.

---

## Receipt Generation

### API Endpoint
`GET /api/payments/receipt/:receiptNumber`

### Receipt Contains
- Receipt Number (e.g., RCP-2026-001)
- Student Name & Email
- Application Details
- Amount Paid
- Payment Date & Time
- Payment Method
- Transaction ID
- Organization Header/Footer

### Receipt Storage
- **Location:** `backend/receipts/` (PDF files)
- **Naming:** `RCP-YYYY-MM-dd-001.pdf`
- **Access:** Secure download via authenticated API

### Automated Email
When payment succeeds, a receipt email is automatically sent to:
- Student's email
- Institute admin
- Board admin (configurable)

---

## Integration Checklist

### Setup Phase
- [ ] Register Cashfree account (https://cashfree.com)
- [ ] Obtain Sandbox API keys
- [ ] Add keys to `.env.development`
- [ ] Test with Sandbox cards
- [ ] Configure webhook URL
- [ ] Verify webhook signature validation

### Testing Phase
- [ ] Test successful payment flow
- [ ] Test failed payment handling
- [ ] Test refund process
- [ ] Test receipt generation
- [ ] Test webhook notifications
- [ ] Test email notifications
- [ ] Test duplicate payment prevention

### Production Phase
- [ ] Obtain Production API keys
- [ ] Update `.env.production`
- [ ] Update webhook URL to production
- [ ] Enable HTTPS (required)
- [ ] Set CSP headers for Cashfree domain
- [ ] Load test payment processing
- [ ] Document SLA and support contacts

---

## Error Handling

| Error Code | Cause | Solution |
|-----------|-------|----------|
| `INVALID_CREDENTIALS` | Wrong API keys | Verify keys in .env |
| `AMOUNT_MISMATCH` | Payment amount differs | Check application fee |
| `STUDENT_NOT_FOUND` | Student doesn't exist | Verify student ID |
| `DUPLICATE_ORDER` | Order already exists | Use unique order IDs |
| `PAYMENT_GATEWAY_ERROR` | Cashfree service down | Retry after delay |
| `NETWORK_TIMEOUT` | Connection timeout | Implement retry logic |

---

## Logging & Monitoring

### Enable Payment Logs
```bash
# In .env.development
LOG_LEVEL=debug
CASHFREE_DEBUG=true
```

### Monitor Payment Activity
```bash
# View recent payments
npm run logs -- --grep payment

# Real-time payment monitoring
tail -f logs/cashfree-payments.log
```

### Dashboard Metrics
- Total Revenue
- Payment Success Rate
- Average Transaction Time
- Failed Payment Analysis
- Refund Tracking

---

## Support & Troubleshooting

### Cashfree Support
- **Email:** support@cashfree.com
- **Phone:** 1800-121-0001 (India)
- **Status:** https://cashf.me/status

### Common Issues

**Issue: "Payment link not working"**
- Solution: Verify CORS headers allow Cashfree domain
- Check CSP policy includes Cashfree payment domain

**Issue: "Webhook not being called"**
- Solution: Verify webhook URL is publicly accessible
- Check firewall allows Cashfree IP addresses
- Verify webhook signature validation not rejecting valid signatures

**Issue: "Receipt showing incorrect amount"**
- Solution: Ensure amount in initiate call matches stored value
- Check currency conversion if applicable

---

## Implementation Deadline

- **Phase 1 (Setup):** Upon Cashfree key provision
- **Phase 2 (Testing):** 1-2 days with test cards
- **Phase 3 (Production):** After successful sandbox testing

---

## Next Actions for User

1. **Provide Cashfree Keys**
   ```
   CASHFREE_APP_ID: _______________
   CASHFREE_SECRET_KEY: _______________
   ```

2. **We will:**
   - Update .env files with your keys
   - Run complete payment flow tests
   - Set up webhook on your Cashfree account
   - Test all scenarios
   - Generate test reports

3. **You will:**
   - Review test results
   - Approve payment system
   - Set cash collection accounts
   - Configure refund policies

---

**Status:** Ready for integration  
**Awaiting:** Cashfree API Keys  
**Timeline:** 3-5 business days after key provision  

**Contact:** [Support Email/Phone]

---

*Last Updated: 2026-03-26*  
*Document Version: 1.0*
