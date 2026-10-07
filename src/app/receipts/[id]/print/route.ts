import { getReceipt } from '@/actions/receipt';
import { renderReceiptHTML } from '@/lib/documents/receipt-html';
import { receiptPdfFilename, withPrintChrome } from '@/lib/documents/print-chrome';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const receipt = await getReceipt(id);
  if (!receipt) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const html = withPrintChrome(
    renderReceiptHTML(receipt),
    receiptPdfFilename(
      receipt.paymentDate,
      receipt.statement.tenant.nameChinese || receipt.statement.tenant.nameEnglish
    )
  );
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
