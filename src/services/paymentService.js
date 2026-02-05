import { Linking, Alert } from 'react-native';

/**
 * Payment Service - Handles UPI payments with deep linking
 */

/**
 * Parse UPI QR code or URL to extract payment parameters
 * @param {string} upiData - UPI URL or QR code data
 * @returns {object} - Parsed UPI parameters
 */
export const parseUpiData = (upiData) => {
  const trimmedData = upiData.trim();
  const result = {
    // Standard UPI parameters (as per NPCI specs)
    upiId: '',           // pa - Payee Address (VPA)
    payeeName: '',       // pn - Payee Name
    amount: null,        // am - Amount
    currency: 'INR',     // cu - Currency
    transactionNote: '', // tn - Transaction Note
    transactionRef: '',  // tr - Transaction Reference ID
    merchantCode: '',    // mc - Merchant Code (MCC)
    merchantCategory: '', // mode - Transaction Mode
    url: '',             // url - Transaction details URL
    minAmount: null,     // mam - Minimum Amount
    tid: '',             // tid - PSP generated transaction ID
    orgId: '',           // orgid - Organization/PSP ID
    mid: '',             // mid - Merchant ID
    msid: '',            // msid - Store ID
    mtid: '',            // mtid - Terminal ID
    sign: '',            // sign - Digital signature
    qrst: '',            // qrst - QR Status
    oobe: '',            // oobe - Out of band experience
    ver: '',             // ver - Version
    valid: false,
    rawParams: {},       // Store all raw parameters
  };

  try {
    if (trimmedData.startsWith('upi://pay')) {
      // Parse UPI URL
      const urlParts = trimmedData.split('?');
      
      console.log('========= QR CODE DATA =========');
      console.log('Full QR Code:', trimmedData);
      console.log('================================');
      
      if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        
        // Log ALL parameters found in QR code
        console.log('\n📋 ALL QR CODE PARAMETERS:');
        const allParams = {};
        for (const [key, value] of params.entries()) {
          allParams[key] = value;
          console.log(`  ${key}: ${value}`);
        }
        result.rawParams = allParams;
        console.log('================================\n');

        // Standard UPI parameters (as per NPCI UPI Linking Specs v1.6)
        result.upiId = params.get('pa') || '';                          // M - Payee VPA
        result.payeeName = params.get('pn') || '';                      // M - Payee Name
        result.amount = params.get('am') ? parseFloat(params.get('am')) : null; // O/M - Amount
        result.currency = params.get('cu') || 'INR';                    // O - Currency
        result.transactionNote = params.get('tn') || '';                // O - Transaction Note
        result.transactionRef = params.get('tr') || '';                 // C - Transaction Reference
        result.merchantCode = params.get('mc') || '';                   // O - Merchant Code (MCC)
        result.merchantCategory = params.get('mode') || '';             // M - Transaction Mode
        result.url = params.get('url') || '';                           // O - Transaction details URL
        result.minAmount = params.get('mam') ? parseFloat(params.get('mam')) : null; // C - Minimum Amount
        result.tid = params.get('tid') || '';                           // O - Transaction ID
        result.orgId = params.get('orgid') || '';                       // M - Organization ID
        result.mid = params.get('mid') || '';                           // O - Merchant ID
        result.msid = params.get('msid') || '';                         // O - Store ID
        result.mtid = params.get('mtid') || '';                         // O - Terminal ID
        result.sign = params.get('sign') || '';                         // M - Digital Signature
        result.qrst = params.get('qrst') || '';                         // O - QR Status
        result.oobe = params.get('oobe') || '';                         // O - OOBE
        result.ver = params.get('ver') || '';                           // O - Version
        
        result.valid = !!result.upiId;

        // Log parsed result (NPCI UPI Specs compliant)
        console.log('✅ PARSED DATA (NPCI UPI Specs v1.6):');
        console.log(`  📱 UPI ID (pa): ${result.upiId}`);
        console.log(`  👤 Payee Name (pn): ${result.payeeName}`);
        console.log(`  💰 Amount (am): ${result.amount || 'Not specified'}`);
        console.log(`  💵 Currency (cu): ${result.currency}`);
        console.log(`  📝 Transaction Note (tn): ${result.transactionNote || 'None'}`);
        console.log(`  🔖 Transaction Ref (tr): ${result.transactionRef || 'None'}`);
        console.log(`  🏪 Merchant Code (mc): ${result.merchantCode || 'None'}`);
        console.log(`  🔢 Mode: ${result.merchantCategory || 'None'}`);
        console.log(`  🔗 URL: ${result.url || 'None'}`);
        console.log(`  💳 Merchant ID (mid): ${result.mid || 'None'}`);
        console.log(`  🏬 Store ID (msid): ${result.msid || 'None'}`);
        console.log(`  🖥️  Terminal ID (mtid): ${result.mtid || 'None'}`);
        console.log(`  🆔 Org ID (orgid): ${result.orgId || 'None'}`);
        console.log(`  📋 Min Amount (mam): ${result.minAmount || 'None'}`);
        console.log(`  🔐 Signature (sign): ${result.sign ? 'Present' : 'None'}`);
        console.log(`  📊 Version (ver): ${result.ver || 'None'}`);
        console.log('================================\n');
      }
    } else if (trimmedData.includes('@')) {
      // Direct UPI ID
      result.upiId = trimmedData;
      result.valid = true;
      console.log('Direct UPI ID entered:', result.upiId);
    }
  } catch (error) {
    console.error('Error parsing UPI data:', error);
  }

  return result;
};

