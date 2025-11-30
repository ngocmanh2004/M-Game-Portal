import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const createTestUsers = async () => {
  const testUsers = [
    { email: 'user1@test.com', money: 5000000, tasks: { followTiktok: true, subscribeYoutube: false }, lastCheckin: '' },
    { email: 'user2@test.com', money: 3000000, tasks: { followTiktok: false, subscribeYoutube: true }, lastCheckin: '' },
    { email: 'user3@test.com', money: 8000000, tasks: { followTiktok: true, subscribeYoutube: true }, lastCheckin: '' },
    { email: 'user4@test.com', money: 2000000, tasks: { followTiktok: false, subscribeYoutube: false }, lastCheckin: '' },
    { email: 'user5@test.com', money: 10000000, tasks: { followTiktok: true, subscribeYoutube: true }, lastCheckin: '' }
  ];

  for (let i = 0; i < testUsers.length; i++) {
    await setDoc(doc(db, 'users', `test_user_${i + 1}`), testUsers[i]);
  }

  console.log('✅ Created 5 test users!');
};