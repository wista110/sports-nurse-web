import { test, expect } from '@playwright/test'

test.describe('Job Lifecycle E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/')
    
    // Mock authentication for testing
    await page.addInitScript(() => {
      // Mock NextAuth session
      window.localStorage.setItem('test-user-role', 'organizer')
    })
  })

  test('should allow organizer to create a job posting', async ({ page }) => {
    // Navigate to job creation page
    await page.goto('/jobs/new')
    
    // Verify page loads
    await expect(page).toHaveTitle(/Create Job/)
    
    // Fill out job creation form
    await page.fill('[data-testid="job-title"]', 'Test Sports Event')
    await page.fill('[data-testid="job-description"]', 'A comprehensive test sports event requiring qualified medical support staff')
    
    // Select sport categories
    await page.click('[data-testid="category-soccer"]')
    
    // Fill location details
    await page.selectOption('[data-testid="prefecture-select"]', '東京都')
    await page.selectOption('[data-testid="city-select"]', '渋谷区')
    await page.fill('[data-testid="venue-input"]', 'Test Stadium')
    await page.fill('[data-testid="address-input"]', '1-1-1 Test Address')
    
    // Set event timing
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    await page.fill('[data-testid="start-date"]', tomorrowStr)
    await page.fill('[data-testid="start-time"]', '10:00')
    await page.fill('[data-testid="end-date"]', tomorrowStr)
    await page.fill('[data-testid="end-time"]', '18:00')
    
    // Set application deadline
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    await page.fill('[data-testid="deadline-date"]', todayStr)
    await page.fill('[data-testid="deadline-time"]', '23:59')
    
    // Set headcount and compensation
    await page.fill('[data-testid="headcount"]', '2')
    await page.selectOption('[data-testid="compensation-type"]', 'hourly')
    await page.fill('[data-testid="compensation-amount"]', '3000')
    
    // Save as draft first
    await page.click('[data-testid="save-draft-btn"]')
    
    // Verify draft is saved
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Job saved as draft')
    
    // Publish the job
    await page.click('[data-testid="publish-btn"]')
    
    // Verify job is published
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Job published successfully')
    
    // Verify redirect to job detail page
    await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9-]+/)
    
    // Verify job details are displayed
    await expect(page.locator('[data-testid="job-title"]')).toContainText('Test Sports Event')
    await expect(page.locator('[data-testid="job-status"]')).toContainText('Open')
  })

  test('should validate required fields in job creation', async ({ page }) => {
    await page.goto('/jobs/new')
    
    // Try to submit empty form
    await page.click('[data-testid="save-draft-btn"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required')
    await expect(page.locator('[data-testid="description-error"]')).toContainText('Description must be at least 10 characters')
    await expect(page.locator('[data-testid="categories-error"]')).toContainText('At least one category is required')
    
    // Test invalid date combinations
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    await page.fill('[data-testid="start-date"]', yesterdayStr)
    await page.fill('[data-testid="start-time"]', '10:00')
    
    await page.click('[data-testid="save-draft-btn"]')
    
    await expect(page.locator('[data-testid="start-date-error"]')).toContainText('Start time must be in the future')
  })

  test('should display job listings for nurses', async ({ page }) => {
    // Switch to nurse role
    await page.addInitScript(() => {
      window.localStorage.setItem('test-user-role', 'nurse')
    })
    
    await page.goto('/jobs')
    
    // Verify page loads with job listings
    await expect(page).toHaveTitle(/Job Listings/)
    
    // Check that job listings container exists
    await expect(page.locator('[data-testid="job-listings"]')).toBeVisible()
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'soccer')
    await page.click('[data-testid="search-btn"]')
    
    // Verify search results update
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Test category filter
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="category-soccer"]')
    await page.click('[data-testid="apply-filters-btn"]')
    
    // Verify filtered results
    await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible()
    
    // Test location filter
    await page.click('[data-testid="location-filter"]')
    await page.selectOption('[data-testid="prefecture-filter"]', '東京都')
    await page.click('[data-testid="apply-filters-btn"]')
    
    // Test sorting
    await page.selectOption('[data-testid="sort-select"]', 'compensation_high')
    
    // Verify sort is applied
    await expect(page.locator('[data-testid="job-card"]').first()).toBeVisible()
  })

  test('should allow nurse to apply for a job', async ({ page }) => {
    // Switch to nurse role
    await page.addInitScript(() => {
      window.localStorage.setItem('test-user-role', 'nurse')
    })
    
    await page.goto('/jobs')
    
    // Click on first job listing
    await page.click('[data-testid="job-card"]')
    
    // Verify job detail page loads
    await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9-]+/)
    
    // Click apply button
    await page.click('[data-testid="apply-btn"]')
    
    // Verify application modal opens
    await expect(page.locator('[data-testid="application-modal"]')).toBeVisible()
    
    // Fill application form
    await page.fill('[data-testid="application-message"]', 'I am very interested in this position and have extensive experience in sports medicine.')
    
    // Add custom quote
    await page.click('[data-testid="add-quote-btn"]')
    await page.fill('[data-testid="quote-description-0"]', 'Base hourly rate')
    await page.fill('[data-testid="quote-amount-0"]', '3000')
    
    await page.click('[data-testid="add-quote-item-btn"]')
    await page.fill('[data-testid="quote-description-1"]', 'Emergency response premium')
    await page.fill('[data-testid="quote-amount-1"]', '500')
    
    // Verify total is calculated
    await expect(page.locator('[data-testid="quote-total"]')).toContainText('3500')
    
    // Submit application
    await page.click('[data-testid="submit-application-btn"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Application submitted successfully')
    
    // Verify application appears in nurse's applications
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="my-applications"]')).toContainText('Test Sports Event')
  })

  test('should handle job application validation', async ({ page }) => {
    // Switch to nurse role
    await page.addInitScript(() => {
      window.localStorage.setItem('test-user-role', 'nurse')
    })
    
    await page.goto('/jobs')
    await page.click('[data-testid="job-card"]')
    await page.click('[data-testid="apply-btn"]')
    
    // Try to submit empty application
    await page.click('[data-testid="submit-application-btn"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="message-error"]')).toContainText('Message must be at least 10 characters')
    
    // Test invalid quote amounts
    await page.click('[data-testid="add-quote-btn"]')
    await page.fill('[data-testid="quote-amount-0"]', '-100')
    
    await page.click('[data-testid="submit-application-btn"]')
    await expect(page.locator('[data-testid="quote-error"]')).toContainText('Amount must be non-negative')
  })

  test('should complete full job lifecycle', async ({ page }) => {
    // This test simulates the complete flow from job creation to completion
    
    // 1. Organizer creates job
    await page.addInitScript(() => {
      window.localStorage.setItem('test-user-role', 'organizer')
    })
    
    await page.goto('/jobs/new')
    
    // Create and publish job (abbreviated form filling)
    await page.fill('[data-testid="job-title"]', 'Full Lifecycle Test Event')
    await page.fill('[data-testid="job-description"]', 'A comprehensive test event for the full job lifecycle')
    await page.click('[data-testid="category-soccer"]')
    await page.selectOption('[data-testid="prefecture-select"]', '東京都')
    await page.selectOption('[data-testid="city-select"]', '渋谷区')
    await page.fill('[data-testid="venue-input"]', 'Lifecycle Test Stadium')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    await page.fill('[data-testid="start-date"]', tomorrowStr)
    await page.fill('[data-testid="start-time"]', '10:00')
    await page.fill('[data-testid="end-date"]', tomorrowStr)
    await page.fill('[data-testid="end-time"]', '18:00')
    
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    await page.fill('[data-testid="deadline-date"]', todayStr)
    await page.fill('[data-testid="deadline-time"]', '23:59')
    
    await page.fill('[data-testid="headcount"]', '1')
    await page.selectOption('[data-testid="compensation-type"]', 'fixed')
    await page.fill('[data-testid="compensation-amount"]', '50000')
    
    await page.click('[data-testid="publish-btn"]')
    
    // Verify job is created
    await expect(page.locator('[data-testid="job-title"]')).toContainText('Full Lifecycle Test Event')
    
    const jobUrl = page.url()
    
    // 2. Switch to nurse and apply for job
    await page.addInitScript(() => {
      window.localStorage.setItem('test-user-role', 'nurse')
    })
    
    await page.goto(jobUrl)
    await page.click('[data-testid="apply-btn"]')
    
    await page.fill('[data-testid="application-message"]', 'I am highly qualified for this position with 5 years of sports medicine experience.')
    await page.click('[data-testid="submit-application-btn"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Application submitted successfully')
    
    // 3. Switch back to organizer to view applications
    await page.addInitScript(() => {
      window.localStorage.setItem('test-user-role', 'organizer')
    })
    
    await page.goto('/dashboard')
    await page.click('[data-testid="job-applications-link"]')
    
    // Verify application is visible
    await expect(page.locator('[data-testid="application-card"]')).toBeVisible()
    
    // 4. Send job offer (this would be implemented in messaging system)
    await page.click('[data-testid="send-offer-btn"]')
    await expect(page.locator('[data-testid="offer-sent-message"]')).toContainText('Job offer sent')
    
    // Note: Full lifecycle would continue with:
    // - Contract acceptance
    // - Escrow creation
    // - Event day attendance
    // - Reviews and ratings
    // - Final payment processing
    // These steps will be implemented as the corresponding features are built
  })
})

