'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { resolveDisputeAction, getDisputeMessagesAction, sendDisputeMessageAction } from '@/app/actions/disputes'

interface DisputeMessage {
  id: string
  message: string
  created_at: string
  sender_id: string
  sender: { username: string; full_name: string; is_admin: boolean; avatar_url: string | null }
}

export default function DisputesTab() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null)
  
  // Chat state
  const [messages, setMessages] = useState<DisputeMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  
  // Resolution state
  const [clientPct, setClientPct] = useState<number>(50)
  const [freelancerPct, setFreelancerPct] = useState<number>(50)
  const [resolutionText, setResolutionText] = useState('')
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('disputes')
      .select(`
        *,
        contract:contracts(id, title, total_amount, milestones, client_id, freelancer_id),
        initiator:profiles!initiator_id(username, full_name)
      `)
      .order('created_at', { ascending: false })
    
    // Calculate locked_amount in JS
    const enhancedData = (data || []).map(d => {
      const milestones = Array.isArray(d.contract?.milestones) ? d.contract.milestones : []
      const lockedAmount = milestones.reduce((sum: number, m: any) => {
        if (m.status === 'in_progress' || m.status === 'submitted') return sum + (m.amount || 0)
        return sum
      }, 0)
      return { ...d, lockedAmount }
    })

    setDisputes(enhancedData)
    setLoading(false)
  }

  const openDispute = async (dispute: any) => {
    setSelectedDispute(dispute)
    setChatLoading(true)
    const res = await getDisputeMessagesAction(dispute.id)
    if (res.success) setMessages(res.messages || [])
    setChatLoading(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return
    const msg = newMessage
    setNewMessage('')
    const res = await sendDisputeMessageAction(selectedDispute.id, msg)
    if (res.success && res.message) {
      setMessages(prev => [...prev, res.message as DisputeMessage])
    } else {
      alert('فشل إرسال الرسالة')
      setNewMessage(msg)
    }
  }

  const handleResolve = async () => {
    if (!selectedDispute) return
    if (clientPct + freelancerPct !== 100) return alert('يجب أن يكون مجموع النسب 100%')
    if (!resolutionText.trim()) return alert('يرجى كتابة سبب/تفاصيل التسوية')
    
    if (!confirm('هل أنت متأكد من تسوية النزاع وتوزيع الأموال؟ هذا الإجراء لا يمكن التراجع عنه.')) return
    
    setResolving(true)
    const res = await resolveDisputeAction(
      selectedDispute.id,
      selectedDispute.contract_id,
      selectedDispute.lockedAmount,
      clientPct,
      freelancerPct,
      resolutionText
    )

    if (res.success) {
      alert('تم تسوية النزاع بنجاح')
      setSelectedDispute(null)
      fetchDisputes()
    } else {
      alert(res.error || 'حدث خطأ')
    }
    setResolving(false)
  }

  if (loading) return <div className="py-12 text-center text-gray-500">جاري التحميل...</div>

  if (selectedDispute) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <button onClick={() => setSelectedDispute(null)} className="text-sm text-gray-400 hover:text-white mb-4">
          ← العودة لقائمة النزاعات
        </button>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Right Col: Info & Resolution */}
          <div className="flex-1 space-y-6">
            <div className="bg-gray-800 p-5 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-2">نزاع في عقد: {selectedDispute.contract?.title}</h2>
              <div className="text-sm text-gray-400 mb-4">تم الرفع بواسطة: @{selectedDispute.initiator?.username}</div>
              <div className="bg-gray-900 p-4 rounded-lg text-gray-300 text-sm mb-4">
                <span className="font-bold text-white">سبب النزاع:</span> {selectedDispute.reason}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">المبلغ الإجمالي للعقد</div>
                  <div className="text-lg font-bold text-white">{selectedDispute.contract?.total_amount} دج</div>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-800 p-4 rounded-lg">
                  <div className="text-emerald-400 text-xs mb-1">المبلغ المجمد (قيد النزاع)</div>
                  <div className="text-lg font-bold text-emerald-400">{selectedDispute.lockedAmount} دج</div>
                </div>
              </div>
            </div>

            {selectedDispute.status === 'open' || selectedDispute.status === 'under_review' ? (
              <div className="bg-gray-800 p-5 rounded-xl border border-emerald-900/50">
                <h3 className="font-bold text-white mb-4">تسوية النزاع وتوزيع الأموال</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-2">نسبة استرجاع العميل (%)</label>
                    <input type="number" min="0" max="100" value={clientPct} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        setClientPct(val)
                        setFreelancerPct(100 - val)
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                    <div className="text-xs text-gray-500 mt-1">
                      سيسترجع: {(selectedDispute.lockedAmount * clientPct / 100).toLocaleString()} دج
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-2">نسبة دفع المستقل (%)</label>
                    <input type="number" min="0" max="100" value={freelancerPct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        setFreelancerPct(val)
                        setClientPct(100 - val)
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                    <div className="text-xs text-gray-500 mt-1">
                      سيستلم: {(selectedDispute.lockedAmount * freelancerPct / 100).toLocaleString()} دج
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">قرار الإدارة (يظهر للطرفين)</label>
                  <textarea value={resolutionText} onChange={e => setResolutionText(e.target.value)} rows={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
                    placeholder="بناءً على مراجعة الأدلة..."></textarea>
                </div>

                <button onClick={handleResolve} disabled={resolving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50">
                  {resolving ? 'جاري التنفيذ...' : 'تأكيد التسوية وإنهاء النزاع'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                <h3 className="font-bold text-white mb-2">تمت تسوية النزاع</h3>
                <p className="text-sm text-gray-300">{selectedDispute.resolution}</p>
                <div className="text-xs text-gray-500 mt-2">بتاريخ {new Date(selectedDispute.resolved_at).toLocaleString('ar-DZ')}</div>
              </div>
            )}
          </div>

          {/* Left Col: Chat */}
          <div className="w-full lg:w-[400px] flex flex-col bg-gray-800 rounded-xl overflow-hidden h-[600px]">
            <div className="bg-gray-900 p-4 border-b border-gray-700 font-bold text-white">غرفة النقاش الثلاثية</div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatLoading ? <div className="text-center text-gray-500">جاري تحميل الرسائل...</div> : 
                messages.map(msg => {
                  const isAdmin = msg.sender.is_admin
                  return (
                    <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-center my-4' : 'items-start'}`}>
                      {isAdmin ? (
                        <div className="bg-red-900/20 border border-red-900/50 text-red-200 px-4 py-2 rounded-xl text-center max-w-[90%]">
                          <div className="text-xs font-bold text-red-400 mb-1">الإدارة</div>
                          <div className="text-sm">{msg.message}</div>
                        </div>
                      ) : (
                        <div className="max-w-[85%] bg-gray-700 text-white px-4 py-2 rounded-2xl rounded-tr-none">
                          <div className="text-xs text-emerald-400 font-bold mb-1">{msg.sender.full_name}</div>
                          <div className="text-sm">{msg.message}</div>
                        </div>
                      )}
                    </div>
                  )
                })
              }
              {messages.length === 0 && !chatLoading && <div className="text-center text-gray-500 text-sm mt-10">لا توجد رسائل بعد</div>}
            </div>

            {selectedDispute.status === 'open' || selectedDispute.status === 'under_review' ? (
              <div className="p-4 bg-gray-900 border-t border-gray-700 flex gap-2">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="اكتب رسالة..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                <button onClick={sendMessage} className="bg-emerald-600 text-white px-4 rounded-lg hover:bg-emerald-500">→</button>
              </div>
            ) : (
              <div className="p-4 bg-gray-900 border-t border-gray-700 text-center text-sm text-gray-500">
                النزاع مغلق. لا يمكن إرسال رسائل.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">مركز فض النزاعات</h1>
      </div>
      
      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">العقد / المبلغ</th>
              <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">المشتكي</th>
              <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">الحالة</th>
              <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">تاريخ الرفع</th>
              <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map(dispute => (
              <tr key={dispute.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-white">{dispute.contract?.title}</div>
                  <div className="text-xs text-gray-400 mt-1">مُجمد: {dispute.lockedAmount} دج</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">@{dispute.initiator?.username}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    dispute.status === 'open' ? 'bg-red-900 text-red-300' :
                    dispute.status === 'closed' ? 'bg-gray-800 text-gray-400' : 'bg-yellow-900 text-yellow-300'
                  }`}>
                    {dispute.status === 'open' ? 'مفتوح' : dispute.status === 'closed' ? 'مغلق' : 'قيد المراجعة'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400">{new Date(dispute.created_at).toLocaleDateString('ar-DZ')}</td>
                <td className="px-6 py-4">
                  <button onClick={() => openDispute(dispute)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg">
                    مراجعة وتسوية
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {disputes.length === 0 && <div className="text-center py-12 text-gray-500">لا توجد نزاعات حالياً</div>}
      </div>
    </div>
  )
}
