import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Trash2, 
  Calendar,
  Star,
  TrendingUp,
  BarChart3,
  Filter,
  Heart,
  HeartOff,
  RefreshCw,
  Download,
  Upload,
  Eraser
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'

// Configuração centralizada para facilitar a adição de novas loterias
const LOTTERY_CONFIGS = {
  euromilhoes: {
    id: 'euromilhoes',
    name: 'Euromilhões',
    mainCount: 5,
    mainMax: 50,
    extraCount: 2,
    extraMax: 12,
    extraLabel: 'Estrela',
    storageKey: 'euromilhoes_draws',
    color: '#3b82f6',
    extraColor: '#fbbf24'
  },
  megasena: {
    id: 'megasena',
    name: 'Mega-Sena',
    mainCount: 6,
    mainMax: 60,
    extraCount: 0,
    extraMax: 0,
    extraLabel: '',
    storageKey: 'megasena_draws',
    color: '#10b981',
    extraColor: ''
  }
};

const loadDraws = (lottoId) => {
  const saved = localStorage.getItem(LOTTERY_CONFIGS[lottoId].storageKey)
  return saved ? JSON.parse(saved) : []
}

function App() {
  const [currentLotto, setCurrentLotto] = useState('euromilhoes')
  const config = LOTTERY_CONFIGS[currentLotto]

  const [draws, setDraws] = useState(() => loadDraws('euromilhoes'))

  const [showAddModal, setShowAddModal] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [favoriteCombinations, setFavoriteCombinations] = useState(() => {
    const saved = localStorage.getItem('euromilhoes_favorites')
    return saved ? JSON.parse(saved) : []
  })
  const [combinationsVersion, setCombinationsVersion] = useState(0)
  const [newDraw, setNewDraw] = useState({
    drawNumber: '',
    date: '',
    numbersText: ''
  })

  useEffect(() => {
    localStorage.setItem(config.storageKey, JSON.stringify(draws))
  }, [draws, config.storageKey])

  useEffect(() => {
    localStorage.setItem('euromilhoes_favorites', JSON.stringify(favoriteCombinations))
  }, [favoriteCombinations])

  // Troca de loteria: define o id e os dados juntos para evitar gravar
  // os sorteios da loteria anterior na chave da nova loteria.
  const switchLotto = (lottoId) => {
    if (lottoId === currentLotto) return
    setCurrentLotto(lottoId)
    setDraws(loadDraws(lottoId))
  }

  const parseNumbers = (text) => {
    const numbers = text.match(/\d+/g) || []
    const nums = numbers.slice(0, config.mainCount).map(n => parseInt(n))
    const stars = numbers.slice(config.mainCount, config.mainCount + config.extraCount).map(n => parseInt(n))
    return { nums, stars }
  }

  const addDraw = (e) => {
    e.preventDefault()
    const { nums, stars } = parseNumbers(newDraw.numbersText)
    setDraws([
      ...draws,
      {
        id: Date.now(),
        drawNumber: newDraw.drawNumber,
        date: newDraw.date,
        numbers: nums,
        stars: stars
      }
    ])
    setNewDraw({
      drawNumber: '',
      date: '',
      numbersText: ''
    })
    setShowAddModal(false)
  }

  const deleteDraw = (id) => {
    setDraws(draws.filter(d => d.id !== id))
  }

  const fileInputRef = useRef(null)

  const normalizeDraw = (d, idx) => ({
    id: d.id ?? Date.now() + idx,
    drawNumber: d.drawNumber != null ? String(d.drawNumber) : String(idx + 1),
    date: d.date ?? '',
    numbers: Array.isArray(d.numbers) ? d.numbers.map(Number) : [],
    stars: Array.isArray(d.stars) ? d.stars.map(Number) : []
  })

  const drawKey = (d) => `${d.date}|${[...d.numbers].sort((a, b) => a - b).join(',')}|${[...d.stars].sort((a, b) => a - b).join(',')}`

  const mergeDraws = (incoming) => {
    setDraws(prev => {
      const seen = new Set(prev.map(drawKey))
      const additions = incoming
        .map(normalizeDraw)
        .filter(d => d.numbers.length > 0 && !seen.has(drawKey(d)))
      return [...prev, ...additions]
    })
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        mergeDraws(arr)
      } catch {
        alert('Arquivo JSON inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const downloadFile = (filename, content, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    downloadFile(`${config.id}-sorteios.json`, JSON.stringify(draws, null, 2), 'application/json')
  }

  const exportCSV = () => {
    const header = ['drawNumber', 'date', 'numbers', 'stars'].join(',')
    const rows = draws.map(d => [
      d.drawNumber,
      d.date,
      `"${d.numbers.join(' ')}"`,
      `"${d.stars.join(' ')}"`
    ].join(','))
    downloadFile(`${config.id}-sorteios.csv`, [header, ...rows].join('\n'), 'text/csv')
  }

  const clearAll = () => {
    if (window.confirm(`Apagar todos os ${draws.length} sorteios de ${config.name}?`)) {
      setDraws([])
    }
  }

  const addFavorite = (combination) => {
    const favorite = {
      id: Date.now(),
      ...combination,
      createdAt: new Date().toISOString()
    }
    setFavoriteCombinations([...favoriteCombinations, favorite])
  }

  const removeFavorite = (id) => {
    setFavoriteCombinations(favoriteCombinations.filter(f => f.id !== id))
  }

  const isFavorite = (combination) => {
    return favoriteCombinations.some(f => 
      f.numbers.join(',') === combination.numbers.join(',') && 
      f.stars.join(',') === combination.stars.join(',')
    )
  }

  const getFilteredDraws = () => {
    if (!filterStartDate && !filterEndDate) return draws
    return draws.filter(d => {
      const date = new Date(d.date)
      const start = filterStartDate ? new Date(filterStartDate) : null
      const end = filterEndDate ? new Date(filterEndDate) : null
      if (start && date < start) return false
      if (end && date > end) return false
      return true
    })
  }

  const filteredDraws = React.useMemo(() => getFilteredDraws(), [draws, filterStartDate, filterEndDate])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-PT')
  }

  const numberFrequency = React.useMemo(() => {
    const frequency = {}
    filteredDraws.forEach(draw => {
      draw.numbers.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1
      })
    })
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [filteredDraws])

  const starFrequency = React.useMemo(() => {
    const frequency = {}
    filteredDraws.forEach(draw => {
      draw.stars.forEach(star => {
        frequency[star] = (frequency[star] || 0) + 1
      })
    })
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [filteredDraws])

  const numberChartData = React.useMemo(
    () => numberFrequency.map(([num, count]) => ({ name: `${num}`, count })),
    [numberFrequency]
  )

  const starChartData = React.useMemo(
    () => starFrequency.map(([star, count]) => ({ name: `★${star}`, count })),
    [starFrequency]
  )

  const getPairFrequency = () => {
    const pairs = {}
    filteredDraws.forEach(draw => {
      const nums = draw.numbers.sort((a, b) => a - b)
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const pair = `${nums[i]}-${nums[j]}`
          pairs[pair] = (pairs[pair] || 0) + 1
        }
      }
    })
    return Object.entries(pairs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }

  const getTripleFrequency = () => {
    const triples = {}
    filteredDraws.forEach(draw => {
      const nums = draw.numbers.sort((a, b) => a - b)
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          for (let k = j + 1; k < nums.length; k++) {
            const triple = `${nums[i]}-${nums[j]}-${nums[k]}`
            triples[triple] = (triples[triple] || 0) + 1
          }
        }
      }
    })
    return Object.entries(triples)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }

  const getSequenceAnalysis = () => {
    const sequences = { 2: 0, 3: 0, 4: 0, 5: 0 }
    filteredDraws.forEach(draw => {
      const nums = draw.numbers.sort((a, b) => a - b)
      let currentSeq = 1
      let maxSeq = 1
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] === nums[i-1] + 1) {
          currentSeq++
          maxSeq = Math.max(maxSeq, currentSeq)
        } else {
          currentSeq = 1
        }
      }
      if (maxSeq >= 2) sequences[maxSeq]++
    })
    return sequences
  }

  const aiAnalysis = React.useMemo(() => {
    if (filteredDraws.length < 3) return null

    const allNumbers = filteredDraws.flatMap(d => d.numbers)
    const allStars = filteredDraws.flatMap(d => d.stars)
    
    const avgNumber = allNumbers.reduce((a, b) => a + b, 0) / allNumbers.length
    const avgStar = allStars.reduce((a, b) => a + b, 0) / allStars.length
    
    const hotNumbers = numberFrequency.slice(0, 3).map(([n]) => parseInt(n))
    const coldNumbers = Array.from({length: config.mainMax}, (_, i) => i + 1)
      .filter(n => !allNumbers.includes(n))
      .slice(0, 5)
    
    const recentDraws = filteredDraws.slice(-5)
    const recentNumbers = recentDraws.flatMap(d => d.numbers)
    const recentAvg = recentNumbers.reduce((a, b) => a + b, 0) / recentNumbers.length
    
    const trend = recentAvg > avgNumber ? 'Alta' : 'Baixa'
    
    return {
      hotNumbers,
      coldNumbers,
      avgNumber: avgNumber.toFixed(1),
      avgStar: avgStar.toFixed(1),
      trend,
      suggestion: `Baseado na análise de ${filteredDraws.length} sorteios, os números ${hotNumbers.join(', ')} estão mais frequentes. A tendência atual é ${trend}.`
    }
  }, [filteredDraws, numberFrequency, config])

  const suggestedCombinations = React.useMemo(() => {
    if (filteredDraws.length < 3) return []

    const allNumbers = filteredDraws.flatMap(d => d.numbers)
    
    const hotNumbers = numberFrequency.slice(0, 10).map(([n]) => parseInt(n))
    const hotStars = starFrequency.slice(0, 5).map(([s]) => parseInt(s))
    
    const combinations = []
    
    // Estratégia 1: Números quentes + estrelas quentes
    for (let i = 0; i < 3; i++) {
      const nums = [...hotNumbers].sort(() => Math.random() - 0.5).slice(0, config.mainCount).sort((a, b) => a - b)
      const stars = [...hotStars].sort(() => Math.random() - 0.5).slice(0, config.extraCount).sort((a, b) => a - b)
      combinations.push({
        strategy: 'Números Quentes',
        numbers: nums,
        stars: stars,
        confidence: 85,
        analysis: 'Baseada nos números mais frequentes históricamente'
      })
    }
    
    // Estratégia 2: Mistura de quentes e frios
    for (let i = 0; i < 2; i++) {
      const coldNumbers = Array.from({length: config.mainMax}, (_, i) => i + 1)
        .filter(n => !allNumbers.includes(n))
        .slice(0, 10)
      const mixed = [...hotNumbers.slice(0, 3), ...coldNumbers.slice(0, 2)].sort(() => Math.random() - 0.5).slice(0, config.mainCount).sort((a, b) => a - b)
      const stars = [...hotStars].sort(() => Math.random() - 0.5).slice(0, config.extraCount).sort((a, b) => a - b)
      combinations.push({
        strategy: 'Misto (Quentes+Frios)',
        numbers: mixed,
        stars: stars,
        confidence: 70,
        analysis: 'Combina números frequentes com números que nunca saíram'
      })
    }
    
    // Estratégia 3: Aleatório ponderado
    for (let i = 0; i < 2; i++) {
      const weighted = []
      for (let n = 1; n <= config.mainMax; n++) {
        const freq = numberFrequency.find(([num]) => parseInt(num) === n)
        const weight = freq ? freq[1] : 1
        for (let w = 0; w < weight; w++) weighted.push(n)
      }
      const nums = [...new Set(weighted.sort(() => Math.random() - 0.5))].slice(0, config.mainCount).sort((a, b) => a - b)
      const stars = [...hotStars].sort(() => Math.random() - 0.5).slice(0, config.extraCount).sort((a, b) => a - b)
      combinations.push({
        strategy: 'Ponderado',
        numbers: nums,
        stars: stars,
        confidence: 75,
        analysis: 'Números escolhidos com base na frequência ponderada'
      })
    }
    
    return combinations
  }, [filteredDraws, numberFrequency, starFrequency, config, combinationsVersion])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Star className="w-10 h-10 text-yellow-400" />
            {config.name}
          </h1>
          <p className="text-blue-200">Análise estatística de números sorteados</p>

          {/* Lottery Selector */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.values(LOTTERY_CONFIGS).map(lotto => (
              <button
                key={lotto.id}
                onClick={() => switchLotto(lotto.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  currentLotto === lotto.id
                    ? 'bg-white text-blue-900'
                    : 'bg-blue-700/50 text-blue-100 hover:bg-blue-700'
                }`}
              >
                {lotto.name}
              </button>
            ))}
          </div>
        </header>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Adicionar Sorteio
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all hover:scale-105"
          >
            <Upload className="w-5 h-5" />
            Importar JSON
          </button>
          <button
            onClick={exportJSON}
            disabled={draws.length === 0}
            className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all hover:scale-105"
          >
            <Download className="w-5 h-5" />
            Exportar JSON
          </button>
          <button
            onClick={exportCSV}
            disabled={draws.length === 0}
            className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all hover:scale-105"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
          <button
            onClick={clearAll}
            disabled={draws.length === 0}
            className="bg-red-600/80 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all hover:scale-105"
          >
            <Eraser className="w-5 h-5" />
            Limpar Tudo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {/* Filter Section */}
        <div className="bg-blue-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-400" />
              Filtros
            </h2>
            {(filterStartDate || filterEndDate) && (
              <button
                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Limpar Filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200 text-sm mb-2">Data Início</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full bg-blue-700 border border-blue-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-blue-200 text-sm mb-2">Data Fim</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full bg-blue-700 border border-blue-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-blue-200 text-sm font-medium">Total de Sorteios</span>
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {filteredDraws.length}
            </p>
            <p className="text-blue-300 text-xs mt-2">
              {filterStartDate || filterEndDate ? '(Filtrado)' : '(Total)'}
            </p>
          </div>

          <div className="bg-blue-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-blue-200 text-sm font-medium">Média de Números</span>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {filteredDraws.length > 0 ? (filteredDraws.reduce((sum, d) => sum + d.numbers.reduce((s, n) => s + n, 0), 0) / (filteredDraws.length * 5)).toFixed(1) : '-'}
            </p>
          </div>

          <div className="bg-blue-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-blue-200 text-sm font-medium">Média de {config.extraLabel || 'Extras'}</span>
              <Star className={`w-5 h-5 ${config.extraColor ? 'text-yellow-400' : 'hidden'}`} />
            </div>
            <p className="text-3xl font-bold text-white">
              {filteredDraws.length > 0 && config.extraCount > 0 ? (filteredDraws.reduce((sum, d) => sum + d.stars.reduce((s, n) => s + n, 0), 0) / (filteredDraws.length * config.extraCount)).toFixed(1) : '-'}
            </p>
          </div>
        </div>

        {/* Frequency Analysis */}
        {filteredDraws.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Números Mais Frequentes
                </h2>
              </div>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={numberChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                    <XAxis dataKey="name" stroke="#bfdbfe" fontSize={12} />
                    <YAxis stroke="#bfdbfe" allowDecimals={false} fontSize={12} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ background: '#1e3a8a', border: 'none', borderRadius: 12, color: '#fff' }}
                      formatter={(value) => [`${value}x`, 'Frequência']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={config.color} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {numberFrequency.map(([num, count]) => (
                  <div key={num} className="flex items-center justify-between text-white">
                    <span className="font-bold text-blue-300">#{num}</span>
                    <span className="text-blue-200">{count}x</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`bg-blue-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700 ${config.extraCount === 0 ? 'hidden' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  {config.extraLabel}s Mais Frequentes
                </h2>
              </div>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={starChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                    <XAxis dataKey="name" stroke="#bfdbfe" fontSize={12} />
                    <YAxis stroke="#bfdbfe" allowDecimals={false} fontSize={12} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ background: '#1e3a8a', border: 'none', borderRadius: 12, color: '#fff' }}
                      formatter={(value) => [`${value}x`, 'Frequência']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={config.extraColor || '#fbbf24'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {starFrequency.map(([star, count]) => (
                  <div key={star} className="flex items-center justify-between text-white">
                    <span className="font-bold text-yellow-300">★{star}</span>
                    <span className="text-blue-200">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {aiAnalysis && (
          <div className="bg-gradient-to-r from-blue-800/50 to-purple-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                Análise Inteligente
              </h2>
              <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">IA</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-900/50 rounded-xl p-4">
                <p className="text-blue-300 text-sm mb-1">Números Quentes</p>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.hotNumbers.map(num => (
                    <span key={num} className="bg-green-600 text-white px-2 py-1 rounded-full text-sm font-bold">
                      {num}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-900/50 rounded-xl p-4">
                <p className="text-blue-300 text-sm mb-1">Números Frios</p>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.coldNumbers.map(num => (
                    <span key={num} className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-bold">
                      {num}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-900/50 rounded-xl p-4">
                <p className="text-blue-300 text-sm mb-1">Tendência</p>
                <p className={`text-2xl font-bold ${aiAnalysis.trend === 'Alta' ? 'text-green-400' : 'text-red-400'}`}>
                  {aiAnalysis.trend}
                </p>
              </div>
            </div>
            
            <div className="bg-blue-900/30 rounded-xl p-4">
              <p className="text-white text-sm">
                <span className="text-yellow-400 font-semibold">💡 Insight:</span> {aiAnalysis.suggestion}
              </p>
            </div>
          </div>
        )}

        {/* Suggested Combinations */}
        {suggestedCombinations.length > 0 && (
          <div className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                Combinações Sugeridas
              </h2>
              <div className="flex items-center gap-3">
                <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">IA Predictiva</span>
                <button
                  onClick={() => setCombinationsVersion(prev => prev + 1)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedCombinations.map((combo, idx) => (
                <div key={idx} className="bg-blue-900/50 rounded-xl p-4 border border-blue-700 hover:border-purple-500 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-purple-300 text-sm font-medium">{combo.strategy}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        combo.confidence >= 80 ? 'bg-green-600' : 
                        combo.confidence >= 70 ? 'bg-yellow-600' : 'bg-blue-600'
                      } text-white`}>
                        {combo.confidence}% confiança
                      </span>
                      <button
                        onClick={() => {
                          const existingFavorite = favoriteCombinations.find(f => 
                            f.numbers.join(',') === combo.numbers.join(',') && 
                            f.stars.join(',') === combo.stars.join(',')
                          )
                          if (existingFavorite) {
                            removeFavorite(existingFavorite.id)
                          } else {
                            addFavorite(combo)
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${isFavorite(combo) ? 'text-red-500 hover:bg-red-500/20' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'}`}
                      >
                        {isFavorite(combo) ? <Heart className="w-5 h-5 fill-current" /> : <Heart className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {combo.numbers.map((num, i) => (
                      <span key={i} className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-bold">
                        {num}
                      </span>
                    ))}
                    {combo.stars.map((star, i) => (
                      <span key={`star-${i}`} className="bg-yellow-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        ★{star}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-blue-200 text-xs">
                    {combo.analysis}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-blue-900/30 rounded-xl p-4">
              <p className="text-white text-sm">
                <span className="text-purple-400 font-semibold">🎯 Nota:</span> Estas combinações são geradas com base em análise estatística dos dados históricos. Não há garantia de acerto.
              </p>
            </div>
          </div>
        )}

        {/* Favorite Combinations */}
        {favoriteCombinations.length > 0 && (
          <div className="bg-gradient-to-r from-red-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-400 fill-current" />
                Combinações Favoritas
              </h2>
              <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full">{favoriteCombinations.length} salvas</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteCombinations.map((fav) => (
                <div key={fav.id} className="bg-blue-900/50 rounded-xl p-4 border border-blue-700 hover:border-red-500 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-red-300 text-sm font-medium">{fav.strategy}</span>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <HeartOff className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {fav.numbers.map((num, i) => (
                      <span key={i} className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-bold">
                        {num}
                      </span>
                    ))}
                    {fav.stars.map((star, i) => (
                      <span key={`star-${i}`} className="bg-yellow-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        ★{star}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-blue-200 text-xs mb-2">
                    {fav.analysis}
                  </p>
                  <p className="text-blue-300 text-xs">
                    Salva em: {new Date(fav.createdAt).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draws List */}
        <div className="bg-blue-800/50 backdrop-blur-sm rounded-2xl border border-blue-700 overflow-hidden">
          <div className="p-6 border-b border-blue-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Histórico de Sorteios
              {(filterStartDate || filterEndDate) && (
                <span className="text-sm text-blue-300 ml-2">({filteredDraws.length} de {draws.length})</span>
              )}
            </h2>
          </div>
          
          {filteredDraws.length === 0 ? (
            <div className="p-12 text-center text-blue-200">
              <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>{draws.length === 0 ? 'Nenhum sorteio cadastrado' : 'Nenhum sorteio encontrado com os filtros atuais'}</p>
              <p className="text-sm mt-2">{draws.length === 0 ? 'Clique em "Adicionar Sorteio" para começar' : 'Tente ajustar os filtros'}</p>
            </div>
          ) : (
            <div className="divide-y divide-blue-700">
              {filteredDraws
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(draw => (
                  <div key={draw.id} className="p-4 hover:bg-blue-700/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">Sorteio #{draw.drawNumber}</p>
                        <p className="text-blue-200 text-sm">{formatDate(draw.date)}</p>
                      </div>
                      <button
                        onClick={() => deleteDraw(draw.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draw.numbers.map((num, idx) => (
                        <span key={idx} className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold">
                          {num}
                        </span>
                      ))}
                      {draw.stars.map((star, idx) => (
                        <span key={`star-${idx}`} className="bg-yellow-500 text-white px-3 py-1 rounded-full font-bold">
                          ★{star}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add Draw Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-blue-800 rounded-2xl p-6 w-full max-w-md border border-blue-700">
              <h2 className="text-2xl font-bold text-white mb-6">Adicionar Sorteio</h2>
              
              <form onSubmit={addDraw} className="space-y-4">
                <div>
                  <label className="block text-blue-200 text-sm mb-2">Número do Sorteio</label>
                  <input
                    type="text"
                    required
                    value={newDraw.drawNumber}
                    onChange={(e) => setNewDraw({...newDraw, drawNumber: e.target.value})}
                    className="w-full bg-blue-700 border border-blue-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ex: 1234"
                  />
                </div>

                <div>
                  <label className="block text-blue-200 text-sm mb-2">Data do Sorteio</label>
                  <input
                    type="date"
                    required
                    value={newDraw.date}
                    onChange={(e) => setNewDraw({...newDraw, date: e.target.value})}
                    className="w-full bg-blue-700 border border-blue-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-200 text-sm mb-2">Números e Estrelas (Copy/Paste)</label>
                  <textarea
                    required
                    value={newDraw.numbersText}
                    onChange={(e) => setNewDraw({...newDraw, numbersText: e.target.value})}
                    className="w-full bg-blue-700 border border-blue-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                    placeholder="Cole os números aqui. Ex: 5 12 23 34 45 2 8&#10;Os primeiros 5 números são os principais e os últimos 2 são as estrelas"
                  />
                  <p className="text-blue-300 text-xs mt-2">
                    Formato: 5 números principais + 2 estrelas (ex: 5 12 23 34 45 2 8)
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-blue-600 text-blue-200 hover:bg-blue-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
