import { getStatement } from '@/actions/statement';
import { renderStatementHTML } from '@/lib/documents/statement-html';
import { getOwnerSignaturesForProperty } from '@/lib/documents/owner-signatures';
import { statementPdfFilename, withPrintChrome } from '@/lib/documents/print-chrome';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stmt = await getStatement(id);
  if (!stmt) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const ownerSignatures = await getOwnerSignaturesForProperty(stmt.room.propertyId);
  const html = withPrintChrome(
    renderStatementHTML(stmt, ownerSignatures),
    statementPdfFilename(stmt.periodStart, stmt.tenant.nameChinese || stmt.tenant.nameEnglish)
  );
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
