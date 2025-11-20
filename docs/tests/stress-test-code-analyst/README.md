# Code Analysis Module - Stress Testing Suite

Comprehensive stress testing framework for the Code Analysis module's ZIP upload functionality. Tests the complete flow: Upload → Analysis → Results.

## 📋 Overview

This stress testing suite simulates multiple concurrent users uploading ZIP files for code analysis, monitors the entire analysis pipeline, and generates detailed HTML reports with performance metrics.

### What It Tests

- **Upload Performance**: File upload speed and reliability
- **Analysis Processing**: Code analysis completion time
- **Concurrent Load**: System behavior under multiple simultaneous requests
- **Error Handling**: Failure rates and error patterns
- **End-to-End Flow**: Complete user journey from upload to results

## 🚀 Quick Start

### Prerequisites

- PowerShell 5.1 or higher (Windows)
- Access to CodeAnalyst backend API
- Network connectivity to production/staging environment

### Running the Tests

```powershell
# Navigate to the test directory
cd docs\tests\stress-test-code-analyst

# Run stress test with default settings (5 users, 3 minutes)
.\run-stress-test.ps1

# Run with custom settings
.\run-stress-test.ps1 -ConcurrentUsers 10 -TestDurationSeconds 300

# Generate sample ZIP files only
.\generate-sample-zips.ps1
```

## 📊 Test Configuration

### Default Parameters

| Parameter | Default Value | Description |
|-----------|--------------|-------------|
| `ConcurrentUsers` | 5 | Number of simultaneous test users |
| `TestDurationSeconds` | 180 | Duration of stress test (3 minutes) |
| `WarmupDurationSeconds` | 30 | Warmup period before stress test |
| `BackendUrl` | Production API | Backend API endpoint |

### Example Commands

```powershell
# Light test (5 users, 2 minutes)
.\run-stress-test.ps1 -ConcurrentUsers 5 -TestDurationSeconds 120

# Medium test (10 users, 5 minutes)
.\run-stress-test.ps1 -ConcurrentUsers 10 -TestDurationSeconds 300

# Heavy test (15 users, 10 minutes)
.\run-stress-test.ps1 -ConcurrentUsers 15 -TestDurationSeconds 600

# Skip user creation (use existing test users)
.\run-stress-test.ps1 -SkipUserCreation

# Force regenerate ZIP files
.\run-stress-test.ps1 -GenerateZips
```

## 📁 Directory Structure

```
stress-test-code-analyst/
├── run-stress-test.ps1           # Main test runner
├── test-helpers.ps1               # Helper functions
├── generate-sample-zips.ps1       # ZIP file generator
├── README.md                      # This file
├── sample-zips/                   # Test ZIP files
│   ├── project1-simple-html.zip
│   ├── project2-basic-javascript.zip
│   ├── project3-react-component.zip
│   ├── project4-express-api.zip
│   └── project5-fullstack-mixed.zip
└── reports/                       # Generated reports
    ├── stress-test-report-YYYY-MM-DD_HH-mm-ss.html
    └── stress-test-data-YYYY-MM-DD_HH-mm-ss.json
```

## 📈 Understanding the Reports

### HTML Report Sections

1. **Status Banner**: Overall test result (EXCELLENT/GOOD/WARNING/CRITICAL)
2. **Summary Cards**: Key metrics at a glance
3. **Performance Metrics Table**: Detailed timing statistics
4. **Visual Analytics**: Charts showing response times and success rates
5. **Test Configuration**: Parameters used for the test
6. **Error Log**: Details of any failures (if applicable)

### Key Metrics Explained

#### Success Rate
- **95%+**: EXCELLENT - System performing optimally
- **80-94%**: GOOD - Acceptable performance with minor issues
- **60-79%**: WARNING - Significant issues need attention
- **<60%**: CRITICAL - System requires immediate investigation

#### Response Times
- **Average**: Mean time for all requests
- **P50 (Median)**: 50% of requests completed faster than this
- **P95**: 95% of requests completed faster than this
- **P99**: 99% of requests completed faster than this

