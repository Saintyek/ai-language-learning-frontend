import React from 'react'
import 'flag-icons/css/flag-icons.min.css'
import { languageOptions } from '@/consts/languages'

const LanguageSelection: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.95),_rgba(239,246,255,0.72)_32%,_#f8fbff_62%,_#eef4ff_100%)] pt-36 pb-24 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute left-[8%] top-36 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute right-[10%] top-24 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[size:78px_78px] opacity-40" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/80 to-transparent" />
      </div>

      <div className="relative container mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-semibold tracking-[0.25em] text-sky-700 uppercase shadow-[0_8px_30px_rgba(14,116,144,0.12)] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
            AI Language Matrix
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
            为现实生活学习一门
            <br />
            <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-700 bg-clip-text text-transparent">
              未来语言
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
            选择你想练习的语言，进入一套更沉浸、更智能的 AI 学习矩阵。
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-slate-500">
            <span className="rounded-full border border-sky-100 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              {languageOptions.length} 种语言节点
            </span>
            <span className="rounded-full border border-sky-100 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              实时对话练习
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {languageOptions.map(language => (
            <button
              key={language.label}
              type="button"
              className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/72 px-6 py-7 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200/90 hover:bg-white/88 hover:shadow-[0_24px_60px_rgba(14,165,233,0.18)] focus:outline-none focus:ring-4 focus:ring-sky-200/80"
            >
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-200/35 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex flex-col items-center justify-center">
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[26px] border border-white/80 bg-gradient-to-br from-white via-sky-50 to-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_28px_rgba(14,165,233,0.12)]">
                  <span
                    className={`fi fi-${language.code} rounded-2xl text-6xl shadow-[inset_0_0_0_4px_#0f172a,0_6px_16px_rgba(15,23,42,0.16)] transition-transform duration-300 group-hover:scale-105`}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-800 md:text-2xl">
                  {language.label}
                </span>
                <span className="mt-3 inline-flex items-center rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-medium tracking-[0.18em] text-sky-700 uppercase">
                  Ready to train
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LanguageSelection
