import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "삭제 확인",
  description = "정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다."
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/50 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {description}
          </p>
        </div>
        <div className="bg-muted px-4 py-3 flex flex-row-reverse gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            삭제하기
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-card text-foreground text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const SuccessModal = ({
  isOpen,
  onClose,
  title = "완료",
  description = "성공적으로 처리되었습니다."
}: SuccessModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-50 dark:bg-green-950/50 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="bg-muted px-4 py-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const ErrorModal = ({
  isOpen,
  onClose,
  title = "오류 발생",
  description = "작업 중 오류가 발생했습니다."
}: ErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/50 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {description}
          </p>
        </div>
        <div className="bg-muted px-4 py-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
