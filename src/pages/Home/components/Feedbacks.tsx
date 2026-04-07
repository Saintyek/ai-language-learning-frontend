import { Avatar, Card } from '@douyinfe/semi-ui'

interface TestimonialItem {
  name: string
  role: string
  avatar: string
  content: string
}

const Feedbacks = () => {
  const testimonials: TestimonialItem[] = [
    {
      name: '李明',
      role: '商务人士',
      avatar:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20businessman%20professional%20headshot&image_size=square',
      content:
        '使用这个平台三个月后，我的英语口语能力有了显著提升，在国际会议上能够自信地表达自己的观点。AI老师的反馈非常及时，帮助我纠正了许多发音问题。',
    },
    {
      name: '张华',
      role: '学生',
      avatar:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20student%20young%20woman%20headshot&image_size=square',
      content:
        '作为一名英语专业的学生，这个平台为我提供了大量的口语练习机会。AI的对话场景非常真实，让我能够在不同情境下练习英语，大大提高了我的语言应用能力。',
    },
    {
      name: '王强',
      role: '旅游爱好者',
      avatar:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20traveler%20middle%20aged%20man%20headshot&image_size=square',
      content:
        '我喜欢旅行，但是语言一直是我的障碍。通过这个平台的旅游英语课程，我现在能够在国外自如地与当地人交流，预订酒店、问路、点餐都不再困难。',
    },
  ]

  return (
    <section className="py-48 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">用户评价</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            听听我们的用户如何通过AI语言学习平台实现他们的学习目标
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              shadows="hover"
              className="transition-shadow duration-300 bg-white"
            >
              <div className="p-6">
                <div className="text-yellow-400 mb-4">{'★★★★★'}</div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <Avatar size="extra-large" src={testimonial.avatar} alt={testimonial.name} />
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Feedbacks
