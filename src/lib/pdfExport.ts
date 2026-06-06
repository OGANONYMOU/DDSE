// N-4: PDF export using the browser's native print dialog.
// CSS print styles are in index.html @media print block.
// This module prepares the DOM for printing and restores it afterward.

export type ClassificationLevel =
  | 'UNCLASSIFIED' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';

const CLASSIFICATION_CSS: Record<ClassificationLevel, string> = {
  UNCLASSIFIED: 'unclassified',
  RESTRICTED:   'restricted',
  CONFIDENTIAL: 'confidential',
  SECRET:       'secret',
  TOP_SECRET:   'top-secret',
};

const CLASSIFICATION_LABEL: Record<ClassificationLevel, string> = {
  UNCLASSIFIED: '⬛ UNCLASSIFIED',
  RESTRICTED:   '⬛ RESTRICTED',
  CONFIDENTIAL: '🔴 CONFIDENTIAL',
  SECRET:       '🔴 SECRET',
  TOP_SECRET:   '⭐ TOP SECRET',
};

interface PrintOptions {
  title:          string;
  classification: ClassificationLevel;
  preparedBy:     string;
  date:           string;
  reference?:     string;
}

/**
 * Prints the element matching `contentSelector` as a formatted PDF.
 * Injects a classification banner, document header, and signature blocks
 * before printing, then removes them.
 */
export function printAsPDF(contentSelector: string, opts: PrintOptions): void {
  // Create classification banner
  const banner = document.createElement('div');
  banner.className = `classification-banner ${CLASSIFICATION_CSS[opts.classification]}`;
  banner.textContent = CLASSIFICATION_LABEL[opts.classification];
  banner.setAttribute('aria-hidden', 'true');

  // Create document header
  const header = document.createElement('div');
  header.className = 'print-content';
  header.setAttribute('data-print-header', 'true');
  header.style.cssText = 'display:none; margin-bottom:16px; border-bottom:1px solid #000; padding-bottom:8px;';
  header.innerHTML = `
    <table style="width:100%; font-family:monospace; font-size:10px;">
      <tr>
        <td style="font-weight:900; font-size:14px; text-transform:uppercase; letter-spacing:0.1em;">
          DDSE — Defence Engineering Platform
        </td>
        <td style="text-align:right; color:#666;">
          ${opts.reference ? `Ref: ${opts.reference}<br>` : ''}
          Date: ${opts.date}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top:6px; font-size:12px; font-weight:700;">
          ${opts.title}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top:4px; font-size:9px; color:#666; text-transform:uppercase; letter-spacing:0.1em;">
          Prepared by: ${opts.preparedBy}
        </td>
      </tr>
    </table>
  `;

  // Create signature block
  const sigBlock = document.createElement('div');
  sigBlock.className = 'signature-block';
  sigBlock.setAttribute('data-print-footer', 'true');
  sigBlock.style.cssText = 'display:none;';
  sigBlock.innerHTML = `
    <div>
      <div class="signature-line"></div>
      <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Prepared By</p>
      <p style="font-size:9px; margin-top:2px;">${opts.preparedBy}</p>
    </div>
    <div>
      <div class="signature-line"></div>
      <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Reviewed By</p>
    </div>
    <div>
      <div class="signature-line"></div>
      <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">Authorised By</p>
    </div>
  `;

  // Insert into DOM
  document.body.prepend(banner);

  const contentEl = document.querySelector(contentSelector);
  if (contentEl) {
    contentEl.prepend(header);
    contentEl.append(sigBlock);
    header.style.display = 'block';
    sigBlock.style.display = 'grid';
  }

  // Mark print content for CSS scoping
  contentEl?.classList.add('print-content');

  // Show print dialog
  window.print();

  // Clean up injected elements
  banner.remove();
  header.remove();
  sigBlock.remove();
  contentEl?.classList.remove('print-content');
}

/**
 * Convenience wrapper: prints the full page with minimal cleanup.
 */
export function quickPrint(title: string, classification: ClassificationLevel, author: string): void {
  printAsPDF('#main-content', {
    title,
    classification,
    preparedBy: author,
    date:       new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
  });
}
