'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn btn-accent fixed bottom-6 left-6 shadow-lg z-50 print:hidden flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 py-3 px-5 text-sm font-bold rounded-xl"
    >
      <Printer size={16} />
      <span>طباعة أو تحميل الفاتورة</span>
    </button>
  )
}
