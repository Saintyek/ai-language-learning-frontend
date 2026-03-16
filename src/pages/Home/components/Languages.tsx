import React from 'react'
import 'flag-icons/css/flag-icons.min.css'

interface Language {
  countryCode: string
  name: string
  region: string
}

const Languages: React.FC = () => {
  const languages: Language[] = [
    { countryCode: 'us', name: '英语', region: '美国' },
    { countryCode: 'gb', name: '英语', region: '英国' },
    { countryCode: 'au', name: '英语', region: '澳大利亚' },
    { countryCode: 'cn', name: '中文', region: '中国' },
    { countryCode: 'tw', name: '中文', region: '台湾' },
    { countryCode: 'es', name: '西班牙语', region: '西班牙' },
    { countryCode: 'mx', name: '西班牙语', region: '墨西哥' },
    { countryCode: 'bg', name: '保加利亚语', region: '保加利亚' },
    { countryCode: 'ru', name: '俄罗斯语', region: '俄罗斯' },
    { countryCode: 'hu', name: '匈牙利语', region: '匈牙利' },
    { countryCode: 'ba', name: '波斯尼亚语', region: '波斯尼亚' },
    { countryCode: 'tr', name: '土耳其语', region: '土耳其' },
    { countryCode: 'ch', name: '德语', region: '瑞士' },
    { countryCode: 'de', name: '德语', region: '德国' },
    { countryCode: 'it', name: '意大利语', region: '意大利' },
    { countryCode: 'by', name: '白俄罗斯语', region: '白俄罗斯' },
    { countryCode: 'fr', name: '法语', region: '法国' },
    { countryCode: 'ca', name: '法语', region: '加拿大' },
    { countryCode: 'se', name: '瑞典语', region: '瑞典' },
    { countryCode: 'dk', name: '丹麦语', region: '丹麦' },
    { countryCode: 'nl', name: '荷兰语', region: '荷兰' },
    { countryCode: 'be', name: '荷兰语', region: '比利时' },
    { countryCode: 'pl', name: '波兰语', region: '波兰' },
    { countryCode: 'fi', name: '芬兰语', region: '芬兰' },
    { countryCode: 'pt', name: '葡萄牙语', region: '葡萄牙' },
    { countryCode: 'br', name: '葡萄牙语', region: '巴西' },
    { countryCode: 'es', name: '西班牙语', region: '西班牙' },
    { countryCode: 'be', name: '葡萄牙语', region: '比利时' },
    { countryCode: 'ch', name: '德语', region: '瑞士' },
    { countryCode: 'my', name: '马来语', region: '马来西亚' },
  ]

  // 将语言列表分为两列
  const halfLength = Math.ceil(languages.length / 2)
  const leftColumn = languages.slice(0, halfLength)
  const rightColumn = languages.slice(halfLength)

  return (
    <section className="py-36 bg-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            多语言核心 <span className="text-blue-600">🌍</span>
          </h2>
          <p className="text-gray-600">我们支持以下语言的学习：</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-48">
          {/* 左列 */}
          <ul className="space-y-3">
            {leftColumn.map((language, index) => (
              <li key={index} className="flex items-center">
                <span className={`fi fi-${language.countryCode} mr-3`} />
                <span className="text-gray-800 text-xl">{language.name}</span>
                <span className="text-gray-500 text-xl ml-2">({language.region})</span>
              </li>
            ))}
          </ul>

          {/* 右列 */}
          <ul className="space-y-3">
            {rightColumn.map((language, index) => (
              <li key={index} className="flex items-center">
                <span className={`fi fi-${language.countryCode} mr-3`} />
                <span className="text-gray-800 text-xl">{language.name}</span>
                <span className="text-gray-500 text-xl ml-2">({language.region})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">...更多语言即将推出 ❤️</p>
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
          >
            立即开始学习一种新的语言 →
          </a>
        </div>
      </div>
    </section>
  )
}

export default Languages
