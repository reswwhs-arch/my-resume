import { useState, useEffect } from 'react'
import { 
  Search, User, MapPin, Send, Mail, Phone, X, Bot, FileText, Download
} from 'lucide-react'
import './App.css'
import AIChat from './AIChat'
import { SKILLS, LEVEL_LABELS } from './data/skillsData'

function App() {
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState(new Set())
  const [modalSkill, setModalSkill] = useState(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [consoleOutput, setConsoleOutput] = useState('')
  const [consoleVisible, setConsoleVisible] = useState(false)
  const [consoleInput, setConsoleInput] = useState('')
  const [aiChatVisible, setAiChatVisible] = useState(false)
  const [imageGallery, setImageGallery] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [diplomModalVisible, setDiplomModalVisible] = useState(false)

  const domainOrder = [...new Set(SKILLS.map(s => s.domain))]
  
  const tagCounts = {}
  SKILLS.forEach(s => s.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 }))
  const allTags = Object.keys(tagCounts).sort((a,b) => tagCounts[b]-tagCounts[a] || a.localeCompare(b))

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.body.style.setProperty('--x', e.clientX + 'px')
      document.body.style.setProperty('--y', e.clientY + 'px')
    }
    window.addEventListener('pointermove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('pointermove', handleMouseMove)
  }, [])

  const matches = (skill) => {
    const q = query.trim().toLowerCase()
    const textMatch = !q || (skill.title + ' ' + skill.desc + ' ' + skill.tags.join(' ')).toLowerCase().includes(q)
    const tagMatch = activeTags.size === 0 || skill.tags.some(t => activeTags.has(t))
    return textMatch && tagMatch
  }

  const visibleCount = SKILLS.filter(s => matches(s)).length

  const toggleTag = (tag) => {
    const newTags = new Set(activeTags)
    if (newTags.has(tag)) newTags.delete(tag)
    else newTags.add(tag)
    setActiveTags(newTags)
  }

  const clearTags = () => setActiveTags(new Set())

  const levelDots = (level) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < level ? 'filled' : ''}></span>
    ))
  }

  const SkillCard = ({ skill, index }) => {
    const Icon = skill.icon || Wrench
    const shownTags = skill.tags.slice(0, 2)
    
    return (
      <button 
        className={`skill-card ${!matches(skill) ? 'hidden-card' : ''}`}
        onClick={() => setModalSkill(skill)}
        style={{ animationDelay: `${Math.min(index, 10) * 0.03}s` }}
      >
        <div className="card-header">
          <div className="icon"><Icon size={18} strokeWidth={1.75} /></div>
          <h3>{skill.title}</h3>
        </div>
        {shownTags.map(t => <span key={t} className="tag">{t}</span>)}
        <p>{skill.desc}</p>
        <div className={`level-row lvl-${skill.level}`}>
          <div className="level-dots">{levelDots(skill.level)}</div>
          <span className={`level-label lvl-${skill.level}-txt`}>{LEVEL_LABELS[skill.level]}</span>
        </div>
      </button>
    )
  }

  const consoleCommands = {
    'help': 'Доступные команды: hardware, skills, contact, clear',
    'hardware': 'FX-8350 + GTX 1070, thermals OK',
    'skills': '25 навыков в 5 направлениях: железо, программирование, ИИ, офис, творчество',
    'contact': 'Telegram: @TrevorGro | Email: reswwhs@gmail.com',
    'clear': ''
  }

  const handleConsoleSubmit = (e) => {
    if (e.key === 'Enter') {
      const command = consoleInput.trim().toLowerCase()
      const response = consoleCommands[command] !== undefined 
        ? consoleCommands[command] 
        : 'Команда не найдена. Напишите help для списка команд.'
      
      setConsoleOutput(`> ${consoleInput}\n→ ${response}`)
      setConsoleVisible(true)
      setConsoleInput('')
      
      if (command === 'clear') {
        setConsoleVisible(false)
        setConsoleOutput('')
      }
    }
  }

  const relatedSkills = modalSkill 
    ? SKILLS.filter(s => s.id !== modalSkill.id && s.tags.some(t => modalSkill.tags.includes(t)))
    : []

  const proofImages = {
    'ai-qa-workflow': 'obsidian-graph.png',
    'local-llm': 'ollama-terminal.png',
    'hw-diag': 'motherboard-thermal-paste.jpg'
  }

  const handleDetailsClick = () => {
    if (modalSkill.images && modalSkill.images.length > 0) {
      setImageGallery(modalSkill.images)
      setCurrentImageIndex(0)
    } else {
      alert('Для этого навыка скриншоты пока не добавлены.\n\nСкоро здесь будут отображаться:\n- Скриншоты работ\n- Примеры проектов\n- Демонстрации навыков')
    }
  }

  return (
    <>
      <header className="hero">
        <div className="wrap hero-inner">
          <div className="photo-frame">
            <img src="/photo.jpg" alt="Фото Сыймыка Шарабидинова" 
                 onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }} />
            <div className="placeholder">ЗАМЕНИ<br />photo.jpg</div>
          </div>
          <div className="hero-text">
            <h1>Сыймык Шарабидинов</h1>
            <p className="role">Junior IT-специалист · Техподдержка · Помощник по ПК</p>
            <p className="bio node2">
              IT-специалист с сильной инженерной базой в железе, сетях и современных AI-пайплайнах.
              Имею практический опыт локального развёртывания open-source LLM (Qwen, Gemma) на потребительском железе
              с оптимизацией RAM/VRAM. Умею настраивать гибридные AI-системы: локальная обработка + маршрутизация
              к старшим моделям через протокол MCP и API. Использую Python и локальный ИИ для написания скриптов
              и автоматизации рутины.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--ok)' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--ok)', borderRadius: '50%', boxShadow: '0 0 8px var(--ok)' }}></span>
              Открыт к предложениям: Бишкек / Кара-Балта / Удаленно
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setAiChatVisible(true)}
                style={{ padding: '10px 18px', background: 'var(--accent)', color: '#0e2436', fontWeight: '600', fontSize: '13px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              >
                <Bot size={16} />
                AI Чат
              </button>
              <a href="https://t.me/TrevorGro" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '10px 18px', background: 'var(--accent)', color: '#0e2436', fontWeight: '600', fontSize: '13px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Написать в Telegram →
              </a>
              <a href="mailto:reswwhs@gmail.com" style={{ textDecoration: 'none', padding: '10px 18px', border: '1px solid var(--line)', color: 'var(--paper)', fontSize: '13px', borderRadius: '3px' }}>
                reswwhs@gmail.com
              </a>
            </div>
            <div style={{ marginTop: '20px', padding: '12px 16px', border: '1px dashed var(--line)', background: 'rgba(18, 48, 73, 0.4)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '6px' }}>// ТЕХНИЧЕСКИЙ СЕЙТ-АП (DEV RIG)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: 'var(--paper-dim)' }}>
                <span>CPU: AMD FX-8350 (8 cores)</span>
                <span>GPU: GTX 1070 8GB VRAM</span>
                <span>RAM: 20 GB DDR3</span>
                <span>OS: Win 10 / WSL2 Linux</span>
              </div>
            </div>
            <div style={{ marginTop: '16px', fontFamily: 'IBM Plex Mono, monospace' }}>
              <div id="console-output" style={{ background: 'rgba(14, 36, 54, 0.95)', border: '1px solid var(--line)', padding: '8px 12px', marginBottom: '4px', fontSize: '11px', color: 'var(--paper-dim)', maxWidth: '300px', minHeight: '60px', display: consoleVisible ? 'block' : 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'pre-line' }}>
                {consoleOutput}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(14, 36, 54, 0.95)', border: '1px solid var(--line)', padding: '6px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <span style={{ color: 'var(--accent)', fontSize: '12px' }}>&gt;</span>
                <input 
                  id="console-input"
                  type="text" 
                  placeholder="help, skills, hardware, contact, clear"
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  onKeyDown={handleConsoleSubmit}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--paper)', fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace', width: '200px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="pipeline">
        <div className="wrap">
          <p className="label">// ОСНОВНАЯ ТРАЕКТОРИЯ</p>
          <div className="pipeline-row">
            <div className="node">Железо и Windows</div><span className="arrow">→</span>
            <div className="node">Сети и Терминал</div><span className="arrow">→</span>
            <div className="node">Локальные LLM (Ollama/Qwen)</div><span className="arrow">→</span>
            <div className="node">MCP и Автоматизация</div><span className="arrow">→</span>
            <div className="node highlight">Python-скриптинг</div>
          </div>
          <p className="pipeline-note">
            Оптимизировал работу ПК под запуск открытых ИИ на потребительском железе. Собрал связку из локальных
            моделей и старших LLM через протокол MCP для написания рабочих скриптов и автоматизации задач с нулевыми затратами на API.
          </p>
        </div>
      </section>

      <section className="toolbar">
        <div className="wrap">
          <div className="search-row">
            <Search size={15} strokeWidth={2} />
            <input 
              id="search-input"
              type="text" 
              placeholder="Поиск по навыкам: python, obsidian, сети, тестирования, llm…" 
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="search-count">{(query || activeTags.size) ? `${visibleCount} из ${SKILLS.length}` : ''}</span>
          </div>
          <div className="tag-row">
            <button 
              className={`tag-chip clear ${activeTags.size === 0 ? 'active' : ''}`}
              onClick={clearTags}
            >
              Все теги
            </button>
            {allTags.map(t => (
              <button 
                key={t}
                className={`tag-chip ${activeTags.has(t) ? 'active' : ''}`}
                onClick={() => toggleTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {domainOrder.map(domain => {
        const [num, title] = domain.split(' · ')
        const skills = SKILLS.filter(s => s.domain === domain)
        const visibleSkills = skills.filter(s => matches(s))
        const anyVisible = visibleSkills.length > 0
        
        return (
          <section key={domain} className={`domain ${!anyVisible ? 'hidden-domain' : ''}`} data-domain={domain}>
            <div className="wrap">
              <div className="domain-head">
                <span className="domain-num">{num}</span>
                <h2>{title}</h2>
              </div>
              <div className="skill-grid" data-grid={domain}>
                {skills.map((s, i) => <SkillCard key={s.id} skill={s} index={i} />)}
              </div>
              <p className={`no-results ${anyVisible ? 'hidden-card' : ''}`} data-empty={domain}>
                Ничего не найдено в этом разделе.
              </p>
            </div>
          </section>
        )
      })}

      <section className="langs">
        <div className="wrap">
          <div className="domain-head">
            <span className="domain-num">06</span>
            <h2>Языки</h2>
          </div>
          <div className="lang-row">
            <span>Русский</span>
            <div className="lang-bar"><span style={{ width: '100%' }}></span></div>
            <span>свободно</span>
          </div>
          <div className="lang-row">
            <span>Кыргызский</span>
            <div className="lang-bar"><span style={{ width: '76%' }}></span></div>
            <span>родной</span>
          </div>
          <div className="lang-row">
            <span>Английский</span>
            <div className="lang-bar"><span style={{ width: '30%' }}></span></div>
            <span>базовый-текст</span>
          </div>
        </div>
      </section>

      <section className="education">
        <div className="wrap">
          <div className="domain-head">
            <span className="domain-num">07</span>
            <h2>Образование</h2>
          </div>
          <div className="edu-item">
            <div className="edu-header">
              <span className="edu-title">Кара-Балтинский технико-экономический колледж им. М.Т. Ибрагимова</span>
              <span className="edu-year">Выпуск 2026</span>
            </div>
            <p className="edu-desc" style={{ color: 'var(--accent)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', marginBottom: '6px' }}>
              Квалификация: Техник-программист
            </p>
            <p className="edu-desc">
              Специальность: «Программное обеспечение вычислительной техники и автоматизированных систем».<br />
              Изученные направления: архитектура ЭВМ, операционные системы, компьютерные сети и телекоммуникации, базы данных, технические средства информатизации.
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setDiplomModalVisible(true)}
                style={{ 
                  padding: '8px 16px', 
                  background: 'var(--accent-soft)', 
                  border: '1px solid var(--accent)', 
                  color: 'var(--paper)', 
                  fontSize: '12px', 
                  borderRadius: '3px', 
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--accent)'
                  e.target.style.color = 'var(--bg)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--accent-soft)'
                  e.target.style.color = 'var(--paper)'
                }}
              >
                <FileText size={14} />
                Посмотреть диплом
              </button>
              <a 
                href="/diplomUC 266210958.pdf" 
                download
                style={{ 
                  padding: '8px 16px', 
                  background: 'transparent', 
                  border: '1px solid var(--line)', 
                  color: 'var(--paper-dim)', 
                  fontSize: '12px', 
                  borderRadius: '3px', 
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'var(--accent)'
                  e.target.style.color = 'var(--paper)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'var(--line)'
                  e.target.style.color = 'var(--paper-dim)'
                }}
              >
                <Download size={14} />
                Скачать PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="experience">
        <div className="wrap">
          <div className="domain-head">
            <span className="domain-num">08</span>
            <h2>Опыт работы</h2>
          </div>
          <div className="edu-item">
            <div className="edu-header">
              <span className="edu-title">Подработка в мэрии Кара-Балта</span>
              <span className="edu-year">2025</span>
            </div>
            <p className="edu-desc">Настройка и поддержание работоспособности парка компьютеров. Оперативное решение инцидентов сотрудников (принтеры, локальная сеть, зависания Windows). Подготовка интерактивных презентаций для руководства города.</p>
          </div>
        </div>
      </section>

      <section className="soft-skills">
        <div className="wrap">
          <div className="domain-head">
            <span className="domain-num">09</span>
            <h2>Личные качества</h2>
          </div>
          <div className="soft-skills-grid">
            <div className="soft-skill-item">
              <h4>Аналитический траблшутинг</h4>
              <p>Умение раскладывать сложную проблему на цепочку простых шагов (от физического уровня кабеля/разъёма до системных логов).</p>
            </div>
            <div className="soft-skill-item">
              <h4>Способность к самообучению</h4>
              <p>Все практические навыки (от пайки/сборки железа до запуска локальных нейросетей) освоены самостоятельно через документацию, форумы и эксперименты.</p>
            </div>
            <div className="soft-skill-item">
              <h4>Техническое наставничество</h4>
              <p>Умение объяснять сложные процессы простым языком на понятных жизненных аналогиях.</p>
            </div>
            <div className="soft-skill-item">
              <h4>Работа по ТЗ</h4>
              <p>Способность автономно концентрироваться на задаче с чёткими критериями входа и выхода.</p>
            </div>
            <div className="soft-skill-item">
              <h4>Критическое мышление</h4>
              <p>Проверка чужих решений и кода перед запуском в продакшн, устойчивость к автоматическому принятию непроверенных данных.</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} style={{ color: 'var(--accent)' }} />
            <span>Сыймык Шарабидинов</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} style={{ color: 'var(--accent)' }} />
            <span>Кара-Балта</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={16} style={{ color: 'var(--accent)' }} />
            <a href="https://t.me/TrevorGro" target="_blank" rel="noopener noreferrer">@TrevorGro</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={16} style={{ color: 'var(--accent)' }} />
            <a href="mailto:reswwhs@gmail.com">reswwhs@gmail.com</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={16} style={{ color: 'var(--accent)' }} />
            <a href="tel:+996709847716" style={{ color: 'var(--paper)', textDecoration: 'none' }}>
              +996 709 847 716
            </a>
          </div>
        </div>
      </footer>

      <div className={`modal-backdrop ${modalSkill ? 'open' : ''}`} onClick={() => setModalSkill(null)}>
        {modalSkill && (
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalSkill(null)} aria-label="Закрыть">
              <X size={14} />
            </button>
            <p className="modal-domain">{modalSkill.domain}</p>
            <div className="modal-header">
              <div className="icon">
                {modalSkill.icon ? <modalSkill.icon size={20} strokeWidth={1.75} /> : <Wrench size={20} strokeWidth={1.75} />}
              </div>
              <h3>{modalSkill.title}</h3>
            </div>
            <div className="tag-row">
              {modalSkill.tags.map(t => <span key={t} className="tag-chip active">{t}</span>)}
            </div>
            <p className="desc">{modalSkill.desc}{modalSkill.evidence ? <><br /><br />{modalSkill.evidence}</> : ''}</p>
            <div className={`modal-level lvl-${modalSkill.level}`}>
              <p className="modal-section-label">Уровень</p>
              <div className="level-row">
                <div className="level-dots">{levelDots(modalSkill.level)}</div>
                <span className={`level-label lvl-${modalSkill.level}-txt`}>{LEVEL_LABELS[modalSkill.level]}</span>
              </div>
            </div>
            <div className="modal-tools">
              <p className="modal-section-label">Инструменты / бренды</p>
              <p className={`tools-value ${!modalSkill.tools || modalSkill.tools === 'неизвестно' ? 'unknown' : ''}`}>
                {modalSkill.tools || 'неизвестно'}
              </p>
            </div>
            {modalSkill.subskills && (
              <div className="subskills-section">
                <p className="modal-section-label">Детализация навыка</p>
                {Object.entries(modalSkill.subskills).map(([name, percent]) => (
                  <div key={name} className="subskill-row">
                    <span className="subskill-name">{name}</span>
                    <div className="subskill-bar">
                      <div className="subskill-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="subskill-percent">{percent}%</span>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-related">
              <p className="modal-section-label">Связанные навыки</p>
              {modalSkill.related && modalSkill.related.length > 0
                ? modalSkill.related.map(relatedId => {
                    const relatedSkill = SKILLS.find(s => s.id === relatedId)
                    return relatedSkill ? (
                      <button key={relatedId} className="related-link" onClick={() => setModalSkill(relatedSkill)}>
                        {relatedSkill.title}
                      </button>
                    ) : null
                  })
                : <span className="related-empty">Пока не с чем связать — но по мере роста базы здесь появятся ссылки.</span>
              }
            </div>
            <button className="details-button enabled" onClick={handleDetailsClick}>
              Подробнее с изображениями
            </button>
          </div>
        )}
      </div>

      <div className={`modal-backdrop ai-chat-backdrop ${aiChatVisible ? 'open' : ''}`} onClick={() => setAiChatVisible(false)}>
        {aiChatVisible && (
          <div className="modal-card ai-chat-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '95vh', overflow: 'auto' }}>
            <button className="modal-close" onClick={() => setAiChatVisible(false)} aria-label="Закрыть">
              <X size={14} />
            </button>
            <AIChat />
          </div>
        )}
      </div>

      <div className={`modal-backdrop image-gallery-backdrop ${imageGallery ? 'open' : ''}`} onClick={() => setImageGallery(null)}>
        {imageGallery && (
          <div className="modal-card image-gallery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <button className="modal-close" onClick={() => setImageGallery(null)} aria-label="Закрыть">
              <X size={14} />
            </button>
            <div className="gallery-container">
              <button 
                className="gallery-nav gallery-prev" 
                onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageGallery.length - 1))}
                disabled={imageGallery.length === 1}
              >
                ‹
              </button>
              <div className="gallery-image-wrapper">
                <img 
                  src={imageGallery[currentImageIndex]} 
                  alt={`Portfolio image ${currentImageIndex + 1}`} 
                  className="gallery-image"
                />
              </div>
              <button 
                className="gallery-nav gallery-next" 
                onClick={() => setCurrentImageIndex((prev) => (prev < imageGallery.length - 1 ? prev + 1 : 0))}
                disabled={imageGallery.length === 1}
              >
                ›
              </button>
            </div>
            <div className="gallery-counter">
              {currentImageIndex + 1} / {imageGallery.length}
            </div>
          </div>
        )}
      </div>

      <div className={`modal-backdrop diplom-backdrop ${diplomModalVisible ? 'open' : ''}`} onClick={() => setDiplomModalVisible(false)}>
        {diplomModalVisible && (
          <div className="modal-card diplom-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '95vh', padding: '0', overflow: 'hidden' }}>
            <button className="modal-close" onClick={() => setDiplomModalVisible(false)} aria-label="Закрыть" style={{ zIndex: 10, background: 'var(--panel)', position: 'sticky', top: '10px', right: '10px' }}>
              <X size={14} />
            </button>
            <div style={{ width: '100%', height: '90vh' }}>
              <iframe 
                src="/diplomUC 266210958.pdf" 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Диплом"
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
