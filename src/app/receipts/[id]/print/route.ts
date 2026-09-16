import { getReceipt } from '@/actions/receipt';
import { renderReceiptHTML } from '@/lib/documents/receipt-html';
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

  const html = renderReceiptHTML(receipt);
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
