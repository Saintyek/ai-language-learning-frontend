import React from 'react'
import 'flag-icons/css/flag-icons.min.css'
import { Link } from 'react-router-dom'
import { languageOptions } from '@/consts/languages'

const Languages: React.FC = () => {
  const previewLanguages = languageOptions.slice(0, 10)
  const halfLength = Math.ceil(previewLanguages.length / 2)
  const leftColumn = previewLanguages.slice(0, halfLength)
  const rightColumn = previewLanguages.slice(halfLength)

  return (
    <section className="py-36 bg-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            多语言核心 <span className="text-blue-600">🌍</span>
          </h2>
          <p className="text-gray-600">我们支持以下语言的学习：</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-32">
          <ul className="space-y-3">
            {leftColumn.map(language => (
              <li key={language.label} className="flex items-center">
                <span className={`fi fi-${language.code} mr-3`} />
                <span className="text-gray-800 text-xl">{language.label}</span>
              </li>
            ))}
          </ul>

          <ul className="space-y-3">
            {rightColumn.map(language => (
              <li key={language.label} className="flex items-center">
                <span className={`fi fi-${language.code} mr-3`} />
                <span className="text-gray-800 text-xl">{language.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">...更多语言即将推出 ❤️</p>
          <Link
            to="/languages"
            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
          >
            立即开始学习一种新的语言 →
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Languages
