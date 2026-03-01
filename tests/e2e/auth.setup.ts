import { test as setup, expect } from '@playwright/test';
import { setupTestDatabase, getTestUsers } from './setup/test-database';

const authFile = 'tests/e2e/.auth/user.json';
const adminAuthFile = 'tests/e2e/.auth/admin.json';
const nurseAuthFile = 'tests/e2e/.auth/nurse.json';
const organizerAuthFile = 'tests/e2e/.auth/organizer.json';

setup('setup test database', async () => {
  await setupTestDatabase();
});

setup('authenticate as admin', async ({ page }) => {
  const users = await getTestUsers();
  const admin = users.admin;
  
  if (!admin) {
    throw new Error('Admin user not found in test data');
  }

  await page.goto('/api/auth/signin');
  
  // メールアドレスでログイン
  await page.fill('input[name="email"]', admin.email);
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // ログイン成功を確認
  await expect(page).toHaveURL('/dashboard');
  
  // 認証状態を保存
  await page.context().storageState({ path: adminAuthFile });
});

setup('authenticate as nurse', async ({ page }) => {
  const users = await getTestUsers();
  const nurse = users.nurses[0];
  
  if (!nurse) {
    throw new Error('Nurse user not found in test data');
  }

  await page.goto('/api/auth/signin');
  
  await page.fill('input[name="email"]', nurse.email);
  await page.fill('input[name="password"]', 'nurse123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await page.context().storageState({ path: nurseAuthFile });
});

setup('authenticate as organizer', async ({ page }) => {
  const users = await getTestUsers();
  const organizer = users.organizers[0];
  
  if (!organizer) {
    throw new Error('Organizer user not found in test data');
  }

  await page.goto('/api/auth/signin');
  
  await page.fill('input[name="email"]', organizer.email);
  await page.fill('input[name="password"]', 'organizer123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await page.context().storageState({ path: organizerAuthFile });
});