test.describe('Job Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Set up nurse role for job browsing
    await page.addInitScript(() => {
      window.localStorage.setItem('test-user-role', 'nurse')
    })
    
    await page.goto('/jobs')
  })

  test('should filter jobs by location', async ({ page }) => {
    // Verify page loads
    await expect(page).toHaveTitle(/Job Listings/)
    
    // Open location filter
    await page.click('[data-testid="location-filter-btn"]')
    
    // Select prefecture
    await page.selectOption('[data-testid="prefecture-filter"]', '東京都')
    
    // Verify city options update based on prefecture
    await expect(page.locator('[data-testid="city-filter"]')).toBeEnabled()
    
    // Select city
    await page.selectOption('[data-testid="city-filter"]', '渋谷区')
    
    // Apply filters
    await page.click('[data-testid="apply-location-filter"]')
    
    // Verify URL contains filter parameters
    await expect(page).toHaveURL(/prefecture=東京都/)
    await expect(page).toHaveURL(/city=渋谷区/)
    
    // Verify filter is applied to results
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('東京都')
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('渋谷区')
    
    // Verify job cards show correct location
    const jobCards = page.locator('[data-testid="job-card"]')
    const firstCard = jobCards.first()
    await expect(firstCard.locator('[data-testid="job-location"]')).toContainText('東京都')
    
    // Test clearing location filter
    await page.click('[data-testid="clear-location-filter"]')
    await expect(page.locator('[data-testid="active-filters"]')).not.toContainText('東京都')
  })

  test('should filter jobs by sport category', async ({ page }) => {
    // Open category filter
    await page.click('[data-testid="category-filter-btn"]')
    
    // Verify category options are available
    await expect(page.locator('[data-testid="category-soccer"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-basketball"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-tennis"]')).toBeVisible()
    
    // Select multiple categories
    await page.click('[data-testid="category-soccer"]')
    await page.click('[data-testid="category-basketball"]')
    
    // Apply category filter
    await page.click('[data-testid="apply-category-filter"]')
    
    // Verify URL contains category parameters
    await expect(page).toHaveURL(/categories=/)
    
    // Verify active filters display
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('サッカー')
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('バスケットボール')
    
    // Verify job cards show correct categories
    const jobCards = page.locator('[data-testid="job-card"]')
    const count = await jobCards.count()
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = jobCards.nth(i)
      const categories = card.locator('[data-testid="job-categories"]')
      
      // Each job should have at least one of the selected categories
      const hasSelectedCategory = await categories.locator('text=/サッカー|バスケットボール/').count() > 0
      expect(hasSelectedCategory).toBe(true)
    }
    
    // Test removing individual category filter
    await page.click('[data-testid="remove-category-soccer"]')
    await expect(page.locator('[data-testid="active-filters"]')).not.toContainText('サッカー')
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('バスケットボール')
  })

  test('should filter jobs by compensation range', async ({ page }) => {
    // Open compensation filter
    await page.click('[data-testid="compensation-filter-btn"]')
    
    // Set compensation type
    await page.selectOption('[data-testid="compensation-type-filter"]', 'hourly')
    
    // Set minimum compensation
    await page.fill('[data-testid="min-compensation"]', '2500')
    
    // Set maximum compensation
    await page.fill('[data-testid="max-compensation"]', '4000')
    
    // Apply compensation filter
    await page.click('[data-testid="apply-compensation-filter"]')
    
    // Verify URL contains compensation parameters
    await expect(page).toHaveURL(/minCompensation=2500/)
    await expect(page).toHaveURL(/maxCompensation=4000/)
    await expect(page).toHaveURL(/compensationType=hourly/)
    
    // Verify active filters display
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('¥2,500 - ¥4,000')
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('時給')
    
    // Verify job cards show compensation within range
    const jobCards = page.locator('[data-testid="job-card"]')
    const count = await jobCards.count()
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = jobCards.nth(i)
      const compensationText = await card.locator('[data-testid="job-compensation"]').textContent()
      
      // Extract amount from compensation text (assuming format like "¥3,000/時間")
      const match = compensationText?.match(/¥([\d,]+)/)
      if (match) {
        const amount = parseInt(match[1].replace(',', ''))
        expect(amount).toBeGreaterThanOrEqual(2500)
        expect(amount).toBeLessThanOrEqual(4000)
      }
    }
  })

  test('should filter jobs by date range', async ({ page }) => {
    // Open date filter
    await page.click('[data-testid="date-filter-btn"]')
    
    // Set start date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    await page.fill('[data-testid="start-date-filter"]', tomorrowStr)
    
    // Set end date (next week)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]
    
    await page.fill('[data-testid="end-date-filter"]', nextWeekStr)
    
    // Apply date filter
    await page.click('[data-testid="apply-date-filter"]')
    
    // Verify URL contains date parameters
    await expect(page).toHaveURL(/startDate=/)
    await expect(page).toHaveURL(/endDate=/)
    
    // Verify active filters display
    await expect(page.locator('[data-testid="active-filters"]')).toContainText(tomorrowStr)
    await expect(page.locator('[data-testid="active-filters"]')).toContainText(nextWeekStr)
  })

  test('should sort jobs by date and compensation', async ({ page }) => {
    // Test sorting by newest first (default)
    await page.selectOption('[data-testid="sort-select"]', 'newest')
    
    // Verify URL contains sort parameter
    await expect(page).toHaveURL(/sort=newest/)
    
    // Get job dates and verify they are in descending order
    const jobDates = await page.locator('[data-testid="job-date"]').allTextContents()
    
    // Test sorting by deadline
    await page.selectOption('[data-testid="sort-select"]', 'deadline')
    await expect(page).toHaveURL(/sort=deadline/)
    
    // Wait for results to update
    await page.waitForTimeout(1000)
    
    // Test sorting by compensation (high to low)
    await page.selectOption('[data-testid="sort-select"]', 'compensation_high')
    await expect(page).toHaveURL(/sort=compensation_high/)
    
    // Verify compensation amounts are in descending order
    const compensationElements = page.locator('[data-testid="job-compensation"]')
    const count = await compensationElements.count()
    
    if (count >= 2) {
      const firstAmount = await compensationElements.first().textContent()
      const secondAmount = await compensationElements.nth(1).textContent()
      
      // Extract numeric values for comparison
      const firstValue = parseInt(firstAmount?.match(/¥([\d,]+)/)?.[1]?.replace(',', '') || '0')
      const secondValue = parseInt(secondAmount?.match(/¥([\d,]+)/)?.[1]?.replace(',', '') || '0')
      
      expect(firstValue).toBeGreaterThanOrEqual(secondValue)
    }
    
    // Test sorting by compensation (low to high)
    await page.selectOption('[data-testid="sort-select"]', 'compensation_low')
    await expect(page).toHaveURL(/sort=compensation_low/)
    
    // Wait for results to update
    await page.waitForTimeout(1000)
    
    // Verify compensation amounts are in ascending order
    if (count >= 2) {
      const firstAmount = await compensationElements.first().textContent()
      const secondAmount = await compensationElements.nth(1).textContent()
      
      const firstValue = parseInt(firstAmount?.match(/¥([\d,]+)/)?.[1]?.replace(',', '') || '0')
      const secondValue = parseInt(secondAmount?.match(/¥([\d,]+)/)?.[1]?.replace(',', '') || '0')
      
      expect(firstValue).toBeLessThanOrEqual(secondValue)
    }
  })

  test('should handle text search', async ({ page }) => {
    // Test basic text search
    await page.fill('[data-testid="search-input"]', 'soccer')
    await page.click('[data-testid="search-btn"]')
    
    // Verify URL contains search parameter
    await expect(page).toHaveURL(/search=soccer/)
    
    // Verify active filters display
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('soccer')
    
    // Verify search results contain the search term
    const jobCards = page.locator('[data-testid="job-card"]')
    const count = await jobCards.count()
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = jobCards.nth(i)
      const title = await card.locator('[data-testid="job-title"]').textContent()
      const description = await card.locator('[data-testid="job-description"]').textContent()
      
      const containsSearchTerm = 
        title?.toLowerCase().includes('soccer') || 
        description?.toLowerCase().includes('soccer') ||
        title?.includes('サッカー') ||
        description?.includes('サッカー')
      
      expect(containsSearchTerm).toBe(true)
    }
    
    // Test clearing search
    await page.click('[data-testid="clear-search"]')
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue('')
    await expect(page.locator('[data-testid="active-filters"]')).not.toContainText('soccer')
  })

  test('should combine multiple filters', async ({ page }) => {
    // Apply multiple filters simultaneously
    
    // Location filter
    await page.click('[data-testid="location-filter-btn"]')
    await page.selectOption('[data-testid="prefecture-filter"]', '東京都')
    await page.click('[data-testid="apply-location-filter"]')
    
    // Category filter
    await page.click('[data-testid="category-filter-btn"]')
    await page.click('[data-testid="category-soccer"]')
    await page.click('[data-testid="apply-category-filter"]')
    
    // Compensation filter
    await page.click('[data-testid="compensation-filter-btn"]')
    await page.fill('[data-testid="min-compensation"]', '3000')
    await page.click('[data-testid="apply-compensation-filter"]')
    
    // Text search
    await page.fill('[data-testid="search-input"]', 'stadium')
    await page.click('[data-testid="search-btn"]')
    
    // Verify all filters are active
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('東京都')
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('サッカー')
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('¥3,000+')
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('stadium')
    
    // Verify URL contains all parameters
    await expect(page).toHaveURL(/prefecture=東京都/)
    await expect(page).toHaveURL(/categories=/)
    await expect(page).toHaveURL(/minCompensation=3000/)
    await expect(page).toHaveURL(/search=stadium/)
    
    // Test clearing all filters
    await page.click('[data-testid="clear-all-filters"]')
    
    // Verify all filters are cleared
    await expect(page.locator('[data-testid="active-filters"]')).not.toContainText('東京都')
    await expect(page.locator('[data-testid="active-filters"]')).not.toContainText('サッカー')
    await expect(page.locator('[data-testid="active-filters"]')).not.toContainText('¥3,000+')
    await expect(page.locator('[data-testid="active-filters"]')).not.toContainText('stadium')
  })

  test('should handle pagination', async ({ page }) => {
    // Verify pagination controls exist
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
    
    // Test page navigation
    const nextPageBtn = page.locator('[data-testid="next-page"]')
    
    if (await nextPageBtn.isEnabled()) {
      await nextPageBtn.click()
      
      // Verify URL contains page parameter
      await expect(page).toHaveURL(/page=2/)
      
      // Verify page indicator updates
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2')
      
      // Test previous page
      await page.click('[data-testid="prev-page"]')
      await expect(page).toHaveURL(/page=1/)
      await expect(page.locator('[data-testid="current-page"]')).toContainText('1')
    }
    
    // Test page size selection
    await page.selectOption('[data-testid="page-size-select"]', '10')
    await expect(page).toHaveURL(/limit=10/)
    
    // Verify job cards count matches page size
    const jobCards = page.locator('[data-testid="job-card"]')
    const count = await jobCards.count()
    expect(count).toBeLessThanOrEqual(10)
  })

  test('should show no results message when filters match nothing', async ({ page }) => {
    // Apply very restrictive filters that should return no results
    await page.fill('[data-testid="search-input"]', 'nonexistentjobtype12345')
    await page.click('[data-testid="search-btn"]')
    
    // Verify no results message is displayed
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="no-results"]')).toContainText('No jobs found')
    
    // Verify suggestions are provided
    await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible()
    await expect(page.locator('[data-testid="clear-filters-suggestion"]')).toBeVisible()
  })
})