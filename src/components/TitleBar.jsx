import { api } from '../lib/api'
import fssoLogo from '../assets/FSSOAppLogo.png'

export default function TitleBar({ showControls = true }) {
  return (
    <div className="drag-region h-12 flex items-center justify-between px-6 glass border-b border-white/20 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <img src={fssoLogo} alt="FSSO" className="w-7 h-7 rounded-lg" />
      </div>

      {showControls && (
        <div className="no-drag flex items-center gap-2">
          <button
            onClick={() => api.minimize()}
            className="w-10 h-7 rounded-lg hover:bg-gray-200/70 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200"
          >
            <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor">
              <rect width="12" height="2" rx="1"/>
            </svg>
          </button>
          <button
            onClick={() => api.maximize()}
            className="w-10 h-7 rounded-lg hover:bg-gray-200/70 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="9" height="9" rx="1"/>
            </svg>
          </button>
          <button
            onClick={() => api.close()}
            className="w-10 h-7 rounded-lg hover:bg-red-500 flex items-center justify-center text-gray-600 hover:text-white transition-all duration-200"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="2" y1="2" x2="9" y2="9"/>
              <line x1="9" y1="2" x2="2" y2="9"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
