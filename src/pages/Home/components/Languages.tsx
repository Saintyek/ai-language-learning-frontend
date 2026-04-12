import React from 'react'
import 'flag-icons/css/flag-icons.min.css'
import { Link } from 'react-router-dom'
import { languageOptions } from '@/consts/languages'

const Languages: React.FC = () => {
  const leftColumn = languageOptions.slice(0, 2)
  const rightColumn = languageOptions.slice(2)

  const renderLanguageCard = (language: (typeof languageOptions)[number]) => (
    <Link
      key={language.code}
      to={`/${language.code}/chat`}
      className="group rounded-[28px] border border-white/70 bg-white/80 p-6 text-center shadow-[0_18px_48px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-200/90 hover:bg-white/90 hover:shadow-[0_26px_70px_rgba(14,165,233,0.18)] focus:outline-none focus:ring-4 focus:ring-sky-200/80"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_28px_rgba(14,165,233,0.14)] transition-transform duration-300 group-hover:scale-105">
        <span className={`fi fi-${language.code} rounded-xl text-5xl`} aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{language.label}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{language.scene}</p>
      <span className="mt-4 inline-flex items-center rounded-full border border-sky-100 bg-sky-50/85 px-3 py-1 text-xs font-medium tracking-[0.16em] text-sky-700">
        {language.tag}
      </span>
    </Link>
  )

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.9),_rgba(239,246,255,0.78)_36%,_#f8fbff_68%,_#eef4ff_100%)] py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute left-[12%] top-32 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute right-[10%] bottom-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:84px_84px] opacity-35" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold tracking-[0.22em] text-sky-700 uppercase shadow-[0_10px_30px_rgba(14,116,144,0.12)] backdrop-blur-md">
            AI Language Paths
          </span>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            四种语言，AI 陪练
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            无论你想学习中文、日语、韩语还是英语，AI 都能陪你进行真实场景的对话练习，让语言学习更高效有趣。
          </p>
        </div>

        <div className="mt-16 grid items-center gap-6 lg:grid-cols-[minmax(220px,1fr)_minmax(340px,520px)_minmax(220px,1fr)]">
          <div className="grid gap-5">{leftColumn.map(renderLanguageCard)}</div>

          <div className="relative overflow-hidden rounded-[36px] border border-white/75 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(239,246,255,0.88)_55%,_rgba(219,234,254,0.92)_100%)] px-8 py-12 text-center shadow-[0_30px_90px_rgba(37,99,235,0.16)] backdrop-blur-2xl">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />
            <div className="absolute left-1/2 top-10 h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/80 text-2xl text-sky-600 shadow-[0_12px_28px_rgba(14,165,233,0.14)]">
                ✦
              </div>
              <p className="mt-6 text-sm font-semibold tracking-[0.24em] text-sky-700 uppercase">
                AI Learning Matrix
              </p>
              <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                智能 AI 对话
                <br />
                沉浸式语言学习
              </h3>
              <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-600">
                通过自然的 AI 对话，在真实场景中练习语言，获得即时反馈和个性化指导，快速提升听说能力。
              </p>
              <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">智能陪练</p>
                  <p className="mt-2 text-sm text-slate-600">AI 24小时在线，随时开始语言对话练习。</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">多语言支持</p>
                  <p className="mt-2 text-sm text-slate-600">覆盖中英日韩四种主流语言，满足多样学习需求。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">{rightColumn.map(renderLanguageCard)}</div>
        </div>
      </div>
    </section>
  )
}

export default Languages
