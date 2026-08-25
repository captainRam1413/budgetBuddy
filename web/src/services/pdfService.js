import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportExpensesAsPDF = async ({
  expenses,
  totalBudget,
  userData,
  totalSpent,
  monthName,
  year
}) => {
  try {
    const doc = new jsPDF();
    const balance = totalBudget - totalSpent;

    // Title & Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('BudgetBuddy - Expense Report', 14, 20);

    doc.setFontSize(10);
    const subtitle = monthName ? `Period: ${monthName} ${year || ''}` : 'Period: All Time';
    doc.text(subtitle, 14, 30);

    // User details
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`User: ${userData?.name || 'User'} (${userData?.email || 'N/A'})`, 14, 50);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 140, 50);

    // Summary Cards
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    
    // Budget
    doc.roundedRect(14, 58, 55, 22, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL BUDGET / INCOME', 18, 66);
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${totalBudget.toFixed(2)}`, 18, 75);

    // Expense
    doc.roundedRect(77, 58, 55, 22, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL EXPENSES', 81, 66);
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68);
    doc.text(`Rs. ${totalSpent.toFixed(2)}`, 81, 75);

    // Balance
    doc.roundedRect(140, 58, 56, 22, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('NET BALANCE', 144, 66);
    doc.setFontSize(12);
    doc.setTextColor(99, 102, 241);
    doc.text(`Rs. ${balance.toFixed(2)}`, 144, 75);

    // Transactions Table
    const tableData = expenses.map(exp => [
      new Date(exp.date).toLocaleDateString(),
      exp.title,
      exp.category || 'General',
      exp.type === 'credit' ? 'Credit (+)' : 'Debit (-)',
      `Rs. ${parseFloat(exp.amount).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 90,
      head: [['Date', 'Title / Description', 'Category', 'Type', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Save File
    const fileName = `BudgetBuddy_Report_${monthName || 'AllTime'}_${year || ''}.pdf`;
    doc.save(fileName);
    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

export default exportExpensesAsPDF;
