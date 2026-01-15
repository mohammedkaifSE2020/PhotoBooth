import { CustomOverlays } from '../types';

interface CustomizeStepProps {
  customOverlays: CustomOverlays;
  onUpdate: (overlays: CustomOverlays) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CustomizeStep({
  customOverlays,
  onUpdate,
  onNext,
  onBack,
}: CustomizeStepProps) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">Customize Your Photo</h2>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Guest Name</label>
            <input
              type="text"
              value={customOverlays.guestName}
              onChange={(e) => onUpdate({ ...customOverlays, guestName: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter guest name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Date</label>
            <input
              type="text"
              value={customOverlays.eventDate}
              onChange={(e) => onUpdate({ ...customOverlays, eventDate: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Custom Text</label>
            <textarea
              value={customOverlays.customText}
              onChange={(e) => onUpdate({ ...customOverlays, customText: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="Additional text..."
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Next: Preview →
          </button>
        </div>
      </div>
    </div>
  );
}
