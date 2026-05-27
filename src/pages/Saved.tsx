import { Bookmark, MapPin, Clock } from 'lucide-react';

export default function Saved() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 md:ml-64">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Saved</h1>
      </header>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Saved Places</h2>
        <div className="space-y-4">
          <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900">Walgreens Pharmacy</h3>
              <p className="text-sm text-gray-500">Pharmacy • 1.2 mi</p>
            </div>
            <Bookmark className="text-blue-600 fill-current" size={24} />
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900">Joe's Coffee</h3>
              <p className="text-sm text-gray-500">Coffee • 0.5 mi</p>
            </div>
            <Bookmark className="text-blue-600 fill-current" size={24} />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Pinned Searches</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
              <MapPin size={20} />
            </div>
            <span className="font-medium text-gray-900">Pharmacy near me</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
              <Clock size={20} />
            </div>
            <span className="font-medium text-gray-900">Late-night food</span>
          </div>
        </div>
      </section>
    </div>
  );
}
