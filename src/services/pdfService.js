/**
 * PDF Export Service for BudgetBuddy
 * Generates beautifully formatted expense reports as PDFs
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Generate HTML content for the expense report
 */
/**
 * Generate HTML content for the expense report matching the Day-To-Day Expenses PDF format
 */
/**
 * Generate HTML content for the expense report with a modern, beautiful design
 */
const generateExpenseReportHTML = ({ expenses, totalBudget, budgetPeriod, userData, monthName, year }) => {
  // Sort expenses by date
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Use Total Budget as the Total Income for the report
  const totalIncome = totalBudget || 0;
  let totalExpense = 0;

  // Helper to determine if an expense is income
  const isIncome = (expense) => {
    if (expense.type === 'credit') return true;
    if (expense.type === 'debit') return false;
    const cat = expense.category?.toLowerCase() || '';
    return cat === 'income' || cat === 'salary' || cat === 'deposit' || cat === 'credit' || (expense.category === 'Income');
  };
  // Calculate actual total expense (excluding income transactions)
  sortedExpenses.forEach(exp => {
    if (!isIncome(exp)) {
      totalExpense += Number(exp.amount) || 0;
    }
  });

  const balance = totalIncome - totalExpense;
  const isNegative = balance < 0;

  const expenseRows = sortedExpenses.map((exp, index) => {
    const isCredit = isIncome(exp);
    const amount = Number(exp.amount) || 0;
    const date = new Date(exp.date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    return `
      <tr style="background-color: ${index % 2 === 0 ? '#fafafa' : '#ffffff'}; border-bottom: 1px solid #eee;">
        <td style="padding: 12px 16px; color: #555;">${date}</td>
        <td style="padding: 12px 16px; font-weight: 500; color: #333;">${exp.title}</td>
        <td style="padding: 12px 16px;">
          <span style="background-color: ${isCredit ? '#d1fae5' : '#f3f4f6'}; color: ${isCredit ? '#065f46' : '#4b5563'}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">
            ${exp.category}
          </span>
        </td>
        <td style="padding: 12px 16px; text-align: right; font-weight: bold; color: ${isCredit ? '#10b981' : '#ef4444'};">
          ${isCredit ? '+ ' : ''}₹${amount.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 0; size: A4 portrait; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 0; color: #333; -webkit-print-color-adjust: exact; }
        .header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 40px 30px;
          border-bottom-left-radius: 30px;
          border-bottom-right-radius: 30px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
        .subtitle { font-size: 14px; opacity: 0.9; margin-top: 5px; font-weight: 500; }
        .user-info { text-align: right; }
        .user-name { font-size: 18px; font-weight: 700; }
        .report-date { font-size: 12px; opacity: 0.8; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
        
        .container { padding: 0 30px 40px 30px; }
        
        .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }
        .card { flex: 1; padding: 20px; border-radius: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .card-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
        .card-value { font-size: 24px; font-weight: 800; color: #333; }
        
        .bg-white { background: white; border: 1px solid #eee; }
        .text-green { color: #10b981; }
        .text-red { color: #ef4444; }
        
        .table-container { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8fafc; text-align: left; padding: 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
        
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #94a3b8; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div>
            <h1 class="title">Expense Report</h1>
            <div class="subtitle">BudgetBuddy Financial Overview</div>
          </div>
          <div class="user-info">
            <div class="user-name">${userData.name || 'User'}</div>
            <div class="report-date">${monthName} ${year}</div>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Summary Section -->
        <div class="summary-cards">
          <div class="card bg-white">
            <div class="card-label">Total Budget</div>
            <div class="card-value text-green">₹${totalIncome.toFixed(2)}</div>
          </div>
          <div class="card bg-white">
            <div class="card-label">Total Spent</div>
            <div class="card-value text-red">₹${totalExpense.toFixed(2)}</div>
          </div>
          <div class="card bg-white">
            <div class="card-label">Remaining Balance</div>
            <div class="card-value" style="color: ${isNegative ? '#ef4444' : '#10b981'}">
              ₹${Math.abs(balance).toFixed(2)} ${isNegative ? '(Over)' : ''}
            </div>
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Date</th>
                <th style="width: 35%">Description</th>
                <th style="width: 20%">Category</th>
                <th style="width: 25%; text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenseRows.length > 0 ? expenseRows : '<tr><td colspan="4" style="padding: 30px; text-align: center; color: #999;">No transactions found for this period.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          Generated by BudgetBuddy • ${new Date().toLocaleDateString()} • Your Personal Finance Companion
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Export expenses as a PDF file and share it
 */
export const exportExpensesAsPDF = async ({ expenses, totalBudget, budgetPeriod, userData, totalSpent, monthName, year }) => {
  try {
    const html = generateExpenseReportHTML({
      expenses,
      totalBudget,
      budgetPeriod,
      userData,
      totalSpent,
      monthName,
      year
    });

    // Generate PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Share the PDF directly from the generated URI
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Expense Report',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, uri };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export expenses as CSV via PDF-style share
 */
export const exportExpensesAsCSV = async ({ expenses, userData }) => {
  try {
    // Build CSV content
    let csv = 'Date,Title,Category,Amount\n';

    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(exp => {
      const date = new Date(exp.date).toLocaleDateString('en-IN');
      const title = `"${(exp.title || '').replace(/"/g, '""')}"`;
      const category = `"${exp.category}"`;
      csv += `${date},${title},${category},${Number(exp.amount || 0).toFixed(2)}\n`;
    });

    // Generate a simple HTML page with the CSV data and print as PDF
    const csvHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: monospace; font-size: 12px; white-space: pre-wrap; padding: 20px; }
          h2 { font-family: sans-serif; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h2>BudgetBuddy - Expense Data Export</h2>
        <p>Generated: ${new Date().toLocaleDateString('en-IN')}</p>
        <p>User: ${userData.name || 'User'}</p>
        <hr/>
        <pre>${csv}</pre>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: csvHtml,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Expense Data',
      });
    }

    return { success: true, uri };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Import expenses from CSV file
 */
