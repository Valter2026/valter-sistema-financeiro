'use client'
import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2, Check, RotateCcw, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface OcrData {
  document_type: string
  transaction_type: 'expense' | 'income'
  amount: number
  date: string
  due_date: string | null
  description: string
  seller_or_payer: string
  payment_method: string
  status: string
  category_suggestion: string
  items: string[]
  notes: string
}

interface Props {
  open: boolean
  onClose: () => void
  onExtracted: (data: OcrData) => void
}

const DOC_LABEL: Record<string, string> = {
  comprovante_pagamento: '🧾 Comprovante de Pagamento',
  cupom_fiscal:          '🛒 Cupom Fiscal',
  nota_fiscal_venda:     '📄 Nota Fiscal de Venda',
  nota_fiscal_servico:   '📋 Nota Fiscal de Serviço',
  boleto:                '📃 Boleto',
  recibo:                '🗒️ Recibo',
  outro:                 '📷 Documento',
}

const PAYMENT_LABEL: Record<string, string> = {
  pix:            'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito:  'Cartão de Débito',
  dinheiro:       'Dinheiro',
  boleto:         'Boleto',
  transferencia:  'Transferência',
  outro:          'Outro',
}

export default function PhotoScanModal({ open, onClose, onExtracted }: Props) {
  const [step,      setStep]      = useState<'capture' | 'loading' | 'result' | 'error'>('capture')
  const [preview,   setPreview]   = useState<string | null>(null)
  const [imageB64,  setImageB64]  = useState<string>('')
  const [mimeType,  setMimeType]  = useState('image/jpeg')
  const [ocrData,   setOcrData]   = useState<OcrData | null>(null)
  const [error,     setError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('capture')
    setPreview(null)
    setImageB64('')
    setOcrData(null)
    setError('')
  }

  const processImage = async (base64: string, mime: string, previewUrl: string) => {
    setImageB64(base64)
    setMimeType(mime)
    setPreview(previewUrl)
    setStep('loading')

    try {
      const res = await fetch('/api/shared/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: mime }),
      }).then(r => r.json())

      if (res.error) throw new Error(res.error)
      setOcrData(res.data)
      setStep('result')
    } catch (e: any) {
      setError(e.message || 'Erro ao processar imagem')
      setStep('error')
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [header, base64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
      processImage(base64, mime, dataUrl)
    }
    reader.readAsDataURL(file)
    // reset o input para permitir selecionar o mesmo arquivo de novo
    e.target.value = ''
  }

  const openCamera = () => {
    if (!fileRef.current) return
    fileRef.current.accept = 'image/*'
    fileRef.current.setAttribute('capture', 'environment')
    fileRef.current.click()
  }

  const openGallery = () => {
    if (!fileRef.current) return
    fileRef.current.accept = 'image/*'
    fileRef.current.removeAttribute('capture')
    fileRef.current.click()
  }

  if (!open) return null

  const isIncome = ocrData?.transaction_type === 'income'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center">
              <Camera size={14} className="text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white">Ler Documento</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ── CAPTURA ──────────────────────────────────────────────────────── */}
        {step === 'capture' && (
          <div className="p-5">
            <p className="text-xs text-gray-400 text-center mb-4">
              Tire uma foto ou importe da galeria
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={openCamera}
                className="flex flex-col items-center gap-3 p-5 bg-gray-800 border border-gray-700 rounded-2xl hover:border-blue-500 transition-all group">
                <div className="w-12 h-12 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center group-hover:bg-blue-900 transition-colors">
                  <Camera size={22} className="text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-gray-300">Câmera</span>
              </button>
              <button onClick={openGallery}
                className="flex flex-col items-center gap-3 p-5 bg-gray-800 border border-gray-700 rounded-2xl hover:border-purple-500 transition-all group">
                <div className="w-12 h-12 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center group-hover:bg-purple-900 transition-colors">
                  <Upload size={22} className="text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-gray-300">Galeria</span>
              </button>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                Reconhece: comprovantes PIX, cupons fiscais,<br />
                notas fiscais, boletos e recibos
              </p>
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* ── ANALISANDO ───────────────────────────────────────────────────── */}
        {step === 'loading' && (
          <div className="p-8 flex flex-col items-center gap-4">
            {preview && (
              <div className="w-28 h-28 rounded-xl overflow-hidden border border-gray-700">
                <img src={preview} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <Loader2 size={36} className="text-blue-400 animate-spin" />
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Analisando documento...</p>
              <p className="text-gray-500 text-xs mt-1">IA lendo valores, datas e categorias</p>
            </div>
          </div>
        )}

        {/* ── RESULTADO ────────────────────────────────────────────────────── */}
        {step === 'result' && ocrData && (
          <>
            <div className="px-5 pt-4 pb-2 max-h-[70vh] overflow-y-auto">
              {/* Badge tipo documento */}
              <div className="mb-3">
                <span className="text-xs font-semibold text-blue-400 bg-blue-950 border border-blue-800 px-2.5 py-1 rounded-full">
                  {DOC_LABEL[ocrData.document_type] ?? DOC_LABEL.outro}
                </span>
              </div>

              {/* Valor + tipo */}
              <div className={`rounded-xl p-4 flex items-center gap-3 mb-3 ${
                isIncome ? 'bg-emerald-950 border border-emerald-900' : 'bg-red-950 border border-red-900'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isIncome ? 'bg-emerald-900' : 'bg-red-900'
                }`}>
                  {isIncome
                    ? <TrendingUp size={20} className="text-emerald-400" />
                    : <TrendingDown size={20} className="text-red-400" />}
                </div>
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-wide ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isIncome ? 'Receita' : 'Despesa'}
                  </p>
                  {ocrData.amount > 0
                    ? <p className={`text-2xl font-bold tabular-nums ${isIncome ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatCurrency(ocrData.amount)}
                      </p>
                    : <p className="text-sm text-gray-500 italic">Valor não encontrado</p>
                  }
                </div>
              </div>

              {/* Campos extraídos */}
              <div className="space-y-2">
                {[
                  { label: 'Descrição',        value: ocrData.description },
                  { label: 'Estabelecimento',  value: ocrData.seller_or_payer },
                  { label: 'Data',             value: ocrData.date ? new Date(ocrData.date + 'T12:00:00').toLocaleDateString('pt-BR') : null },
                  { label: 'Vencimento',       value: ocrData.due_date ? new Date(ocrData.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : null },
                  { label: 'Forma de pag.',    value: PAYMENT_LABEL[ocrData.payment_method] ?? ocrData.payment_method },
                  { label: 'Categoria sug.',   value: ocrData.category_suggestion },
                  { label: 'Situação',         value: ocrData.status === 'pending' ? '⏳ Pendente' : '✅ Confirmado' },
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2.5">
                    <span className="text-[11px] text-gray-500">{row.label}</span>
                    <span className="text-xs font-medium text-gray-200 text-right max-w-[60%]">{row.value}</span>
                  </div>
                ))}

                {/* Itens do cupom */}
                {ocrData.items && ocrData.items.length > 0 && (
                  <div className="bg-gray-800 rounded-xl px-3 py-2.5">
                    <p className="text-[11px] text-gray-500 mb-1.5">Itens ({ocrData.items.length})</p>
                    {ocrData.items.slice(0, 5).map((item, i) => (
                      <p key={i} className="text-xs text-gray-300 truncate">• {item}</p>
                    ))}
                  </div>
                )}

                {ocrData.notes && (
                  <div className="bg-yellow-950 border border-yellow-900 rounded-xl px-3 py-2.5">
                    <p className="text-[11px] text-yellow-400">{ocrData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-gray-800">
              <button onClick={reset}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 transition-colors">
                <RotateCcw size={13} /> Nova
              </button>
              <button onClick={() => { onExtracted(ocrData!); onClose() }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
                <Check size={16} /> Usar dados
              </button>
            </div>
          </>
        )}

        {/* ── ERRO ─────────────────────────────────────────────────────────── */}
        {step === 'error' && (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-950 border border-red-800 flex items-center justify-center mx-auto mb-3">
              <FileText size={24} className="text-red-400" />
            </div>
            <p className="text-red-400 font-semibold text-sm mb-1">Não foi possível ler</p>
            <p className="text-gray-500 text-xs mb-5 max-w-xs mx-auto">{error}</p>
            <button onClick={reset}
              className="px-6 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition-colors">
              Tentar novamente
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          </div>
        )}
      </div>
    </div>
  )
}
