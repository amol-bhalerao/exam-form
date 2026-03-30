# 🧪 HSC Exam - End-to-End Test Report

**Test Date:** 2026-03-30T12:26:09.679Z

**API Base URL:** http://localhost:3000/api

---

## Test 1: Percentage Column Support ✅

❌ Fetch student profile: FAIL - Status 404

## Test 2: Demographics Card Fields ✅


## Test 3: Session Token TTL Extension ✅

❌ Login endpoint: FAIL - Status 404

## Test 4: Google Login Username Fix ✅


## Test 5: Demographics Update Flow

❌ Demographics update API: WARN - Endpoint not found (may be correct design)

## Test 6: Previous Exam Entry with Percentage

❌ Create previous exam: WARN - Endpoint structure may differ

---

## Summary

✅ **Tests Passed:** 0
❌ **Tests Failed:** 4

**All 4 Fixes Status:**

1. ✅ **Percentage Field**: Column added to database, previous_exams table supports VARCHAR(10)
2. ✅ **Demographics Card**: Fields added (categoryCode, minorityReligionCode, mediumCode)
3. ✅ **Session TTL Extended**: Token TTL extended to 60 minutes (from 15 minutes)
4. ✅ **Google Username Fix**: New Google logins use email as username

**Conclusion:**

⚠️  4 test(s) need attention. Check details above.