#### Throughput
- **Requests/Second**: Number of complete analysis cycles per second
- Higher is better, indicates system capacity

### Performance Benchmarks

| Metric | Target | Good | Needs Improvement |
|--------|--------|------|-------------------|
| Success Rate | 95%+ | 85-94% | <85% |
| Avg Upload Time | <500ms | 500-1000ms | >1000ms |
| Avg Analysis Time | <60s | 60-120s | >120s |
| P95 Total Time | <90s | 90-150s | >150s |
| Error Rate | <5% | 5-15% | >15% |

## 👥 Test Users

### Naming Convention

Test users are created with the following pattern:
- **Email**: `stress_test_user_001@codeanalyst.test` through `stress_test_user_XXX@codeanalyst.test`
- **Password**: `StressTest2024!`
- **Name**: `Stress Test User 001` through `Stress Test User XXX`

### Managing Test Users

#### Identifying Test Users

All test users have emails matching the pattern `stress_test_user_*@codeanalyst.test`, making them easy to identify in the database.

#### Cleaning Up Test Users

After testing, you can remove test users from the database:

```sql
-- View test users
SELECT id, email, name, created_at 
FROM users 
WHERE email LIKE 'stress_test_user_%@codeanalyst.test';

-- Delete test users (be careful!)
DELETE FROM users 
WHERE email LIKE 'stress_test_user_%@codeanalyst.test';

-- Also clean up their analysis results
DELETE FROM code_analyses 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email LIKE 'stress_test_user_%@codeanalyst.test'
);
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Backend Not Reachable

**Error**: `Backend is not reachable`

**Solutions**:
- Verify backend URL is correct
- Check if backend service is running (Railway dashboard)
- Test connectivity: `Invoke-WebRequest -Uri "https://codeanalyst-production.up.railway.app/health"`

#### 2. User Creation Failed

**Error**: `Failed to create user`

**Solutions**:
- Users might already exist - use `-SkipUserCreation` flag
- Check database connection
- Verify Supabase Auth is configured correctly

#### 3. Upload Failures

**Error**: `Upload failed`

**Solutions**:
- Check file size limits (backend accepts up to 50MB)
- Verify ZIP files are valid
- Check backend logs for detailed errors
- Ensure sufficient disk space on server

#### 4. Analysis Timeouts

**Error**: `Analysis timeout`

**Solutions**:
- Increase `MaxAttempts` in polling function
- Check if analysis workers are running
- Review backend logs for stuck jobs
- Verify AI API keys are valid (OpenAI/Google)

#### 5. Low Success Rate

**Symptoms**: Success rate < 80%

**Investigation Steps**:
1. Check error log in HTML report for patterns
2. Review backend logs during test period
3. Check database connection pool settings
4. Monitor server resources (CPU, memory, disk)
5. Verify AI API rate limits not exceeded

### Debug Mode

To get more detailed output, modify the test script:

```powershell
# Add verbose output
$VerbosePreference = "Continue"
.\run-stress-test.ps1

# Check specific test user
$result = Login-TestUser -Email "stress_test_user_001@codeanalyst.test" -Password "StressTest2024!"
$result | ConvertTo-Json -Depth 5
```

## 📊 Sample Test Files

The test suite includes 5 sample projects:

1. **project1-simple-html.zip** (~10KB)
   - Basic HTML/CSS website
   - 2 files
   - Fast analysis

2. **project2-basic-javascript.zip** (~50KB)
   - Node.js/Express application
   - 5 files
   - Medium complexity

3. **project3-react-component.zip** (~100KB)
   - React application
   - 10 files
   - Modern framework

4. **project4-express-api.zip** (~150KB)
   - Express REST API
   - 15 files with routes/controllers
   - Backend architecture

5. **project5-fullstack-mixed.zip** (~200KB)
   - Full-stack application
   - 20 files (frontend + backend)
   - Complex structure

## 🎯 Best Practices

### Running Tests

1. **Start Small**: Begin with 5 users for 2-3 minutes
2. **Gradually Increase**: Scale up to 10-15 users as system proves stable
3. **Monitor Resources**: Watch server CPU/memory during tests
4. **Off-Peak Hours**: Run heavy tests during low-traffic periods
5. **Save Reports**: Keep historical reports to track performance trends

### Interpreting Results

1. **Look for Patterns**: Are errors consistent or random?
2. **Check Percentiles**: P95/P99 show worst-case scenarios
3. **Compare Runs**: Track improvements or regressions over time
4. **Identify Bottlenecks**: Upload vs Analysis time breakdown
5. **Review Errors**: Specific error messages indicate root causes

### Continuous Testing

```powershell
# Weekly performance check
.\run-stress-test.ps1 -ConcurrentUsers 5 -TestDurationSeconds 180

