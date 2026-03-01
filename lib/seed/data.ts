/**
 * シードデータ定義
 */

export const SPORT_CATEGORIES = [
  'サッカー',
  'バスケットボール', 
  'バレーボール',
  'テニス',
  '野球',
  'ソフトボール',
  'ラグビー',
  'アメリカンフットボール',
  'ハンドボール',
  'バドミントン',
  '卓球',
  '陸上競技',
  '水泳',
  '体操',
  '柔道',
  '剣道',
  '空手',
  'ボクシング',
  'レスリング',
  'フェンシング',
  'アーチェリー',
  '射撃',
  'ゴルフ',
  'スキー',
  'スノーボード',
  'アイスホッケー',
  'フィギュアスケート',
  'スピードスケート',
  'カーリング',
  'その他'
];

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export const NURSE_SKILLS = [
  '救急処置',
  '外傷処理',
  '心肺蘇生法',
  'AED操作',
  '熱中症対応',
  '脱水症状対応',
  '骨折処置',
  '捻挫処置',
  '切り傷処置',
  '打撲処置',
  'バイタルサイン測定',
  '血圧測定',
  '体温測定',
  '酸素飽和度測定',
  '薬物アレルギー対応',
  '喘息発作対応',
  'てんかん発作対応',
  '糖尿病対応',
  '高血圧対応',
  '心疾患対応',
  'スポーツ外傷知識',
  'リハビリテーション知識',
  '栄養指導',
  '健康管理指導',
  'メンタルヘルスケア'
];

export const SAMPLE_USERS = [
  // 管理者
  {
    email: 'admin@sportsnurse.jp',
    password: 'admin123',
    role: 'ADMIN' as const,
    profile: {
      name: '管理者',
      phone: '03-1234-5678',
      prefecture: '東京都',
      city: '渋谷区'
    }
  },
  
  // 看護師
  {
    email: 'nurse1@example.com',
    password: 'nurse123',
    role: 'NURSE' as const,
    profile: {
      name: '田中 花子',
      phone: '090-1234-5678',
      prefecture: '東京都',
      city: '新宿区',
      licenseNumber: 'N123456789',
      skills: ['救急処置', '外傷処理', '心肺蘇生法', 'AED操作', '熱中症対応'],
      experience: 5,
      bio: 'スポーツ医学に特化した看護師として5年の経験があります。特に外傷処理と救急対応を得意としています。'
    }
  },
  {
    email: 'nurse2@example.com',
    password: 'nurse123',
    role: 'NURSE' as const,
    profile: {
      name: '佐藤 美咲',
      phone: '090-2345-6789',
      prefecture: '神奈川県',
      city: '横浜市',
      licenseNumber: 'N234567890',
      skills: ['救急処置', 'バイタルサイン測定', '薬物アレルギー対応', 'スポーツ外傷知識'],
      experience: 8,
      bio: '総合病院での勤務経験8年。スポーツイベントでの医療サポート経験も豊富です。'
    }
  },
  {
    email: 'nurse3@example.com',
    password: 'nurse123',
    role: 'NURSE' as const,
    profile: {
      name: '山田 恵美',
      phone: '090-3456-7890',
      prefecture: '大阪府',
      city: '大阪市',
      licenseNumber: 'N345678901',
      skills: ['心肺蘇生法', 'AED操作', '熱中症対応', 'メンタルヘルスケア'],
      experience: 3,
      bio: '新人ながら熱心に取り組んでいます。特にメンタルヘルスケアに関心があります。'
    }
  },
  
  // 主催者
  {
    email: 'organizer1@example.com',
    password: 'organizer123',
    role: 'ORGANIZER' as const,
    profile: {
      name: '鈴木 太郎',
      phone: '03-9876-5432',
      prefecture: '東京都',
      city: '港区',
      organizationName: '東京スポーツクラブ',
      organizationType: 'スポーツクラブ',
      isVerified: true,
      bio: '地域のスポーツ振興を目的とした各種大会を主催しています。安全第一でイベントを運営しています。'
    }
  },
  {
    email: 'organizer2@example.com',
    password: 'organizer123',
    role: 'ORGANIZER' as const,
    profile: {
      name: '高橋 次郎',
      phone: '06-1111-2222',
      prefecture: '大阪府',
      city: '大阪市',
      organizationName: '関西サッカー協会',
      organizationType: '協会・団体',
      isVerified: true,
      bio: '関西地区でのサッカー大会を多数主催。参加者の安全管理に力を入れています。'
    }
  },
  {
    email: 'organizer3@example.com',
    password: 'organizer123',
    role: 'ORGANIZER' as const,
    profile: {
      name: '伊藤 三郎',
      phone: '045-3333-4444',
      prefecture: '神奈川県',
      city: '川崎市',
      organizationName: '神奈川バスケットボール連盟',
      organizationType: '協会・団体',
      isVerified: false,
      bio: '地域のバスケットボール普及活動を行っています。'
    }
  }
];

