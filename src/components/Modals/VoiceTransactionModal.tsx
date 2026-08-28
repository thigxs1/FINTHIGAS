import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import type { TransactionType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Mic,
  Square,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  AlertCircle,
  Tag,
  FileText,
} from 'lucide-react';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedData {
  tipo: 'receita' | 'despesa';
  valor: number;
  categoria: string;
  descricao: string;
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({ isOpen, onClose }) => {
  const { categories, addTransaction } = useFinance();
  const { user } = useAuth();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState<ExtractedData | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up streams and timers when modal closes
  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping mediaRecorder:', err);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupRecording();
      setErrorMsg('');
      setSuccessResult(null);
      setIsProcessing(false);
    }
    return () => cleanupRecording();
  }, [isOpen]);

  // Convert Blob to Base64 string
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    setErrorMsg('');
    setSuccessResult(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Seu navegador não suporta gravação de áudio (MediaDevices API).');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Select best supported MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const rawMime = recorder.mimeType || mimeType || 'audio/webm';
        const actualMime = rawMime.split(';')[0].trim() || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        if (audioBlob.size > 0) {
          await handleSendAudio(audioBlob, actualMime);
        }
      };

      recorder.start(250); // collect in 250ms chunks
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error starting audio recording:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMsg('Permissão de microfone negada. Permita o acesso ao microfone no navegador.');
      } else {
        setErrorMsg('Não foi possível acessar o microfone: ' + (error.message || 'Erro desconhecido.'));
      }
      cleanupRecording();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSendAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const base64Audio = await blobToBase64(blob);

      const response = await fetch('/api/voice-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
          userId: user?.id || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao processar o áudio com o Gemini.');
      }

      if (data.extracted) {
        setSuccessResult(data.extracted);

        // If not saved directly in DB by backend (e.g. offline / guest mode), add via context
        if (!data.transaction) {
          const type: TransactionType = data.extracted.tipo === 'receita' ? 'income' : 'expense';
          const matchCat = categories.find(
            (c) => c.type === type && c.name.toLowerCase().includes((data.extracted.categoria || '').toLowerCase())
          ) || categories.find((c) => c.type === type);

          await addTransaction({
            description: data.extracted.descricao || 'Lançamento por Voz',
            amount: Number(data.extracted.valor) || 0,
            type,
            date: new Date().toISOString().split('T')[0],
            category_id: matchCat?.id,
            payment_method: 'Pix',
            is_paid: true,
            notes: `Lançado via Gemini 2.5 Flash (${data.extracted.categoria})`,
          });
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Audio processing error:', error);
      setErrorMsg(error.message || 'Erro ao processar áudio com o Gemini.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(124, 58, 237, 0.15)',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
              }}
            >
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Registro por Áudio</h3>
              <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Powered by Google Gemini 2.5 Flash</span>
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ textAlign: 'center', gap: '20px', padding: '24px 12px' }}>
          {/* Success State */}
          {successResult ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 size={36} color="#10b981" />
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#10b981', fontWeight: 700 }}>
                  Lançamento Registrado!
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Os dados foram processados e salvos com sucesso no sistema.
                </p>
              </div>

              {/* Extracted Data Card */}
              <div
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: successResult.tipo === 'receita' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: successResult.tipo === 'receita' ? '#10b981' : '#f43f5e',
                      border: `1px solid ${successResult.tipo === 'receita' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                    }}
                  >
                    {successResult.tipo === 'receita' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                    {successResult.tipo === 'receita' ? 'RECEITA' : 'DESPESA'}
                  </span>

                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: successResult.tipo === 'receita' ? '#10b981' : '#f43f5e' }}>
                    {formatCurrency(successResult.valor)}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <FileText size={15} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{successResult.descricao}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <Tag size={14} />
                    <span>Categoria: <strong style={{ color: '#e4e4e7' }}>{successResult.categoria}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : isProcessing ? (
            /* Processing State */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(79, 70, 229, 0.2))',
                  border: '2px solid #7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s infinite',
                }}
              >
                <Loader2 size={40} color="#a78bfa" className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Processando áudio com Gemini 2.5 Flash...
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Compreendendo contexto e extraindo dados financeiros com precisão.
                </p>
              </div>
            </div>
          ) : (
            /* Ready / Recording State */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
              {/* Mic / Stop Circle Button */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isRecording && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: 'rgba(244, 63, 94, 0.2)',
                      animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isRecording
                      ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                      : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isRecording
                      ? '0 0 35px rgba(244, 63, 94, 0.6)'
                      : '0 10px 28px rgba(124, 58, 237, 0.45)',
                    transition: 'all 0.25s ease',
                    zIndex: 2,
                  }}
                  title={isRecording ? 'Parar Gravação' : 'Iniciar Gravação'}
                >
                  {isRecording ? <Square size={32} fill="white" /> : <Mic size={38} />}
                </button>
              </div>

              {/* Status and Timer */}
              <div>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: isRecording ? '#f43f5e' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isRecording ? (
                    <>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#f43f5e',
                          display: 'inline-block',
                        }}
                      />
                      Gravando: {formatTimer(recordingDuration)}
                    </>
                  ) : (
                    'Toque para começar a falar'
                  )}
                </span>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {isRecording
                    ? 'Fale o valor, tipo e detalhes. Clique no quadrado quando terminar.'
                    : 'Grave sua despesa ou receita naturalmente.'}
                </p>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f43f5e',
                    borderRadius: '10px',
                    fontSize: '0.83rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Examples Box */}
              {!isRecording && (
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    textAlign: 'left',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: 'var(--text-secondary)' }}>💡 Como falar:</strong>
                  <br />
                  • <em>"Gastei 54 reais no supermercado hoje"</em>
                  <br />
                  • <em>"Recebi 4200 de salário"</em>
                  <br />
                  • <em>"Paguei 35 de Uber para o trabalho"</em>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
          {successResult ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSuccessResult(null);
                  startRecording();
                }}
              >
                <RefreshCw size={15} /> Novo Áudio
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#10b981' }}
                onClick={onClose}
              >
                <CheckCircle2 size={16} /> Concluir
              </button>
            </>
          ) : (
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