export const importExpensesFromCSV = async (categories) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/comma-separated-values', 'application/csv'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, canceled: true };
    }

    const { uri } = result.assets[0];

    // Read file content using fetch (works for local URIs in Expo)
    const response = await fetch(uri);
    const content = await response.text();

    if (!content) {
      return { success: false, message: 'File is empty' };
    }

    const lines = content.split(/\r\n|\n/).filter(line => line.trim());
    if (lines.length < 2) {
      return { success: false, message: 'File contains no data rows' };
    }

    // Helper to parse CSV line handling quotes
    const parseCSVLine = (text) => {
      const result = [];
      let start = 0;
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
          inQuotes = !inQuotes;
        } else if (text[i] === ',' && !inQuotes) {
          let field = text.substring(start, i).trim();
          if (field.startsWith('"') && field.endsWith('"')) {
            field = field.substring(1, field.length - 1).replace(/""/g, '"');
          }
          result.push(field);
          start = i + 1;
        }
      }
      let field = text.substring(start).trim();
      if (field.startsWith('"') && field.endsWith('"')) {
        field = field.substring(1, field.length - 1).replace(/""/g, '"');
      }
      result.push(field);
      return result;
    };

    // Determine indices from header
    const headers = parseCSVLine(lines[0].toLowerCase());
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('description'));
    const catIdx = headers.findIndex(h => h.includes('category'));
    const amtIdx = headers.findIndex(h => h.includes('amount'));

    if (dateIdx === -1 || catIdx === -1 || amtIdx === -1) {
      return { success: false, message: 'Invalid CSV format. Header must contain Date, Category, and Amount.' };
    }

    const newExpenses = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCSVLine(line);
      if (fields.length < 3) continue;

      const dateStr = fields[dateIdx];
      const title = titleIdx >= 0 ? fields[titleIdx] : 'Imported Expense';
      const catName = fields[catIdx];
      const amountStr = fields[amtIdx];

      // Validate Amount
      const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ''));
      if (isNaN(amount) || amount <= 0) {
        failCount++;
        continue;
      }

      // Validate Category
      const category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (!category) {
        failCount++;
        continue;
      }

      // Validate Date (try multiple formats)
      let dateVal = new Date(dateStr);
      if (isNaN(dateVal.getTime())) {
        // Try DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          dateVal = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      if (isNaN(dateVal.getTime())) dateVal = new Date();

      newExpenses.push({
        title,
        amount,
        category: category,
        date: dateVal.toISOString(),
      });
      successCount++;
    }

    return {
      success: true,
      data: newExpenses,
      stats: { success: successCount, failed: failCount }
    };

  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: error.message };
  }
};
