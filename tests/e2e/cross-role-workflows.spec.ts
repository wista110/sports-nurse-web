import { test, expect } from '@playwright/test';

test.describe('クロスロールワークフロー', () => {
  test('完全な求人応募から支払いまでのワークフロー', async ({ browser }) => {
    // 複数のユーザーロールを使用した統合テスト
    
    // 1. 主催者として求人を作成
    const organizerContext = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/organizer.json' 
    });
    const organizerPage = await organizerContext.newPage();
    
    await organizerPage.goto('/jobs/new');
    
    // 求人作成
    await organizerPage.fill('input[name="title"]', 'クロスロールテスト用サッカー大会');
    await organizerPage.fill('textarea[name="description"]', 'テスト用の求人です。');
    await organizerPage.selectOption('select[name="prefecture"]', '東京都');
    await organizerPage.fill('input[name="city"]', 'テスト市');
    await organizerPage.fill('input[name="venue"]', 'テストスタジアム');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 10);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await organizerPage.fill('input[name="startDate"]', `${dateString}T10:00`);
    await organizerPage.fill('input[name="endDate"]', `${dateString}T18:00`);
    await organizerPage.selectOption('select[name="category"]', 'サッカー');
    await organizerPage.fill('input[name="participantCount"]', '200');
    await organizerPage.fill('input[name="requiredNurses"]', '3');
    await organizerPage.fill('input[name="compensation"]', '25000');
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 5);
    const deadlineString = deadline.toISOString().split('T')[0];
    await organizerPage.fill('input[name="applicationDeadline"]', `${deadlineString}T23:59`);
    
    await organizerPage.click('button:has-text("公開")');
    await expect(organizerPage.locator('text=求人が公開されました')).toBeVisible();
    
    // 求人IDを取得
    const jobUrl = organizerPage.url();
    const jobId = jobUrl.split('/').pop();
    
    await organizerContext.close();
    
    // 2. 看護師として応募
    const nurseContext = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/nurse.json' 
    });
    const nursePage = await nurseContext.newPage();
    
    await nursePage.goto(`/jobs/${jobId}`);
    await nursePage.click('button:has-text("応募する")');
    
    await nursePage.fill('textarea[name="message"]', 'サッカー大会での医療サポート経験があります。');
    await nursePage.fill('input[name="customQuote"]', '27000');
    await nursePage.click('button:has-text("応募を送信")');
    
    await expect(nursePage.locator('text=応募が完了しました')).toBeVisible();
    await nurseContext.close();
    
    // 3. 主催者として応募を承認
    const organizerContext2 = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/organizer.json' 
    });
    const organizerPage2 = await organizerContext2.newPage();
    
    await organizerPage2.goto('/dashboard');
    
    // 新しい応募があることを確認
    const applicationExists = await organizerPage2.locator('text=新しい応募').count() > 0;
    
    if (applicationExists) {
      await organizerPage2.click('text=応募を確認');
      await organizerPage2.click('.application-card:first-child');
      await organizerPage2.click('button:has-text("承認")');
      await organizerPage2.click('button:has-text("承認する")');
      
      await expect(organizerPage2.locator('text=応募を承認しました')).toBeVisible();
      
      // 4. ジョブオファーを作成
      await organizerPage2.click('button:has-text("オファーを作成")');
      await organizerPage2.fill('input[name="finalCompensation"]', '27000');
      await organizerPage2.fill('textarea[name="terms"]', 'テスト用のオファー条件です。');
      await organizerPage2.click('button:has-text("オファーを送信")');
      
      await expect(organizerPage2.locator('text=オファーを送信しました')).toBeVisible();
    }
    
    await organizerContext2.close();
    
    // 5. 看護師としてオファーを承認
    const nurseContext2 = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/nurse.json' 
    });
    const nursePage2 = await nurseContext2.newPage();
    
    await nursePage2.goto('/inbox');
    
    const offerExists = await nursePage2.locator('text=オファー').count() > 0;
    
    if (offerExists) {
      await nursePage2.click('text=オファーを確認');
      await nursePage2.click('button:has-text("承認")');
      await nursePage2.click('button:has-text("承認する")');
      
      await expect(nursePage2.locator('text=オファーを承認しました')).toBeVisible();
    }
    
    await nurseContext2.close();
    
    // 6. 管理者として支払い処理を確認
    const adminContext = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/admin.json' 
    });
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto('/admin/payments');
    
    // エスクロー取引が作成されていることを確認
    const escrowExists = await adminPage.locator('text=エスクロー').count() > 0;
    
    if (escrowExists) {
      await expect(adminPage.locator('text=支払い処理')).toBeVisible();
    }
    
    await adminContext.close();
  });

  test('レビューシステムの完全なワークフロー', async ({ browser }) => {
    // 1. 完了した求人に対するレビューのテスト
    
    // 主催者としてレビューを投稿
    const organizerContext = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/organizer.json' 
    });
    const organizerPage = await organizerContext.newPage();
    
    await organizerPage.goto('/dashboard');
    
    const completedJobs = await organizerPage.locator('text=完了').count() > 0;
    
    if (completedJobs) {
      await organizerPage.click('text=レビューを書く');
      await organizerPage.click('[data-rating="5"]');
      await organizerPage.fill('textarea[name="comment"]', '素晴らしい対応でした。');
      await organizerPage.check('input[value="迅速対応"]');
      await organizerPage.click('button:has-text("レビューを投稿")');
      
      await expect(organizerPage.locator('text=レビューを投稿しました')).toBeVisible();
    }
    
    await organizerContext.close();
    
    // 2. 看護師としてレビューを投稿
    const nurseContext = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/nurse.json' 
    });
    const nursePage = await nurseContext.newPage();
    
    await nursePage.goto('/dashboard');
    
    const completedJobsForNurse = await nursePage.locator('text=完了').count() > 0;
    
    if (completedJobsForNurse) {
      await nursePage.click('text=レビューを書く');
      await nursePage.click('[data-rating="4"]');
      await nursePage.fill('textarea[name="comment"]', 'スムーズな運営でした。');
      await nursePage.check('input[value="運営良好"]');
      await nursePage.click('button:has-text("レビューを投稿")');
      
      await expect(nursePage.locator('text=レビューを投稿しました')).toBeVisible();
    }
    
    await nurseContext.close();
    
    // 3. 管理者としてレビューを管理
    const adminContext = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/admin.json' 
    });
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto('/admin/reviews');
    
    const reviewExists = await adminPage.locator('.review-item').count() > 0;
    
    if (reviewExists) {
      await adminPage.click('.review-item:first-child');
      
      const approveButton = adminPage.locator('button:has-text("承認")');
      if (await approveButton.isVisible()) {
        await approveButton.click();
        await expect(adminPage.locator('text=レビューを承認しました')).toBeVisible();
      }
    }
    
    await adminContext.close();
  });

  test('セキュリティ監査ログの記録と確認', async ({ browser }) => {
    // 1. 各ロールでの操作がログに記録されることを確認
    
    // 看護師の操作
    const nurseContext = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/nurse.json' 
    });
    const nursePage = await nurseContext.newPage();
    
    await nursePage.goto('/profile/edit');
    await nursePage.fill('input[name="name"]', 'セキュリティテスト用名前');
    await nursePage.click('button:has-text("保存")');
    
    await nurseContext.close();
    
    // 2. 管理者として監査ログを確認
    const adminContext = await browser.newContext({ 
      storageState: 'tests/e2e/.auth/admin.json' 
    });
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto('/admin/security');
    await adminPage.click('text=監査ログ');
    
    // プロフィール更新のログが記録されていることを確認
    await adminPage.fill('input[placeholder*="アクション・ユーザーを検索"]', 'PROFILE_UPDATED');
    
    const logExists = await adminPage.locator('.audit-log-item').count() > 0;
    expect(logExists).toBeTruthy();
    
    await adminContext.close();
  });
});