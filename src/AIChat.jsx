import { useState, useEffect, useRef } from 'react'
import { Send, Key, Settings, Trash2, Save, Plus, X, MessageSquare, Bot, Code, Lightbulb, Loader2, ExternalLink } from 'lucide-react'

const CHAT_ROLES = [
  { id: 'assistant', name: 'Ассистент', icon: MessageSquare, systemPrompt: 'Ты полезный ассистент, который помогает с различными задачами. Отвечай кратко и по делу на русском языке.' },
  { id: 'coder', name: 'Программист', icon: Code, systemPrompt: 'Ты опытный программист. Помогай с написанием кода, отладкой и объясняй технические концепции. Используй markdown для форматирования кода.' },
]

const API_KEY_SLOTS = 6

export default function AIChat() {
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_api_keys')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === API_KEY_SLOTS) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error loading API keys from localStorage:', e)
    }
    return Array(API_KEY_SLOTS).fill('')
  })
  const [selectedKeySlot, setSelectedKeySlot] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_selected_key_slot')
      return saved ? parseInt(saved, 10) : 0
    } catch (e) {
      return 0
    }
  })
  const [selectedModel, setSelectedModel] = useState('')
  const [chatModels, setChatModels] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_chat_models')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed) return parsed
      }
    } catch (e) {
      console.error('Error loading chat models from localStorage:', e)
    }
    return CHAT_ROLES.reduce((acc, role) => ({ ...acc, [role.id]: '' }), {})
  })
  const [showSettings, setShowSettings] = useState(false)
  const [models, setModels] = useState([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelFilter, setModelFilter] = useState('all')
  
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('ai_chats')
    return saved ? JSON.parse(saved) : CHAT_ROLES.map(role => ({
      id: role.id,
      role: role.id,
      messages: [],
      isLoading: false
    }))
  })
  
  const [inputs, setInputs] = useState(() => 
    CHAT_ROLES.reduce((acc, role) => ({ ...acc, [role.id]: '' }), {})
  )
  
  const chatEndRefs = useRef({})

  useEffect(() => {
    localStorage.setItem('ai_api_keys', JSON.stringify(apiKeys))
  }, [apiKeys])

  useEffect(() => {
    localStorage.setItem('ai_selected_key_slot', selectedKeySlot.toString())
  }, [selectedKeySlot])

  useEffect(() => {
    localStorage.setItem('ai_chats', JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    localStorage.setItem('ai_chat_models', JSON.stringify(chatModels))
  }, [chatModels])

  useEffect(() => {
    const loadModels = async () => {
      const currentKey = apiKeys[selectedKeySlot]
      if (!currentKey) {
        setModels([])
        return
      }

      setIsLoadingModels(true)
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${currentKey}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to load models')
        }

        const data = await response.json()
        const modelList = data.data || []
        
        // Сортируем: сначала free модели, потом остальные
        const sortedModels = modelList.sort((a, b) => {
          const aFree = a.id.includes(':free') || a.pricing?.prompt === '0'
          const bFree = b.id.includes(':free') || b.pricing?.prompt === '0'
          if (aFree && !bFree) return -1
          if (!aFree && bFree) return 1
          return a.name.localeCompare(b.name)
        })

        setModels(sortedModels)

        // Устанавливаем первую free модель по умолчанию для чатов без модели
        setChatModels(prev => {
          const updated = { ...prev }
          CHAT_ROLES.forEach(role => {
            if (!updated[role.id] || !sortedModels.find(m => m.id === updated[role.id])) {
              const firstFree = sortedModels.find(m => m.id.includes(':free') || m.pricing?.prompt === '0')
              updated[role.id] = firstFree?.id || sortedModels[0].id
            }
          })
          return updated
        })
      } catch (error) {
        console.error('Error loading models:', error)
        setModels([])
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadModels()
  }, [apiKeys, selectedKeySlot])

  const scrollToBottom = (chatId) => {
    setTimeout(() => {
      if (chatEndRefs.current[chatId]) {
        chatEndRefs.current[chatId].scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const sendMessage = async (chatId) => {
    const message = inputs[chatId].trim()
    if (!message) return
    
    const currentKey = apiKeys[selectedKeySlot]
    if (!currentKey) {
      alert('Сначала добавьте API ключ в настройках')
      setShowSettings(true)
      return
    }

    const chatModel = chatModels[chatId]
    if (!chatModel) {
      alert('Сначала выберите модель для этого чата')
      return
    }

    const roleConfig = CHAT_ROLES.find(r => r.id === chatId)
    
    const newMessage = { role: 'user', content: message }
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, newMessage], isLoading: true }
        : chat
    ))
    setInputs(prev => ({ ...prev, [chatId]: '' }))

    try {
      const messages = [
        { role: 'system', content: roleConfig.systemPrompt },
        ...chats.find(c => c.id === chatId).messages,
        newMessage
      ]

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Portfolio Resume'
        },
        body: JSON.stringify({
          model: chatModel,
          messages,
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Превышен лимит запросов. Подождите немного или используйте другую модель/ключ.')
        }
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const aiMessage = { role: 'assistant', content: data.choices[0]?.message?.content || 'Нет ответа' }
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, aiMessage], isLoading: false }
          : chat
      ))
      
      scrollToBottom(chatId)
    } catch (error) {
      console.error('Error:', error)
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, isLoading: false }
          : chat
      ))
      alert('Ошибка при отправке сообщения: ' + error.message)
    }
  }

  const clearChat = (chatId) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, messages: [] } : chat
    ))
  }

  const saveApiKey = (slot, key) => {
    setApiKeys(prev => prev.map((k, i) => i === slot ? key : k))
  }

  const selectedModelConfig = models.find(m => m.id === selectedModel)

  return (
    <div style={{ padding: '40px 0', borderTop: '1px solid var(--line)', overflowX: 'hidden', overflowY: 'auto', height: '100%' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', margin: 0 }}>
            <Bot size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent)' }} />
            AI Чат-лаборатория
          </h2>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '8px 16px',
              background: showSettings ? 'var(--accent)' : 'var(--panel)',
              border: '1px solid var(--line)',
              color: showSettings ? '#0e2436' : 'var(--paper)',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <Settings size={16} />
            Настройки
          </button>
        </div>

        {showSettings && (
          <div style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--line)',
            padding: '20px',
            marginBottom: '24px',
            borderRadius: '6px'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: 'var(--accent)' }}>
              <Key size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              API Ключи OpenRouter
            </h3>
            
            <div style={{
              padding: '12px 16px',
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px',
              color: 'var(--paper)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#4caf50' }}>Получить API ключ бесплатно:</span>
                <a 
                  href="https://openrouter.ai/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#4caf50',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  OpenRouter <ExternalLink size={14} />
                </a>
              </div>
              <div style={{ color: 'var(--paper-dim)', fontSize: '12px' }}>
                Требуется Google аккаунт для регистрации. После регистрации скопируйте API ключ и вставьте ниже.
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
              {Array.from({ length: API_KEY_SLOTS }).map((_, slot) => (
                <div key={slot} style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ 
                    padding: '8px 12px', 
                    background: 'var(--panel)', 
                    border: '1px solid var(--line)',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontFamily: 'IBM Plex Mono, monospace',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    #{slot + 1}
                  </span>
                  <input
                    type="password"
                    value={apiKeys[slot]}
                    onChange={(e) => saveApiKey(slot, e.target.value)}
                    placeholder="sk-or-v1-..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--panel)',
                      border: `1px solid ${selectedKeySlot === slot ? 'var(--accent)' : 'var(--line)'}`,
                      borderRadius: '3px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => setSelectedKeySlot(slot)}
                    style={{
                      padding: '8px 12px',
                      background: selectedKeySlot === slot ? 'var(--accent)' : 'var(--panel)',
                      border: '1px solid var(--line)',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: selectedKeySlot === slot ? '#0e2436' : 'var(--paper)'
                    }}
                  >
                    {selectedKeySlot === slot ? '✓' : 'Выбрать'}
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed var(--line)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--paper-dim)' }}>
                Модель ИИ
              </h4>
              
              {isLoadingModels ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--paper-dimmer)', fontSize: '13px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Загрузка моделей...
                </div>
              ) : !apiKeys[selectedKeySlot] ? (
                <div style={{ color: 'var(--paper-dimmer)', fontSize: '13px', fontStyle: 'italic' }}>
                  Добавьте API ключ для загрузки моделей
                </div>
              ) : models.length === 0 ? (
                <div style={{ color: 'var(--paper-dimmer)', fontSize: '13px', fontStyle: 'italic' }}>
                  Не удалось загрузить модели. Проверьте API ключ.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setModelFilter('all')}
                      style={{
                        padding: '6px 12px',
                        background: modelFilter === 'all' ? 'var(--accent)' : 'var(--panel)',
                        border: '1px solid var(--line)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: modelFilter === 'all' ? '#0e2436' : 'var(--paper)'
                      }}
                    >
                      Все
                    </button>
                    <button
                      onClick={() => setModelFilter('free')}
                      style={{
                        padding: '6px 12px',
                        background: modelFilter === 'free' ? 'rgba(76, 175, 80, 0.2)' : 'var(--panel)',
                        border: modelFilter === 'free' ? '1px solid #4caf50' : '1px solid var(--line)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: modelFilter === 'free' ? '#4caf50' : 'var(--paper)'
                      }}
                    >
                      🆓 Бесплатные
                    </button>
                    <button
                      onClick={() => setModelFilter('paid')}
                      style={{
                        padding: '6px 12px',
                        background: modelFilter === 'paid' ? 'var(--accent-soft)' : 'var(--panel)',
                        border: modelFilter === 'paid' ? '1px solid var(--accent)' : '1px solid var(--line)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: modelFilter === 'paid' ? 'var(--paper)' : 'var(--paper-dim)'
                      }}
                    >
                      💳 Платные
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {models.filter(model => {
                      const isFree = model.id.includes(':free') || model.pricing?.prompt === '0'
                      if (modelFilter === 'free') return isFree
                      if (modelFilter === 'paid') return !isFree
                      return true
                    }).map(model => {
                      const isFree = model.id.includes(':free') || model.pricing?.prompt === '0'
                      const isSelected = selectedModel === model.id
                      
                      return (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          style={{
                            padding: '8px 14px',
                            background: isSelected ? 'var(--accent-soft)' : isFree ? 'rgba(76, 175, 80, 0.1)' : 'var(--panel)',
                            border: `1px solid ${isSelected ? 'var(--accent)' : isFree ? 'rgba(76, 175, 80, 0.3)' : 'var(--line)'}`,
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: isSelected ? 'var(--paper)' : isFree ? '#4caf50' : 'var(--paper-dim)',
                            transition: 'all 0.15s ease',
                            position: 'relative'
                          }}
                          title={model.description || model.id}
                        >
                          {isFree && (
                            <span style={{ 
                              position: 'absolute', 
                              top: '-4px', 
                              right: '-4px', 
                              background: '#4caf50', 
                              color: 'white', 
                              fontSize: '8px', 
                              padding: '1px 4px', 
                              borderRadius: '4px',
                              fontWeight: 'bold'
                            }}>
                              FREE
                            </span>
                          )}
                          {model.name || model.id.split('/').pop()}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '20px',
          marginBottom: '16px'
        }}>
          {CHAT_ROLES.map(role => {
            const chat = chats.find(c => c.id === role.id)
            const RoleIcon = role.icon
            const currentChatModel = chatModels[role.id]
            const currentModelConfig = models.find(m => m.id === currentChatModel)
            
            return (
              <div 
                key={role.id}
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '450px'
                }}
              >
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--panel)',
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RoleIcon size={18} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{role.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={currentChatModel || ''}
                      onChange={(e) => setChatModels(prev => ({ ...prev, [role.id]: e.target.value }))}
                      disabled={!currentChatModel && models.length === 0}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--bg-2)',
                        border: '1px solid var(--line)',
                        borderRadius: '3px',
                        color: 'var(--paper)',
                        fontSize: '11px',
                        maxWidth: '150px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Выбрать модель</option>
                      {models.map(model => {
                        const isFree = model.id.includes(':free') || model.pricing?.prompt === '0'
                        return (
                          <option key={model.id} value={model.id}>
                            {isFree ? '🆓 ' : ''}{model.name || model.id.split('/').pop()}
                          </option>
                        )
                      })}
                    </select>
                    <button
                      onClick={() => clearChat(role.id)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid var(--line)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        color: 'var(--paper-dimmer)',
                        fontSize: '11px'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {chat.messages.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      color: 'var(--paper-dimmer)',
                      fontSize: '13px',
                      padding: '40px 20px',
                      fontStyle: 'italic'
                    }}>
                      Начните диалог с {role.name.toLowerCase()}...
                    </div>
                  )}
                  
                  {chat.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        maxWidth: '85%',
                        background: msg.role === 'user' ? 'var(--accent-soft)' : 'var(--panel)',
                        border: `1px solid ${msg.role === 'user' ? 'var(--accent)' : 'var(--line)'}`,
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.content}
                    </div>
                  ))}
                  
                  {chat.isLoading && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--panel)',
                      border: '1px solid var(--line)',
                      alignSelf: 'flex-start',
                      fontSize: '13px',
                      color: 'var(--paper-dimmer)'
                    }}>
                      <Bot size={16} style={{ display: 'inline', animation: 'pulse 1s infinite' }} />
                      Печатает...
                    </div>
                  )}
                  
                  <div ref={el => chatEndRefs.current[role.id] = el} />
                </div>
                
                <div style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <input
                    value={inputs[role.id]}
                    onChange={(e) => setInputs(prev => ({ ...prev, [role.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(role.id)}
                    placeholder={`Сообщение для ${role.name.toLowerCase()}...`}
                    disabled={chat.isLoading}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--panel)',
                      border: '1px solid var(--line)',
                      borderRadius: '3px',
                      color: 'var(--paper)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => sendMessage(role.id)}
                    disabled={chat.isLoading || !inputs[role.id].trim()}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: chat.isLoading || !inputs[role.id].trim() ? 'not-allowed' : 'pointer',
                      opacity: chat.isLoading || !inputs[role.id].trim() ? 0.5 : 1,
                      color: '#0e2436',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          padding: '16px',
          background: 'var(--bg-2)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--paper-dimmer)',
          fontFamily: 'IBM Plex Mono, monospace'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent)' }}>//</span>
            <span>Активная модель: {selectedModelConfig?.name || selectedModelConfig?.id || 'Не выбрана'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)' }}>//</span>
            <span>API ключ: Слот #{selectedKeySlot + 1} {apiKeys[selectedKeySlot] ? '✓' : '(не установлен)'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
