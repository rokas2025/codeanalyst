# 🚀 Quick Start Guide - Code Analysis Stress Testing

## What You Have Now

A **complete, working stress testing suite** for your Code Analysis module that:
- ✅ Tests ZIP file upload and analysis
- ✅ Simulates multiple concurrent users
- ✅ Measures performance metrics
- ✅ Generates detailed reports
- ✅ Works on Windows with PowerShell

## Run Your First Test (30 seconds)

```powershell
# 1. Open PowerShell
# 2. Navigate to test directory
cd docs\tests\stress-test-code-analyst

# 3. Run the test
.\run-stress-test-simple.ps1
```

That's it! The test will:
1. Check backend connectivity ✅
2. Verify test files exist ✅
3. Login with demo account ✅
4. Run warmup test ✅
5. Execute 3-minute stress test with 5 concurrent workers 🔥
6. Generate reports with all metrics 📊

## What Happens During the Test

```
[PHASE 1] Setup (10 seconds)
- Checks backend is reachable
- Verifies 5 sample ZIP files exist
- Logs in with demo account

[PHASE 2] Warmup (30 seconds)
- Single upload to verify system works
- Catches any configuration issues early

[PHASE 3] Stress Test (3 minutes)
- 5 workers upload files simultaneously
- Each worker continuously:
  • Uploads random ZIP file
  • Waits for analysis to complete
  • Records all metrics
  • Repeats until time expires

[PHASE 4] Analysis (5 seconds)
- Collects all results
- Calculates statistics
- Identifies errors

[PHASE 5] Reports (5 seconds)
- Saves JSON data
- Generates text report
- Displays summary
```

## Understanding Your Results

After the test completes, you'll see:

```
================================================================
RESULTS SUMMARY
================================================================

Overall Status: EXCELLENT    ← System health (EXCELLENT/GOOD/WARNING/CRITICAL)

Total Requests:        25    ← How many uploads completed
Successful Analyses:   24    ← How many finished successfully
Failed Requests:       1     ← Any failures

Success Rate:          96%   ← Target: 95%+
Throughput:            0.14 req/s

Avg Upload Time:       450ms  ← How fast uploads happen
Avg Analysis Time:     45s    ← How long analysis takes
Avg Total Time:        47s    ← Complete cycle time
```

### What's Good?
- ✅ Success Rate ≥ 95% = EXCELLENT
- ✅ Avg Upload Time < 500ms = Fast
- ✅ Avg Analysis Time < 60s = Good
- ✅ No errors = Perfect

### What Needs Attention?
- ⚠️ Success Rate 80-94% = Review errors
- ⚠️ Avg Analysis Time > 120s = Slow processing
- ❌ Success Rate < 80% = Critical issues

## Your Reports

After each test, find reports in `reports/` folder:

```
reports/
├── stress-test-data-2024-11-14_12-30-00.json    ← Raw data
└── stress-test-report-2024-11-14_12-30-00.txt   ← Human-readable
```

### View Latest Report
```powershell
# Open in Notepad
notepad (Get-ChildItem .\reports\*.txt | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName

# Or view in console
Get-Content (Get-ChildItem .\reports\*.txt | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
```

## Customize Your Test

### Test More Users
```powershell
# 10 concurrent users instead of 5
.\run-stress-test-simple.ps1 -ConcurrentUsers 10
```

### Test Longer
```powershell
# 10 minutes instead of 3
.\run-stress-test-simple.ps1 -TestDurationSeconds 600
```

### Both
```powershell
# 15 users for 10 minutes (heavy load)
.\run-stress-test-simple.ps1 -ConcurrentUsers 15 -TestDurationSeconds 600
```

## Test Files Used

The test automatically uses 5 sample projects:

1. **project1-simple-html.zip** (10KB) - Basic website
2. **project2-basic-javascript.zip** (50KB) - Node.js app
3. **project3-react-component.zip** (100KB) - React app
4. **project4-express-api.zip** (150KB) - REST API
5. **project5-fullstack-mixed.zip** (200KB) - Full-stack app

These are automatically generated if they don't exist.

## About Test Users

### Current Setup (Working Now)
- Uses demo account: `test@demo.com`
- All 5 workers share same login
- **Works immediately, no setup needed** ✅

### Future Enhancement (Optional)
- Can create dedicated test users
- Each worker gets own account
- Requires admin approval
- See `TEST_USERS_FOR_APPROVAL.md` for details

## Troubleshooting

### "Backend not reachable"
```powershell
# Check backend status
Invoke-WebRequest -Uri "https://codeanalyst-production.up.railway.app/health"
```

### "Login failed"
- Demo account credentials might have changed
- Check with admin for current test account

### "No ZIP files found"
```powershell
# Regenerate sample files
.\generate-sample-zips.ps1
```

### Test runs but no results
- Check `reports/` folder
- Ensure test completed (wait for "TEST COMPLETE" message)

## Regular Testing Schedule

### Daily Quick Check (2 minutes)
```powershell
.\run-stress-test-simple.ps1 -TestDurationSeconds 120
```

### Weekly Capacity Test (10 minutes)
```powershell
.\run-stress-test-simple.ps1 -ConcurrentUsers 10 -TestDurationSeconds 600
```

### Before Deployment (5 minutes)
```powershell
.\run-stress-test-simple.ps1 -ConcurrentUsers 8 -TestDurationSeconds 300
```

## What Gets Tested

✅ **Upload Performance**
- File upload speed
- Concurrent upload handling
- Error rates

✅ **Analysis Processing**
- Analysis completion time
- Queue handling
- AI processing performance

✅ **System Reliability**
- Success rates under load
- Error handling
- Timeout management

✅ **End-to-End Flow**
- Complete user journey
- Real-world usage patterns
- Performance bottlenecks

## Next Steps

1. **Run your first test** (do it now!)
   ```powershell
   .\run-stress-test-simple.ps1
   ```

2. **Review the results**
   - Check console output
   - Open text report
   - Look for any errors

3. **Analyze performance**
   - Is success rate > 95%?
   - Is analysis time acceptable?
   - Any bottlenecks identified?

4. **Optional: Approve test users**
   - See `TEST_USERS_FOR_APPROVAL.md`
   - More realistic testing
   - Not required for basic testing

## Need Help?

- 📖 Full documentation: `README.md`
- 👥 Test users info: `TEST_USERS_FOR_APPROVAL.md`
- ✅ Implementation details: `IMPLEMENTATION_COMPLETE.md`

---

**Ready to test?** Run this now:
```powershell
cd docs\tests\stress-test-code-analyst
.\run-stress-test-simple.ps1
```

🎉 **Your stress testing suite is ready to use!**

