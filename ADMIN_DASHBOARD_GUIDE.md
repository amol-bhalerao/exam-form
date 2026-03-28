# 🔧 API Status Dashboard Guide

## Access the Dashboard

Once the code is deployed (after Hostinger rebuilds), visit:

```
https://hsc-exam-form.hisofttechnology.com/admin/status
```

## What You'll See

### Summary Cards (Top)
- **Overall Status:** HEALTHY or DEGRADED
- **Database:** PASS/FAIL
- **API Endpoints:** How many are working (X/total)
- **Response Time:** How long the health check took

### Database Check
- Connection status (✅ OK or ❌ FAILED)
- Error message if connection fails
- Shows exact error from Prisma

### Database Tables
Lists all tables with their status:
- ✅ Records found
- ❌ Error accessing table
- Shows record count for each table

### System Information
- Node.js version
- Platform (Linux)
- Server uptime
- Memory usage (heap)

### Live Logs
Last 10 log entries showing:
- Timestamp
- Log level (success, error, info)
- Message
- Additional data

### Configuration
Shows (non-sensitive):
- Environment (production/development)
- Build ID
- Database URL status (masked for security)
- CORS settings

## Troubleshooting with the Dashboard

### Issue: Database shows FAILED

**In the dashboard, you'll see:** The exact error message (e.g., "Authentication failed")

**Action:** 
1. Check [DATABASE_CREDENTIAL_FIX.md](./DATABASE_CREDENTIAL_FIX.md)
2. Verify DATABASE_URL in Hostinger cPanel
3. Check MySQL credentials are correct
4. Restart Node.js app
5. Refresh dashboard

### Issue: Some tables show 0 records

**This is OK!** Means:
- Database connection works ✅
- Table exists ✅
- Just needs data seeding

**Action:** Add sample data to database

### Issue: API endpoints show mixed PASS/FAIL

**Check the logs at bottom** to see which specific endpoints are failing and why

## Auto-Refresh

The dashboard **automatically refreshes every 5 seconds** while viewing it.

You can manually refresh by clicking the **🔄 Refresh** button in the top right.

## What Each Log Level Means

- 🟩 **success** (green) - Check passed
- 🔵 **info** (blue) - Information message  
- 🔴 **error** (red) - Something failed

## Performance Tips

1. **Bookmark this page** - `https://hsc-exam-form.hisofttechnology.com/admin/status`
2. **Keep it open** during debugging
3. **Check logs** when troubleshooting
4. **Watch the summary** for overall system health

## Real-World Usage Example

**You see:** 
```
Overall Status: DEGRADED
Database: FAIL
Error: Authentication failed
```

**You do:**
1. Go to Hostinger cPanel
2. Find the DATABASE_URL environment variable
3. Verify the password is correct (Exam%401234567890)
4. Verify the host is 127.0.0.1, not localhost
5. Save and restart app
6. Refresh dashboard - should now show HEALTHY

---

## Integration with Frontend

The frontend home page can also display a quick status indicator that links to this dashboard.

Future enhancement: Add status banner on home page showing "System Status" with link to detailed dashboard.