export const SAMPLE_JOBS = [
  {
    title: '東京マラソン2024 医療サポート',
    description: '東京マラソンでの医療サポート業務です。ランナーの体調管理、救護所での対応、緊急時の初期対応をお願いします。',
    location: '東京都千代田区',
    prefecture: '東京都',
    city: '千代田区',
    venue: '皇居周辺コース',
    startDate: new Date('2024-03-10T06:00:00'),
    endDate: new Date('2024-03-10T15:00:00'),
    category: '陸上競技',
    participantCount: 30000,
    requiredNurses: 15,
    compensation: 25000,
    transportationFee: 2000,
    mealProvided: true,
    accommodationProvided: false,
    requirements: ['救急処置', '外傷処理', '熱中症対応'],
    applicationDeadline: new Date('2024-03-05T23:59:59'),
    status: 'PUBLISHED' as const,
    isUrgent: true
  },
  {
    title: '高校サッカー選手権 準決勝・決勝',
    description: '全国高校サッカー選手権の準決勝・決勝戦での医療サポートです。選手の怪我対応、観客席での急病対応をお願いします。',
    location: '埼玉県さいたま市',
    prefecture: '埼玉県',
    city: 'さいたま市',
    venue: '埼玉スタジアム2002',
    startDate: new Date('2024-01-08T09:00:00'),
    endDate: new Date('2024-01-08T17:00:00'),
    category: 'サッカー',
    participantCount: 500,
    requiredNurses: 8,
    compensation: 20000,
    transportationFee: 1500,
    mealProvided: true,
    accommodationProvided: false,
    requirements: ['救急処置', '外傷処理', 'スポーツ外傷知識'],
    applicationDeadline: new Date('2024-01-05T23:59:59'),
    status: 'PUBLISHED' as const,
    isUrgent: false
  },
  {
    title: '市民バスケットボール大会',
    description: '地域の市民バスケットボール大会での医療サポートです。軽微な怪我の処置、体調不良者の対応をお願いします。',
    location: '神奈川県横浜市',
    prefecture: '神奈川県',
    city: '横浜市',
    venue: '横浜市体育館',
    startDate: new Date('2024-02-15T08:00:00'),
    endDate: new Date('2024-02-15T18:00:00'),
    category: 'バスケットボール',
    participantCount: 200,
    requiredNurses: 3,
    compensation: 15000,
    transportationFee: 1000,
    mealProvided: true,
    accommodationProvided: false,
    requirements: ['救急処置', 'バイタルサイン測定'],
    applicationDeadline: new Date('2024-02-10T23:59:59'),
    status: 'PUBLISHED' as const,
    isUrgent: false
  },
  {
    title: '大学テニストーナメント',
    description: '関東大学テニストーナメントでの医療サポートです。熱中症対策、軽微な外傷処置をお願いします。',
    location: '東京都世田谷区',
    prefecture: '東京都',
    city: '世田谷区',
    venue: '有明テニスの森',
    startDate: new Date('2024-05-20T08:00:00'),
    endDate: new Date('2024-05-22T18:00:00'),
    category: 'テニス',
    participantCount: 150,
    requiredNurses: 4,
    compensation: 18000,
    transportationFee: 800,
    mealProvided: true,
    accommodationProvided: true,
    requirements: ['熱中症対応', '外傷処理'],
    applicationDeadline: new Date('2024-05-15T23:59:59'),
    status: 'DRAFT' as const,
    isUrgent: false
  }
];

export const SAMPLE_MESSAGES = [
  {
    content: 'こんにちは。東京マラソンの医療サポートに応募させていただきました。救急処置の経験が豊富で、マラソン大会での医療サポート経験もあります。よろしくお願いいたします。',
    isFromNurse: true
  },
  {
    content: 'ご応募ありがとうございます。経験豊富な方にお越しいただけて心強いです。当日の詳細な業務内容について説明させていただきたいのですが、お時間はいかがでしょうか？',
    isFromNurse: false
  },
  {
    content: '来週でしたら平日の夕方以降でしたら空いております。オンラインでの打ち合わせも可能です。',
    isFromNurse: true
  }
];

export const SAMPLE_REVIEWS = [
  {
    rating: 5,
    comment: '非常に迅速で的確な対応をしていただきました。参加者からも安心感があったとの声をいただいています。',
    tags: ['迅速対応', '的確判断', '安心感']
  },
  {
    rating: 4,
    comment: '丁寧な対応で、軽微な怪我の処置も適切に行っていただきました。コミュニケーションも良好でした。',
    tags: ['丁寧', '適切処置', 'コミュニケーション良好']
  },
  {
    rating: 5,
    comment: '熱中症の対応が素晴らしく、重篤化を防いでいただきました。経験豊富な方で安心してお任せできました。',
    tags: ['熱中症対応', '経験豊富', '安心感']
  }
];