/**
 * Build UPI deep link URL
 * @param {object} params - Payment parameters
 * @returns {string} - UPI deep link URL
 */
export const buildUpiUrl = (params) => {
  const {
    upiId,
    payeeName = '',
    amount,
    currency = 'INR',
    transactionNote = '',
    transactionRef = '',
    merchantCode = '',
    merchantCategory = '',
    url = '',
    mid = '',
    msid = '',
    mtid = '',
    tid = '',
  } = params;

  if (!upiId) {
    throw new Error('UPI ID is required');
  }

  if (!amount || amount <= 0) {
    throw new Error('Valid amount is required');
  }

  // List of generic/placeholder names to skip
  const genericNames = [
    'google pay merchant',
    'merchant',
    'upi receiver',
    'gpay merchant',
    'phonepe merchant',
    'paytm merchant',
  ];

  // Check if payee name is generic/placeholder
  const isGenericName = payeeName && genericNames.some(
    generic => payeeName.toLowerCase().includes(generic)
  );

  console.log('🔧 Building UPI URL (NPCI Spec v1.6):');
  console.log(`  UPI ID: ${upiId}`);
  console.log(`  Payee Name: ${payeeName || 'Not provided'}`);
  console.log(`  Is Generic Name: ${isGenericName ? 'Yes - Will be omitted' : 'No'}`);
  console.log(`  Amount: ${amount}`);
  console.log(`  Merchant Code: ${merchantCode || 'Not provided'}`);

  // Format amount as per NPCI spec - decimal format
  const formattedAmount = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);

  // Build UPI URL as per NPCI specification parameter order
  // Required parameters first: pa, pn (conditional), mc, tid, tr, tn, am, cu
  let upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}`;

  // Only add payee name if it's not a generic placeholder
  // This allows UPI app to fetch actual merchant name from registry
  if (payeeName && !isGenericName) {
    upiUrl += `&pn=${encodeURIComponent(payeeName)}`;
    console.log('  ✅ Including payee name in URL');
  } else {
    console.log('  ⚠️ Skipping payee name - letting UPI app resolve it');
  }

  // Add merchant code if present
  if (merchantCode) {
    upiUrl += `&mc=${encodeURIComponent(merchantCode)}`;
  }

  // Add transaction ID if present
  if (tid) {
    upiUrl += `&tid=${encodeURIComponent(tid)}`;
  }

  if (transactionNote) {
    upiUrl += `&tn=${encodeURIComponent(transactionNote)}`;
  }

  if (transactionRef) {
    upiUrl += `&tr=${encodeURIComponent(transactionRef)}`;
  }

  // Add REQUIRED amount and currency parameters (NPCI mandatory)
  upiUrl += `&am=${formattedAmount}`;
  upiUrl += `&cu=${currency}`;

  if (merchantCategory) {
    upiUrl += `&mode=${encodeURIComponent(merchantCategory)}`;
  }

  // Add merchant/store/terminal IDs if present (for reconciliation)
  if (mid) {
    upiUrl += `&mid=${encodeURIComponent(mid)}`;
  }

  if (msid) {
    upiUrl += `&msid=${encodeURIComponent(msid)}`;
  }

  if (mtid) {
    upiUrl += `&mtid=${encodeURIComponent(mtid)}`;
  }

  if (url) {
    upiUrl += `&url=${encodeURIComponent(url)}`;
  }

  console.log('🔗 Generated UPI URL:', upiUrl);

  return upiUrl;
};

/**
 * Initiate UPI payment
 * @param {object} paymentParams - Payment parameters
 * @param {function} onSuccess - Success callback
 * @param {function} onError - Error callback
 */
export const initiateUpiPayment = async (paymentParams, onSuccess, onError) => {
  try {
    // Validate required parameters
    if (!paymentParams.upiId) {
      throw new Error('UPI ID is required');
    }

    const amount = parseFloat(paymentParams.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    if (amount < 1) {
      throw new Error('Amount must be at least ₹1');
    }

    // Build UPI URL
    const upiUrl = buildUpiUrl({
      ...paymentParams,
      amount: amount % 1 === 0 ? amount.toString() : amount.toFixed(2),
    });

    console.log('=== Initiating UPI Payment ===');
    console.log('UPI URL:', upiUrl);
    console.log('Payment Details:', {
      upiId: paymentParams.upiId,
      payeeName: paymentParams.payeeName,
      amount,
      merchantCode: paymentParams.merchantCode || 'Not available',
    });

    // Try to open UPI app directly
    // On Android, canOpenURL may fail even when UPI apps are installed due to query restrictions
    // Better to attempt opening and handle the error
    const supported = await Linking.canOpenURL(upiUrl).catch(() => true);
    
    if (!supported) {
      throw new Error('No UPI app found. Please install a UPI app like GPay, PhonePe, or Paytm.');
    }

    // Open UPI app
    await Linking.openURL(upiUrl);

    // Call success callback after opening UPI app
    if (onSuccess) {
      setTimeout(() => {
        onSuccess(paymentParams);
      }, 1500);
    }
  } catch (error) {
    console.error('UPI Payment Error:', error);
    
    // Handle specific error when no app can handle the URL
    if (error.message && error.message.includes('No Activity found')) {
      if (onError) {
        onError(new Error('No UPI app found. Please install GPay, PhonePe, or Paytm.'));
      } else {
        Alert.alert('No UPI App', 'Please install a UPI app like GPay, PhonePe, or Paytm to make payments.');
      }
      return;
    }
    
    if (onError) {
      onError(error);
    } else {
      Alert.alert('Payment Error', error.message || 'Failed to initiate UPI payment');
    }
  }
};

/**
 * Initiate UPI payment from scanned QR code
 * @param {object} params - Parameters
 * @param {string} params.qrData - Scanned QR code data
 * @param {number} params.amount - Payment amount (optional if in QR)
 * @param {string} params.title - Transaction title
 * @param {string} params.category - Expense category
 * @param {function} onSuccess - Success callback
 * @param {function} onError - Error callback
 */
export const initiateQrPayment = async (params, onSuccess, onError) => {
  try {
    const { qrData, amount, title, category } = params;

    if (!qrData) {
      throw new Error('QR code data is required');
    }

    // Parse QR code
    const parsedData = parseUpiData(qrData);

    if (!parsedData.valid) {
      throw new Error('Invalid UPI QR code');
    }

    // Use amount from params or QR code
    const paymentAmount = amount || parsedData.amount;

    if (!paymentAmount) {
      throw new Error('Payment amount is required');
    }

    // Generate transaction reference with app name
    const transactionRef = `BUDGETBUDDY_TXN${Date.now()}`;

    // Build transaction note
    let transactionNote = parsedData.transactionNote || '';
    if (title && category) {
      transactionNote = `${category} - ${title}`.replace(/\n/g, ' ').trim();
    }

    // Prepare payment parameters
    const paymentParams = {
      upiId: parsedData.upiId,
      payeeName: parsedData.payeeName || 'Merchant',
      amount: paymentAmount,
      currency: parsedData.currency || 'INR',
      transactionNote,
      transactionRef: transactionRef, // Always use our generated transaction ID
      merchantCode: parsedData.merchantCode,
      merchantCategory: parsedData.merchantCategory,
      url: parsedData.url,
      mid: parsedData.mid,
      msid: parsedData.msid,
      mtid: parsedData.mtid,
      tid: parsedData.tid,
    };

    // Initiate payment
    await initiateUpiPayment(paymentParams, onSuccess, onError);
  } catch (error) {
    console.error('QR Payment Error:', error);
    if (onError) {
      onError(error);
    } else {
      Alert.alert('Payment Error', error.message || 'Failed to process QR payment');
    }
  }
};

/**
 * Initiate manual UPI payment
 * @param {object} params - Payment parameters
 * @param {string} params.upiId - UPI ID or VPA
 * @param {number} params.amount - Payment amount
 * @param {string} params.title - Transaction title
 * @param {string} params.category - Expense category
 * @param {string} params.payeeName - Payee name (optional)
 * @param {function} onSuccess - Success callback
 * @param {function} onError - Error callback
 */
export const initiateManualPayment = async (params, onSuccess, onError) => {
  try {
    const { upiId, amount, title, category, payeeName } = params;

    if (!upiId) {
      throw new Error('UPI ID is required');
    }

    if (!amount) {
      throw new Error('Amount is required');
    }

    // Generate transaction reference with app name
    const transactionRef = `BUDGETBUDDY_TXN${Date.now()}`;

    // Build transaction note
    const transactionNote = `${category} - ${title}`.replace(/\n/g, ' ').trim();

    // Prepare payment parameters
    const paymentParams = {
      upiId,
      payeeName: payeeName || 'UPI Receiver',
      amount,
      currency: 'INR',
      transactionNote,
      transactionRef,
    };

    // Initiate payment
    await initiateUpiPayment(paymentParams, onSuccess, onError);
  } catch (error) {
    console.error('Manual Payment Error:', error);
    if (onError) {
      onError(error);
    } else {
      Alert.alert('Payment Error', error.message || 'Failed to initiate payment');
    }
  }
};

/**
 * Show payment confirmation dialog
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 */
export const showPaymentConfirmation = (onConfirm, onCancel) => {
  setTimeout(() => {
    Alert.alert(
      'Save Expense?',
      'Did you complete the payment? Do you want to save this expense?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Yes, Save',
          onPress: onConfirm,
        },
      ],
      { cancelable: false }
    );
  }, 2000);
};

export default {
  parseUpiData,
  buildUpiUrl,
  initiateUpiPayment,
  initiateQrPayment,
  initiateManualPayment,
  showPaymentConfirmation,
};
