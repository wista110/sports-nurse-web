import { test, expect } from '@playwright/test';
import { getTestJobs } from '../setup/test-database';

test.describe('看護師のユーザージャーニー', () => {
  test.use({ storageState: 'tests/e2e/.auth/nurse.json' });

  test('看護師が求人を検索して応募するまでの完全なフロー', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/ダッシュボード/);
    
    // 2. 求人一覧ページに移動
    await page.click('text=求人を探す');
    await expect(page).toHaveURL('/jobs');
    
    // 3. 求人を検索
    await page.fill('input[placeholder*="求人を検索"]', 'マラソン');
    await page.click('button:has-text("検索")');
    
    // 4. 検索結果を確認
    await expect(page.locator('.job-card')).toHaveCount({ min: 1 });
    
    // 5. 求人詳細を表示
    await page.click('.job-card:first-child a:has-text("詳細を見る")');
    await expect(page).toHaveURL(/\/jobs\/[^\/]+$/);
    
    // 6. 求人詳細の内容を確認
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=開催日時')).toBeVisible();
    await expect(page.locator('text=報酬')).toBeVisible();
    await expect(page.locator('text=必要なスキル')).toBeVisible();
    
    // 7. 応募フォームを開く
    await page.click('button:has-text("応募する")');
    
    // 8. 応募フォームに入力
    await page.fill('textarea[name="message"]', 'この求人に興味があります。マラソン大会での医療サポート経験があります。');
    await page.fill('input[name="customQuote"]', '28000');
    
    // 9. 応募を送信
    await page.click('button:has-text("応募を送信")');
    
    // 10. 応募完了を確認
    await expect(page.locator('text=応募が完了しました')).toBeVisible();
    
    // 11. 応募一覧ページで確認
    await page.goto('/applications');
    await expect(page.locator('.application-card')).toHaveCount({ min: 1 });
    await expect(page.locator('text=応募中')).toBeVisible();
  });

  test('看護師がプロフィールを更新する', async ({ page }) => {
    // 1. プロフィールページにアクセス
    await page.goto('/profile');
    await expect(page).toHaveTitle(/プロフィール/);
    
    // 2. プロフィール編集ページに移動
    await page.click('text=プロフィールを編集');
    await expect(page).toHaveURL('/profile/edit');
    
    // 3. プロフィール情報を更新
    await page.fill('input[name="name"]', '田中 花子（更新済み）');
    await page.fill('textarea[name="bio"]', '更新されたプロフィール説明です。');
    
    // 4. スキルを追加
    await page.click('text=スキルを追加');
    await page.check('input[value="メンタルヘルスケア"]');
    
    // 5. 変更を保存
    await page.click('button:has-text("保存")');
    
    // 6. 更新完了を確認
    await expect(page.locator('text=プロフィールが更新されました')).toBeVisible();
    
    // 7. プロフィールページで変更を確認
    await page.goto('/profile');
    await expect(page.locator('text=田中 花子（更新済み）')).toBeVisible();
    await expect(page.locator('text=更新されたプロフィール説明です。')).toBeVisible();
  });

  test('看護師がメッセージを送受信する', async ({ page }) => {
    // 1. メッセージ一覧ページにアクセス
    await page.goto('/inbox');
    await expect(page).toHaveTitle(/メッセージ/);
    
    // 2. 既存のスレッドがある場合はクリック
    const threadExists = await page.locator('.thread-item').count() > 0;
    
    if (threadExists) {
      await page.click('.thread-item:first-child');
      
      // 3. メッセージを送信
      await page.fill('textarea[placeholder*="メッセージを入力"]', 'テストメッセージです。よろしくお願いします。');
      await page.click('button:has-text("送信")');
      
      // 4. メッセージが送信されたことを確認
      await expect(page.locator('text=テストメッセージです。よろしくお願いします。')).toBeVisible();
    }
  });
});