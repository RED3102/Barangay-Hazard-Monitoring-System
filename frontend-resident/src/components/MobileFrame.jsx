export function MobileFrame({ children }) {
  return (
    <div className="flex h-screen w-full justify-center bg-gray-100 font-sans">
      {/* max-w-md restricts width, mx-auto centers it, shadow makes it pop on desktop */}
      <div className="flex-1 overflow-hidden relative flex flex-col w-full max-w-md bg-gray-50 shadow-lg sm:my-auto sm:h-[95vh] sm:rounded-2xl">
        {children}
      </div>
    </div>
  );
}
