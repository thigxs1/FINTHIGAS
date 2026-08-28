import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { TransactionType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Mic, MicOff, Check, X, Sparkles, RefreshCw, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedTransaction {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  category_id?: string;
  subcategory_id?: string;
  payment_method: string;
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({ isOpen, onClose }) => {
  const { categories, addTransaction } = useFinance();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const parseVoiceText = (text: string): ParsedTransaction => {
    const lower = text.toLowerCase();

    // 1. Detect Type (income vs expense)
    const incomeKeywords = ['recebi', 'ganhei', 'receita', 'salário', 'salario', 'pix recebido', 'rendimento', 'depósito', 'deposito', 'vendi', 'entrada'];
    const isIncome = incomeKeywords.some(kw => lower.includes(kw));
    const type: TransactionType = isIncome ? 'income' : 'expense';

    // 2. Detect Amount
    let amount = 0;
    // Match patterns like "R$ 50,00", "50 reais", "50,50", "50.50", "50", "cinquenta reais"
    const numberWordsMap: Record<string, number> = {
      'um': 1, 'dois': 2, 'três': 3, 'tres': 3, 'quatro': 4, 'cinco': 5,
      'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
      'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
      'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90,
      'cem': 100, 'cento': 100, 'duzentos': 200, 'trezentos': 300,
      'quatrocentos': 400, 'quinhentos': 500, 'mil': 1000,
    };

    // Regex for numeric values: "50,50", "50.00", "50", "1.500"
    const regexCurrency = /(?:r\$\s*)?(\d+(?:[.,]\d+)?)/i;
    const matchNum = lower.match(regexCurrency);

    if (matchNum) {
      const numStr = matchNum[1].replace(/\./g, '').replace(',', '.');
      amount = parseFloat(numStr) || 0;
    } else {
      // Try word matching (e.g. "cinquenta reais")
      for (const [word, val] of Object.entries(numberWordsMap)) {
        if (lower.includes(word)) {
          amount += val;
        }
      }
    }

    // 3. Detect Payment Method
    let payment_method = 'Pix';
    if (lower.includes('crédito') || lower.includes('credito') || lower.includes('cartão de crédito')) payment_method = 'Cartão de Crédito';
    else if (lower.includes('débito') || lower.includes('debito') || lower.includes('cartão de débito')) payment_method = 'Cartão de Débito';
    else if (lower.includes('boleto')) payment_method = 'Boleto';
    else if (lower.includes('dinheiro') || lower.includes('em espécie')) payment_method = 'Dinheiro';
    else if (lower.includes('ted') || lower.includes('transferência') || lower.includes('transferencia')) payment_method = 'Transferência';

    // 4. Detect Date
    const today = new Date();
    let dateStr = today.toISOString().split('T')[0];
    if (lower.includes('ontem')) {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      dateStr = d.toISOString().split('T')[0];
    } else if (lower.includes('anteontem')) {
      const d = new Date(today);
      d.setDate(d.getDate() - 2);
      dateStr = d.toISOString().split('T')[0];
    }

    // 5. Match Category & Subcategory by semantic keywords
    const availableCategories = categories.filter(c => c.type === type);
    let matchedCategoryId = availableCategories[0]?.id;
    let matchedSubcategoryId: string | undefined;

    const categoryKeywords: Record<string, string[]> = {
      'Alimentação': ['mercado', 'supermercado', 'almoço', 'almoco', 'jantar', 'lanche', 'ifood', 'delivery', 'restaurante', 'pizza', 'hambúrguer', 'comida', 'café', 'padaria'],
      'Transporte': ['uber', '99', 'táxi', 'gasolina', 'combustível', 'posto', 'estacionamento', 'pedágio', 'ônibus', 'metro', 'manutenção', 'carro', 'moto'],
      'Moradia': ['aluguel', 'luz', 'energia', 'água', 'agua', 'internet', 'condomínio', 'condominio', 'iptu', 'gás', 'gas', 'casa'],
      'Lazer & Estilo': ['cinema', 'filme', 'viagem', 'passeio', 'netflix', 'spotify', 'jogo', 'streaming', 'roupa', 'shopping'],
      'Saúde & Bem-Estar': ['remédio', 'remedio', 'farmácia', 'farmacia', 'médico', 'medico', 'consulta', 'academia', 'dentista', 'exame'],
      'Salário & Prolabore': ['salário', 'salario', 'adiantamento', 'bônus', 'plr', 'comissão', 'pagamento'],
      'Investimentos & Rendimentos': ['dividendo', 'rendimento', 'ações', 'fiis', 'cripto', 'juros', 'investimento'],
    };

    for (const cat of availableCategories) {
      const keywords = categoryKeywords[cat.name] || [];
      const hasKeyword = keywords.some(kw => lower.includes(kw)) || lower.includes(cat.name.toLowerCase());
      if (hasKeyword) {
        matchedCategoryId = cat.id;
        // Check subcategories
        if (cat.subcategories && cat.subcategories.length > 0) {
          const matchedSub = cat.subcategories.find(s => lower.includes(s.name.toLowerCase()));
          if (matchedSub) matchedSubcategoryId = matchedSub.id;
        }
        break;
      }
    }

    // 6. Generate Clean Description
    let description = text.trim();
    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);

    return {
      description,
      amount: amount || 0,
      type,
      date: dateStr,
      category_id: matchedCategoryId,
      subcategory_id: matchedSubcategoryId,
      payment_method,
    };
  };

  const startListening = () => {
    setErrorMsg('');
    setTranscript('');
    setParsed(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          const parsedResult = parseVoiceText(currentTranscript);
          setParsed(parsedResult);
        }
      };

      recognition.onerror = (event: { error: string }) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Permissão de microfone negada. Autorize o microfone no navegador.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('Nenhuma voz detectada. Tente falar novamente.');
        } else {
          setErrorMsg('Erro ao capturar áudio: ' + event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Não foi possível iniciar o microfone.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setParsed(null);
      setErrorMsg('');
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!parsed || parsed.amount <= 0) {
      alert('Por favor, informe uma transação com valor válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        date: parsed.date,
        category_id: parsed.category_id,
        subcategory_id: parsed.subcategory_id,
        payment_method: parsed.payment_method,
        is_paid: true,
        notes: `Lançado por voz: "${transcript}"`,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar lançamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0 }}>Lançamento Rápido por Voz</h3>
          </div>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', gap: '18px' }}>
          {!isSupported ? (
            <div style={{ padding: '20px', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '12px' }}>
              <p style={{ fontWeight: 600, marginBottom: '6px' }}>Reconhecimento de Voz Indisponível</p>
              <small style={{ color: 'var(--text-muted)' }}>
                Seu navegador atual não suporta a API de fala. Experimente usar o Google Chrome, Edge ou Safari no celular.
              </small>
            </div>
          ) : (
            <>
              {/* Pulsing Mic Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isListening
                      ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                      : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isListening
                      ? '0 0 30px rgba(244, 63, 94, 0.6), 0 0 60px rgba(244, 63, 94, 0.3)'
                      : '0 8px 24px rgba(124, 58, 237, 0.4)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                >
                  {isListening ? <Mic size={36} /> : <MicOff size={36} />}
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '12px', color: isListening ? '#f43f5e' : 'var(--text-muted)' }}>
                  {isListening ? 'Ouvindo... Fale agora' : 'Clique no microfone para falar'}
                </span>
              </div>

              {/* Speech Transcript or Error */}
              {errorMsg ? (
                <div style={{ padding: '8px 12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderRadius: '8px', fontSize: '0.83rem' }}>
                  {errorMsg}
                </div>
              ) : transcript ? (
                <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.92rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                  "{transcript}"
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong>Exemplos de voz:</strong><br />
                  • <em>"Gastei 45 reais no almoço hoje"</em><br />
                  • <em>"Paguei 150 de luz no pix ontem"</em><br />
                  • <em>"Recebi 3500 de salário"</em>
                </div>
              )}

              {/* Parsed Result Card */}
              {parsed && (
                <div
                  style={{
                    textAlign: 'left',
                    background: parsed.type === 'income' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                    border: `1px solid ${parsed.type === 'income' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: parsed.type === 'income' ? '#10b981' : '#f43f5e' }}>
                      {parsed.type === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                      {parsed.type === 'income' ? 'ENTRADA DETECTADA' : 'SAÍDA DETECTADA'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setParsed({ ...parsed, type: parsed.type === 'income' ? 'expense' : 'income' })}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Alternar tipo
                    </button>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Descrição</label>
                    <input
                      type="text"
                      value={parsed.description}
                      onChange={(e) => setParsed({ ...parsed, description: e.target.value })}
                    />
                  </div>

                  <div className="form-row" style={{ margin: 0 }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={parsed.amount || ''}
                        onChange={(e) => setParsed({ ...parsed, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Data</label>
                      <input
                        type="date"
                        value={parsed.date}
                        onChange={(e) => setParsed({ ...parsed, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ margin: 0 }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Categoria</label>
                      <select
                        value={parsed.category_id || ''}
                        onChange={(e) => setParsed({ ...parsed, category_id: e.target.value, subcategory_id: undefined })}
                      >
                        {categories.filter(c => c.type === parsed.type).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Forma de Pagamento</label>
                      <select
                        value={parsed.payment_method}
                        onChange={(e) => setParsed({ ...parsed, payment_method: e.target.value })}
                      >
                        <option value="Pix">Pix</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Transferência">Transferência</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={startListening} title="Tentar Novamente">
            <RefreshCw size={14} /> Falar de Novo
          </button>
          {parsed && parsed.amount > 0 && (
            <button
              type="button"
              className="btn-primary"
              disabled={isSubmitting}
              onClick={handleConfirm}
              style={{ background: '#10b981' }}
            >
              <Check size={16} /> Confirmar {formatCurrency(parsed.amount)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
