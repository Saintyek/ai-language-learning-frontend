import React from 'react'

interface ReasonItem {
  icon: string
  title: string
  subtitle: string
  description: string
  features: string[]
}

const Reasons = () => {
  const reasons: ReasonItem[] = [
    {
      icon: '😎',
      title: '出色的发音！',
      subtitle: '像孩子一样，通过说话学习。',
      description: '使用最自然的学习方式：您的声音。',
      features: [
        '如果您通过文本学习，您的口音将难以理解 😓',
        '但如果您通过说话学习，您的发音将像母语者一样。',
        '不要犯和我一样的错误，从第一天开始就清晰地说话！ 👍',
      ],
    },
    {
      icon: '⌚️',
      title: '节省时间',
      subtitle: '随时随地练习！',
      description: '无需安排课程 – 随时为您服务！',
      features: [
        '如果您想流利地说，很简单：您只需每天练习一点。',
        '但您很忙，没有时间安排课程。',
        '所以在您需要时随时陪伴您：📱 在您的口袋里或 💻 在您的电脑上。',
      ],
    },
    {
      icon: '🤑',
      title: '省钱',
      subtitle: '比传统教师便宜12倍',
      description: '花更少的钱练习更多，学得更快！',
      features: [
        '语言课程很棒，但与私人教师一对一学习会花费一小笔财富 💸。',
        '一节课的价格，您可以获得整整一个月的使用！',
        '您可以将节省下来的所有钱用于前往您正在学习语言的国家旅行... 🛫',
      ],
    },
  ]

  return (
    <section className="py-36 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">为什么选择我们?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-4xl mb-4">{reason.icon}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{reason.title}</h3>
              <h4 className="text-xl font-semibold text-blue-600 mb-4">{reason.subtitle}</h4>
              <p className="text-gray-600 mb-6">{reason.description}</p>
              <ul className="space-y-3">
                {reason.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-600">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
          >
            随时练习学习，提高您的语言能力，立即开始 →
          </a>
        </div>
      </div>
    </section>
  )
}

export default Reasons
