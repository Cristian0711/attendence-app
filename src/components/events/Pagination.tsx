'use client';

import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}

const Pagination = ({ page, totalPages, onPageChange, disabled }: PaginationProps) => {
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const showEllipsis = totalPages > 7;
    
    if (showEllipsis) {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (page >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="mt-8 flex justify-center items-center space-x-2">
      <Button 
        variant="outline" 
        onClick={() => !disabled && onPageChange(page - 1)} 
        disabled={page === 1 || disabled}
        className="transition-all duration-200 hover:scale-105 px-4 py-2 min-w-[100px]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </Button>

      <div className="flex items-center space-x-2">
        {generatePageNumbers().map((num, index) => (
          num === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2">...</span>
          ) : (
            <Button
              key={num}
              variant={page === num ? "default" : "outline"}
              onClick={() => !disabled && onPageChange(num as number)}
              disabled={disabled}
              className={`transition-all duration-200 w-10 h-10 p-0
                ${page === num ? 'bg-primary text-primary-foreground' : 'hover:scale-105'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {num}
            </Button>
          )
        ))}
      </div>

      <Button 
        variant="outline" 
        onClick={() => !disabled && onPageChange(page + 1)} 
        disabled={page === totalPages || disabled}
        className="transition-all duration-200 hover:scale-105 px-4 py-2 min-w-[100px]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;