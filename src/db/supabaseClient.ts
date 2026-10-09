import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  orderBy, 
  limit, 
  addDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseApp';
import { 
  UserProfile, 
  AccountType, 
  BarakahBox, 
  OrderItem, 
  SupportTicket, 
  RewardRule, 
  AuditLog, 
  DisputeIncident, 
  CommissionTier, 
  MerchantComplaint 
} from '../types';

/**
 * Fetch User Wallet Balance
 */
export async function fetchUserWalletBalance(userId: string): Promise<number> {
  try {
    const docRef = doc(db, 'wallets', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().balanceSyp || 0;
    }
  } catch (err) {
    console.error('Error fetching wallet:', err);
  }
  return 0;
}

/**
 * Verify User Credentials (Simulated OTP / Firestore Check)
 */
export async function verifyUserCredentials(
  identifier: string,
  password?: string,
  role?: string
): Promise<UserProfile | null> {
  try {
    const usersRef = collection(db, 'users');
    const field = role === 'admin' ? 'email' : 'phoneNumber';
    const q = query(usersRef, where(field, '==', identifier), where('role', '==', role || 'consumer'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const u = querySnapshot.docs[0].data();
      if (password && u.password && u.password !== password) return null;
      
      return {
        id: querySnapshot.docs[0].id,
        name: u.name,
        role: u.role as AccountType,
        phoneNumber: u.phoneNumber,
        email: u.email,
        storeName: u.storeName,
        storeCategory: u.storeCategory,
        licenseUrl: u.licenseUrl,
        location: u.location ? JSON.parse(u.location) : undefined
      };
    }
  } catch (err) {
    console.error('Error verifying user:', err);
  }
  return null;
}

/**
 * Register New User
 */
export async function registerUserInDb(profile: UserProfile, password?: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', profile.id);
    await setDoc(userRef, {
      ...profile,
      password: password || 'barakah123',
      location: profile.location ? JSON.stringify(profile.location) : null,
      createdAt: serverTimestamp()
    });

    const walletRef = doc(db, 'wallets', profile.id);
    await setDoc(walletRef, {
      userId: profile.id,
      balanceSyp: 0,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (err) {
    console.error('Registration error:', err);
  }
  return false;
}

/**
 * Fetch All Boxes
 */
export async function fetchBoxesFromDb(): Promise<BarakahBox[]> {
  try {
    const boxesRef = collection(db, 'boxes');
    const q = query(boxesRef, where('stockLeft', '>', 0));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BarakahBox));
  } catch (err) {
    console.error('Error fetching boxes:', err);
  }
  return [];
}

/**
 * Fetch Orders
 */
export async function fetchOrdersFromDb(role?: string, identifier?: string): Promise<OrderItem[]> {
  try {
    const ordersRef = collection(db, 'orders');
    let q;
    if (role === 'merchant') {
      q = query(ordersRef, where('storeName', '==', identifier), orderBy('orderPlacedAt', 'desc'));
    } else if (role === 'consumer') {
      q = query(ordersRef, where('customerPhone', '==', identifier), orderBy('orderPlacedAt', 'desc'));
    } else {
      q = query(ordersRef, orderBy('orderPlacedAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderItem));
  } catch (err) {
    console.error('Error fetching orders:', err);
  }
  return [];
}

/**
 * Create Order
 */
export async function createOrderInDb(order: OrderItem): Promise<boolean> {
  try {
    const orderId = order.id.replace('#BB-', '');
    await setDoc(doc(db, 'orders', orderId), {
      ...order,
      orderPlacedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Error creating order:', err);
  }
  return false;
}

/**
 * Update Order Status
 */
export async function updateOrderStatus(orderId: string, status: string, proofPhotoUrl?: string): Promise<boolean> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = { status };
    if (proofPhotoUrl) updateData.proofPhotoUrl = proofPhotoUrl;
    await updateDoc(orderRef, updateData);
    return true;
  } catch (err) {
    console.error('Error updating order:', err);
  }
  return false;
}

/**
 * Fetch Support Tickets
 */
export async function fetchSupportTicketsFromDb(): Promise<SupportTicket[]> {
  try {
    const ticketsRef = collection(db, 'support_tickets');
    const q = query(ticketsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
  } catch (err) {
    console.error('Error fetching tickets:', err);
  }
  return [];
}

/**
 * Persist Support Ticket
 */
export async function persistSupportTicketToDb(ticket: SupportTicket): Promise<boolean> {
  try {
    await setDoc(doc(db, 'support_tickets', ticket.id), {
      ...ticket,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Error saving ticket:', err);
  }
  return false;
}

// Fallbacks for other functions needed by App.tsx
export async function fetchDisputesFromDb(): Promise<DisputeIncident[]> { return []; }
export async function fetchCommissionsFromDb(): Promise<CommissionTier[]> { return []; }
export async function fetchAuditLogsFromDb(): Promise<AuditLog[]> { return []; }
export async function fetchRewardRulesFromDb(): Promise<RewardRule[]> { return []; }
export async function fetchUsersFromDb(role?: string): Promise<UserProfile[]> { return []; }
export async function updateUserPassword(userId: string, newPass: string): Promise<boolean> { return true; }
export async function fetchGovernoratesFromDb() { return []; }
export async function fetchDistrictsFromDb(govId?: string) { return []; }
export async function executeSupabaseInstantRefund(u: string, t: string, o: string, a: number, r: string) { return { success: true, newBalanceSyp: a, refCode: 'REF-123' }; }
export async function uploadFileToSupabase(file: any, bucket: string, path: string) { return { publicUrl: 'https://via.placeholder.com/150', error: null }; }
export async function executeSecurePayout(u: string, r: string, a: number, m: string, ai: string, pin: string) { return { success: true, refCode: 'PAY-123', message: 'Success' }; }
export async function fetchMerchantComplaintsFromDb(merchantName?: string): Promise<MerchantComplaint[]> { return []; }
export async function issueManualBonusCreditToDb(customerIdentifier: string, amountSyp: number, reason: string): Promise<boolean> { return true; }
export async function saveRewardRuleToDb(rule: RewardRule): Promise<boolean> { return true; }
