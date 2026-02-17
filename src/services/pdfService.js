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
const generateExpenseReportHTML = ({ expenses, totalBudget, budgetPeriod, userData, monthName, year }) => {
  const now = new Date();

  // Sort expenses by date (oldest first for the report usually, but screenshot shows chronological?)
  // Screenshot shows data from 07-02-2024 to 29-02-2024.
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

  let totalIncome = 0;
  let totalExpense = 0;

  // Helper to determine if an expense is income
  const isIncome = (expense) => {
    const cat = expense.category.toLowerCase();
    return cat === 'income' || cat === 'salary' || cat === 'deposit' || cat === 'credit';
  };

  const expenseRows = sortedExpenses.map((exp, index) => {
    const isCredit = isIncome(exp);
    const amount = exp.amount;

    if (isCredit) totalIncome += amount;
    else totalExpense += amount;

    const formattedDate = new Date(exp.date).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '-'); // Format: DD-MM-YYYY

    return `
      <tr style="background-color: ${index % 2 === 0 ? '#E0F2F1' : '#ffffff'};">
        <td style="padding: 4px; border: 1px solid #000;">${formattedDate}</td>
        <td style="padding: 4px; border: 1px solid #000;">${exp.title}</td>
        <td style="padding: 4px; border: 1px solid #000;">${exp.category}</td>
        <td style="padding: 4px; border: 1px solid #000;">${exp.account || 'Main'}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${isCredit ? amount.toFixed(2) : ''}</td>
        <td style="padding: 4px; border: 1px solid #000; text-align: right;">${!isCredit ? amount.toFixed(2) : ''}</td>
      </tr>
    `;
  }).join('');

  const balance = totalIncome - totalExpense;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 20px; size: A4 portrait; }
        body { font-family: sans-serif; font-size: 10px; }
        h1, h2, h3 { text-align: center; margin: 5px 0; color: #00897B; }
        .sub-header { text-align: center; color: #6A1B9A; margin-bottom: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #00897B; color: white; padding: 5px; border: 1px solid #000; font-weight: bold; }
        td { padding: 4px; border: 1px solid #000; font-size: 10px; }
        .footer-row td { font-weight: bold; background-color: #E0F2F1; }
        .balance-row td { font-weight: bold; color: #00897B; text-align: right; background-color: #E0F2F1; }
        .red-text { color: red; }
        .green-text { color: green; }
      </style>
    </head>
    <body>
      <h3>Day to Day Expenses</h3>
      <div class="sub-header">${userData.name || 'User'}</div>
      
      <h3 style="color: black; font-size: 12px; margin-top: 10px;">${monthName} ${year}</h3>

      <table>
        <thead>
          <tr>
            <th style="width: 12%;">Date</th>
            <th style="width: 30%;">Description</th>
            <th style="width: 15%;">Category</th>
            <th style="width: 15%;">Account</th>
            <th style="width: 14%;">Income (Credit)</th>
            <th style="width: 14%;">Expense (Debit)</th>
          </tr>
        </thead>
        <tbody>
          <!-- Expense Rows -->
          ${expenseRows}
        </tbody>
        <tfoot>
          <tr class="footer-row">
            <td colspan="4" style="text-align: right;">Total</td>
            <td style="text-align: right; color: green;">${totalIncome.toFixed(2)}</td>
            <td style="text-align: right; color: red;">${totalExpense.toFixed(2)}</td>
          </tr>
          <tr class="balance-row">
             <td colspan="6">Balance = ₹${balance.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
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
      csv += `${date},${title},${category},${exp.amount.toFixed(2)}\n`;
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