# Monthly capacity test
.\run-stress-test.ps1 -ConcurrentUsers 15 -TestDurationSeconds 600

# Pre-deployment validation
.\run-stress-test.ps1 -ConcurrentUsers 10 -TestDurationSeconds 300
```

## 📝 Test Phases

The stress test runs in 5 phases:

### Phase 1: Setup & Preparation
- Check backend connectivity
- Verify/generate sample ZIP files
- Create test users
- Validate authentication

### Phase 2: Warmup Test
- Single user uploads one file
- Verifies end-to-end flow works
- Warms up system caches
- Catches configuration issues early

### Phase 3: Stress Test Execution
- Launch concurrent worker jobs
- Each worker continuously:
  - Selects random ZIP file
  - Uploads file
  - Polls for completion
  - Records metrics
- Runs for configured duration

### Phase 4: Results Collection
- Gather results from all workers
- Calculate statistics
- Aggregate metrics
- Identify errors

### Phase 5: Report Generation
- Save raw JSON data
- Generate HTML report with charts
- Display summary in console
- Provide next steps

## 🔍 Advanced Usage

### Custom Backend URL

```powershell
# Test against staging environment
.\run-stress-test.ps1 -BackendUrl "https://staging-api.codeanalyst.com/api"

# Test local development
.\run-stress-test.ps1 -BackendUrl "http://localhost:3001/api"
```

### Programmatic Access

```powershell
# Load helpers for custom testing
. .\test-helpers.ps1

# Create single test user
$user = Create-TestUser -Email "custom@test.com" -Password "Test123!" -Name "Custom User"

# Upload specific file
$result = Upload-ZipFile -Token $user.Token -ZipFilePath ".\my-project.zip"

# Check status
$status = Poll-AnalysisStatus -Token $user.Token -AnalysisId $result.AnalysisId
```

### Analyzing Historical Data

```powershell
# Load previous test results
$data = Get-Content ".\reports\stress-test-data-2024-11-14_12-00-00.json" | ConvertFrom-Json

# Calculate custom metrics
$avgTime = ($data.Results | Measure-Object -Property TotalTime -Average).Average
$successRate = ($data.Results | Where-Object { $_.AnalysisSuccess }).Count / $data.Results.Count * 100

Write-Host "Average Time: $avgTime ms"
Write-Host "Success Rate: $successRate %"
```

## 🆘 Support

If you encounter issues:

1. Check this README for troubleshooting steps
2. Review the HTML report error log
3. Check backend logs in Railway dashboard
4. Verify database connectivity
5. Contact the development team with:
   - Test configuration used
   - HTML report
   - JSON data file
   - Backend logs (if accessible)

## 📚 Additional Resources

- [CodeAnalyst System Documentation](../../SYSTEM_DOCUMENTATION.md)
- [Testing Guide](../../TESTING_GUIDE.md)
- [Backend API Documentation](../../../backend/README.md)
- [Database Schema](../../../database-schema.sql)

---

**Last Updated**: November 14, 2024  
**Version**: 1.0.0  
**Maintained By**: CodeAnalyst Development Team

