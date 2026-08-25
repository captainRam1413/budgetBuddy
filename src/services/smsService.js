import { PermissionsAndroid, Platform, Alert } from 'react-native';

/**
 * Service to manage SMS permissions and bank transaction SMS parsing
 */
export const smsService = {
  /**
   * Request SMS reading permission on Android devices
   * Returns true if permission is granted, false otherwise.
   */
  requestSmsPermission: async () => {
    if (Platform.OS !== 'android') {
      // iOS does not support SMS reading permissions for 3rd party apps
      return {
        granted: false,
        reason: 'SMS scanning is only supported on Android devices due to iOS platform privacy restrictions.'
      };
    }

    try {
      // Check if permission is already granted
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );

      if (hasPermission) {
        return { granted: true };
      }

      // Show rationale alert before requesting native permission
      return new Promise((resolve) => {
        Alert.alert(
          'SMS Permission Required 📩',
          'BudgetBuddy needs permission to read bank transactional SMS to automatically log your debit payments and expenses.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve({ granted: false, reason: 'User cancelled permission request' }),
            },
            {
              text: 'Allow Permission',
              onPress: async () => {
                try {
                  const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_SMS,
                    {
                      title: 'BudgetBuddy SMS Permission',
                      message: 'BudgetBuddy needs access to your SMS to automatically track bank transaction debits.',
                      buttonNeutral: 'Ask Me Later',
                      buttonNegative: 'Cancel',
                      buttonPositive: 'OK',
                    }
                  );

                  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    resolve({ granted: true });
                  } else {
                    resolve({ granted: false, reason: 'Permission denied by user' });
                  }
                } catch (err) {
                  console.error('Error requesting SMS permission:', err);
                  resolve({ granted: false, reason: err.message });
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error in requestSmsPermission:', error);
      return { granted: false, reason: error.message };
    }
  },

  /**
   * Parse transactional SMS text to extract expense data
   * @param {string} smsMessage - Raw SMS body text
   */
  parseTransactionSms: (smsMessage) => {
    if (!smsMessage) return null;

    // Common bank regex patterns for Indian Bank SMS (HDFC, ICICI, SBI, Axis, Paytm, PhonePe, GPay)
    const debitKeywords = ['debited', 'spent', 'paid', 'sent to', 'vpa', 'txn'];
    const lowerMessage = smsMessage.toLowerCase();

    const isDebit = debitKeywords.some(keyword => lowerMessage.includes(keyword));
    if (!isDebit) return null;

    // Extract amount: e.g. "Rs. 250.00", "INR 500", "Rs 1,250"
    const amountMatch = smsMessage.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

    // Extract merchant/recipient: e.g. "at SWIGGY", "to Swiggy", "at Amazon"
    const merchantMatch = smsMessage.match(/(?:at|to|info)\s+([A-Za-z0-9\s&]+?)(?:\s+on|\s+ref|\s+via|\.|,|avail)/i);
    const merchant = merchantMatch ? merchantMatch[1].trim() : 'Bank Transaction';

    if (amount && amount > 0) {
      return {
        amount,
        title: merchant,
        category: inferCategory(merchant),
        rawMessage: smsMessage,
      };
    }

    return null;
  },
};

/**
 * Infer category based on merchant keywords
 */
const inferCategory = (merchantName) => {
  const name = merchantName.toLowerCase();
  if (name.includes('swiggy') || name.includes('zomato') || name.includes('hotel') || name.includes('food') || name.includes('restaurant')) {
    return 'Food';
  }
  if (name.includes('amazon') || name.includes('flipkart') || name.includes('mart') || name.includes('store')) {
    return 'Shopping';
  }
  if (name.includes('uber') || name.includes('ola') || name.includes('rapido') || name.includes('petrol') || name.includes('fuel')) {
    return 'Transportation';
  }
  if (name.includes('electric') || name.includes('bill') || name.includes('recharge') || name.includes('broadband')) {
    return 'Bills/Utilities';
  }
  return 'Food';
};

export default smsService;
