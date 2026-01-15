interface FinalStepProps {
  onStartNew: () => void;
}

export function FinalStep({ onStartNew }: FinalStepProps) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="text-8xl mb-6">✅</div>
        <h2 className="text-4xl font-bold mb-4">All Done!</h2>
        <p className="text-xl text-gray-400 mb-8">Your photo has been saved successfully.</p>

        <button
          onClick={onStartNew}
          className="px-12 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 text-lg font-semibold"
        >
          📷 Start New Session
        </button>
      </div>
    </div>
  );
}
