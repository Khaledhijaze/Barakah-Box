import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

const INITIAL_BOXES = [
  {
    id: 'box-1',
    vendor: 'مخبز وشمسين',
    vendor_en: 'Shamsin Bakery',
    vendorCategory: 'bakeries',
    categoryLabel: 'خبز ومعجنات',
    categoryLabel_en: 'Bakery & Pastries',
    title: 'سلة الخير اليومية - شمسين',
    title_en: 'Daily Barakah Basket',
    description: 'تحتوي على تشكيلة من الخبز السوري الساخن، صمون، وبعض القطع من المعجنات المشكلة.',
    description_en: 'Contains hot Syrian bread, samoon, and assorted pastries.',
    rating: 4.8,
    reviewsCount: 124,
    originalPrice: 25000,
    discountedPrice: 7500,
    discountPercent: 70,
    stockLeft: 5,
    pickupStart: '20:00',
    pickupEnd: '22:00',
    governorate: 'دمشق',
    neighborhood: 'المزة',
    neighborhood_en: 'Mezzeh',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'box-2',
    vendor: 'فواكه الشعلان',
    vendor_en: 'Shaalan Fruits',
    vendorCategory: 'produce',
    categoryLabel: 'خضار وفواكه',
    categoryLabel_en: 'Fruits & Veggies',
    title: 'صندوق الفواكه الطازجة',
    title_en: 'Fresh Fruit Box',
    description: 'تشكيلة من الفواكه الموسمية التي بقيت في نهاية اليوم، نظيفة وجاهزة للاستهلاك.',
    description_en: 'Seasonal fruit selection from the end of the day, clean and ready.',
    rating: 4.6,
    reviewsCount: 89,
    originalPrice: 45000,
    discountedPrice: 15000,
    discountPercent: 66,
    stockLeft: 3,
    pickupStart: '19:00',
    pickupEnd: '21:00',
    governorate: 'دمشق',
    neighborhood: 'الشعلان',
    neighborhood_en: 'Shaalan',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=800'
  }
];

async function seed() {
  console.log('Seeding boxes...');
  for (const box of INITIAL_BOXES) {
    await setDoc(doc(db, 'boxes', box.id), box);
    console.log(`Seeded box: ${box.id}`);
  }
  
  console.log('Seeding test users...');
  const users = [
    {
      id: 'admin-1',
      name: 'مدير المنصة',
      role: 'admin',
      phoneNumber: '0933111222',
      email: 'admin@barakah.sy',
      password: 'admin'
    },
    {
      id: 'merchant-1',
      name: 'أبو أحمد - شمسين',
      role: 'merchant',
      phoneNumber: '0944111222',
      storeName: 'مخبز وشمسين',
      password: 'merchant'
    }
  ];

  for (const user of users) {
    await setDoc(doc(db, 'users', user.id), user);
    console.log(`Seeded user: ${user.id}`);
  }

  console.log('Done!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
