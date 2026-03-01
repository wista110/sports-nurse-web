import { test, expect } from '@playwright/test';

test.describe('主催者のユーザージャーニー', () => {
  test.use({ storageState: 'tests/e2e/.auth/organizer.json' });

  test('主催者が求人を作成して応募を管理するまでの完全なフロー', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/ダッシュボード/);
    
    // 2. 求人作成ページに移動
    await page.click('text=求人を作成');
    await expect(page).toHaveURL('/jobs/new');
    
    // 3. 求人情報を入力
    await page.fill('input[name="title"]', 'E2Eテスト用バスケットボール大会');
    await page.fill('textarea[name="description"]', 'テスト用の求人です。バスケットボール大会での医療サポートをお願いします。');
    
    // 4. 開催場所を入力
    await page.selectOption('select[name="prefecture"]', '東京都');
    await page.fill('input[name="city"]', 'テスト市');
    await page.fill('input[name="venue"]', 'テスト体育館');
    
    // 5. 日時を設定
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="startDate"]', `${dateString}T09:00`);
    await page.fill('input[name="endDate"]', `${dateString}T17:00`);
    
    // 6. カテゴリーと参加者数を設定
    await page.selectOption('select[name="category"]', 'バスケットボール');
    await page.fill('input[name="participantCount"]', '100');
    await page.fill('input[name="requiredNurses"]', '2');
    
    // 7. 報酬を設定
    await page.fill('input[name="compensation"]', '20000');
    await page.fill('input[name="transportationFee"]', '1000');
    await page.check('input[name="mealProvided"]');
    
    // 8. 必要なスキルを選択
    await page.check('input[value="救急処置"]');
    await page.check('input[value="外傷処理"]');
    
    // 9. 応募締切を設定
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);
    const deadlineString = deadline.toISOString().split('T')[0];
    await page.fill('input[name="applicationDeadline"]', `${deadlineString}T23:59`);
    
    // 10. 求人を下書き保存
    await page.click('button:has-text("下書き保存")');
    await expect(page.locator('text=求人が下書きとして保存されました')).toBeVisible();
    
    // 11. 求人を公開
    await page.click('button:has-text("公開")');
    await expect(page.locator('text=求人が公開されました')).toBeVisible();
    
    // 12. 求人一覧で確認
    await page.goto('/jobs');
    await expect(page.locator('text=E2Eテスト用バスケットボール大会')).toBeVisible();
  });

  test('主催者が応募を確認して承認する', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');
    
    // 2. 応募管理ページに移動（応募がある場合）
    const applicationsExist = await page.locator('text=新しい応募').count() > 0;
    
    if (applicationsExist) {
      await page.click('text=応募を確認');
      
      // 3. 応募詳細を確認
      await page.click('.application-card:first-child');
      
      // 4. 応募者のプロフィールを確認
      await expect(page.locator('text=応募者情報')).toBeVisible();
      await expect(page.locator('text=スキル')).toBeVisible();
      await expect(page.locator('text=経験年数')).toBeVisible();
      
      // 5. 応募を承認
      await page.click('button:has-text("承認")');
      
      // 6. 承認確認ダイアログで確定
      await page.click('button:has-text("承認する")');
      
      // 7. 承認完了を確認
      await expect(page.locator('text=応募を承認しました')).toBeVisible();
    }
  });

  test('主催者がジョブオファーを作成する', async ({ page }) => {
    // 1. 承認済み応募がある場合のテスト
    await page.goto('/dashboard');
    
    const approvedApplications = await page.locator('text=承認済み').count() > 0;
    
    if (approvedApplications) {
      // 2. 承認済み応募からオファー作成
      await page.click('text=オファーを作成');
      
      // 3. オファー内容を入力
      await page.fill('input[name="finalCompensation"]', '22000');
      await page.fill('textarea[name="terms"]', 'テスト用のオファー条件です。');
      
      // 4. オファーを送信
      await page.click('button:has-text("オファーを送信")');
      
      // 5. オファー送信完了を確認
      await expect(page.locator('text=オファーを送信しました')).toBeVisible();
    }
  });

  test('主催者がレビューを投稿する', async ({ page }) => {
    // 1. 完了した求人がある場合のレビューテスト
    await page.goto('/dashboard');
    
    const completedJobs = await page.locator('text=完了').count() > 0;
    
    if (completedJobs) {
      // 2. レビューページに移動
      await page.click('text=レビューを書く');
      
      // 3. レビューを入力
      await page.click('[data-rating="5"]'); // 5つ星評価
      await page.fill('textarea[name="comment"]', '素晴らしい対応でした。また機会があればお願いしたいです。');
      
      // 4. タグを選択
      await page.check('input[value="迅速対応"]');
      await page.check('input[value="的確判断"]');
      
      // 5. レビューを投稿
      await page.click('button:has-text("レビューを投稿")');
      
      // 6. 投稿完了を確認
      await expect(page.locator('text=レビューを投稿しました')).toBeVisible();
    }
  });
});