interface FeatureItem {
  icon: string
  title: string
  description: string
}

const Features = () => {
  const features: FeatureItem[] = [
    {
      icon: '👩‍🎤',
      title: '顶级人工智能',
      description: '由与ChatGPT相同的技术提供支持，友好、有帮助，感觉就像与真人交谈。',
    },
    {
      icon: '👂',
      title: '随处可听的音频',
      description: '像真人一样与您交谈，点击任何单词重复它并学习它的发音。',
    },
    {
      icon: '💬',
      title: '智能建议',
      description: '永远不会没话说！AI会建议您接下来要说什么。',
    },
    {
      icon: '🎙️',
      title: '多语言语音识别',
      description: '用您的母语询问关于目标语言的问题，对初学者极为有用。',
    },
    {
      icon: '⚡️',
      title: '可调节速度',
      description: '让AI快速或慢速与您交谈，由您选择！',
    },
    {
      icon: '💡',
      title: '详细解释',
      description: '点击任何单词在上下文中解释它，AI会像老师一样为您解释。',
    },
    {
      icon: '🧠',
      title: '语法反馈',
      description: '只需说话，AI会让您知道您的语法有任何问题。',
    },
    {
      icon: '🔤',
      title: '音译支持',
      description: '对于中文、日文、西班牙语和美式英语等语言，享受音译帮助您熟悉陌生的表达方式。',
    },
  ]

  return (
    <section className="py-36 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            强大的AI语言学习功能
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            我们的平台集成了最先进的AI技术，为您提供全方位的语言学习体验
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
