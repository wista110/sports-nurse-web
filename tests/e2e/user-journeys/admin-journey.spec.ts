import { test, expect } from '@playwright/test';

test.describe('管理者のユーザージャーニー', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test('管理者がセキュリティダッシュボードを確認する', async ({ page }) => {
    // 1. 管理者ダッシュボードにアクセス
    await page.goto('/admin');
    await expect(page).toHaveTitle(/管理/);
    
    // 2. セキュリティ管理ページに移動
    await page.click('text=セキュリティ管理');
    await expect(page).toHaveURL('/admin/security');
    
    // 3. セキュリティダッシュボードの表示を確認
    await expect(page.locator('text=セキュリティダッシュボード')).toBeVisible();
    await expect(page.locator('text=総イベント数')).toBeVisible();
    await expect(page.locator('text=重大イベント')).toBeVisible();
    await expect(page.locator('text=ログイン失敗')).toBeVisible();
    
    // 4. 監査ログタブに切り替え
    await page.click('text=監査ログ');
    
    // 5. 監査ログの表示を確認
    await expect(page.locator('text=フィルター・検索')).toBeVisible();
    await expect(page.locator('input[placeholder*="アクション・ユーザーを検索"]')).toBeVisible();
    
    // 6. 監査ログをフィルタリング
    await page.selectOption('select:has-option[value="LOGIN"]', 'LOGIN');
    await expect(page.locator('.audit-log-item')).toHaveCount({ min: 0 });
  });

  test('管理者が支払い管理を行う', async ({ page }) => {
    // 1. 支払い管理ページにアクセス
    await page.goto('/admin/payments');
    await expect(page).toHaveTitle(/支払い管理/);
    
    // 2. 支払い処理タブの表示を確認
    await expect(page.locator('text=支払い処理')).toBeVisible();
    
    // 3. 支払い履歴タブに切り替え
    await page.click('text=支払い履歴');
    
    // 4. 支払い履歴の表示を確認
    await expect(page.locator('text=支払い履歴')).toBeVisible();
    
    // 5. レポートタブに切り替え
    await page.click('text=レポート');
    
    // 6. レポートの表示を確認
    await expect(page.locator('text=支払いレポート')).toBeVisible();
  });

  test('管理者がレビューを管理する', async ({ page }) => {
    // 1. レビュー管理ページにアクセス
    await page.goto('/admin/reviews');
    await expect(page).toHaveTitle(/レビュー管理/);
    
    // 2. レビュー一覧の表示を確認
    await expect(page.locator('text=レビュー管理')).toBeVisible();
    
    // 3. レビューがある場合の管理操作
    const reviewExists = await page.locator('.review-item').count() > 0;
    
    if (reviewExists) {
      // 4. レビュー詳細を確認
      await page.click('.review-item:first-child');
      
      // 5. レビューの承認/非承認操作
      const approveButton = page.locator('button:has-text("承認")');
      const rejectButton = page.locator('button:has-text("非承認")');
      
      if (await approveButton.isVisible()) {
        await approveButton.click();
        await expect(page.locator('text=レビューを承認しました')).toBeVisible();
      }
    }
  });

  test('管理者がユーザー管理を行う', async ({ page }) => {
    // 1. ユーザー管理ページにアクセス（存在する場合）
    await page.goto('/admin');
    
    // 2. ユーザー一覧の確認
    const userManagementExists = await page.locator('text=ユーザー管理').count() > 0;
    
    if (userManagementExists) {
      await page.click('text=ユーザー管理');
      
      // 3. ユーザー一覧の表示を確認
      await expect(page.locator('text=ユーザー一覧')).toBeVisible();
      
      // 4. ユーザー検索機能をテスト
      await page.fill('input[placeholder*="ユーザーを検索"]', 'nurse');
      await page.click('button:has-text("検索")');
    }
  });

  test('管理者が組織認証を管理する', async ({ page }) => {
    // 1. 組織認証管理ページにアクセス（存在する場合）
    await page.goto('/admin');
    
    const orgVerificationExists = await page.locator('text=組織認証').count() > 0;
    
    if (orgVerificationExists) {
      await page.click('text=組織認証');
      
      // 2. 未認証の組織一覧を確認
      await expect(page.locator('text=認証待ち')).toBeVisible();
      
      // 3. 組織認証の承認操作
      const pendingOrgs = await page.locator('.org-verification-item').count();
      
      if (pendingOrgs > 0) {
        await page.click('.org-verification-item:first-child button:has-text("承認")');
        await expect(page.locator('text=組織を認証しました')).toBeVisible();
      }
    }
  });
});