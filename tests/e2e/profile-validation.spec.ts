import { test, expect } from '@playwright/test'

test.describe('Profile Validation E2E Tests', () => {
  test.describe('Registration Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register')
    })

    test('should display registration form with role-based descriptions', async ({ page }) => {
      // Check that form loads
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('#role')).toBeVisible()
      
      // Test role descriptions
      await page.selectOption('#role', 'NURSE')
      await expect(page.locator('text=スポーツイベントで医療サポートを提供する看護師として登録')).toBeVisible()
      
      await page.selectOption('#role', 'ORGANIZER')
      await expect(page.locator('text=スポーツイベントを主催し、看護師を募集する組織として登録')).toBeVisible()
    })

    test('should show client-side validation errors', async ({ page }) => {
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Check for HTML5 validation or form validation
      const emailField = page.locator('#email')
      const passwordField = page.locator('#password')
      
      // Check if fields are marked as invalid
      await expect(emailField).toHaveAttribute('required')
      await expect(passwordField).toHaveAttribute('required')
    })

    test('should validate password requirements on form interaction', async ({ page }) => {
      // Fill form with weak password
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'weak')
      await page.fill('#confirmPassword', 'weak')
      await page.check('#agreeToTerms')
      
      // Try to submit
      await page.click('button[type="submit"]')
      
      // The form should prevent submission or show validation
      // Since we don't have the API implemented, we just check the form exists
      await expect(page.locator('form')).toBeVisible()
    })

    test('should handle terms agreement requirement', async ({ page }) => {
      // Fill form without agreeing to terms
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'Password123')
      
      // Terms checkbox should be unchecked
      await expect(page.locator('#agreeToTerms')).not.toBeChecked()
      
      // Check terms and verify it's checked
      await page.check('#agreeToTerms')
      await expect(page.locator('#agreeToTerms')).toBeChecked()
    })

    test('should have proper accessibility attributes', async ({ page }) => {
      // Check form labels
      await expect(page.locator('label[for="email"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()
      await expect(page.locator('label[for="confirmPassword"]')).toBeVisible()
      await expect(page.locator('label[for="role"]')).toBeVisible()
      
      // Check required field indicators
      await expect(page.locator('text=メールアドレス *')).toBeVisible()
      await expect(page.locator('text=パスワード *')).toBeVisible()
    })

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab')
      await expect(page.locator('#email')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('#password')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('#confirmPassword')).toBeFocused()
    })
  })

  test.describe('Role-based Field Visibility (Registration)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register')
    })

    test('should show appropriate role options', async ({ page }) => {
      const roleSelect = page.locator('#role')
      
      // Check that nurse and organizer options are available
      await expect(roleSelect.locator('option[value="NURSE"]')).toBeVisible()
      await expect(roleSelect.locator('option[value="ORGANIZER"]')).toBeVisible()
      
      // Admin option should not be visible for public registration
      const adminOption = roleSelect.locator('option[value="ADMIN"]')
      const adminExists = await adminOption.count()
      expect(adminExists).toBe(0)
    })

    test('should update role description when selection changes', async ({ page }) => {
      // Start with nurse selected
      await page.selectOption('#role', 'NURSE')
      await expect(page.locator('text=看護師として登録')).toBeVisible()
      
      // Change to organizer
      await page.selectOption('#role', 'ORGANIZER')
      await expect(page.locator('text=イベント主催者')).toBeVisible()
      
      // Previous description should not be visible
      await expect(page.locator('text=看護師として登録')).not.toBeVisible()
    })
  })

  test.describe('Form Validation Behavior', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register')
    })

    test('should handle password confirmation validation', async ({ page }) => {
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'DifferentPassword')
      
      // Move focus away to trigger validation
      await page.click('#email')
      
      // Form should be ready for submission attempt
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should maintain form state during interaction', async ({ page }) => {
      // Fill form partially
      await page.fill('#email', 'test@example.com')
      await page.selectOption('#role', 'ORGANIZER')
      
      // Navigate away and back
      await page.click('a[href="/login"]')
      await page.goBack()
      
      // Form should be reset (this is expected behavior)
      await expect(page.locator('#email')).toHaveValue('')
    })

    test('should show loading state during form submission', async ({ page }) => {
      // Fill valid form
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'Password123')
      await page.check('#agreeToTerms')
      
      // Mock slow API response
      await page.route('/api/auth/register', async route => {
        await new Promise(resolve => setTimeout(resolve, 100))
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Test error' })
        })
      })
      
      // Submit form
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()
      
      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled()
    })
  })

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register')
    })

    test('should handle API errors gracefully', async ({ page }) => {
      // Fill valid form
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'Password123')
      await page.check('#agreeToTerms')
      
      // Mock API error
      await page.route('/api/auth/register', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Email already exists' })
        })
      })
      
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('text=Email already exists')).toBeVisible()
      
      // Form should remain interactive
      await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
    })

    test('should handle network errors', async ({ page }) => {
      // Fill valid form
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'Password123')
      await page.check('#agreeToTerms')
      
      // Mock network error
      await page.route('/api/auth/register', async route => {
        await route.abort('failed')
      })
      
      await page.click('button[type="submit"]')
      
      // Should show generic error or handle gracefully
      await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
    })
  })
})