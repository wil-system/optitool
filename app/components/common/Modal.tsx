interface IProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  preventClose?: boolean;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  preventClose = false
}: IProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-[1000px] max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{title}</h2>
              {!preventClose && (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">닫기</span>
                  ×
                </button>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 