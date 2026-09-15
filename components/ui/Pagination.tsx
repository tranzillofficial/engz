// ============================================================
// Pagination Component — Engz Design System
// Arabic labels, mobile-friendly compact mode
// ============================================================
'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const from = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const to = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className="pagination-wrapper">
      {totalItems != null && from != null && to != null && (
        <p className="pagination-info">
          عرض <strong>{from}</strong> - <strong>{to}</strong> من <strong>{totalItems}</strong>
        </p>
      )}

      <div className="pagination" role="navigation" aria-label="التنقل بين الصفحات">
        {/* Prev */}
        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="الصفحة السابقة"
        >
          ‹
        </button>

        {/* Pages */}
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="page-dots">…</span>
          ) : (
            <button
              key={page}
              type="button"
              className={['page-btn', currentPage === page ? 'page-btn-active' : ''].filter(Boolean).join(' ')}
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              aria-label={`صفحة ${page}`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="الصفحة التالية"
        >
          ›
        </button>
      </div>
    </div>
  );
}
