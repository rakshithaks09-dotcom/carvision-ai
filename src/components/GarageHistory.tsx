import React, { useState } from 'react';
import {
  Trash2,
  Search,
  Car,
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { ScanRecord } from '../types/vehicle';

interface GarageHistoryProps {
  records: ScanRecord[];
  onSelectRecord: (record: ScanRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const GarageHistory: React.FC<GarageHistoryProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');

  const filtered = records.filter((r) => {
    const query = search.toLowerCase();
    const car = r.analysis?.cars?.[r.selectedCarIndex] || r.analysis?.cars?.[0];
    if (!car) return false;
    const make = car.make?.toLowerCase() || '';
    const model = car.model?.toLowerCase() || '';
    const colour = car.colour?.toLowerCase() || '';
    return make.includes(query) || model.includes(query) || colour.includes(query);
  });

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            <Car className="w-4 h-4 text-blue-400" />
            Car Scan History
          </h2>
          <p className="text-[11px] text-slate-400">
            {records.length} {records.length === 1 ? 'vehicle' : 'vehicles'} stored in local database
          </p>
        </div>

        {records.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
            title="Clear all scans"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      {records.length > 0 && (
        <div className="relative mb-3 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search make, model, colour..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 mb-1">No Scanned Cars Yet</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Take a photo or pick a car image from gallery and tap "Analyze Car". Your scans will be preserved here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <p className="text-xs text-slate-400">No vehicles match "{search}"</p>
        </div>
      ) : (
        /* History Table View: Image | Make | Model | Colour | Date */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            <div className="col-span-3">Image</div>
            <div className="col-span-3">Make</div>
            <div className="col-span-3">Model</div>
            <div className="col-span-3">Colour / Date</div>
          </div>

          {/* Table List Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filtered.map((record) => {
              const car = record.analysis?.cars?.[record.selectedCarIndex] || record.analysis?.cars?.[0];
              if (!car) return null;

              const dateFormatted = new Date(record.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              const isModelLowConfidence = (car.model_confidence || 0) < 0.60;
              const displayModel = isModelLowConfidence
                ? 'Unidentified'
                : car.model;

              return (
                <div
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  {/* Image Thumbnail */}
                  <div className="col-span-3">
                    <div className="relative w-12 h-10 rounded-lg overflow-hidden border border-slate-700/60 bg-black">
                      <img
                        src={record.imageUrl}
                        alt={car.make}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </div>

                  {/* Make */}
                  <div className="col-span-3 truncate">
                    <div className="text-xs font-bold text-white truncate">{car.make}</div>
                    <div className="text-[10px] text-blue-400">
                      {Math.round((car.make_confidence || 0) * 100)}%
                    </div>
                  </div>

                  {/* Model */}
                  <div className="col-span-3 truncate">
                    <div
                      className={`text-xs truncate ${
                        isModelLowConfidence ? 'text-amber-400 italic font-normal text-[11px]' : 'font-semibold text-slate-200'
                      }`}
                      title={car.model}
                    >
                      {displayModel}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {Math.round((car.model_confidence || 0) * 100)}% conf
                    </div>
                  </div>

                  {/* Colour & Date */}
                  <div className="col-span-3 flex items-center justify-between">
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        {car.colour_hex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/40 shrink-0"
                            style={{ backgroundColor: car.colour_hex }}
                          />
                        )}
                        <span className="text-xs text-slate-300 truncate font-medium">{car.colour}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{dateFormatted}</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecord(record.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
