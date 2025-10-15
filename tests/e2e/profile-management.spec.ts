import { test, expect } from '@playwright/test'

test.describe('Profile Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test.describe('User Registration Flow', () => {
    test('should display registration form with all required fields', async ({ page }) => {
      await page.goto('/register')
      
      // Check that all form fields are present
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('#confirmPassword')).toBeVisible()
      await expect(page.locator('#role')).toBeVisible()
      await expect(page.locator('#agreeToTerms')).toBeVisible()
      
      // Check submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toContainText('アカウントを作成')
    })

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.goto('/register')
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=有効なメールアドレスを入力してください')).toBeVisible()
      await expect(page.locator('text=パスワードは8文字以上で入力してください')).toBeVisible()
    })

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/register')
      
      // Fill form with weak password
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'weak')
      await page.fill('#confirmPassword', 'weak')
      await page.check('#agreeToTerms')
      
      await page.click('button[type="submit"]')
      
      // Should show password validation error
      await expect(page.locator('text=パスワードは大文字、小文字、数字をそれぞれ1文字以上含む必要があります')).toBeVisible()
    })

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/register')
      
      // Fill form with mismatched passwords
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'DifferentPassword123')
      await page.check('#agreeToTerms')
      
      await page.click('button[type="submit"]')
      
      // Should show password mismatch error
      await expect(page.locator('text=パスワードが一致しません')).toBeVisible()
    })

    test('should require terms agreement', async ({ page }) => {
      await page.goto('/register')
      
      // Fill form without agreeing to terms
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'Password123')
      // Don't check terms agreement
      
      await page.click('button[type="submit"]')
      
      // Should show terms agreement error
      await expect(page.locator('text=利用規約に同意する必要があります')).toBeVisible()
    })

    test('should show role descriptions when role is selected', async ({ page }) => {
      await page.goto('/register')
      
      // Select nurse role
      await page.selectOption('#role', 'NURSE')
      await expect(page.locator('text=スポーツイベントで医療サポートを提供する看護師として登録')).toBeVisible()
      
      // Select organizer role
      await page.selectOption('#role', 'ORGANIZER')
      await expect(page.locator('text=スポーツイベントを主催し、看護師を募集する組織として登録')).toBeVisible()
    })

    test('should handle successful registration flow', async ({ page }) => {
      await page.goto('/register')
      
      // Fill valid registration form
      await page.fill('#email', 'newuser@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'Password123')
      await page.selectOption('#role', 'NURSE')
      await page.check('#agreeToTerms')
      
      // Mock successful API response
      await page.route('/api/auth/register', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      await page.click('button[type="submit"]')
      
      // Should redirect to profile setup
      await expect(page).toHaveURL('/profile/setup')
    })

    test('should handle registration API errors', async ({ page }) => {
      await page.goto('/register')
      
      // Fill valid form
      await page.fill('#email', 'existing@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'Password123')
      await page.check('#agreeToTerms')
      
      // Mock API error response
      await page.route('/api/auth/register', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'このメールアドレスは既に使用されています' })
        })
      })
      
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('text=このメールアドレスは既に使用されています')).toBeVisible()
    })
  })

  test.describe('Profile Setup Flow', () => {
    test('should display nurse profile setup form', async ({ page }) => {
      await page.goto('/profile/setup?role=NURSE')
      
      // Check nurse-specific fields are present
      await expect(page.locator('#name')).toBeVisible()
      await expect(page.locator('#licenseNumber')).toBeVisible()
      await expect(page.locator('text=スキル・専門分野')).toBeVisible()
      await expect(page.locator('#prefecture')).toBeVisible()
      await expect(page.locator('#city')).toBeVisible()
    })

    test('should display organizer profile setup form', async ({ page }) => {
      await page.goto('/profile/setup?role=ORGANIZER')
      
      // Check organizer-specific fields are present
      await expect(page.locator('#organizationName')).toBeVisible()
      await expect(page.locator('#organizationType')).toBeVisible()
      await expect(page.locator('#representativeName')).toBeVisible()
      await expect(page.locator('#prefecture')).toBeVisible()
      await expect(page.locator('#city')).toBeVisible()
    })

    test('should validate nurse profile form', async ({ page }) => {
      await page.goto('/profile/setup?role=NURSE')
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=名前は必須です')).toBeVisible()
      await expect(page.locator('text=看護師免許番号は必須です')).toBeVisible()
      await expect(page.locator('text=少なくとも1つのスキルを選択してください')).toBeVisible()
    })

    test('should validate organizer profile form', async ({ page }) => {
      await page.goto('/profile/setup?role=ORGANIZER')
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=名前は必須です')).toBeVisible()
      await expect(page.locator('text=組織名は必須です')).toBeVisible()
      await expect(page.locator('text=代表者名は必須です')).toBeVisible()
    })

    test('should handle nurse skills selection', async ({ page }) => {
      await page.goto('/profile/setup?role=NURSE')
      
      // Select some skills
      await page.check('input[id="skill-応急処置"]')
      await page.check('input[id="skill-外傷処置"]')
      await page.check('input[id="skill-心肺蘇生法"]')
      
      // Check that skill counter updates
      await expect(page.locator('text=選択済み: 3/10')).toBeVisible()
    })

    test('should prevent selecting too many skills', async ({ page }) => {
      await page.goto('/profile/setup?role=NURSE')
      
      // Try to select more than 10 skills
      const skillCheckboxes = await page.locator('input[id^="skill-"]').all()
      
      // Select first 11 skills (should be limited to 10)
      for (let i = 0; i < Math.min(11, skillCheckboxes.length); i++) {
        await skillCheckboxes[i].check()
      }
      
      // Fill other required fields
      await page.fill('#name', 'テスト 看護師')
      await page.fill('#licenseNumber', 'RN-123456789')
      await page.fill('#city', '新宿区')
      
      await page.click('button[type="submit"]')
      
      // Should show validation error if more than 10 skills selected
      const selectedSkills = await page.locator('input[id^="skill-"]:checked').count()
      if (selectedSkills > 10) {
        await expect(page.locator('text=スキルは最大10個まで選択できます')).toBeVisible()
      }
    })

    test('should handle successful profile setup', async ({ page }) => {
      await page.goto('/profile/setup?role=NURSE')
      
      // Fill valid nurse profile
      await page.fill('#name', 'テスト 看護師')
      await page.fill('#licenseNumber', 'RN-123456789')
      await page.fill('#city', '新宿区')
      await page.selectOption('#prefecture', '東京都')
      await page.check('input[id="skill-応急処置"]')
      
      // Mock successful API response
      await page.route('/api/profile', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      await page.click('button[type="submit"]')
      
      // Should redirect to dashboard or profile page
      await page.waitForURL(url => url.pathname !== '/profile/setup')
    })
  })

  test.describe('Profile Edit Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication state
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'NURSE'
        }))
      })
    })

    test('should display profile edit form with existing data', async ({ page }) => {
      // Mock API response with existing profile data
      await page.route('/api/profile', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              name: 'テスト 看護師',
              licenseNumber: 'RN-123456789',
              city: '新宿区',
              prefecture: '東京都',
              skills: ['応急処置', '外傷処置']
            })
          })
        }
      })
      
      await page.goto('/profile/edit')
      
      // Check that form is pre-filled with existing data
      await expect(page.locator('#name')).toHaveValue('テスト 看護師')
      await expect(page.locator('#licenseNumber')).toHaveValue('RN-123456789')
      await expect(page.locator('#city')).toHaveValue('新宿区')
      await expect(page.locator('#prefecture')).toHaveValue('東京都')
    })

    test('should handle profile update', async ({ page }) => {
      await page.goto('/profile/edit')
      
      // Update profile information
      await page.fill('#name', 'Updated Name')
      await page.fill('#city', '渋谷区')
      
      // Mock successful update response
      await page.route('/api/profile', async route => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        }
      })
      
      await page.click('button[type="submit"]')
      
      // Should show success message or redirect
      await expect(page.locator('text=プロフィールが更新されました')).toBeVisible()
    })
  })

  test.describe('Role-based Profile Field Visibility', () => {
    test('should show nurse-specific fields only for nurses', async ({ page }) => {
      await page.goto('/profile/setup?role=NURSE')
      
      // Nurse-specific fields should be visible
      await expect(page.locator('#licenseNumber')).toBeVisible()
      await expect(page.locator('text=スキル・専門分野')).toBeVisible()
      await expect(page.locator('#yearsOfExperience')).toBeVisible()
      
      // Organizer-specific fields should not be visible
      await expect(page.locator('#organizationName')).not.toBeVisible()
      await expect(page.locator('#organizationType')).not.toBeVisible()
      await expect(page.locator('#representativeName')).not.toBeVisible()
    })

    test('should show organizer-specific fields only for organizers', async ({ page }) => {
      await page.goto('/profile/setup?role=ORGANIZER')
      
      // Organizer-specific fields should be visible
      await expect(page.locator('#organizationName')).toBeVisible()
      await expect(page.locator('#organizationType')).toBeVisible()
      await expect(page.locator('#representativeName')).toBeVisible()
      await expect(page.locator('#businessRegistrationNumber')).toBeVisible()
      
      // Nurse-specific fields should not be visible
      await expect(page.locator('#licenseNumber')).not.toBeVisible()
      await expect(page.locator('text=スキル・専門分野')).not.toBeVisible()
    })

    test('should show common fields for all roles', async ({ page }) => {
      const roles = ['NURSE', 'ORGANIZER']
      
      for (const role of roles) {
        await page.goto(`/profile/setup?role=${role}`)
        
        // Common fields should be visible for all roles
        await expect(page.locator('#name')).toBeVisible()
        await expect(page.locator('#phone')).toBeVisible()
        await expect(page.locator('#prefecture')).toBeVisible()
        await expect(page.locator('#city')).toBeVisible()
      }
    })
  })

  test.describe('Accessibility and UX', () => {
    test('should have proper form labels and accessibility attributes', async ({ page }) => {
      await page.goto('/register')
      
      // Check that form fields have proper labels
      await expect(page.locator('label[for="email"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()
      await expect(page.locator('label[for="confirmPassword"]')).toBeVisible()
      await expect(page.locator('label[for="role"]')).toBeVisible()
      
      // Check required field indicators
      await expect(page.locator('text=メールアドレス *')).toBeVisible()
      await expect(page.locator('text=パスワード *')).toBeVisible()
    })

    test('should handle keyboard navigation', async ({ page }) => {
      await page.goto('/register')
      
      // Tab through form fields
      await page.keyboard.press('Tab') // Email field
      await expect(page.locator('#email')).toBeFocused()
      
      await page.keyboard.press('Tab') // Password field
      await expect(page.locator('#password')).toBeFocused()
      
      await page.keyboard.press('Tab') // Confirm password field
      await expect(page.locator('#confirmPassword')).toBeFocused()
    })

    test('should show loading states during form submission', async ({ page }) => {
      await page.goto('/register')
      
      // Fill form
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'Password123')
      await page.fill('#confirmPassword', 'Password123')
      await page.check('#agreeToTerms')
      
      // Mock slow API response
      await page.route('/api/auth/register', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      // Click submit and check loading state
      await page.click('button[type="submit"]')
      await expect(page.locator('text=作成中...')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeDisabled()
    })
  })
})