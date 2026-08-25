const smsService = {
  parseTransactionSms: (smsMessage) => {
    if (!smsMessage) return null;

    const debitKeywords = ['debited', 'spent', 'paid', 'sent to', 'vpa', 'txn'];
    const lowerMessage = smsMessage.toLowerCase();

    const isDebit = debitKeywords.some(keyword => lowerMessage.includes(keyword));
    if (!isDebit) return null;

    const amountMatch = smsMessage.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

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
